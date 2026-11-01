import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
from admin_bootstrap import provision_first_admin
from auth import verify_password
from database import Base


@pytest.fixture
def admin_session_factory(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'admin-bootstrap.sqlite'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine)
    engine.dispose()


def test_provisions_one_hashed_admin_and_refuses_a_second(admin_session_factory):
    password = "test-admin-password"
    with admin_session_factory() as db:
        admin = provision_first_admin(db, "  first-admin  ", password)
        assert admin.username == "first-admin"
        assert admin.role == "Admin"
        assert admin.password != password
        assert verify_password(password, admin.password)

    with admin_session_factory() as db:
        with pytest.raises(ValueError, match="only when no users exist"):
            provision_first_admin(db, "second-admin", "another-secure-password")

        users = db.query(models.User).all()
        assert len(users) == 1
        assert users[0].username == "first-admin"


@pytest.mark.parametrize(
    ("username", "password", "error"),
    [
        ("ab", "long-enough-password", "Username"),
        ("valid-admin", "short", "at least 12 characters"),
        ("valid-admin", "é" * 37, "maximum length"),
    ],
)
def test_rejects_invalid_admin_credentials_without_writing(
    admin_session_factory,
    username,
    password,
    error,
):
    with admin_session_factory() as db:
        with pytest.raises(ValueError, match=error):
            provision_first_admin(db, username, password)
        assert db.query(models.User).count() == 0
