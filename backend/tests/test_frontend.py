from __future__ import annotations


def test_index_is_served(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"HCMUT LMS" in response.data
    assert b"bootstrap.min.css" in response.data


def test_local_bootstrap_assets_are_served(client):
    css = client.get("/vendor/bootstrap/bootstrap.min.css")
    js = client.get("/vendor/bootstrap/bootstrap.bundle.min.js")
    assert css.status_code == 200
    assert js.status_code == 200
    assert b"Bootstrap" in css.data[:500]


def test_frontend_js_is_served(client):
    response = client.get("/assets/app.js")
    assert response.status_code == 200
    assert b"/api/enrollments" in response.data


def test_unknown_api_is_json_404(client):
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "http_404"
