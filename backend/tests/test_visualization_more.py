import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import pandas as pd

from utils.visualization_functions import Answer, Survey, SurveyVisualizer


def _close(fig):
    plt.close(fig)


def _visualizer():
    survey = Survey(
        id="s1",
        title="Survey",
        description="Description",
        questions=[
            {"id": "choice", "title": "Choice", "type": "radio", "answers": ["A", "B", "C"]},
            {"id": "number", "title": "Number", "type": "scale"},
            {"id": "boolean", "title": "Boolean", "type": "boolean"},
            {"id": "text", "title": "Text", "type": "text"},
        ],
    )
    answers = [
        Answer(
            id="a1",
            survey_id="s1",
            group="g1",
            answers=[
                {"id_question": "choice", "value": "A"},
                {"id_question": "number", "value": 1},
                {"id_question": "boolean", "value": "true"},
                {"id_question": "text", "value": "alpha beta gamma"},
            ],
        ),
        Answer(
            id="a2",
            survey_id="s1",
            group="g2",
            answers=[
                {"id_question": "choice", "value": "B"},
                {"id_question": "number", "value": 5},
                {"id_question": "boolean", "value": "false"},
                {"id_question": "text", "value": "alpha delta"},
            ],
        ),
    ]
    return SurveyVisualizer([survey], answers)


def test_plot_choice_covers_both_horizontal_and_pie_branches():
    values = pd.Series(["A", "A", "B"])
    visualizer = _visualizer()

    for chart_type, min_axes in [("both", 2), ("horizontal", 1), ("pie", 1)]:
        fig = visualizer.plot_choice(values, "Choice", chart_type=chart_type, options=["A", "B", "C"])
        assert isinstance(fig, plt.Figure)
        assert len(fig.axes) >= min_axes
        _close(fig)


def test_plot_numeric_covers_all_chart_branches_and_empty_data():
    values = pd.Series([1, 2, 3, 4])
    visualizer = _visualizer()

    for chart_type in ["all", "box", "violin", "ecdf", "summary"]:
        fig = visualizer.plot_numeric(values, "Number", chart_type=chart_type, figsize=(7, 5))
        assert isinstance(fig, plt.Figure)
        _close(fig)

    empty_fig = visualizer.plot_numeric(pd.Series(["bad", None]), "Number")
    assert isinstance(empty_fig, plt.Figure)
    _close(empty_fig)


def test_plot_text_covers_summary_and_long_examples():
    values = pd.Series(["x" * 90, "short", "another", "last"])
    visualizer = _visualizer()

    summary_fig = visualizer.plot_text(values, "Text", chart_type="summary")
    list_fig = visualizer.plot_text(values, "Text", chart_type="list", max_examples=2)

    assert isinstance(summary_fig, plt.Figure)
    assert isinstance(list_fig, plt.Figure)
    _close(summary_fig)
    _close(list_fig)


def test_plot_boolean_covers_both_and_pie_branches():
    values = pd.Series(["true", "false", "maybe"])
    visualizer = _visualizer()

    for chart_type, min_axes in [("both", 2), ("pie", 1)]:
        fig = visualizer.plot_boolean(values, "Boolean", chart_type=chart_type)
        assert isinstance(fig, plt.Figure)
        assert len(fig.axes) >= min_axes
        _close(fig)


def test_word_cloud_and_word_comparison_cover_empty_and_non_empty_paths():
    visualizer = _visualizer()

    empty_word_cloud = visualizer.plot_word_cloud(pd.Series(["a", ""]), "Text")
    comparison = visualizer.plot_word_comparison(
        pd.Series(["alpha beta", "alpha", "beta", "none"]),
        "Text",
        ["alpha"],
        ["beta"],
    )

    assert isinstance(empty_word_cloud, plt.Figure)
    assert isinstance(comparison, plt.Figure)
    _close(empty_word_cloud)
    _close(comparison)


def test_plot_choice_by_group_handles_missing_column_and_empty_values():
    visualizer = _visualizer()

    missing_column = visualizer.plot_choice_by_group("s1", "missing", "Missing")
    empty_values = visualizer.plot_choice_by_group("s1", "text", "Text with empty values")

    assert isinstance(missing_column, plt.Figure)
    assert isinstance(empty_values, plt.Figure)
    _close(missing_column)
    _close(empty_values)
