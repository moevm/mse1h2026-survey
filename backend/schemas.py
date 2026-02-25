from pydantic import *
from typing import Optional

"""Здесь описанна структура входяших и исходящих данных"""

"""данные для создания опроса"""
class SurveyCreate(BaseModel):
    title: str
    description: str
    questions: list[dict]

"""в каком формате будет приходить опрос от сервера"""
class SurveyResponce(BaseModel):
    id: int
    title: str
    description: str
    questions: list[dict]

"""данные для обновления"""
class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[list[dict]] = None
    is_active: Optional[bool] = None

