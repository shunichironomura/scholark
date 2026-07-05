from fastapi.testclient import TestClient


def test_cors_headers_are_present_for_configured_origin(client: TestClient) -> None:
    origin = "http://localhost:5173"
    response = client.get("/api/v1/health/", headers={"Origin": origin})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
