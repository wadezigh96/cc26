import { verifyDidSignature } from "./did_key.mjs";

const did = process.env.CC26_DID;
const message = process.env.CC26_MESSAGE;
const signatureBase64 = process.env.CC26_SIGNATURE_BASE64;

if (!did || !message || !signatureBase64) {
  console.error("Set CC26_DID, CC26_MESSAGE and CC26_SIGNATURE_BASE64.");
  process.exit(2);
}

const ok = verifyDidSignature(
  did,
  Buffer.from(message, "utf8"),
  Buffer.from(signatureBase64, "base64"),
);

console.log(ok ? "VERIFY: PASS" : "VERIFY: FAIL");
process.exit(ok ? 0 : 1);
