from typing import Any

from utils.visualization_functions import (
    Answer as ReportAnswer,
    Survey as ReportSurvey,
    SurveyVisualizer,
)


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


def build_report_visualizer(survey_row: Any, answer_rows: list[Any]) -> SurveyVisualizer:
    """Преобразует SQLAlchemy-модели приложения в модели генераторов PDF/XLSX."""
    questions = _flatten_questions(survey_row.questions or [])

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
            normalized_item['id_question'] = _resolve_question_id(
                item.get('id_question'),
                questions,
            )
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
