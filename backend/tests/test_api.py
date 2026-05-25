import pytest
import json
from models import UserRole, User


def create_survey(client, **overrides):
    payload = {
        "title": "Test Survey",
        "description": "Description",
        "questions": [{"id_question": 1, "title": "Do you like tests?", "type": "FreeQuestion"}],
        "groups": ["3341"],
        "lifetime_seconds": None,
        "is_active": True,
    }
    payload.update(overrides)

    data = {
        "title": payload["title"],
        "description": payload["description"],
        "questions": json.dumps(payload["questions"]),
        "groups": json.dumps(payload["groups"]),
        "is_active": str(payload["is_active"]).lower(),
    }
    if payload["lifetime_seconds"] is not None:
        data["lifetime_seconds"] = str(payload["lifetime_seconds"])

    return client.post("/survey", data=data)

def test_register_user(client):
    user_data = {
        "username": "new_tester",
        "password": "strongpassword123",
        "confirm_password": "strongpassword123"
    }
    response = client.post("/register", json=user_data)
    assert response.status_code == 200
    assert response.json() == {"message": "Регистрация успешна"}

def test_register_short_password(client):
    user_data = {
        "username": "shorty",
        "password": "123",
        "confirm_password": "123"
    }
    response = client.post("/register", json=user_data)
    assert response.status_code == 422

def test_login_success(client):
    client.post("/register", json={
        "username": "login_test", "password": "password123", "confirm_password": "password123"
    })

    login_data = {"username": "login_test", "password": "password123"}
    response = client.post("/login", json=login_data)

    assert response.status_code == 200
    assert "access_token" in client.cookies
    assert response.json()["message"] == "Успешный вход"


@pytest.fixture
def admin_token(client, db_session):
    """Создает админа и авторизует клиента"""
    from utils.auth import get_password_hash
    admin = User(
        username="admin_api_test",
        hashed_password=get_password_hash("admin_pass"),
        role=UserRole.ADMIN
    )
    db_session.add(admin)
    db_session.commit()

    client.post("/login", json={"username": "admin_api_test", "password": "admin_pass"})
    return client.cookies.get("access_token")

def test_create_survey(client, admin_token):
    response = create_survey(
        client,
        title="Main Survey",
        lifetime_seconds=3600,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Main Survey"

def test_get_all_surveys(client, admin_token):
    create_survey(client, title="S1", description="D", questions=[])

    response = client.get("/survey")
    assert response.status_code == 200
    assert response.json()["count"] >= 1

def test_update_survey(client, admin_token):
    res = create_survey(client, title="Old", description="D", questions=[])
    s_id = res.json()["id"]

    response = client.put(f"/survey/{s_id}", json={"title": "New Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"

def test_delete_survey(client, admin_token):
    res = create_survey(client, title="Delete Me", description="D", questions=[])
    s_id = res.json()["id"]

    response = client.delete(f"/survey/{s_id}")
    assert response.status_code == 200

    check = client.get(f"/survey/{s_id}")
    assert check.status_code == 404


def test_post_answer(client, admin_token):
    res = create_survey(client, title="Answer Test", description="D", questions=[])
    s_id = res.json()["id"]

    answer_data = {
        "survey_id": s_id,
        "group": "3341",
        "answers": []
    }
    response = client.post("/answers", json=answer_data)
    assert response.status_code == 200
    assert response.json()["group"] == "3341"

def test_get_answers_for_survey(client, admin_token):
    res = create_survey(client, title="Survey 42", description="D", questions=[])
    s_id = res.json()["id"]

    client.post("/answers", json={
        "survey_id": s_id, "group": "3341", "answers": []
    })

    response = client.get(f"/survey/answers/{s_id}")
    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["answers_list"][0]["group"] == "3341"

def test_delete_answer(client, admin_token):
    res_s = create_survey(client, title="Del Ans", description="D", questions=[])
    s_id = res_s.json()["id"]
    res_a = client.post("/answers", json={"survey_id": s_id, "group": "3341", "answers": []})
    a_id = res_a.json()["id"]

    response = client.delete(f"/answers/{a_id}")
    assert response.status_code == 200
