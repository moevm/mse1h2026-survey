from fastapi import FastAPI, status, Body, Depends, HTTPException
import json
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import *
from schemas import *


# na prode zamenit na migrations
Base.metadata.create_all(bind=engine)

app = FastAPI()


"""Формат входящей и изходящей информации об опросах смотреть в schemas.py"""
@app.get("/survey/{id}", response_model=SurveyResponse)
def get_survey(id:int, db:Session = Depends(get_db)):
    """Находит опрос по ID"""
    survey = db.query(Survey).filter(Survey.id == id).first()
    if not survey:
        raise HTTPException(
            detail="Not found survey with this ID", 
            status_code=status.HTTP_404_NOT_FOUND
        )
    return survey

@app.post("/survey", response_model=SurveyResponse)
def post_survey(data:SurveyCreate, db:Session = Depends(get_db)):
    """Создает сразу же активный опрос"""
    existing_survey = db.query(Survey).filter(Survey.title == data.title).first()
    if existing_survey:
        raise HTTPException(
            detail="Already exist survey with this title",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    new_survey = Survey(**data.model_dump())
    db.add(new_survey)

    try:
        db.commit()
        db.refresh(new_survey)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            detail=f"Something goes wrong:{e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return new_survey 

@app.put("/survey/{id}", response_model=SurveyResponse)
def put_survey(id:int, data:SurveyUpdate, db:Session = Depends(get_db)):
    """Обновляет данные опроса"""
    exist_survey = db.query(Survey).filter(Survey.id == id).first()
    if not exist_survey:
        raise HTTPException(
            detail="Not found survey with this ID", 
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(exist_survey, key, value)

    try:
        db.commit()
        db.refresh(exist_survey)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            detail=f"Something goes wrong:{e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return exist_survey

@app.delete("/survey/{id}")
def delete_survey(id:int, db:Session = Depends(get_db)):
    """Удаляет опрос по ID"""
    survey = db.query(Survey).filter(Survey.id == id).first()
    if not survey:
        raise HTTPException(
            detail="Not found survey with this ID",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    db.delete(survey)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            detail=f"Something goes wrong:{e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return None


@app.get("/answers/{id}", response_model=AnswerResponse)
def get_answer(id:int, db:Session = Depends(get_db)):
    """Находит ответ на опрос по ID"""
    answer = db.query(Answer).filter(Answer.id == id).first()

    if not answer:
        raise HTTPException(
            detail="Not found answer with this ID",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    return answer

@app.post("/answers", response_model=AnswerResponse)
def post_answer(data:AnswerCreate, db:Session = Depends(get_db)):
    """Создает ответ на опрос"""
    new_answer = Answer(**data.model_dump())
    db.add(new_answer)

    try:
        db.commit()
        db.refresh(new_answer)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            detail=f"Something goes wrong:{e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return new_answer

@app.put("/answers/{id}", response_model=AnswerResponse)
def put_answer(id:int, data:AnswerUpdate, db:Session = Depends(get_db)):
    """Обновляет данные ответа"""
    exist_answer = db.query(Answer).filter(Answer.id == id).first()
    if not exist_answer:
        raise HTTPException(
            detail="Not found answer with this ID",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(exist_answer, key, value)

    try:
        db.commit()
        db.refresh(exist_answer)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            detail=f"Something goes wrong:{e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return exist_answer

@app.delete("/answers/{id}")
def delete_answer(id:int, db:Session = Depends(get_db)):
    """Удаляет ответ на опрос по ID"""
    exist_answer = db.query(Answer).filter(Answer.id == id).first()

    if not exist_answer:
        raise HTTPException(
            detail="Not found answer with this ID",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    db.delete(exist_answer)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            detail=f"Something goes wrong:{e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return None
