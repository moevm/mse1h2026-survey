import io
from typing import List, Dict, Optional
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import matplotlib.pyplot as plt
import pandas as pd

from visualization_functions import SurveyVisualizer


class PDFExporter:

    def __init__(self, visualizer: SurveyVisualizer):
        self.visualizer = visualizer
        self.styles = self._get_styles()

    def _get_styles(self):
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            textColor=colors.HexColor('#2C3E50'),
            alignment=TA_CENTER,
            spaceAfter=30,
            spaceBefore=20
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=colors.HexColor('#34495E'),
            spaceAfter=12,
            spaceBefore=20,
            alignment=TA_LEFT
        )

        subheading_style = ParagraphStyle(
            'CustomSubheading',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.HexColor('#7F8C8D'),
            spaceAfter=10,
            spaceBefore=15
        )

        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            spaceAfter=6,
            alignment=TA_LEFT
        )

        return {
            'title': title_style,
            'heading': heading_style,
            'subheading': subheading_style,
            'normal': normal_style,
            'default': styles['Normal']
        }

    def export_survey_to_pdf(self, survey_id: int, filename: str = None,
                             include_charts: bool = True) -> bytes:
        survey = self.visualizer.surveys.get(survey_id)
        if not survey:
            raise ValueError(f"Survey with ID {survey_id} not found")

        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )

        story = []

        story.extend(self._create_title_page(survey))
        story.append(PageBreak())

        story.extend(self._create_survey_summary(survey_id, survey))
        story.append(PageBreak())

        for question in survey.questions:
            question_content = self._create_question_analysis(survey_id, question, include_charts)
            if question_content:
                story.extend(question_content)
                story.append(PageBreak())

        doc.build(story)

        buffer.seek(0)

        if filename:
            with open(filename, 'wb') as f:
                f.write(buffer.getvalue())
            return None

        return buffer.getvalue()

    def _create_title_page(self, survey) -> List:
        story = []

        story.append(Paragraph("Survey Report", self.styles['title']))
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph(survey.title, self.styles['heading']))
        story.append(Spacer(1, 1*cm))

        info_data = [
            ["Survey ID:", str(survey.id)],
            ["Description:", survey.description if survey.description else "No description"],
            ["Created:", survey.created_at.strftime("%d.%m.%Y") if survey.created_at else "Not specified"],
            ["Questions:", str(len(survey.questions))],
            ["Report date:", datetime.now().strftime("%d.%m.%Y %H:%M:%S")]
        ]

        info_table = Table(info_data, colWidths=[4*cm, 10*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(info_table)

        return story

    def _create_survey_summary(self, survey_id: int, survey) -> List:
        story = []

        story.append(Paragraph("General Statistics", self.styles['heading']))
        story.append(Spacer(1, 0.3*cm))

        total_answers = len(self.visualizer.get_survey_data(survey_id))

        metrics = [["Total responses:", str(total_answers)]]

        df = self.visualizer.df
        if not df.empty and 'group' in df.columns:
            group_stats = df[df['survey_id'] == survey_id]
            if not group_stats.empty:
                group_counts = group_stats['group'].value_counts()
                for group, count in group_counts.items():
                    metrics.append([f"  Group {group}:", str(count)])

        metrics_table = Table(metrics, colWidths=[6*cm, 8*cm])
        metrics_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(metrics_table)
        story.append(Spacer(1, 0.5*cm))

        return story

    def _create_question_analysis(self, survey_id: int, question: Dict,
                                   include_charts: bool) -> List:
        story = []

        question_id = question.get('id')
        question_text = question.get('text', f"Question {question_id}")
        question_type = question.get('type', 'text')

        values = self.visualizer.get_question_values(survey_id, question_id)

        if len(values) == 0:
            return []

        story.append(Paragraph(f"Question {question_id}: {question_text}",
                              self.styles['subheading']))
        story.append(Spacer(1, 0.2*cm))

        if question_type == 'choice':
            story.extend(self._create_choice_analysis(values))
        elif question_type in ['number', 'integer', 'float']:
            story.extend(self._create_numeric_analysis(values))
        elif question_type == 'boolean':
            story.extend(self._create_boolean_analysis(values))
        else:
            story.extend(self._create_text_analysis(values))

        if include_charts and len(values) > 0:
            try:
                if question_type == 'choice':
                    fig = self.visualizer.plot_choice(values, question_text, chart_type='bar', figsize=(8, 5))
                    img_data = self._fig_to_bytes(fig)
                    story.append(Spacer(1, 0.5*cm))
                    story.append(Image(img_data, width=12*cm, height=8*cm))
                    plt.close(fig)
                elif question_type in ['number', 'integer', 'float']:
                    values_num = pd.to_numeric(values, errors='coerce').dropna()
                    if len(values_num) > 0:
                        fig = self.visualizer.plot_numeric(values_num, question_text, chart_type='hist', figsize=(8, 5))
                        img_data = self._fig_to_bytes(fig)
                        story.append(Spacer(1, 0.5*cm))
                        story.append(Image(img_data, width=12*cm, height=8*cm))
                        plt.close(fig)
                elif question_type == 'boolean':
                    fig = self.visualizer.plot_boolean(values, question_text, chart_type='bar', figsize=(8, 5))
                    img_data = self._fig_to_bytes(fig)
                    story.append(Spacer(1, 0.5*cm))
                    story.append(Image(img_data, width=12*cm, height=8*cm))
                    plt.close(fig)
                elif question_type == 'text':
                    word_stats = self.visualizer.stats.word_frequency(values, top_n=20)
                    if word_stats['top_words']:
                        fig = self.visualizer.plot_word_cloud(values, question_text, top_n=20, figsize=(8, 5))
                        img_data = self._fig_to_bytes(fig)
                        story.append(Spacer(1, 0.5*cm))
                        story.append(Image(img_data, width=12*cm, height=8*cm))
                        plt.close(fig)
            except Exception:
                pass

        return story

    def _create_choice_analysis(self, values: pd.Series) -> List:
        story = []
        stats = self.visualizer.stats.choice_stats(values)

        if stats['total'] == 0:
            return []

        story.append(Paragraph(f"<b>Total answers:</b> {stats['total']}", self.styles['normal']))
        story.append(Paragraph(f"<b>Unique options:</b> {stats['unique']}", self.styles['normal']))

        if stats['most_common']:
            story.append(Paragraph(f"<b>Most common:</b> {stats['most_common']} "
                                  f"({stats['most_common_count']} times)", self.styles['normal']))

        story.append(Spacer(1, 0.3*cm))

        distribution = [["Option", "Count", "Percent"]]
        total = stats['total']

        for option, count in stats['distribution'].items():
            if count > 0:
                percent = (count / total * 100) if total > 0 else 0
                distribution.append([str(option)[:30], str(count), f"{percent:.1f}%"])

        if len(distribution) > 1:
            dist_table = Table(distribution, colWidths=[6*cm, 2.5*cm, 2.5*cm])
            dist_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (1, 1), (2, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(dist_table)

        return story

    def _create_numeric_analysis(self, values: pd.Series) -> List:
        story = []
        values_num = pd.to_numeric(values, errors='coerce').dropna()

        if len(values_num) == 0:
            return []

        stats = self.visualizer.stats.numeric_stats(values_num)

        key_stats = [
            ["Count:", f"{stats.get('total', 0)}"],
            ["Mean:", f"{stats.get('mean', 0)}"],
            ["Median:", f"{stats.get('median', 0)}"],
            ["Std Dev:", f"{stats.get('std', 0)}"],
            ["Min:", f"{stats.get('min', 0)}"],
            ["Max:", f"{stats.get('max', 0)}"]
        ]

        stats_table = Table(key_stats, colWidths=[5*cm, 5*cm])
        stats_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))

        story.append(stats_table)
        return story

    def _create_boolean_analysis(self, values: pd.Series) -> List:
        story = []
        stats = self.visualizer.stats.boolean_stats(values)

        if stats['total'] == 0:
            return []

        story.append(Paragraph(f"<b>Total answers:</b> {stats['total']}", self.styles['normal']))
        story.append(Paragraph(f"<b>Yes:</b> {stats['true']} ({stats['true_percent']:.1f}%)", self.styles['normal']))

        if stats['other'] > 0:
            false_percent = (stats['false'] / stats['total'] * 100)
            story.append(Paragraph(f"<b>No:</b> {stats['false']} ({false_percent:.1f}%)", self.styles['normal']))
            other_percent = (stats['other'] / stats['total'] * 100)
            story.append(Paragraph(f"<b>Other:</b> {stats['other']} ({other_percent:.1f}%)", self.styles['normal']))
        else:
            false_percent = 100 - stats['true_percent']
            story.append(Paragraph(f"<b>No:</b> {stats['false']} ({false_percent:.1f}%)", self.styles['normal']))

        return story

    def _create_text_analysis(self, values: pd.Series) -> List:
        story = []
        stats = self.visualizer.stats.text_stats(values)

        if stats['total'] == 0:
            return []

        story.append(Paragraph(f"<b>Total answers:</b> {stats['total']}", self.styles['normal']))
        story.append(Paragraph(f"<b>Filled:</b> {stats['filled']}", self.styles['normal']))
        story.append(Paragraph(f"<b>Empty:</b> {stats['empty']}", self.styles['normal']))
        story.append(Paragraph(f"<b>Avg length:</b> {stats['avg_length']} chars", self.styles['normal']))
        story.append(Paragraph(f"<b>Unique:</b> {stats['unique']}", self.styles['normal']))

        story.append(Spacer(1, 0.3*cm))

        non_empty = values[values.astype(str).str.strip() != '']
        if len(non_empty) > 0:
            story.append(Paragraph("<b>Sample answers:</b>", self.styles['normal']))
            story.append(Spacer(1, 0.2*cm))

            for i, val in enumerate(non_empty.head(5), 1):
                val_str = str(val)[:100]
                story.append(Paragraph(f"{i}. {val_str}", self.styles['normal']))
                story.append(Spacer(1, 0.1*cm))

        return story

    def _fig_to_bytes(self, fig: plt.Figure, dpi: int = 80) -> io.BytesIO:
        img_data = io.BytesIO()
        fig.savefig(img_data, format='png', dpi=dpi, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        img_data.seek(0)
        return img_data