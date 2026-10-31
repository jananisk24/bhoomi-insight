import pytest

from auth import create_token, hash_password, verify_password, verify_token


def test_password_hash_round_trip_and_rejects_wrong_password():
    hashed = hash_password("valid-password")

    assert hashed != "valid-password"
    assert verify_password("valid-password", hashed)
    assert not verify_password("wrong-password", hashed)


def test_token_contains_authenticated_subject():
    token = create_token("officer-1", "Officer")

    assert verify_token(token) == "officer-1"
    assert verify_token(f"{token}invalid") is None


def test_authentication_fails_closed_without_a_strong_secret():
    import os
    import subprocess
    import sys

    environment = os.environ.copy()
    environment.pop("JWT_SECRET_KEY", None)
    environment["ENVIRONMENT"] = "production"
    result = subprocess.run(
        [sys.executable, "-c", "import auth"],
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "JWT_SECRET_KEY must contain at least 32 bytes" in result.stderr
