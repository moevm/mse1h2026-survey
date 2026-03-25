from fastapi import FastAPI, status, Body, Depends, HTTPException, Response
import json
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import *
from schemas import *
from utils import auth
from utils.permissions import RoleChecker
from fastapi.middleware.cors import CORSMiddleware
import contextlib

Base.metadata.create_all(bind=engine)

# dev-only code
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    db: Session = next(get_db())
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()

        if not admin_user:
            hashed_pwd = auth.get_password_hash("admin")

            new_admin = User(
                username="admin",
                hashed_password=hashed_pwd,
                role=UserRole.ADMIN
            )

            db.add(new_admin)
            db.commit()
            print("Администратор (admin/admin) успешно создан")
        else:
            print("Администратор уже существует")

        default_survey = db.query(Survey).filter(Survey.id == 1).first()

        if not default_survey:
            survey = Survey(
                id=1,
                title="Опрос по качеству обучения",
                description="Пожалуйста, ответьте на все 6 вопросов",
                lifetime_seconds=None,
                questions=[
                    {
                        "id": 1,
                        "title": "Насколько понятен учебный материал?",
                        "type": "scale",
                        "min": 1,
                        "max": 5,
                        "step": 1
                    },
                    {
                        "id": 2,
                        "title": "Насколько удобно расписание занятий?",
                        "type": "scale",
                        "min": 1,
                        "max": 5,
                        "step": 1
                    },
                    {
                        "id": 3,
                        "title": "Как вы оцениваете работу преподавателя?",
                        "type": "radio",
                        "answers": ["Отлично", "Хорошо", "Удовлетворительно", "Плохо"]
                    },
                    {
                        "id": 4,
                        "title": "Насколько полезны практические задания?",
                        "type": "radio",
                        "answers": ["Очень полезны", "Скорее полезны", "Мало полезны", "Бесполезны"]
                    },
                    {
                        "id": 5,
                        "title": "Что вам больше всего нравится в обучении?",
                        "type": "text"
                    },
                    {
                        "id": 6,
                        "title": "Что бы вы хотели улучшить?",
                        "type": "text"
                    }
                ]
            )

            db.add(survey)
            db.commit()
            db.refresh(survey)
            print("Опрос с id=1 успешно создан")
        else:
            print("Опрос с id=1 уже существует")

    except Exception as e:
        db.rollback()
        print(f"Ошибка при инициализации приложения: {e}")
    finally:
        db.close()

    yield

    print("Остановка приложения")

app = FastAPI(
    lifespan=lifespan,
    root_path="/api"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""Формат входящей и изходящей информации об опросах смотреть в schemas.py"""

@app.post('/register')
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароли не совпадают"
        )
    
    existing_user = db.query(User).filter(User.username == user_data.username).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Пользователь с таким именем уже существует'
        )

    hashed_pwd = auth.get_password_hash(user_data.password)

    new_user = User(
        username=user_data.username,
        hashed_password=hashed_pwd
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {'message': 'Регистрация успешна'}


@app.post('/login')
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()

    if not existing_user or not auth.verify_password(user_data.password, existing_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Неверный логин или пароль'
        )
    
    
    token_data = {"sub": user_data.username}
    jwt_token = auth.create_access_token(token_data)

    response.set_cookie(
        key="access_token", 
        value=f"Bearer {jwt_token}",
        httponly=True,
        max_age=3600,
        samesite="lax",
        secure=False
    )

    return {"message": "Успешный вход"}


@app.get("/survey", response_model=SurveyList)
def get_all(db:Session = Depends(get_db)):
    survey_list = db.query(Survey).all()
    survey_count = db.query(Survey).count()
    if not survey_list:
        raise HTTPException(
            detail="Not found any survey",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    return {
        "count":survey_count,
        "survey_list":survey_list
    }

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
def post_survey(data:SurveyCreate, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
def put_survey(id:int, data:SurveyUpdate, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
def delete_survey(id:int, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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


@app.get("/survey/answers/{id}", response_model=AnswerList)
def get_all_answers(id:int, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    answers_list = db.query(Answer).filter(Answer.survey_id == id).all()
    answers_count = db.query(Answer).filter(Answer.survey_id == id).count()

    if not answers_list:
        raise HTTPException(
            detail="Not found any answers to this survey",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    return {
        "count": answers_count,
        "answers_list": answers_list
    }

@app.get("/answers/{id}", response_model=AnswerResponse)
def get_answer(id:int, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    answer = db.query(Answer).filter(Answer.id == id).first()

    if not answer:
        raise HTTPException(
            detail="Not found answer with this ID",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    return answer

@app.post("/answers", response_model=AnswerResponse)
def post_answer(data:AnswerCreate, db:Session = Depends(get_db)):
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
def put_answer(id:int, data:AnswerUpdate, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
def delete_answer(id:int, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
