from __future__ import annotations

import base64
import json
from typing import Any

from .did_key import DidKeyIdentity


def canonical_json(value: Any) -> bytes:
    """Canonical JSON for protocol messages: sorted keys, compact separators."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sign_bytes(identity: DidKeyIdentity, payload: bytes) -> str:
    return base64.b64encode(identity.sign(payload)).decode("ascii")


def sign_json(identity: DidKeyIdentity, payload: Any) -> str:
    return sign_bytes(identity, canonical_json(payload))


def verify_json(did: str, payload: Any, signature_b64: str) -> bool:
    from .did_key import verify
    try:
        signature = base64.b64decode(signature_b64, validate=True)
    except Exception:
        return False
    return verify(did, canonical_json(payload), signature)
