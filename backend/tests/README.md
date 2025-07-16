# Backend Tests

This directory contains all backend tests for the ImgLink project.

## Structure

```
tests/
├── api/          # API endpoint tests
├── models/       # Database model tests
├── services/     # Service layer tests
├── conftest.py   # Pytest configuration and fixtures
└── __init__.py
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/api/test_images.py

# Run with verbose output
pytest -v

# Run and show print statements
pytest -s
```

## Test Database

Tests use an in-memory SQLite database for speed and isolation. Each test gets a fresh database instance.

## Fixtures

Common fixtures are defined in `conftest.py`:
- `db`: Database session
- `client`: FastAPI test client
- `test_user`: Regular user for testing
- `test_admin`: Admin user for testing
- `auth_headers`: Authentication headers for regular user
- `admin_auth_headers`: Authentication headers for admin user

## Writing Tests

1. Use appropriate fixtures to avoid repetition
2. Test both success and error cases
3. Use meaningful test names that describe what is being tested
4. Group related tests in classes
5. Clean up any created resources