import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or 'https://heir-mobile.preview.emergentagent.com'
BASE_URL = BASE_URL.rstrip('/')

TEST_EMAIL = 'test@nextheir.com'
TEST_PASSWORD = 'Test1234'


@pytest.fixture(scope='session')
def base_url():
    return BASE_URL


@pytest.fixture(scope='session')
def api_client():
    s = requests.Session()
    s.headers.update({'Content-Type': 'application/json'})
    return s


@pytest.fixture(scope='session')
def auth_token(api_client):
    # Try login first
    r = api_client.post(f"{BASE_URL}/api/auth/login", json={'email': TEST_EMAIL, 'password': TEST_PASSWORD})
    if r.status_code == 200:
        return r.json()['token']
    # Fallback: register fresh user
    r = api_client.post(f"{BASE_URL}/api/auth/register", json={
        'full_name': 'Test User', 'email': TEST_EMAIL, 'password': TEST_PASSWORD
    })
    if r.status_code == 200:
        return r.json()['token']
    pytest.skip(f"Cannot authenticate. login={r.status_code} body={r.text[:200]}")


@pytest.fixture(scope='session')
def auth_headers(auth_token):
    return {'Authorization': f'Bearer {auth_token}', 'Content-Type': 'application/json'}
