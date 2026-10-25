import base64

import pytest

import art_crypto as ac

IT = 1000


def test_derive_key_is_deterministic():
    salt = b"s" * 16
    k = ac.derive_key("pass", salt, IT)
    assert len(k) == 32
    assert k == ac.derive_key("pass", salt, IT)
    assert k != ac.derive_key("other", salt, IT)
    assert k != ac.derive_key("pass", b"t" * 16, IT)


def test_encrypt_decrypt_roundtrip():
    key = ac.derive_key("pass", b"s" * 16, IT)
    blob = ac.encrypt(key, b"hello")
    assert len(blob) == 12 + 5 + 16
    assert ac.decrypt(key, blob) == b"hello"
    assert ac.encrypt(key, b"hello") != blob  # iv is random


def test_decrypt_with_other_key_raises():
    blob = ac.encrypt(ac.derive_key("a", b"s" * 16, IT), b"hello")
    with pytest.raises(Exception):
        ac.decrypt(ac.derive_key("b", b"s" * 16, IT), blob)


def test_new_meta_and_key_from_meta():
    meta, key = ac.new_meta("pass", iterations=IT)
    assert meta["version"] == 1 and meta["iterations"] == IT
    assert len(base64.b64decode(meta["salt"])) == 16
    assert ac.key_from_meta(meta, "pass") == key


def test_key_from_meta_wrong_passphrase():
    meta, _ = ac.new_meta("pass", iterations=IT)
    with pytest.raises(ValueError, match="wrong passphrase"):
        ac.key_from_meta(meta, "nope")
