import unittest

from src.identity.did_key import generate, public_key_from_did, verify
from src.identity.signer import canonical_json, sign_json, verify_json


class DidKeyTests(unittest.TestCase):
    def test_generate_and_roundtrip(self):
        identity = generate()
        self.assertTrue(identity.did.startswith("did:key:z"))
        self.assertEqual(len(public_key_from_did(identity.did)), 32)

    def test_sign_and_verify(self):
        identity = generate()
        message = b"cc26 close call test"
        signature = identity.sign(message)
        self.assertTrue(verify(identity.did, message, signature))
        self.assertFalse(verify(identity.did, message + b"!", signature))

    def test_canonical_json_is_stable(self):
        self.assertEqual(canonical_json({"b": 2, "a": 1}), b'{"a":1,"b":2}')

    def test_json_signing(self):
        identity = generate()
        payload = {"t": "owner", "season": "close-1", "key": identity.did}
        signature = sign_json(identity, payload)
        self.assertTrue(verify_json(identity.did, payload, signature))
        payload["season"] = "other"
        self.assertFalse(verify_json(identity.did, payload, signature))


if __name__ == "__main__":
    unittest.main()
