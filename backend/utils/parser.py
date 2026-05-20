import io
import re

import pandas as pd
import requests
from sqlalchemy.orm import Session
from fastapi import HTTPException

from models import Group, Teacher, Discipline, GroupTeacherDiscipline


def extract_sheet_id(url: str) -> str:
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", url)
    if not match:
        raise HTTPException(
            status_code=422,
            detail=f"Не удалось найти ID таблицы в ссылке: {url}",
        )
    return match.group(1)


def download_workbook(sheet_id: str) -> pd.ExcelFile:
    export_url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    )
    try:
        resp = requests.get(export_url, timeout=30)
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Ошибка сети при загрузке таблицы: {e}")

    if resp.status_code == 403:
        raise HTTPException(
            status_code=403,
            detail="Таблица закрыта. Откройте доступ 'Все, у кого есть ссылка' в Google Sheets.",
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Google Sheets вернул HTTP {resp.status_code}",
        )

    return pd.ExcelFile(io.BytesIO(resp.content))


def _clean_name(value) -> str:
    if pd.isna(value):
        return ""
    s = str(value).strip()
    if s.endswith(".0") and s[:-2].isdigit():
        s = s[:-2]
    return s


def _parse_groups(cell_value) -> list[str]:
    if pd.isna(cell_value):
        return []
    groups = []
    for part in str(cell_value).split(","):
        g = re.sub(r"\(.*?\)", "", _clean_name(part)).strip()
        if g and g.replace(" ", "").isalnum():
            groups.append(g)
    return groups


def _parse_sheet(df: pd.DataFrame) -> list[dict]:
    records = []
    last_teacher = ""
    last_discipline = ""

    for _, row in df.iloc[1:].iterrows():
        teacher = _clean_name(row.iloc[0])
        discipline = _clean_name(row.iloc[1])

        if not teacher and not discipline:
            continue

        teacher = teacher or last_teacher
        discipline = discipline or last_discipline

        if not teacher or not discipline:
            continue

        last_teacher = teacher
        last_discipline = discipline

        lesson_type = _clean_name(row.iloc[2])
        discipline_full = f"{discipline} ({lesson_type})" if lesson_type else discipline

        groups = _parse_groups(row.iloc[3])
        if len(row) > 4:
            groups += _parse_groups(row.iloc[4])

        if groups:
            records.append({"teacher": teacher, "discipline": discipline_full, "groups": groups})

    return records


def _fetch_records(url: str) -> list[dict]:
    sheet_id = extract_sheet_id(url)
    workbook = download_workbook(sheet_id)

    all_records: list[dict] = []
    for sheet_name in workbook.sheet_names:
        df = workbook.parse(sheet_name, header=None)
        all_records.extend(_parse_sheet(df))

    if not all_records:
        raise HTTPException(
            status_code=422,
            detail=f"Не найдены листы в таблице или они пустые.",
        )

    return all_records


def _populate(records: list[dict], session: Session) -> dict:
    teacher_cache: dict[str, Teacher] = {t.name: t for t in session.query(Teacher).all()}
    discipline_cache: dict[str, Discipline] = {d.name: d for d in session.query(Discipline).all()}
    group_cache: dict[str, Group] = {g.name: g for g in session.query(Group).all()}

    existing_triples: set[tuple[int, int, int]] = {
        (a.group_id, a.teacher_id, a.discipline_id)
        for a in session.query(GroupTeacherDiscipline).all()
    }

    def get_or_create_teacher(name: str) -> Teacher:
        if name not in teacher_cache:
            obj = Teacher(name=name)
            session.add(obj)
            session.flush()
            teacher_cache[name] = obj
        return teacher_cache[name]

    def get_or_create_discipline(name: str) -> Discipline:
        if name not in discipline_cache:
            obj = Discipline(name=name)
            session.add(obj)
            session.flush()
            discipline_cache[name] = obj
        return discipline_cache[name]

    def get_or_create_group(name: str) -> Group:
        if name not in group_cache:
            obj = Group(name=name)
            session.add(obj)
            session.flush()
            group_cache[name] = obj
        return group_cache[name]

    for rec in records:
        teacher = get_or_create_teacher(rec["teacher"])
        discipline = get_or_create_discipline(rec["discipline"])

        for group_name in rec["groups"]:
            group = get_or_create_group(group_name)

            triple = (group.id, teacher.id, discipline.id)
            if triple not in existing_triples:
                session.add(GroupTeacherDiscipline(
                    group=group,
                    teacher=teacher,
                    discipline=discipline,
                ))
                existing_triples.add(triple)

    session.commit()

    return {
        "groups": len(group_cache),
        "teachers": len(teacher_cache),
        "disciplines": len(discipline_cache),
        "assignments": len(existing_triples),
    }


def parse_and_populate(url: str, session: Session) -> dict:
    records = _fetch_records(url)
    stats = _populate(records, session)
    return stats


def detect_columns_from_url(url: str) -> dict[str, str]:
    KEYWORDS = {
        "teacher":     "преподаватель",
        "discipline":  "дисциплина",
        "group":       "группа",
    }

    sheet_id = extract_sheet_id(url)
    workbook = download_workbook(sheet_id)

    df = workbook.parse(workbook.sheet_names[0], header=None)

    temp = {}
    for key, keyword in KEYWORDS.items():
        matches = [val for val in df.iloc[0].fillna("").astype(str) if keyword in val.lower()]
        if not matches:
            raise HTTPException(
                status_code=422,
                detail=f"Не найдена колонка '{keyword}' в заголовках листа.",
            )
        temp[key] = matches[0].strip()

    
    result = {}

    counter = 1
    for item in temp.values():
        result[f"option{counter}"] = item.split()[0]
        counter += 1

    return result