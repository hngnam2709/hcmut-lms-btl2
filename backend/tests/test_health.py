from __future__ import annotations


def test_live(client):
    response = client.get("/api/health/live")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_health_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["database"]["version"] == "8.4.13"


def test_health_degraded(client, app):
    app.extensions["services"]["health"].fail = True
    response = client.get("/api/health")
    assert response.status_code == 503
    assert response.get_json()["error"]["code"] == "database_unavailable"
    assert response.headers["X-Request-ID"]
