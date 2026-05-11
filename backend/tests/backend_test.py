"""NextHeir backend regression tests.

Covers: auth (email + mobile OTP), dashboard, assets/family/scenarios CRUD,
AI fairness analysis (Gemini 3 Flash), AI chat (multi-turn), share, PDF export.
"""
import json
import time
import uuid
import pytest
import requests


# ---------------- Auth: Email ----------------
class TestAuthEmail:
    def test_login_seeded_user(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/auth/login",
                            json={'email': 'test@nextheir.com', 'password': 'Test1234'})
        assert r.status_code == 200, r.text
        data = r.json()
        assert 'token' in data and isinstance(data['token'], str)
        assert data['user']['email'] == 'test@nextheir.com'

    def test_login_invalid_credentials(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/auth/login",
                            json={'email': 'test@nextheir.com', 'password': 'WRONG'})
        assert r.status_code == 401

    def test_register_duplicate_email(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/auth/register", json={
            'full_name': 'Dup', 'email': 'test@nextheir.com', 'password': 'Test1234'
        })
        assert r.status_code == 400

    def test_register_new_user(self, api_client, base_url):
        email = f"TEST_{uuid.uuid4().hex[:8]}@nextheir.com"
        r = api_client.post(f"{base_url}/api/auth/register", json={
            'full_name': 'TEST New', 'email': email, 'password': 'Test1234'
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body['user']['email'] == email
        assert 'token' in body

    def test_auth_me(self, api_client, base_url, auth_headers):
        r = api_client.get(f"{base_url}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json()['email'] == 'test@nextheir.com'

    def test_auth_me_no_token(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/auth/me")
        assert r.status_code == 401


# ---------------- Auth: Mobile OTP ----------------
class TestAuthMobile:
    def test_request_otp_returns_mock(self, api_client, base_url):
        mobile = f"99{uuid.uuid4().int % 100000000:08d}"
        r = api_client.post(f"{base_url}/api/auth/mobile/request-otp",
                            json={'mobile': mobile, 'full_name': 'TEST Mobile'})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body['otp_mock'] == '123456'
        assert body['mobile'] == mobile

    def test_verify_otp_creates_user_and_returns_token(self, api_client, base_url):
        mobile = f"98{uuid.uuid4().int % 100000000:08d}"
        api_client.post(f"{base_url}/api/auth/mobile/request-otp",
                        json={'mobile': mobile, 'full_name': 'TEST Mob2'})
        r = api_client.post(f"{base_url}/api/auth/mobile/verify-otp",
                            json={'mobile': mobile, 'otp': '123456', 'full_name': 'TEST Mob2'})
        assert r.status_code == 200, r.text
        body = r.json()
        assert 'token' in body
        assert body['user']['mobile'] == mobile

        # GET /auth/me with this token
        h = {'Authorization': f"Bearer {body['token']}"}
        me = api_client.get(f"{base_url}/api/auth/me", headers=h)
        assert me.status_code == 200
        assert me.json()['mobile'] == mobile

    def test_verify_otp_invalid(self, api_client, base_url):
        mobile = f"97{uuid.uuid4().int % 100000000:08d}"
        api_client.post(f"{base_url}/api/auth/mobile/request-otp", json={'mobile': mobile})
        r = api_client.post(f"{base_url}/api/auth/mobile/verify-otp",
                            json={'mobile': mobile, 'otp': '000000'})
        assert r.status_code == 400


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard_shape(self, api_client, base_url, auth_headers):
        r = api_client.get(f"{base_url}/api/dashboard", headers=auth_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ['total_value', 'asset_count', 'family_count', 'scenario_count', 'by_category']:
            assert k in d
        assert isinstance(d['total_value'], (int, float))


# ---------------- Assets CRUD ----------------
class TestAssetsCRUD:
    def test_full_crud(self, api_client, base_url, auth_headers):
        # CREATE
        payload = {'name': 'TEST Mumbai Flat', 'category': 'property',
                   'value': 25000000, 'description': 'TEST 3BHK'}
        r = api_client.post(f"{base_url}/api/assets", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        a = r.json()
        assert a['name'] == payload['name']
        assert a['value'] == 25000000
        asset_id = a['id']

        # LIST (verify persistence)
        r = api_client.get(f"{base_url}/api/assets", headers=auth_headers)
        assert r.status_code == 200
        ids = [x['id'] for x in r.json()]
        assert asset_id in ids

        # UPDATE
        upd = {**payload, 'value': 30000000, 'name': 'TEST Mumbai Flat Updated'}
        r = api_client.put(f"{base_url}/api/assets/{asset_id}", json=upd, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()['value'] == 30000000
        assert r.json()['name'] == 'TEST Mumbai Flat Updated'

        # DELETE
        r = api_client.delete(f"{base_url}/api/assets/{asset_id}", headers=auth_headers)
        assert r.status_code == 200

        # Verify deletion
        r = api_client.get(f"{base_url}/api/assets", headers=auth_headers)
        assert asset_id not in [x['id'] for x in r.json()]

    def test_update_nonexistent_asset(self, api_client, base_url, auth_headers):
        r = api_client.put(f"{base_url}/api/assets/nonexistent-id",
                           json={'name': 'x', 'category': 'other', 'value': 1, 'description': ''},
                           headers=auth_headers)
        assert r.status_code == 404


# ---------------- Family CRUD ----------------
class TestFamilyCRUD:
    def test_full_crud(self, api_client, base_url, auth_headers):
        payload = {'name': 'TEST Son', 'relationship': 'son', 'age': 25,
                   'financial_needs': 'medium', 'notes': 'TEST'}
        r = api_client.post(f"{base_url}/api/family", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        m = r.json()
        mid = m['id']
        assert m['name'] == 'TEST Son'

        r = api_client.get(f"{base_url}/api/family", headers=auth_headers)
        assert mid in [x['id'] for x in r.json()]

        upd = {**payload, 'age': 26}
        r = api_client.put(f"{base_url}/api/family/{mid}", json=upd, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()['age'] == 26

        r = api_client.delete(f"{base_url}/api/family/{mid}", headers=auth_headers)
        assert r.status_code == 200


# ---------------- Scenarios + AI Analysis + Share + PDF ----------------
@pytest.fixture(scope='class')
def estate_setup(api_client, base_url, auth_headers):
    """Create assets + family + scenario for downstream tests."""
    asset_ids = []
    for n, v, c in [('TEST Estate A', 10000000, 'property'),
                    ('TEST Estate B', 5000000, 'investment')]:
        r = api_client.post(f"{base_url}/api/assets",
                            json={'name': n, 'category': c, 'value': v, 'description': ''},
                            headers=auth_headers)
        assert r.status_code == 200, r.text
        asset_ids.append(r.json()['id'])

    member_ids = []
    for n, rel in [('TEST Alice', 'daughter'), ('TEST Bob', 'son')]:
        r = api_client.post(f"{base_url}/api/family",
                            json={'name': n, 'relationship': rel, 'age': 30,
                                  'financial_needs': 'medium', 'notes': ''},
                            headers=auth_headers)
        assert r.status_code == 200
        member_ids.append(r.json()['id'])

    allocations = {
        asset_ids[0]: {member_ids[0]: 60.0, member_ids[1]: 40.0},
        asset_ids[1]: {member_ids[0]: 50.0, member_ids[1]: 50.0},
    }
    r = api_client.post(f"{base_url}/api/scenarios",
                        json={'name': 'TEST Plan A', 'description': 'TEST',
                              'allocations': allocations},
                        headers=auth_headers)
    assert r.status_code == 200, r.text
    scenario = r.json()

    yield {
        'asset_ids': asset_ids,
        'member_ids': member_ids,
        'scenario_id': scenario['id'],
    }

    # Teardown
    api_client.delete(f"{base_url}/api/scenarios/{scenario['id']}", headers=auth_headers)
    for aid in asset_ids:
        api_client.delete(f"{base_url}/api/assets/{aid}", headers=auth_headers)
    for mid in member_ids:
        api_client.delete(f"{base_url}/api/family/{mid}", headers=auth_headers)


class TestScenariosAndAI:
    def test_list_scenarios(self, api_client, base_url, auth_headers, estate_setup):
        r = api_client.get(f"{base_url}/api/scenarios", headers=auth_headers)
        assert r.status_code == 200
        ids = [s['id'] for s in r.json()]
        assert estate_setup['scenario_id'] in ids

    def test_get_scenario(self, api_client, base_url, auth_headers, estate_setup):
        r = api_client.get(f"{base_url}/api/scenarios/{estate_setup['scenario_id']}",
                           headers=auth_headers)
        assert r.status_code == 200
        s = r.json()
        assert s['name'] == 'TEST Plan A'
        assert len(s['allocations']) == 2

    def test_update_scenario(self, api_client, base_url, auth_headers, estate_setup):
        r = api_client.put(f"{base_url}/api/scenarios/{estate_setup['scenario_id']}",
                           json={'name': 'TEST Plan A v2', 'description': 'updated',
                                 'allocations': {}},
                           headers=auth_headers)
        assert r.status_code == 200
        assert r.json()['name'] == 'TEST Plan A v2'
        # restore allocations for analyze test
        allocations = {
            estate_setup['asset_ids'][0]: {estate_setup['member_ids'][0]: 60.0,
                                            estate_setup['member_ids'][1]: 40.0},
            estate_setup['asset_ids'][1]: {estate_setup['member_ids'][0]: 50.0,
                                            estate_setup['member_ids'][1]: 50.0},
        }
        api_client.put(f"{base_url}/api/scenarios/{estate_setup['scenario_id']}",
                       json={'name': 'TEST Plan A', 'description': 'TEST',
                             'allocations': allocations},
                       headers=auth_headers)

    def test_analyze_scenario_gemini(self, api_client, base_url, auth_headers, estate_setup):
        """Calls Gemini 3 Flash; verify real response (not fallback)."""
        r = api_client.post(f"{base_url}/api/scenarios/{estate_setup['scenario_id']}/analyze",
                            headers=auth_headers, timeout=90)
        assert r.status_code == 200, r.text
        a = r.json()
        # Required keys
        for k in ['fairness_score', 'fairness_label', 'summary', 'risks',
                  'recommendations', 'totals_by_member', 'total_estate_value']:
            assert k in a, f"missing key {k} in {a}"
        assert isinstance(a['fairness_score'], int)
        assert 0 <= a['fairness_score'] <= 100
        assert isinstance(a['risks'], list)
        assert isinstance(a['recommendations'], list) and len(a['recommendations']) >= 1
        # totals_by_member computed correctly
        # Asset A 10M -> Alice 60% = 6M, Bob 40% = 4M
        # Asset B 5M -> Alice 50% = 2.5M, Bob 50% = 2.5M
        # Alice total = 8.5M, Bob total = 6.5M
        totals = a['totals_by_member']
        amounts = sorted([v['amount'] for v in totals.values()])
        assert amounts == pytest.approx([6_500_000.0, 8_500_000.0])
        assert a['total_estate_value'] == 15_000_000
        # Detect fallback (server fallback summary text)
        fallback_marker = "Unable to perform full AI analysis"
        if fallback_marker in a.get('summary', ''):
            pytest.fail(f"AI returned fallback - Gemini call failed: {a.get('summary')}")

    def test_share_scenario(self, api_client, base_url, auth_headers, estate_setup):
        r = api_client.post(f"{base_url}/api/scenarios/{estate_setup['scenario_id']}/share",
                            headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert 'share_token' in body and len(body['share_token']) > 0
        token = body['share_token']

        # GET public shared (no auth)
        r2 = requests.get(f"{base_url}/api/shared/{token}")
        assert r2.status_code == 200, r2.text
        shared = r2.json()
        assert 'scenario' in shared
        assert 'assets' in shared
        assert 'family' in shared
        assert shared['scenario']['name'] == 'TEST Plan A'

    def test_shared_invalid_token(self, api_client, base_url):
        r = requests.get(f"{base_url}/api/shared/invalid-nonexistent-token")
        assert r.status_code == 404

    def test_pdf_export(self, api_client, base_url, auth_headers, estate_setup):
        r = api_client.get(f"{base_url}/api/scenarios/{estate_setup['scenario_id']}/pdf",
                           headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text[:200]
        assert r.headers.get('content-type', '').startswith('application/pdf')
        assert r.content[:4] == b'%PDF', f"not a PDF, got: {r.content[:20]}"
        assert len(r.content) > 1000


# ---------------- AI Chat ----------------
class TestChat:
    def test_chat_multi_turn_with_session(self, api_client, base_url, auth_headers):
        session_id = f"TEST-{uuid.uuid4().hex[:8]}"
        # Turn 1
        r = api_client.post(f"{base_url}/api/chat",
                            json={'session_id': session_id,
                                  'message': 'I have two kids. How should I think about fairness?'},
                            headers=auth_headers, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body['session_id'] == session_id
        assert isinstance(body['reply'], str) and len(body['reply']) > 20
        # Check it's not the fallback error
        assert "I'm having trouble connecting" not in body['reply'], \
            f"AI chat returned fallback: {body['reply']}"

        # Turn 2
        r2 = api_client.post(f"{base_url}/api/chat",
                             json={'session_id': session_id,
                                   'message': 'What if one needs more financial support?'},
                             headers=auth_headers, timeout=90)
        assert r2.status_code == 200, r2.text
        assert len(r2.json()['reply']) > 20

        # History
        r3 = api_client.get(f"{base_url}/api/chat/history",
                            params={'session_id': session_id}, headers=auth_headers)
        assert r3.status_code == 200
        msgs = r3.json()
        assert len(msgs) >= 4  # 2 user + 2 assistant
        roles = [m['role'] for m in msgs]
        assert roles.count('user') >= 2
        assert roles.count('assistant') >= 2

        # Clear
        r4 = api_client.delete(f"{base_url}/api/chat/history",
                               params={'session_id': session_id}, headers=auth_headers)
        assert r4.status_code == 200

        # Verify cleared
        r5 = api_client.get(f"{base_url}/api/chat/history",
                            params={'session_id': session_id}, headers=auth_headers)
        assert len(r5.json()) == 0
