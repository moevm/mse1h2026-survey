import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import pandas as pd
import pytest
from datetime import datetime

from visualization_functions import Survey, Answer, StatsCalculator, SurveyVisualizer


@pytest.fixture
def sample_surveys():
    return [
        Survey(
            id=1,
            title="Учебный опрос",
            description="Тестовый опрос",
            questions=[
                {"id": 1, "text": "Любимый цвет", "type": "choice"},
                {"id": 2, "text": "Возраст", "type": "number"},
                {"id": 3, "text": "Нравится курс?", "type": "boolean"},
                {"id": 4, "text": "Комментарий", "type": "text"},
            ]
        )
    ]


@pytest.fixture
def sample_answers():
    return [
        Answer(
            id=1,
            survey_id=1,
            group="A",
            answers=[
                {"question_id": 1, "value": "Красный"},
                {"question_id": 2, "value": 20},
                {"question_id": 3, "value": "да"},
                {"question_id": 4, "value": "Очень интересный курс"}
            ],
            created_at=datetime(2024, 1, 1)
        ),
        Answer(
            id=2,
            survey_id=1,
            group="A",
            answers=[
                {"question_id": 1, "value": "Синий"},
                {"question_id": 2, "value": 22},
                {"question_id": 3, "value": "нет"},
                {"question_id": 4, "value": "Нормально, но сложно"}
            ],
            created_at=datetime(2024, 1, 2)
        ),
        Answer(
            id=3,
            survey_id=1,
            group="B",
            answers=[
                {"question_id": 1, "value": "Красный"},
                {"question_id": 2, "value": 21},
                {"question_id": 3, "value": "true"},
                {"question_id": 4, "value": "Очень полезно и понятно"}
            ],
            created_at=datetime(2024, 1, 3)
        ),
        Answer(
            id=4,
            survey_id=1,
            group="B",
            answers=[
                {"question_id": 1, "value": "Зеленый"},
                {"question_id": 2, "value": 23},
                {"question_id": 3, "value": "false"},
                {"question_id": 4, "value": ""}
            ],
            created_at=datetime(2024, 1, 4)
        ),
    ]


@pytest.fixture
def visualizer(sample_surveys, sample_answers):
    return SurveyVisualizer(sample_surveys, sample_answers)


def close_fig(fig):
    plt.close(fig)


def test_prepare_dataframe_creates_expected_columns(visualizer):
    df = visualizer.df

    assert not df.empty
    assert "survey_id" in df.columns
    assert "group" in df.columns
    assert "q_1" in df.columns
    assert "q_2" in df.columns
    assert "q_3" in df.columns
    assert "q_4" in df.columns
    assert pd.api.types.is_numeric_dtype(df["q_2"])


def test_choice_stats_with_missing_options():
    values = pd.Series(["A", "B", "A"])
    stats = StatsCalculator.choice_stats(values, options=["A", "B", "C"])

    assert stats["total"] == 3
    assert stats["unique"] == 2
    assert stats["most_common"] == "A"
    assert stats["most_common_count"] == 2
    assert stats["distribution"]["C"] == 0


def test_numeric_stats():
    values = pd.Series([1, 2, 3, 4, 5])
    stats = StatsCalculator.numeric_stats(values)

    assert stats["total"] == 5
    assert stats["mean"] == 3.0
    assert stats["median"] == 3.0
    assert stats["min"] == 1
    assert stats["max"] == 5


def test_boolean_stats():
    values = pd.Series(["да", "нет", "true", "false", "1", "0", "maybe"])
    stats = StatsCalculator.boolean_stats(values)

    assert stats["total"] == 7
    assert stats["true"] == 3
    assert stats["false"] == 3
    assert stats["other"] == 1


def test_text_stats():
    values = pd.Series(["текст", "", "  ", "ещё текст"])
    stats = StatsCalculator.text_stats(values)

    assert stats["total"] == 4
    assert stats["empty"] == 2
    assert stats["filled"] == 2
    assert stats["unique"] == 2


def test_word_frequency():
    values = pd.Series([
        "Мне нравится Python и анализ данных",
        "Python очень полезен",
        "Анализ данных важен"
    ])
    stats = StatsCalculator.word_frequency(values, top_n=5)

    assert stats["total_responses"] == 3
    assert stats["unique_words"] > 0
    assert "python" in stats["top_words"]


def test_plot_choice_returns_figure(visualizer):
    values = visualizer.get_question_values(1, 1)
    fig = visualizer.plot_choice(values, "Любимый цвет", chart_type="bar")

    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) == 1
    close_fig(fig)


def test_plot_numeric_returns_figure(visualizer):
    values = visualizer.get_question_values(1, 2)
    fig = visualizer.plot_numeric(values, "Возраст", chart_type="hist")

    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) == 1
    close_fig(fig)


def test_plot_boolean_returns_figure(visualizer):
    values = visualizer.get_question_values(1, 3)
    fig = visualizer.plot_boolean(values, "Нравится курс?", chart_type="bar")

    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) == 1
    close_fig(fig)


def test_plot_text_returns_figure(visualizer):
    values = visualizer.get_question_values(1, 4)
    fig = visualizer.plot_text(values, "Комментарий", chart_type="list")

    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) == 1
    close_fig(fig)


def test_plot_word_cloud_returns_figure(visualizer):
    values = visualizer.get_question_values(1, 4)
    fig = visualizer.plot_word_cloud(values, "Комментарий", top_n=5)

    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) >= 1
    close_fig(fig)


def test_plot_choice_by_group_returns_figure(visualizer):
    fig = visualizer.plot_choice_by_group(
        survey_id=1,
        question_id=1,
        question_text="Любимый цвет",
        options=["Красный", "Синий", "Зеленый"]
    )

    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) == 1
    close_fig(fig)


def test_plot_choice_by_group_normalized(visualizer):
    fig = visualizer.plot_choice_by_group(
        survey_id=1,
        question_id=1,
        question_text="Любимый цвет",
        options=["Красный", "Синий", "Зеленый"],
        normalize=True
    )

    assert isinstance(fig, plt.Figure)
    assert fig.axes[0].get_ylabel() == "Процент внутри группы"
    close_fig(fig)


def test_plot_choice_by_group_no_data(sample_surveys):
    visualizer = SurveyVisualizer(sample_surveys, [])

    fig = visualizer.plot_choice_by_group(
        survey_id=1,
        question_id=1,
        question_text="Любимый цвет"
    )

    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) == 1
    close_fig(fig)