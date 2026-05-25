from models import Discipline, Group, GroupTeacherDiscipline, Teacher


def test_health_returns_service_status(client):
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["services"]["backend"]["status"] == "up"
    assert body["services"]["database"]["status"] == "up"


def test_register_password_mismatch(client):
    response = client.post("/register", json={
        "username": "mismatch_user",
        "password": "password123",
        "confirm_password": "password456",
    })

    assert response.status_code == 400
    assert response.json()["detail"] == "Пароли не совпадают"


def test_register_duplicate_username(client):
    payload = {
        "username": "duplicate_user_ci",
        "password": "password123",
        "confirm_password": "password123",
    }

    first_response = client.post("/register", json=payload)
    second_response = client.post("/register", json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Пользователь с таким именем уже существует"


def test_login_invalid_credentials(client):
    response = client.post("/login", json={
        "username": "missing_user",
        "password": "wrong_password",
    })

    assert response.status_code == 400
    assert response.json()["detail"] == "Неверный логин или пароль"
    assert "access_token" not in client.cookies


def test_admin_route_requires_auth(client):
    response = client.post("/survey", data={
        "title": "Protected Survey",
        "description": "Description",
        "questions": "[]",
        "groups": '["3341"]',
        "is_active": "true",
    })

    assert response.status_code == 401
    assert response.json()["detail"] == "Необходима авторизация"


def test_regular_user_cannot_create_survey(client):
    client.post("/register", json={
        "username": "regular_user_ci",
        "password": "password123",
        "confirm_password": "password123",
    })
    client.post("/login", json={
        "username": "regular_user_ci",
        "password": "password123",
    })

    response = client.post("/survey", data={
        "title": "Forbidden Survey",
        "description": "Description",
        "questions": "[]",
        "groups": '["3341"]',
        "is_active": "true",
    })

    assert response.status_code == 403
    assert response.json()["detail"] == "Доступ запрещен"


def test_get_unknown_survey_returns_404(client):
    response = client.get("/survey/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
    assert response.json()["detail"] == "Опрос не найден"


def test_group_data_returns_disciplines_by_teacher(client, db_session):
    group = Group(name="ci-3341")
    teacher = Teacher(name="CI Teacher")
    first_discipline = Discipline(name="CI Discipline A")
    second_discipline = Discipline(name="CI Discipline B")

    db_session.add_all([group, teacher, first_discipline, second_discipline])
    db_session.flush()
    db_session.add_all([
        GroupTeacherDiscipline(
            group_id=group.id,
            teacher_id=teacher.id,
            discipline_id=first_discipline.id,
        ),
        GroupTeacherDiscipline(
            group_id=group.id,
            teacher_id=teacher.id,
            discipline_id=second_discipline.id,
        ),
    ])

    response = client.get("/group_data/ci-3341")

    assert response.status_code == 200
    assert response.json() == {
        "teachers": {
            "CI Teacher": ["CI Discipline A", "CI Discipline B"],
        },
    }
