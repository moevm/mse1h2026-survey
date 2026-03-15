from pydantic import *
from typing import Optional

"""Здесь описанна структура входяших и исходящих данных"""

"""схемма данных для создания опроса"""
class SurveyCreate(BaseModel):
    title: str
    description: str
    lifetime_seconds: Optional[int] = None
    questions: list[dict]

"""Схемма данных об опросе от сервера"""
class SurveyResponse(BaseModel):
    id: int
    title: str
    description: str
    lifetime_seconds: Optional[int] = None
    questions: list[dict]

"""Схемма данных для обновления опроса"""
class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    lifetime_seconds: Optional[int] = None
    questions: Optional[list[dict]] = None
    is_active: Optional[bool] = None

"""Данные для создание отввета на опрос"""
class AnswerCreate(BaseModel):
    survey_id: int
    group: int
    answers: list[dict]

"""Данные об ответе от сервера"""
class AnswerResponse(BaseModel):
    id: int
    survey_id: int
    group: int
    answers: list[dict]

"""Данные для обновления ответа на опрос"""
class AnswerUpdate(BaseModel):
    survey_id: Optional[int] = None
    group: Optional[int] = None
    answers: Optional[list[dict]] = None
