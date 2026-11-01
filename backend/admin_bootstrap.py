"""Provision the first Admin account through an operator-run CLI."""

import getpass
import os
import sys

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import models
from auth import hash_password
from database import SessionLocal

_ADVISORY_LOCK_NAMESPACE = 481228
_ADVISORY_LOCK_KEY = 1
_MIN_PASSWORD_LENGTH = 12
_MAX_PASSWORD_BYTES = 72


def provision_first_admin(
    db: Session,
    username: str,
    password: str,
) -> models.User:
    """Create one Admin only while the users table has no records."""
    normalized_username = username.strip()
    if not 3 <= len(normalized_username) <= 64:
        raise ValueError("Username must be between 3 and 64 characters.")
    if len(password) < _MIN_PASSWORD_LENGTH:
        raise ValueError("Password must contain at least 12 characters.")
    if len(password.encode("utf-8")) > _MAX_PASSWORD_BYTES:
        raise ValueError("Password exceeds the supported maximum length.")

    password_hash = hash_password(password)
    dialect = db.get_bind().dialect.name

    with db.begin():
        if dialect == "postgresql":
            db.execute(
                text("SELECT pg_advisory_xact_lock(:namespace, :lock_key)"),
                {
                    "namespace": _ADVISORY_LOCK_NAMESPACE,
                    "lock_key": _ADVISORY_LOCK_KEY,
                },
            )
        elif dialect == "sqlite":
            db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        else:
            raise RuntimeError(
                "Admin provisioning requires PostgreSQL or SQLite tests."
            )

        if db.query(models.User.id).first() is not None:
            raise ValueError(
                "First Admin provisioning is allowed only when no users exist."
            )

        admin = models.User(
            username=normalized_username,
            password=password_hash,
            role="Admin",
        )
        db.add(admin)
        db.flush()

    db.refresh(admin)
    return admin


def main() -> int:
    if os.getenv("ENVIRONMENT", "").strip().lower() not in {
        "production",
        "prod",
    }:
        print("Admin provisioning requires ENVIRONMENT=production.")
        return 1

    try:
        with SessionLocal() as db:
            bind = db.get_bind()
            if bind.dialect.name != "postgresql":
                print("Admin provisioning requires a PostgreSQL database.")
                return 1

            target = bind.url
            database_name = target.database or ""
            if (
                not database_name
                or not target.host
                or not target.host.lower().endswith(".neon.tech")
            ):
                print("The configured database is not a verified Neon target.")
                return 1

            target_confirmation = f"{target.host}/{database_name}"
            print(f"Configured Neon target: {target_confirmation}")
            confirmation = input(
                "Type the Neon host/database to confirm the target: "
            ).strip()
            if confirmation != target_confirmation:
                print("Target confirmation did not match; no changes made.")
                return 1

            username = input("First Admin username: ")
            password = getpass.getpass("First Admin password: ")
            confirmation_password = getpass.getpass("Confirm password: ")
            if password != confirmation_password:
                print("Passwords did not match; no changes made.")
                return 1

            admin = provision_first_admin(db, username, password)
    except (EOFError, KeyboardInterrupt):
        print("\nAdmin provisioning cancelled; no changes made.")
        return 130
    except ValueError as exc:
        print(f"Admin provisioning refused: {exc}")
        return 1
    except SQLAlchemyError:
        print(
            "Admin provisioning failed during a database operation. "
            "No credentials were displayed."
        )
        return 1

    print(f"Created the first Admin account for {admin.username}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
