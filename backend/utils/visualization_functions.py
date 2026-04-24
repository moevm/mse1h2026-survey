"""
visualization_functions.py
Функции для визуализации данных опросов с подсветкой частых слов
"""

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import json
import re
from collections import Counter


class Survey:
    def __init__(self, id: int, title: str, description: str, questions: Union[str, List],
                 is_active: bool = True, created_at: datetime = None):
        self.id = id
        self.title = title
        self.description = description
        self.questions = json.loads(questions) if isinstance(questions, str) else questions
        self.is_active = is_active
        self.created_at = created_at or datetime.now()


class Answer:
    def __init__(self, id: int, survey_id: int, group: str, answers: Union[str, List],
                 created_at: datetime = None):
        self.id = id
        self.survey_id = survey_id
        self.group = group
        self.answers = json.loads(answers) if isinstance(answers, str) else answers
        self.created_at = created_at or datetime.now()


class StatsCalculator:

    @staticmethod
    def choice_stats(values: pd.Series, options: List[str] = None) -> Dict:
        counts = values.value_counts()
        if options:
            for opt in options:
                if opt not in counts.index:
                    counts[opt] = 0
            counts = counts.reindex(options, fill_value=0)
        most_common = counts.idxmax() if not counts.empty else None
        return {
            'total': len(values),
            'unique': len(counts[counts > 0]),
            'most_common': most_common,
            'most_common_count': counts.get(most_common, 0) if most_common else 0,
            'distribution': counts.to_dict()
        }

    @staticmethod
    def numeric_stats(values: pd.Series) -> Dict:
        values = pd.to_numeric(values, errors='coerce').dropna()
        if len(values) == 0:
            return {'total': 0}
        return {
            'total': len(values),
            'mean': round(values.mean(), 2),
            'median': round(values.median(), 2),
            'std': round(values.std(), 2),
            'min': round(values.min(), 2),
            'max': round(values.max(), 2),
            'q1': round(values.quantile(0.25), 2),
            'q3': round(values.quantile(0.75), 2)
        }

    @staticmethod
    def boolean_stats(values: pd.Series) -> Dict:
        bool_map = {'True': True, 'False': False, 'true': True, 'false': False,
                   '1': True, '0': False, 'да': True, 'нет': False}
        true_count = false_count = other_count = 0
        for v in values:
            if v is None:
                continue
            str_v = str(v)
            if str_v in bool_map:
                if bool_map[str_v]:
                    true_count += 1
                else:
                    false_count += 1
            else:
                other_count += 1
        total = true_count + false_count + other_count
        return {
            'total': total,
            'true': true_count,
            'false': false_count,
            'other': other_count,
            'true_percent': round(100 * true_count / total, 1) if total > 0 else 0
        }

    @staticmethod
    def text_stats(values: pd.Series) -> Dict:
        values = values.astype(str)
        non_empty = values[values.str.strip() != '']
        return {
            'total': len(values),
            'empty': (values.str.strip() == '').sum(),
            'filled': len(non_empty),
            'avg_length': round(non_empty.str.len().mean(), 1) if len(non_empty) > 0 else 0,
            'unique': non_empty.nunique()
        }

    @staticmethod
    def extract_words(text: str, min_word_length: int = 3, stop_words: List[str] = None) -> List[str]:
        if stop_words is None:
            stop_words = ['это', 'что', 'как', 'так', 'для', 'все', 'когда', 'уже',
                         'еще', 'только', 'чтобы', 'также', 'вот', 'которые', 'свои',
                         'можно', 'очень', 'есть', 'будет', 'было', 'если', 'нет', 'да']
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', '', text)
        words = text.split()
        return [w for w in words if len(w) >= min_word_length and w not in stop_words]

    @staticmethod
    def word_frequency(values: pd.Series, top_n: int = 20, min_word_length: int = 3,
                      stop_words: List[str] = None) -> Dict:
        values = values.astype(str)
        non_empty = values[values.str.strip() != '']
        all_words = []
        word_counts = Counter()
        for text in non_empty:
            words = StatsCalculator.extract_words(text, min_word_length, stop_words)
            all_words.extend(words)
            word_counts.update(set(words))
        top_words = word_counts.most_common(top_n)
        return {
            'total_words': len(all_words),
            'unique_words': len(word_counts),
            'top_words': dict(top_words),
            'total_responses': len(non_empty)
        }


class SurveyVisualizer:

    def __init__(self, surveys: List[Survey], answers: List[Answer]):
        self.surveys = {s.id: s for s in surveys}
        self.answers = answers
        self.stats = StatsCalculator()
        self.df = self._prepare_dataframe()

    def _prepare_dataframe(self) -> pd.DataFrame:
        rows = []
        for ans in self.answers:
            survey = self.surveys.get(ans.survey_id)
            if not survey:
                continue
            row = {
                'answer_id': ans.id,
                'survey_id': ans.survey_id,
                'survey_title': survey.title,
                'group': ans.group,
                'created_at': ans.created_at
            }
            # Создаем словарь для ответов
            answers_dict = {a.get('question_id'): a.get('value') for a in ans.answers}

            for q in survey.questions:
                q_id = q.get('id')
                row[f'q_{q_id}'] = answers_dict.get(q_id)

            rows.append(row)

        base_columns = ['answer_id', 'survey_id', 'survey_title', 'group', 'created_at']
        question_columns = []
        for survey in self.surveys.values():
            for q in survey.questions:
                q_id = q.get('id')
                question_columns.append(f'q_{q_id}')

        all_columns = base_columns + question_columns
        df = pd.DataFrame(rows, columns=all_columns)

        # Убираем дублирование колонок
        df = df.loc[:, ~df.columns.duplicated()]

        # Конвертируем числовые колонки
        for survey in self.surveys.values():
            for q in survey.questions:
                q_id = q.get('id')
                col = f'q_{q_id}'
                if col in df.columns and q.get('type') in ['number', 'integer', 'float']:
                    df[col] = pd.to_numeric(df[col], errors='coerce')

        return df

    def get_survey_data(self, survey_id: int) -> pd.DataFrame:
        if 'survey_id' not in self.df.columns:
            return pd.DataFrame(columns=self.df.columns)
        return self.df[self.df['survey_id'] == survey_id].copy()

    def get_question_values(self, survey_id: int, question_id: int) -> pd.Series:
        df = self.get_survey_data(survey_id)
        col = f'q_{question_id}'
        return df[col].dropna() if col in df.columns else pd.Series()

    def get_choice_stats(self, survey_id: int, question_id: int, options: List[str] = None) -> Dict:
        return self.stats.choice_stats(self.get_question_values(survey_id, question_id), options)

    def get_numeric_stats(self, survey_id: int, question_id: int) -> Dict:
        return self.stats.numeric_stats(self.get_question_values(survey_id, question_id))

    def get_boolean_stats(self, survey_id: int, question_id: int) -> Dict:
        return self.stats.boolean_stats(self.get_question_values(survey_id, question_id))

    def get_text_stats(self, survey_id: int, question_id: int) -> Dict:
        return self.stats.text_stats(self.get_question_values(survey_id, question_id))

    def get_word_frequency(self, survey_id: int, question_id: int, top_n: int = 20,
                          min_word_length: int = 3, stop_words: List[str] = None) -> Dict:
        return self.stats.word_frequency(
            self.get_question_values(survey_id, question_id),
            top_n, min_word_length, stop_words
        )

    def plot_choice(self, values: pd.Series, question_text: str,
                    chart_type: str = 'both', options: List[str] = None,
                    figsize: tuple = (12, 5), **kwargs) -> plt.Figure:
        counts = values.value_counts()
        if options:
            for opt in options:
                if opt not in counts.index:
                    counts[opt] = 0
            counts = counts.reindex(options, fill_value=0)

        if chart_type == 'both':
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)
            bars = ax1.bar(range(len(counts)), counts.values, **kwargs.get('bar_kwargs', {}))
            ax1.set_xticks(range(len(counts)))
            ax1.set_xticklabels(counts.index, rotation=45, ha='right')
            ax1.set_title(f'Распределение (n={len(values)})')
            ax1.set_ylabel('Количество')
            for bar, count in zip(bars, counts.values):
                if count > 0:
                    ax1.text(bar.get_x() + bar.get_width()/2., count, f'{int(count)}',
                            ha='center', va='bottom')
            non_zero = counts[counts > 0]
            if not non_zero.empty:
                ax2.pie(non_zero.values, labels=non_zero.index, autopct='%1.1f%%')
            ax2.set_title('Проценты')
        elif chart_type == 'bar':
            fig, ax = plt.subplots(figsize=figsize)
            ax.bar(range(len(counts)), counts.values, **kwargs.get('bar_kwargs', {}))
            ax.set_xticks(range(len(counts)))
            ax.set_xticklabels(counts.index, rotation=45, ha='right')
            ax.set_ylabel('Количество')
            ax.set_title(f'{question_text} (n={len(values)})')
        elif chart_type == 'horizontal':
            fig, ax = plt.subplots(figsize=figsize)
            ax.barh(range(len(counts)), counts.values, **kwargs.get('bar_kwargs', {}))
            ax.set_yticks(range(len(counts)))
            ax.set_yticklabels(counts.index)
            ax.set_xlabel('Количество')
            ax.set_title(f'{question_text} (n={len(values)})')
        else:
            fig, ax = plt.subplots(figsize=figsize)
            non_zero = counts[counts > 0]
            if not non_zero.empty:
                ax.pie(non_zero.values, labels=non_zero.index, autopct='%1.1f%%')
            ax.set_title(f'{question_text} (n={len(values)})')
        plt.suptitle(question_text, fontweight='bold')
        plt.tight_layout()
        return fig

    def plot_numeric(self, values: pd.Series, question_text: str,
                     chart_type: str = 'hist', figsize: tuple = (12, 8),
                     **kwargs) -> plt.Figure:
        values = pd.to_numeric(values, errors='coerce').dropna()
        if len(values) == 0:
            fig, ax = plt.subplots()
            ax.text(0.5, 0.5, 'Нет числовых данных', ha='center', va='center')
            return fig

        if chart_type == 'all':
            fig, axes = plt.subplots(2, 3, figsize=figsize)
            axes[0, 0].hist(values, bins=min(20, len(values)), edgecolor='black', alpha=0.7)
            axes[0, 0].set_title('Гистограмма')
            axes[0, 1].boxplot(values)
            axes[0, 1].set_title('Ящик с усами')
            axes[0, 2].violinplot(values)
            axes[0, 2].set_title('Скрипичный график')
            axes[1, 0].axis('off')
            stats_text = f"n={len(values)}\nμ={values.mean():.2f}\nmed={values.median():.2f}"
            stats_text += f"\nσ={values.std():.2f}\nmin={values.min():.2f}\nmax={values.max():.2f}"
            axes[1, 0].text(0.1, 0.5, stats_text, fontsize=11, va='center')
            axes[1, 1].hist(values, bins=min(20, len(values)), density=True, alpha=0.7)
            axes[1, 1].set_title('Плотность')
            axes[1, 2].ecdf(values)
            axes[1, 2].set_title('ECDF')
        elif chart_type == 'hist':
            fig, ax = plt.subplots(figsize=figsize)
            ax.hist(values, bins=min(20, len(values)), edgecolor='black', alpha=0.7,
                   **kwargs.get('hist_kwargs', {}))
            ax.set_xlabel('Значение')
            ax.set_ylabel('Частота')
            ax.set_title(f'{question_text} (n={len(values)})')
        elif chart_type == 'box':
            fig, ax = plt.subplots(figsize=figsize)
            ax.boxplot(values, **kwargs.get('box_kwargs', {}))
            ax.set_ylabel('Значение')
            ax.set_title(question_text)
        elif chart_type == 'violin':
            fig, ax = plt.subplots(figsize=figsize)
            ax.violinplot(values, **kwargs.get('violin_kwargs', {}))
            ax.set_ylabel('Значение')
            ax.set_title(question_text)
        elif chart_type == 'ecdf':
            fig, ax = plt.subplots(figsize=figsize)
            ax.ecdf(values, **kwargs.get('ecdf_kwargs', {}))
            ax.set_xlabel('Значение')
            ax.set_ylabel('Накопленная вероятность')
            ax.set_title(question_text)
        else:
            fig, ax = plt.subplots(figsize=figsize)
            ax.axis('off')
            stats_text = f"Статистика для: {question_text}\n\n"
            stats_text += f"Количество: {len(values)}\n"
            stats_text += f"Среднее: {values.mean():.2f}\n"
            stats_text += f"Медиана: {values.median():.2f}\n"
            stats_text += f"Стд отклонение: {values.std():.2f}\n"
            stats_text += f"Мин: {values.min():.2f}\n"
            stats_text += f"Макс: {values.max():.2f}\n"
            stats_text += f"25%: {values.quantile(0.25):.2f}\n"
            stats_text += f"75%: {values.quantile(0.75):.2f}"
            ax.text(0.1, 0.5, stats_text, fontsize=12, va='center')
        plt.suptitle(question_text, fontweight='bold')
        plt.tight_layout()
        return fig

    def plot_text(self, values: pd.Series, question_text: str,
                  chart_type: str = 'list', max_examples: int = 15,
                  figsize: tuple = (10, 6)) -> plt.Figure:
        values = values.astype(str)
        if chart_type == 'list':
            fig, ax = plt.subplots(figsize=figsize)
            ax.axis('off')
            text = f"ВОПРОС: {question_text}\n"
            text += f"Всего ответов: {len(values)}\n\n"
            if len(values) > 0:
                text += "ПРИМЕРЫ:\n"
                for i, val in enumerate(values.head(max_examples), 1):
                    if len(val) > 80:
                        val = val[:77] + "..."
                    text += f"{i}. {val}\n"
                if len(values) > max_examples:
                    text += f"\n... и еще {len(values) - max_examples} ответов"
            else:
                text += "Нет текстовых ответов"
            ax.text(0.05, 0.95, text, fontsize=10, va='top', family='monospace',
                    transform=ax.transAxes, bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.2))
        else:
            stats = self.stats.text_stats(values)
            fig, ax = plt.subplots(figsize=figsize)
            ax.axis('off')
            text = f"Статистика для: {question_text}\n\n"
            text += f"Всего ответов: {stats['total']}\n"
            text += f"Заполнено: {stats['filled']}\n"
            text += f"Пустых: {stats['empty']}\n"
            text += f"Средняя длина: {stats['avg_length']}\n"
            text += f"Уникальных: {stats['unique']}"
            ax.text(0.1, 0.5, text, fontsize=12, va='center')
        plt.tight_layout()
        return fig

    def plot_boolean(self, values: pd.Series, question_text: str,
                     chart_type: str = 'both', figsize: tuple = (12, 5),
                     **kwargs) -> plt.Figure:
        bool_map = {'True': 'Да', 'False': 'Нет', 'true': 'Да', 'false': 'Нет',
                   '1': 'Да', '0': 'Нет', 'да': 'Да', 'нет': 'Нет'}
        mapped = values.astype(str).map(bool_map).fillna('Другое')
        counts = mapped.value_counts()
        for label in ['Да', 'Нет']:
            if label not in counts.index:
                counts[label] = 0
        counts = counts.reindex(['Да', 'Нет'] + [c for c in counts.index if c not in ['Да', 'Нет']])
        colors = {'Да': '#2ecc71', 'Нет': '#e74c3c', 'Другое': '#95a5a6'}
        bar_colors = [colors.get(idx, '#3498db') for idx in counts.index]

        if chart_type == 'both':
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)
            bars = ax1.bar(range(len(counts)), counts.values, color=bar_colors, edgecolor='black',
                          **kwargs.get('bar_kwargs', {}))
            ax1.set_xticks(range(len(counts)))
            ax1.set_xticklabels(counts.index)
            ax1.set_title(f'Распределение (n={len(values)})')
            for bar, count in zip(bars, counts.values):
                if count > 0:
                    ax1.text(bar.get_x() + bar.get_width()/2., count, f'{int(count)}',
                            ha='center', va='bottom')
            non_zero = counts[counts > 0]
            if not non_zero.empty:
                pie_colors = [colors.get(idx, '#3498db') for idx in non_zero.index]
                ax2.pie(non_zero.values, labels=non_zero.index, autopct='%1.1f%%',
                       colors=pie_colors, **kwargs.get('pie_kwargs', {}))
            ax2.set_title('Проценты')
        elif chart_type == 'bar':
            fig, ax = plt.subplots(figsize=figsize)
            ax.bar(range(len(counts)), counts.values, color=bar_colors, edgecolor='black',
                  **kwargs.get('bar_kwargs', {}))
            ax.set_xticks(range(len(counts)))
            ax.set_xticklabels(counts.index)
            ax.set_ylabel('Количество')
            ax.set_title(f'{question_text} (n={len(values)})')
        else:
            fig, ax = plt.subplots(figsize=figsize)
            non_zero = counts[counts > 0]
            if not non_zero.empty:
                pie_colors = [colors.get(idx, '#3498db') for idx in non_zero.index]
                ax.pie(non_zero.values, labels=non_zero.index, autopct='%1.1f%%',
                      colors=pie_colors, **kwargs.get('pie_kwargs', {}))
            ax.set_title(f'{question_text} (n={len(values)})')
        plt.suptitle(question_text, fontweight='bold')
        plt.tight_layout()
        return fig

    def plot_word_cloud(self, values: pd.Series, question_text: str,
                        top_n: int = 20, min_word_length: int = 3,
                        stop_words: List[str] = None, figsize: tuple = (12, 8),
                        **kwargs) -> plt.Figure:
        word_freq = self.stats.word_frequency(values, top_n, min_word_length, stop_words)
        if not word_freq['top_words']:
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, 'Недостаточно данных для анализа слов',
                   ha='center', va='center')
            return fig

        words = list(word_freq['top_words'].keys())
        counts = list(word_freq['top_words'].values())
        sorted_data = sorted(zip(words, counts), key=lambda x: x[1])
        words = [x[0] for x in sorted_data]
        counts = [x[1] for x in sorted_data]

        norm = plt.Normalize(min(counts), max(counts))
        colors = plt.cm.viridis(norm(counts))

        fig, ax = plt.subplots(figsize=figsize)
        bars = ax.barh(words, counts, color=colors, **kwargs.get('bar_kwargs', {}))
        for bar, count in zip(bars, counts):
            ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                   f'{count}', va='center')

        ax.set_xlabel('Количество упоминаний')
        ax.set_ylabel('Слова')
        ax.set_title(f'Топ-{top_n} самых частых слов\nВсего слов: {word_freq["total_words"]}, '
                    f'Уникальных: {word_freq["unique_words"]}')

        sm = plt.cm.ScalarMappable(cmap='viridis', norm=norm)
        sm.set_array([])
        plt.colorbar(sm, ax=ax, label='Частота')

        stats_text = f"Всего ответов: {word_freq['total_responses']}"
        ax.text(0.98, 0.98, stats_text, transform=ax.transAxes,
               ha='right', va='top', fontsize=10,
               bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8))

        plt.suptitle(f'Анализ текста: {question_text}', fontweight='bold')
        plt.tight_layout()
        return fig

    def plot_word_comparison(self, values: pd.Series, question_text: str,
                            group1_words: List[str], group2_words: List[str],
                            group1_name: str = 'Группа 1', group2_name: str = 'Группа 2',
                            figsize: tuple = (10, 6)) -> plt.Figure:
        values = values.astype(str)
        group1_count = group2_count = both_count = 0
        for text in values:
            text_lower = text.lower()
            has_group1 = any(word.lower() in text_lower for word in group1_words)
            has_group2 = any(word.lower() in text_lower for word in group2_words)
            if has_group1 and has_group2:
                both_count += 1
            elif has_group1:
                group1_count += 1
            elif has_group2:
                group2_count += 1

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)
        categories = [group1_name, group2_name, 'Оба']
        counts = [group1_count, group2_count, both_count]
        bars = ax1.bar(categories, counts, color=['#3498db', '#e74c3c', '#9b59b6'])
        ax1.set_ylabel('Количество ответов')
        ax1.set_title('Упоминание слов')
        for bar, count in zip(bars, counts):
            ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                    str(count), ha='center')

        non_zero = [(cat, cnt) for cat, cnt in zip(categories, counts) if cnt > 0]
        if non_zero:
            ax2.pie([cnt for _, cnt in non_zero], labels=[cat for cat, _ in non_zero],
                   autopct='%1.1f%%', colors=['#3498db', '#e74c3c', '#9b59b6'])
        ax2.set_title('Процентное соотношение')

        plt.suptitle(f'Сравнение слов: {question_text}', fontweight='bold')
        plt.tight_layout()
        return fig

    def plot_choice_by_group(self, survey_id: int, question_id: int, question_text: str,
                             options: List[str] = None, normalize: bool = False,
                             figsize: tuple = (12, 6), **kwargs) -> plt.Figure:
        """
        Столбчатая диаграмма распределения ответов по группам.

        Args:
            survey_id: ID опроса
            question_id: ID вопроса
            question_text: текст вопроса
            options: полный список опций, чтобы показать даже отсутствующие ответы
            normalize: если True, показывать проценты внутри каждой группы
            figsize: размер графика

        Returns:
            matplotlib Figure
        """
        df = self.get_survey_data(survey_id)
        col = f'q_{question_id}'

        if df.empty or col not in df.columns:
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, 'Нет данных для сравнения по группам',
                    ha='center', va='center')
            ax.axis('off')
            return fig

        plot_df = df[['group', col]].dropna()

        if plot_df.empty:
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, 'Нет данных для сравнения по группам',
                    ha='center', va='center')
            ax.axis('off')
            return fig

        cross = pd.crosstab(plot_df['group'], plot_df[col])

        if options:
            for opt in options:
                if opt not in cross.columns:
                    cross[opt] = 0
            cross = cross.reindex(columns=options, fill_value=0)

        cross = cross.sort_index()

        if normalize:
            cross_plot = cross.div(cross.sum(axis=1).replace(0, np.nan), axis=0).fillna(0) * 100
            ylabel = 'Процент внутри группы'
        else:
            cross_plot = cross
            ylabel = 'Количество ответов'

        fig, ax = plt.subplots(figsize=figsize)
        cross_plot.plot(
            kind='bar',
            ax=ax,
            stacked=True,
            **kwargs.get('plot_kwargs', {})
        )

        ax.set_title(f'{question_text}\nСравнение по группам')
        ax.set_xlabel('Группа')
        ax.set_ylabel(ylabel)
        ax.legend(title='Ответ', bbox_to_anchor=(1.02, 1), loc='upper left')

        # Подписи итогов над столбцами
        totals = cross.sum(axis=1)
        ymax = cross_plot.sum(axis=1).max()
        offset = ymax * 0.02 if ymax > 0 else 0.5

        for i, total in enumerate(totals):
            if normalize:
                ax.text(i, 100 + 1, f'n={int(total)}', ha='center', va='bottom', fontsize=9)
                ax.set_ylim(0, max(105, ax.get_ylim()[1]))
            else:
                ax.text(i, cross_plot.sum(axis=1).iloc[i] + offset, f'n={int(total)}',
                        ha='center', va='bottom', fontsize=9)

        plt.suptitle(question_text, fontweight='bold')
        plt.tight_layout()
        return fig