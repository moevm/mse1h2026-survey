from fastapi import FastAPI, status, Body, Depends, HTTPException, Response
import json
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, delete
from database import engine, get_db, Base
from models import *
from schemas import *
from utils import auth
from collections import defaultdict
from utils.permissions import RoleChecker
from fastapi.middleware.cors import CORSMiddleware
import contextlib
import time
from sqlalchemy.exc import OperationalError
from alembic.config import Config
from alembic import command
from fastapi import File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import os
import shutil
import uuid
from utils.parser import parse_and_populate, detect_columns_from_url

DEFAULT_SCHEDULE_RECORDS = [
    {"teacher": "Иванов Сергей Петрович", "discipline": "Алгоритмы и структуры данных", "groups": ["3341"]},
    {"teacher": "Иванов Сергей Петрович", "discipline": "Основы программирования", "groups": ["3341"]},
    {"teacher": "Смирнова Анна Викторовна", "discipline": "Дискретная математика", "groups": ["3341"]},
    {"teacher": "Кузнецов Дмитрий Олегович", "discipline": "Базы данных", "groups": ["3341"]},
    {"teacher": "Кузнецов Дмитрий Олегович", "discipline": "Проектирование информационных систем", "groups": ["3341"]},
    {"teacher": "Кузнецов Дмитрий Олегович", "discipline": "Веб-разработка", "groups": ["3341"]},
    {"teacher": "Петрова Мария Андреевна", "discipline": "Линейная алгебра", "groups": ["1303"]},
    {"teacher": "Петрова Мария Андреевна", "discipline": "Математический анализ", "groups": ["1303"]},
    {"teacher": "Васильев Алексей Николаевич", "discipline": "Физика", "groups": ["1303"]},
    {"teacher": "Васильев Алексей Николаевич", "discipline": "Теоретическая механика", "groups": ["1303"]},
    {"teacher": "Васильев Алексей Николаевич", "discipline": "Компьютерное моделирование", "groups": ["1303"]},
    {"teacher": "Соколова Елена Игоревна", "discipline": "Иностранный язык", "groups": ["1303"]},
]

def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

def init_db():
    retries = 5
    delay = 3

    while retries > 0:
        try:
            with engine.begin() as conn:
                pass
            
            run_migrations()
            
            return
            
        except OperationalError as e:
            retries -= 1
            if retries == 0:
                raise
            time.sleep(delay)


def seed_default_schedule(db: Session):
    seed_groups = {group for record in DEFAULT_SCHEDULE_RECORDS for group in record["groups"]}

    group_ids = [
        group_id for (group_id,) in db.query(Group.id).filter(Group.name.in_(seed_groups)).all()
    ]

    if group_ids:
        db.query(GroupTeacherDiscipline).filter(
            GroupTeacherDiscipline.group_id.in_(group_ids)
        ).delete(synchronize_session=False)

    for record in DEFAULT_SCHEDULE_RECORDS:
        teacher = db.query(Teacher).filter(Teacher.name == record["teacher"]).first()
        if not teacher:
            teacher = Teacher(name=record["teacher"])
            db.add(teacher)
            db.flush()

        discipline = db.query(Discipline).filter(Discipline.name == record["discipline"]).first()
        if not discipline:
            discipline = Discipline(name=record["discipline"])
            db.add(discipline)
            db.flush()

        for group_name in record["groups"]:
            group = db.query(Group).filter(Group.name == group_name).first()
            if not group:
                group = Group(name=group_name)
                db.add(group)
                db.flush()

            exists = db.query(GroupTeacherDiscipline).filter(
                GroupTeacherDiscipline.group_id == group.id,
                GroupTeacherDiscipline.teacher_id == teacher.id,
                GroupTeacherDiscipline.discipline_id == discipline.id,
            ).first()

            if not exists:
                db.add(GroupTeacherDiscipline(
                    group_id=group.id,
                    teacher_id=teacher.id,
                    discipline_id=discipline.id,
                ))

    db.commit()

    db.query(Teacher).filter(~Teacher.assignments.any(), Teacher.name.like("препод%")).delete(
        synchronize_session=False
    )
    db.query(Discipline).filter(~Discipline.assignments.any(), Discipline.name.like("предмет%")).delete(
        synchronize_session=False
    )
    db.query(Teacher).filter(~Teacher.assignments.any(), Teacher.name.in_([
        "Иванов Сергей Петрович",
        "Смирнова Анна Викторовна",
        "Кузнецов Дмитрий Олегович",
        "Петрова Мария Андреевна",
        "Васильев Алексей Николаевич",
        "Соколова Елена Игоревна",
    ])).delete(synchronize_session=False)
    db.query(Discipline).filter(~Discipline.assignments.any(), Discipline.name.in_([
        "Алгоритмы и структуры данных",
        "Основы программирования",
        "Дискретная математика",
        "Базы данных",
        "Проектирование информационных систем",
        "Веб-разработка",
        "Линейная алгебра",
        "Математический анализ",
        "Физика",
        "Теоретическая механика",
        "Компьютерное моделирование",
        "Иностранный язык",
    ])).delete(synchronize_session=False)
    db.commit()


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
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

        default_survey = db.query(Survey).filter(Survey.title == "Опрос по качеству обучения").first()

        if not default_survey:
            survey = Survey(
                                title="Опрос по качеству обучения",
                description="Пожалуйста, ответьте на все 6 вопросов",
                groups=["3341","3342","3343"],
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
            print("Опрос успешно создан")
        else:
            print("Опрос уже существует")

        seed_default_schedule(db)

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

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db_status = "up"
    db_error = None

    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "down"
        db_error = str(e)

    overall_status = "ok" if db_status == "up" else "degraded"

    return {
        "status": overall_status,
        "services": {
            "backend": {
                "status": "up"
            },
            "database": {
                "status": db_status,
                "error": db_error
            }
        }
    }

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


@app.get("/group_data/{group}")
def get_data_by_group(group: str, db: Session = Depends(get_db)):
    rows = (
        db.query(
            Group.name.label("group"),
            Teacher.name.label("teacher"),
            Discipline.name.label("discipline"),
        )
        .join(GroupTeacherDiscipline, GroupTeacherDiscipline.group_id == Group.id)
        .join(Teacher, Teacher.id == GroupTeacherDiscipline.teacher_id)
        .join(Discipline, Discipline.id == GroupTeacherDiscipline.discipline_id)
        # Добавляем фильтрацию
        .filter(Group.name == group)
        .order_by(Teacher.name, Discipline.name)
        .all()
    )

    if not rows:
        raise HTTPException(
            detail="No data found for this group",
            status_code=404
        )

    teachers_dict = defaultdict(list)
    for r in rows:
        teachers_dict[r.teacher].append(r.discipline)
    
    return {
        "teachers": teachers_dict
    }

    
@app.get("/survey", response_model=SurveyList)
def get_all(size:int = 5, page:int = 1, db:Session = Depends(get_db)):
    survey_list = db.query(Survey).offset((page - 1) * size).limit(size).all()
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

@app.get("/survey/group/{group}", response_model=SurveyList)
def get_survey_by_group(group:str, db:Session= Depends(get_db)):
    surveys= db.query(Survey).filter(Survey.groups.any(group)).all()
    if not surveys:
        raise HTTPException(
            detail="Not found any surveys for this group", 
            status_code=status.HTTP_404_NOT_FOUND
        )
    return {
        "count":len(surveys),
        "survey_list":surveys
    }

@app.get("/survey/{id}", response_model=SurveyResponse)
def get_survey(id:str, db:Session = Depends(get_db)):
    """Находит опрос по ID"""
    survey = db.query(Survey).filter(Survey.id == id).first()
    if not survey:
        raise HTTPException(
            detail="Not found survey with this ID", 
            status_code=status.HTTP_404_NOT_FOUND
        )
    return survey

@app.post("/survey", response_model=SurveyResponse)
def post_survey(
    title: str = Form(...),
    description: str = Form(...),
    lifetime_seconds: Optional[int] = Form(None),
    questions: str = Form(...),
    groups: str = Form("[]"),
    is_active: bool = Form(True),
    photo: Optional[UploadFile] = File(None), 
    db: Session = Depends(get_db),
    current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Создает опрос с опциональной загрузкой фото"""
    
    existing_survey = db.query(Survey).filter(Survey.title == title).first()
    if existing_survey:
        raise HTTPException(
            detail="Already exist survey with this title",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    final_photo_path = None
    if photo:
        file_ext = photo.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        
        final_photo_path = f"/{UPLOAD_DIR}/{file_name}"

    try:
        questions_list = json.loads(questions)
        groups_list = json.loads(groups)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON format for questions")

    new_survey = Survey(
        title=title,
        description=description,
        lifetime_seconds=lifetime_seconds,
        questions=questions_list,
        groups=groups_list,
        is_active=is_active,
        photo_path=final_photo_path
    )
    
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
def put_survey(id:str, data:SurveyUpdate, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    """Обновляет данные опроса"""
    
    exist_survey = db.query(Survey).filter(Survey.id == id).first()
    if not exist_survey:
        raise HTTPException(
            detail="Not found survey with this ID", 
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    update_data = data.model_dump(exclude_unset=True)
    
    if "photo_path" in update_data:
        del update_data["photo_path"]

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
def delete_survey(id:str, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
def get_all_answers(id:str, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
def get_answer(id:str, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
def put_answer(id:str, data:AnswerUpdate, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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
def delete_answer(id:str, db:Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
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


def clear_schedule_tables(db: Session, current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    try:
        stats = {
            "groups_deleted": db.query(Group).count(),
            "teachers_deleted": db.query(Teacher).count(),
            "disciplines_deleted": db.query(Discipline).count(),
            "relations_deleted": db.query(GroupTeacherDiscipline).count()
        }
        
        db.execute(delete(GroupTeacherDiscipline))
        db.execute(delete(Group))
        db.execute(delete(Teacher))
        db.execute(delete(Discipline))
        
        db.commit()

        return stats
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear data: {str(e)}"
        )


@app.post("/set_google_sheets_link")
def set_google_sheets_link(data: SetGoogleSheetsLink, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    os.environ['GOOGLE_SHEETS_LINK'] = str(data.url)

    if data.delete_old_data:
        clear_schedule_tables(db)

    return {
        "url": str(data.url),
        "status": "success"
    }


@app.get("/get_google_sheets_link")
def get_google_sheets_link(current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    google_sheets_link = os.getenv('GOOGLE_SHEETS_LINK', default='')

    return {
        "link": google_sheets_link
    }


@app.post("/import_from_sheets")
def import_from_sheets(db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    google_sheets_link = os.getenv('GOOGLE_SHEETS_LINK', default='')

    if not google_sheets_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Ссылка на гугл таблицы не была установлена'
        )
    
    stats = parse_and_populate(url=os.getenv('GOOGLE_SHEETS_LINK'), session=db)

    return stats


@app.get("/get_schedule_data", response_model=list[ParsedDataRecord])
def get_schedule_data(db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    rows = (
        db.query(
            Group.name.label("group"),
            Teacher.name.label("teacher"),
            Discipline.name.label("discipline"),
        )
        .join(GroupTeacherDiscipline, GroupTeacherDiscipline.group_id == Group.id)
        .join(Teacher, Teacher.id == GroupTeacherDiscipline.teacher_id)
        .join(Discipline, Discipline.id == GroupTeacherDiscipline.discipline_id)
        .order_by(Group.name, Teacher.name, Discipline.name)
        .all()
    )

    return [ParsedDataRecord(group=r.group, teacher=r.teacher, discipline=r.discipline) for r in rows]


@app.post("/clear_parsed_data")
def clear_parsed_data(db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    stats = clear_schedule_tables(db)

    return stats


@app.post("/create_group", response_model=GroupResponse)
def create_group(group: GroupCreate, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    db_group = Group(name=group.name)
    db.add(db_group)
    try:
        db.commit()
        db.refresh(db_group)
        return db_group
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Group with this name already exists")


@app.get("/get_groups", response_model=List[GroupResponse])
def get_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    groups = db.query(Group).offset(skip).limit(limit).all()
    return groups


@app.get("/get_group/{group_id}", response_model=GroupResponse)
def get_group(group_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    group = db.query(Group).filter(Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@app.put("/update_group/{group_id}", response_model=GroupResponse)
def update_group(group_id: str, group: GroupCreate, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db_group.name = group.name
    try:
        db.commit()
        db.refresh(db_group)
        return db_group
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Group with this name already exists")


@app.delete("/delete_group/{group_id}")
def delete_group(group_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    group = db.query(Group).filter(Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db.delete(group)
    db.commit()
    return {"message": "Group deleted successfully"}



@app.post("/create_teacher/", response_model=TeacherResponse)
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    db_teacher = Teacher(name=teacher.name)
    db.add(db_teacher)
    try:
        db.commit()
        db.refresh(db_teacher)
        return db_teacher
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Teacher with this name already exists")


@app.get("/get_teachers/", response_model=List[TeacherResponse])
def get_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    teachers = db.query(Teacher).offset(skip).limit(limit).all()
    return teachers


@app.get("/get_teacher/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@app.put("/update_teacher/{teacher_id}", response_model=TeacherResponse)
def update_teacher(teacher_id: str, teacher: TeacherCreate, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    db_teacher.name = teacher.name
    try:
        db.commit()
        db.refresh(db_teacher)
        return db_teacher
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Teacher with this name already exists")


@app.delete("/delete_teacher/{teacher_id}")
def delete_teacher(teacher_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    db.delete(teacher)
    db.commit()
    return {"message": "Teacher deleted successfully"}


@app.post("/create_discipline/", response_model=DisciplineResponse)
def create_discipline(discipline: DisciplineCreate, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    db_discipline = Discipline(name=discipline.name)
    db.add(db_discipline)
    try:
        db.commit()
        db.refresh(db_discipline)
        return db_discipline
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Discipline with this name already exists")


@app.get("/get_disciplines/", response_model=List[DisciplineResponse])
def get_disciplines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    disciplines = db.query(Discipline).offset(skip).limit(limit).all()
    return disciplines


@app.get("/get_discipline/{discipline_id}", response_model=DisciplineResponse)
def get_discipline(discipline_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    discipline = db.query(Discipline).filter(Discipline.id == discipline_id).first()
    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found")
    return discipline


@app.put("/update_discipline/{discipline_id}", response_model=DisciplineResponse)
def update_discipline(discipline_id: str, discipline: DisciplineCreate, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    db_discipline = db.query(Discipline).filter(Discipline.id == discipline_id).first()
    if db_discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found")
    
    db_discipline.name = discipline.name
    try:
        db.commit()
        db.refresh(db_discipline)
        return db_discipline
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Discipline with this name already exists")


@app.delete("/delete_discipline/{discipline_id}")
def delete_discipline(discipline_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    discipline = db.query(Discipline).filter(Discipline.id == discipline_id).first()
    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found")
    
    db.delete(discipline)
    db.commit()
    return {"message": "Discipline deleted successfully"}


@app.post("/create_assignment/", response_model=GroupTeacherDisciplineResponse)
def create_assignment(assignment: GroupTeacherDisciplineCreate, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    group = db.query(Group).filter(Group.id == assignment.group_id).first()
    teacher = db.query(Teacher).filter(Teacher.id == assignment.teacher_id).first()
    discipline = db.query(Discipline).filter(Discipline.id == assignment.discipline_id).first()
    
    if not group or not teacher or not discipline:
        raise HTTPException(status_code=404, detail="Group, teacher, or discipline not found")
    
    db_assignment = GroupTeacherDiscipline(
        group_id=assignment.group_id,
        teacher_id=assignment.teacher_id,
        discipline_id=assignment.discipline_id
    )
    db.add(db_assignment)
    try:
        db.commit()
        db.refresh(db_assignment)
        return db_assignment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Assignment already exists")


@app.get("/get_assignments/", response_model=List[AssignmentWithDetails])
def get_assignments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    assignments = db.query(GroupTeacherDiscipline).offset(skip).limit(limit).all()
    return assignments


@app.get("/get_assignment/{assignment_id}", response_model=AssignmentWithDetails)
def get_assignment(assignment_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    assignment = db.query(GroupTeacherDiscipline).filter(GroupTeacherDiscipline.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@app.delete("/delete_assignment/{assignment_id}")
def delete_assignment(assignment_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    assignment = db.query(GroupTeacherDiscipline).filter(GroupTeacherDiscipline.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}


@app.get("/groups/{group_id}/assignments", response_model=List[AssignmentWithDetails])
def get_group_assignments(group_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    assignments = db.query(GroupTeacherDiscipline).filter(GroupTeacherDiscipline.group_id == group_id).all()
    return assignments


@app.get("/teachers/{teacher_id}/assignments", response_model=List[AssignmentWithDetails])
def get_teacher_assignments(teacher_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    assignments = db.query(GroupTeacherDiscipline).filter(GroupTeacherDiscipline.teacher_id == teacher_id).all()
    return assignments


@app.get("/disciplines/{discipline_id}/assignments", response_model=List[AssignmentWithDetails])
def get_discipline_assignments(discipline_id: str, db: Session = Depends(get_db), current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    assignments = db.query(GroupTeacherDiscipline).filter(GroupTeacherDiscipline.discipline_id == discipline_id).all()
    return assignments

@app.get("/sheets/columns")
def get_column_map(current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))):
    google_sheets_link = os.getenv('GOOGLE_SHEETS_LINK', default='')

    if not google_sheets_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Ссылка на гугл таблицы не была установлена'
        )
    return detect_columns_from_url(google_sheets_link)