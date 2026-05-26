import re
from collections import defaultdict
from typing import Any

from models import Discipline, Group, GroupTeacherDiscipline, Teacher

from utils.visualization_functions import (
    Answer as ReportAnswer,
    Survey as ReportSurvey,
    SurveyVisualizer,
)


TEMPLATE_TAG_RE = re.compile(r"\{\{([^{}]+)\}\}")
PASSING_QUESTION_TYPES = {"radio", "checkbox", "scale", "text"}


def _get_option_value(option: Any) -> Any:
    return option.get("value") if isinstance(option, dict) else option


def _get_base_tag(tag: Any) -> str:
    return re.sub(r"_\d+$", "", str(tag or ""))


def _question_tags(question: dict[str, Any]) -> list[str]:
    values = [
        question.get("title"),
        *[_get_option_value(value) for value in question.get("answers") or []],
        *[
            _get_option_value(value)
            for value in question.get("options") or []
            if isinstance(question.get("options"), list)
        ],
    ]

    tags: list[str] = []
    for value in values:
        tags.extend(match.group(1) for match in TEMPLATE_TAG_RE.finditer(str(value or "")))

    return tags


def _uses_tag(question: dict[str, Any], tag: str) -> bool:
    return any(_get_base_tag(value) == tag for value in _question_tags(question))


def _first_relation_mode(template_questions: list[dict[str, Any]]) -> str:
    for question in template_questions:
        for tag in _question_tags(question):
            base_tag = _get_base_tag(tag)
            if base_tag in {"teacher", "subject"}:
                return base_tag

    return "teacher"


def _replace_tags(value: Any, context: dict[str, Any]) -> str:
    def replace(match: re.Match) -> str:
        replacement = context.get(_get_base_tag(match.group(1)))
        if str(replacement or "").strip() == "":
            return match.group(0)
        return str(replacement)

    return TEMPLATE_TAG_RE.sub(replace, str(value or ""))


def _has_unresolved_tags(question: dict[str, Any]) -> bool:
    values = [
        question.get("title"),
        *[_get_option_value(value) for value in question.get("answers") or []],
        *[
            _get_option_value(value)
            for value in question.get("options") or []
            if isinstance(question.get("options"), list)
        ],
    ]

    return any(TEMPLATE_TAG_RE.search(str(value or "")) for value in values)


def _normalize_question(question: dict[str, Any], context: dict[str, Any], question_id: str) -> dict[str, Any]:
    normalized = {
        **question,
        "id": question_id,
        "title": _replace_tags(question.get("title"), context),
    }

    if question.get("type") in {"radio", "checkbox"}:
        normalized["answers"] = [
            _replace_tags(_get_option_value(option), context)
            for option in (question.get("answers") or question.get("options") or [])
        ]

    if question.get("type") == "scale" and isinstance(question.get("options"), dict):
        normalized["min"] = question["options"].get("min")
        normalized["max"] = question["options"].get("max")
        normalized["step"] = question["options"].get("step")

    return normalized


def _append_question(
    result: list[dict[str, Any]],
    question: dict[str, Any],
    context: dict[str, Any],
    question_id: str,
    group_id: str | None = None,
    group_label: str | None = None,
) -> None:
    normalized = _normalize_question(question, context, question_id)
    if normalized.get("type") in PASSING_QUESTION_TYPES and not _has_unresolved_tags(normalized):
        if group_id and group_label:
            normalized["report_group_id"] = group_id
            normalized["report_group_label"] = group_label
        result.append(normalized)


def _get_group_pairs(survey_id: Any, group: str, db: Any) -> list[dict[str, str]]:
    if db is None:
        return []

    rows = (
        db.query(
            Teacher.name.label("teacher"),
            Discipline.name.label("subject"),
        )
        .join(GroupTeacherDiscipline, GroupTeacherDiscipline.teacher_id == Teacher.id)
        .join(Discipline, Discipline.id == GroupTeacherDiscipline.discipline_id)
        .join(Group, Group.id == GroupTeacherDiscipline.group_id)
        .filter(GroupTeacherDiscipline.survey_id == survey_id)
        .filter(Group.name == group)
        .order_by(GroupTeacherDiscipline.source_order, Teacher.name, Discipline.name)
        .all()
    )

    return [{"teacher": row.teacher, "subject": row.subject} for row in rows]


def _expand_blueprint(question: dict[str, Any], pairs: list[dict[str, str]], group: str) -> list[dict[str, Any]]:
    template_questions = question.get("options") if isinstance(question.get("options"), list) else []
    result: list[dict[str, Any]] = []

    if not template_questions or not pairs:
        return result

    has_teacher_and_subject = (
        any(_uses_tag(item, "teacher") for item in template_questions)
        and any(_uses_tag(item, "subject") for item in template_questions)
    )

    if has_teacher_and_subject and _first_relation_mode(template_questions) == "subject":
        subject_teachers: dict[str, list[str]] = defaultdict(list)
        for pair in pairs:
            subject_teachers[pair["subject"]].append(pair["teacher"])

        for subject, teachers in subject_teachers.items():
            report_group_id = f"{question.get('id')}-{subject}"
            report_group_label = subject
            for template_question in template_questions:
                needs_teacher = _uses_tag(template_question, "teacher")
                needs_subject = _uses_tag(template_question, "subject")

                if not needs_teacher:
                    _append_question(
                        result,
                        template_question,
                        {"teacher": "", "subject": subject, "group": group},
                        f"{question.get('id')}-{subject}-{template_question.get('id')}",
                        report_group_id,
                        report_group_label,
                    )
                    continue

                for teacher in teachers:
                    _append_question(
                        result,
                        template_question,
                        {"teacher": teacher, "subject": subject if needs_subject else "", "group": group},
                        f"{question.get('id')}-{subject}-{teacher}-{template_question.get('id')}",
                        report_group_id,
                        report_group_label,
                    )
        return result

    teacher_subjects: dict[str, list[str]] = defaultdict(list)
    for pair in pairs:
        teacher_subjects[pair["teacher"]].append(pair["subject"])

    for teacher, subjects in teacher_subjects.items():
        report_group_id = f"{question.get('id')}-{teacher}"
        report_group_label = teacher
        for template_question in template_questions:
            needs_teacher = _uses_tag(template_question, "teacher")
            needs_subject = _uses_tag(template_question, "subject")

            if not needs_subject:
                _append_question(
                    result,
                    template_question,
                    {"teacher": teacher if needs_teacher else "", "subject": "", "group": group},
                    f"{question.get('id')}-{teacher}-{template_question.get('id')}",
                    report_group_id,
                    report_group_label,
                )
                continue

            for subject in subjects:
                _append_question(
                    result,
                    template_question,
                    {"teacher": teacher if needs_teacher else "", "subject": subject, "group": group},
                    f"{question.get('id')}-{teacher}-{subject}-{template_question.get('id')}",
                    report_group_id,
                    report_group_label,
                )

    return result


def _flatten_questions(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Возвращает обычные вопросы и шаблонные вопросы из blueprint-групп."""
    result = []

    for question in questions or []:
        if question.get('type') == 'blueprint' and isinstance(question.get('options'), list):
            result.extend(_flatten_questions(question['options']))
        else:
            result.append(question)

    return result


def _resolve_question_id(raw_id: Any, questions: list[dict[str, Any]]) -> Any:
    """Связывает сгенерированный blueprint-id с id вопроса-шаблона для отчёта."""
    raw_text = str(raw_id)

    for question in questions:
        question_id = question.get('id')
        if str(question_id) == raw_text:
            return question_id

    for question in questions:
        question_id = question.get('id')
        if raw_text.endswith(f'-{question_id}'):
            return question_id

    return raw_id


def _build_report_questions(survey_row: Any, answer_rows: list[Any], db: Any = None) -> list[dict[str, Any]]:
    questions: list[dict[str, Any]] = []
    question_ids: set[str] = set()
    groups = sorted({answer.group for answer in answer_rows})

    def add(question: dict[str, Any]) -> None:
        question_id = str(question.get("id"))
        if question_id in question_ids:
            return
        questions.append(question)
        question_ids.add(question_id)

    for question in survey_row.questions or []:
        if question.get("type") != "blueprint":
            add(question)
            continue

        for group in groups:
            for expanded_question in _expand_blueprint(
                question,
                _get_group_pairs(survey_row.id, group, db),
                group,
            ):
                add(expanded_question)

    return questions


def build_report_visualizer(survey_row: Any, answer_rows: list[Any], db: Any = None) -> SurveyVisualizer:
    """Преобразует SQLAlchemy-модели приложения в модели генераторов PDF/XLSX."""
    questions = _build_report_questions(survey_row, answer_rows, db)
    question_ids = {str(question.get("id")) for question in questions}
    fallback_questions = _flatten_questions(survey_row.questions or [])

    report_survey = ReportSurvey(
        id=str(survey_row.id),
        title=survey_row.title,
        description=survey_row.description,
        questions=questions,
        is_active=survey_row.is_active,
        created_at=survey_row.created_at,
    )

    report_answers = []
    for answer_row in answer_rows:
        normalized_items = []

        for item in answer_row.answers or []:
            normalized_item = dict(item)
            raw_question_id = item.get('id_question')
            if str(raw_question_id) not in question_ids:
                raw_question_id = _resolve_question_id(raw_question_id, fallback_questions)
            normalized_item['id_question'] = raw_question_id
            normalized_items.append(normalized_item)

        report_answers.append(
            ReportAnswer(
                id=str(answer_row.id),
                survey_id=str(answer_row.survey_id),
                group=answer_row.group,
                answers=normalized_items,
                created_at=answer_row.created_at,
            )
        )

    return SurveyVisualizer([report_survey], report_answers)
