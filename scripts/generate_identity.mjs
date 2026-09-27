import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

function base58btc(buf) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = BigInt("0x" + buf.toString("hex"));
  let out = "";
  while (n > 0n) {
    const r = Number(n % 58n);
    out = alphabet[r] + out;
    n /= 58n;
  }
  for (const b of buf) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out || "1";
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});

// Ed25519 public key is the final 32 bytes of the SPKI DER for this key type.
const rawPublicKey = publicKey.subarray(-32);
const didKeyBytes = Buffer.concat([Buffer.from([0xed, 0x01]), rawPublicKey]);
const did = "did:key:z" + base58btc(didKeyBytes);

// PKCS#8 DER is portable and can be re-imported by Node without exposing a seed.
// Write it only to stdout so the user can save it locally.
const privateKeyBase64 = privateKey.toString("base64");

const challenge = JSON.stringify({ t: "owner", season: "close-1", key: did });
const signature = sign(null, Buffer.from(challenge), createPrivateKey({ key: privateKey, format: "der", type: "pkcs8" }));
const verified = verify(
  null,
  Buffer.from(challenge),
  createPublicKey({ key: publicKey, format: "der", type: "spki" }),
  signature
);

console.log("DID:", did);
console.log("PRIVATE_KEY_PKCS8_BASE64:", privateKeyBase64);
console.log("PUBLIC_KEY_RAW_BASE64:", rawPublicKey.toString("base64"));
console.log("OWNER_MESSAGE:", challenge);
console.log("SIGNATURE_BASE64:", signature.toString("base64"));
console.log("SELF_TEST:", verified ? "PASS" : "FAIL");
console.log("\nIMPORTANT: Keep PRIVATE_KEY_PKCS8_BASE64 secret. Do not commit it to GitHub or send it in chat.");
