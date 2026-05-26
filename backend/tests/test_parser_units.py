from types import SimpleNamespace
from uuid import uuid4

import pandas as pd
import pytest
from fastapi import HTTPException

from models import Discipline, Group, GroupTeacherDiscipline, Survey, Teacher
from utils import parser


TEACHER = "Преподаватель"
SUBJECT = "Дисциплина"
GROUP = "Группа"


def test_extract_sheet_id_accepts_google_sheet_url_and_rejects_invalid_url():
    assert parser.extract_sheet_id("https://docs.google.com/spreadsheets/d/sheet_123-Abc/edit") == "sheet_123-Abc"

    with pytest.raises(HTTPException) as exc:
        parser.extract_sheet_id("https://example.com/not-a-sheet")

    assert exc.value.status_code == 422


def test_parse_groups_strips_notes_and_numeric_suffixes():
    assert parser._parse_groups("3341 (PI), 3342.0, bad group, 3381") == [
        "3341",
        "3342",
        "bad group",
        "3381",
    ]
    assert parser._parse_groups(None) == []


def test_header_detection_and_column_tag_names():
    dataframe = pd.DataFrame([
        ["noise", None, None],
        [TEACHER, SUBJECT, GROUP],
    ])

    assert parser._detect_header_row(dataframe) == 1
    assert parser._column_tag_name(TEACHER, "fallback") == "teacher"
    assert parser._column_tag_name(GROUP, "fallback") == "group"
    assert parser._column_tag_name(SUBJECT, "fallback") == "subject"
    assert parser._column_tag_name("custom tag", "fallback") == "custom_tag"
    assert parser._column_tag_name("", "fallback") == "fallback"


def test_get_sheet_columns_handles_duplicate_tags_and_labels():
    workbook = SimpleNamespace(
        sheet_names=["First", "Second"],
        parse=lambda sheet_name, header=None: pd.DataFrame([
            [TEACHER, SUBJECT, GROUP, GROUP],
            ["Teacher A", "Math", "3341", "3381"],
        ]),
    )

    columns = parser._get_sheet_columns(workbook)

    assert [column["value"] for column in columns] == [
        "{{teacher}}",
        "{{subject}}",
        "{{group}}",
        "{{group_2}}",
        "{{teacher_2}}",
        "{{subject_2}}",
        "{{group_3}}",
        "{{group_4}}",
    ]
    assert [column["sheet"] for column in columns] == ["First"] * 4 + ["Second"] * 4


def test_fetch_records_combines_sheets_and_assigns_source_order(monkeypatch):
    workbook = SimpleNamespace(
        sheet_names=["First", "Second"],
        parse=lambda sheet_name, header=None: pd.DataFrame([
            [TEACHER, SUBJECT, GROUP],
            [f"Teacher {sheet_name}", "Math", "3341"],
        ]),
    )
    monkeypatch.setattr(parser, "download_workbook", lambda sheet_id: workbook)

    records = parser._fetch_records("https://docs.google.com/spreadsheets/d/abc/edit")

    assert [record["source_sheet"] for record in records] == ["First", "Second"]
    assert [record["source_order"] for record in records] == [0, 1]
    assert records[0]["teacher"] == "Teacher First"


def test_get_sheet_groups_returns_empty_list_when_fetch_fails(monkeypatch):
    def raise_http_error(url):
        raise HTTPException(status_code=422, detail="broken")

    monkeypatch.setattr(parser, "_fetch_records", raise_http_error)

    assert parser.get_sheet_groups("broken-url") == []


def test_get_sheet_tags_for_group_limits_tags_to_matching_sheet(monkeypatch):
    workbook = SimpleNamespace(
        sheet_names=["Allowed", "Denied"],
        parse=lambda sheet_name, header=None: pd.DataFrame([
            [TEACHER, SUBJECT, GROUP],
            [f"Teacher {sheet_name}", "Math", "3341" if sheet_name == "Allowed" else "3381"],
        ]),
    )
    monkeypatch.setattr(parser, "download_workbook", lambda sheet_id: workbook)

    assert parser.get_sheet_tags_for_group("https://docs.google.com/spreadsheets/d/abc/edit", "3341") == [
        "group",
        "subject",
        "teacher",
    ]


def test_populate_creates_and_updates_schedule_records(db_session):
    survey_id = uuid4()
    suffix = str(survey_id)[:8]
    teacher_name = f"Populate Teacher {suffix}"
    discipline_name = f"Populate Discipline {suffix}"
    first_group = f"p{suffix[:4]}"
    second_group = f"p{suffix[4:]}"
    db_session.add(Survey(
        id=survey_id,
        title=f"Populate Survey {suffix}",
        description="Description",
        groups=[first_group, second_group],
        questions=[],
        is_active=True,
    ))
    db_session.flush()
    records = [
        {
            "teacher": teacher_name,
            "discipline": discipline_name,
            "groups": [first_group, second_group],
            "source_order": 4,
        }
    ]

    stats = parser._populate(records, db_session, survey_id)

    assert stats["groups"] >= 2
    assert stats["teachers"] >= 1
    assert stats["disciplines"] >= 1
    assignments = (
        db_session.query(GroupTeacherDiscipline)
        .join(Group)
        .join(Teacher)
        .join(Discipline)
        .filter(GroupTeacherDiscipline.survey_id == survey_id)
        .filter(Teacher.name == teacher_name)
        .filter(Discipline.name == discipline_name)
        .all()
    )
    assert {assignment.group.name for assignment in assignments} == {first_group, second_group}
    assert {assignment.source_order for assignment in assignments} == {4}

    records[0]["source_order"] = 9
    parser._populate(records, db_session, survey_id)

    updated_orders = {
        assignment.source_order
        for assignment in db_session.query(GroupTeacherDiscipline)
        .filter(GroupTeacherDiscipline.survey_id == survey_id)
        .all()
    }
    assert updated_orders == {9}
