from __future__ import annotations

import base64
import hashlib
from dataclasses import dataclass
from typing import Final

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, PrivateFormat, NoEncryption

# did:key Ed25519 multicodec: 0xed01 (varint-encoded ed25519-pub).
ED25519_PUB_CODEC: Final[bytes] = b"\xed\x01"
BASE58_ALPHABET = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def _b58encode(data: bytes) -> str:
    n = int.from_bytes(data, "big")
    out = bytearray()
    while n:
        n, r = divmod(n, 58)
        out.append(BASE58_ALPHABET[r])
    pad = len(data) - len(data.lstrip(b"\0"))
    if not out:
        out.extend(BASE58_ALPHABET[:1])
    return (BASE58_ALPHABET[:1] * pad + bytes(reversed(out))).decode("ascii")


def _b58decode(value: str) -> bytes:
    raw = value.encode("ascii")
    n = 0
    for char in raw:
        pos = BASE58_ALPHABET.find(bytes([char]))
        if pos < 0:
            raise ValueError("invalid base58btc character")
        n = n * 58 + pos
    size = (n.bit_length() + 7) // 8
    decoded = n.to_bytes(size, "big") if n else b""
    pad = len(raw) - len(raw.lstrip(b"1"))
    return b"\0" * pad + decoded


@dataclass
class DidKeyIdentity:
    did: str
    private_key: Ed25519PrivateKey

    @property
    def public_key_bytes(self) -> bytes:
        return self.private_key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)

    def private_key_raw(self) -> bytes:
        return self.private_key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())

    def sign(self, message: bytes) -> bytes:
        return self.private_key.sign(message)


def did_from_public_key(public_key: bytes) -> str:
    if len(public_key) != 32:
        raise ValueError("Ed25519 public key must be 32 bytes")
    return "did:key:z" + _b58encode(ED25519_PUB_CODEC + public_key)


def generate() -> DidKeyIdentity:
    private_key = Ed25519PrivateKey.generate()
    did = did_from_public_key(private_key.public_key().public_bytes(Encoding.Raw, format=None))
    return DidKeyIdentity(did=did, private_key=private_key)


def public_key_from_did(did: str) -> bytes:
    if not did.startswith("did:key:z"):
        raise ValueError("expected base58btc did:key")
    decoded = _b58decode(did[len("did:key:z"):])
    if len(decoded) != 34 or decoded[:2] != ED25519_PUB_CODEC:
        raise ValueError("did:key is not an Ed25519 did:key")
    return decoded[2:]


def verify(did: str, message: bytes, signature: bytes) -> bool:
    public_key = public_key_from_did(did)
    try:
        Ed25519PublicKey.from_public_bytes(public_key).verify(signature, message)
        return True
    except Exception:
        return False


def fingerprint(did: str) -> str:
    """Short non-secret identifier for logs; never log the private key."""
    return hashlib.sha256(did.encode("utf-8")).hexdigest()[:16]
