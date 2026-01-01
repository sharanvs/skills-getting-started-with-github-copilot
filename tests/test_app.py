from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

TEST_ACTIVITY = "Basketball"
TEST_EMAIL = "test.student@mergington.edu"


def ensure_absent(activity_name, email):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    participants = data[activity_name]["participants"]
    assert email not in participants


def ensure_present(activity_name, email):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    participants = data[activity_name]["participants"]
    assert email in participants


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert TEST_ACTIVITY in data


def test_signup_and_unregister_flow():
    # Make sure test email is not present to start
    if TEST_EMAIL in activities[TEST_ACTIVITY]["participants"]:
        activities[TEST_ACTIVITY]["participants"].remove(TEST_EMAIL)

    ensure_absent(TEST_ACTIVITY, TEST_EMAIL)

    # Signup
    resp = client.post(f"/activities/{TEST_ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Now the participant should be present
    ensure_present(TEST_ACTIVITY, TEST_EMAIL)

    # Unregister
    resp = client.delete(f"/activities/{TEST_ACTIVITY}/participants?email={TEST_EMAIL}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Unregistered" in body.get("message", "")

    # Ensure removed
    ensure_absent(TEST_ACTIVITY, TEST_EMAIL)


def test_unregister_nonexistent_returns_404():
    fake_email = "not-in-list@mergington.edu"
    # Ensure it's not present
    if fake_email in activities[TEST_ACTIVITY]["participants"]:
        activities[TEST_ACTIVITY]["participants"].remove(fake_email)

    resp = client.delete(f"/activities/{TEST_ACTIVITY}/participants?email={fake_email}")
    assert resp.status_code == 404
