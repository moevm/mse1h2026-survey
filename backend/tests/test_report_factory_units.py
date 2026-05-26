from types import SimpleNamespace

import pandas as pd

from utils import report_factory as rf


def test_tag_helpers_read_titles_answers_and_options():
    question = {
        "title": "Rate {{teacher_2}} and {{subject}}",
        "answers": [{"value": "{{group}}"}, "plain"],
        "options": [{"value": "{{ignored}}"}],
    }

    assert rf._get_base_tag("teacher_2") == "teacher"
    assert rf._question_tags(question) == ["teacher_2", "subject", "group", "ignored"]
    assert rf._uses_tag(question, "teacher")
    assert rf._uses_tag(question, "subject")
    assert not rf._uses_tag(question, "missing")


def test_replace_tags_keeps_missing_values_as_templates():
    value = "{{teacher}} teaches {{subject}} for {{group}}"

    assert rf._replace_tags(value, {"teacher": "Teacher A", "subject": ""}) == (
        "Teacher A teaches {{subject}} for {{group}}"
    )


def test_normalize_question_handles_choice_and_scale_shapes():
    radio = rf._normalize_question(
        {
            "id": "q",
            "title": "{{teacher}} rating",
            "type": "radio",
            "options": [{"value": "{{subject}}"}, "Other"],
        },
        {"teacher": "Teacher A", "subject": "Math"},
        "generated-radio",
    )
    scale = rf._normalize_question(
        {
            "id": "scale",
            "title": "Score",
            "type": "scale",
            "options": {"min": 1, "max": 5, "step": 1},
        },
        {},
        "generated-scale",
    )

    assert radio["id"] == "generated-radio"
    assert radio["title"] == "Teacher A rating"
    assert radio["answers"] == ["Math", "Other"]
    assert scale["min"] == 1
    assert scale["max"] == 5
    assert scale["step"] == 1


def test_append_question_skips_unresolved_or_non_passing_questions():
    result = []

    rf._append_question(
        result,
        {"id": "q1", "title": "{{teacher}}", "type": "text"},
        {"teacher": ""},
        "q1",
    )
    rf._append_question(
        result,
        {"id": "q2", "title": "{{teacher}}", "type": "file"},
        {"teacher": "Teacher A"},
        "q2",
    )
    rf._append_question(
        result,
        {"id": "q3", "title": "{{teacher}}", "type": "text"},
        {"teacher": "Teacher A"},
        "q3",
    )

    assert [question["id"] for question in result] == ["q3"]


def test_expand_blueprint_subject_first_groups_teachers_by_subject():
    blueprint = {
        "id": "bp",
        "type": "blueprint",
        "options": [
            {"id": "subject", "title": "{{subject}}", "type": "text"},
            {"id": "teacher", "title": "{{teacher}} on {{subject}}", "type": "radio", "answers": ["yes"]},
        ],
    }
    pairs = [
        {"teacher": "Teacher A", "subject": "Databases"},
        {"teacher": "Teacher B", "subject": "Databases"},
        {"teacher": "Teacher C", "subject": "Networks"},
    ]

    expanded = rf._expand_blueprint(blueprint, pairs, "3341")

    assert [question["title"] for question in expanded] == [
        "Databases",
        "Teacher A on Databases",
        "Teacher B on Databases",
        "Networks",
        "Teacher C on Networks",
    ]
    assert expanded[1]["id"] == "bp-Databases-Teacher A-teacher"


def test_expand_blueprint_teacher_first_keeps_all_subjects_for_teacher():
    blueprint = {
        "id": "bp",
        "type": "blueprint",
        "options": [
            {"id": "teacher", "title": "{{teacher}}", "type": "text"},
            {"id": "subject", "title": "{{subject}}", "type": "text"},
        ],
    }
    pairs = [
        {"teacher": "Teacher A", "subject": "Lecture"},
        {"teacher": "Teacher A", "subject": "Lab"},
    ]

    expanded = rf._expand_blueprint(blueprint, pairs, "3341")

    assert [question["title"] for question in expanded] == [
        "Teacher A",
        "Lecture",
        "Lab",
    ]


def test_build_report_visualizer_resolves_fallback_generated_ids():
    survey = SimpleNamespace(
        id="survey-1",
        title="Survey",
        description="Description",
        questions=[
            {"id": "template", "title": "Template question", "type": "text"}
        ],
        is_active=True,
        created_at=None,
    )
    answer = SimpleNamespace(
        id="answer-1",
        survey_id="survey-1",
        group="3341",
        answers=[{"id_question": "bp-generated-template", "value": "ok"}],
        created_at=None,
    )

    visualizer = rf.build_report_visualizer(survey, [answer])

    assert visualizer.get_survey_data("survey-1").iloc[0]["q_template"] == "ok"
    assert isinstance(visualizer.get_question_values("survey-1", "template"), pd.Series)
