from pydantic import *
from typing import Optional

"""Здесь описанна структура входяших и исходящих данных"""

class Question(BaseModel):
    id_question: int
    title: str
    type: str

class RadioButton(Question):
    type: Literal["RadioButton"] = "RadioButton"
    answers: list[str]

class Checkbox(Question):
    type: Literal["Checkbox"] = "Checkbox"  
    answers: list[str]

class FreeQuestion(Question):
    type: Literal["FreeQuestion"] = "FreeQuestion"

class ScaleQuestion(Question):
    type: Literal["ScaleQuestion"] = "ScaleQuestion"
    min_range: int
    max_range: int
    step: Optional[int] = 1

class QuestionAnswer(BaseModel):
    id_question: int
    answer: list[str]

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

"""Лист со всеми опросами"""
class SurveyList(BaseModel):
    count: int
    survey_list: list[SurveyResponse]

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

class AnswerList(BaseModel):
    count: int
    answers_list: list[AnswerResponse]

"""Данные для обновления ответа на опрос"""
class AnswerUpdate(BaseModel):
    survey_id: Optional[int] = None
    group: Optional[int] = None
    answers: Optional[list[dict]] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
