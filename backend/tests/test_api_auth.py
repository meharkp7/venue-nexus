from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_status_requires_api_key():
    response = client.get("/status/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or missing API key"


def test_status_with_api_key():
    response = client.get("/status/", headers={"x-api-key": "venue-nexus-demo"})
    assert response.status_code == 200
    assert "summary" in response.json()
