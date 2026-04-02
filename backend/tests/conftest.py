import pytest


@pytest.fixture
def simple_schema_ddl():
    return "CREATE TABLE person (id INTEGER, email VARCHAR);"


@pytest.fixture
def person_fixture():
    return {
        "person": [
            {"id": 1, "email": "alice@example.com"},
            {"id": 2, "email": "bob@example.com"},
            {"id": 3, "email": "alice@example.com"},
        ]
    }
