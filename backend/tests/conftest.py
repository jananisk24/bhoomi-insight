import os


os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "bhoomi-insight-test-only-key-32-bytes-minimum",
)
