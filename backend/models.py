from sqlalchemy.orm import Mapped, mapped_column, validates, relationship
from sqlalchemy import JSON, Integer, String, DateTime, Boolean, ForeignKey, Enum as SQLAlchemyEnum, UniqueConstraint, ARRAY
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import List, Optional, Dict, Any
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    

class Survey(Base):
    __tablename__ = "surveys"
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255))
    groups: Mapped[List[str]] = mapped_column(ARRAY(String(6)))
    lifetime_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    questions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    photo_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

    answers: Mapped[List["Answer"]] = relationship(
        back_populates="survey",
        cascade="all, delete-orphan"
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    survey_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"))
    survey: Mapped["Survey"] = relationship(back_populates="answers")

    group: Mapped[str] = mapped_column(String(6))

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

    answers: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
 

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    username: Mapped[str] = mapped_column(
        String(255), 
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String)
    
    role: Mapped[UserRole] =  mapped_column(SQLAlchemyEnum(UserRole), default=UserRole.USER)


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)

    assignments: Mapped[List["GroupTeacherDiscipline"]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
    )


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    assignments: Mapped[List["GroupTeacherDiscipline"]] = relationship(
        back_populates="teacher",
        cascade="all, delete-orphan",
    )


class Discipline(Base):
    __tablename__ = "disciplines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)

    assignments: Mapped[List["GroupTeacherDiscipline"]] = relationship(
        back_populates="discipline",
        cascade="all, delete-orphan",
    )

class GroupTeacherDiscipline(Base):
    __tablename__ = "group_teacher_disciplines"
    __table_args__ = (
        UniqueConstraint(
            "group_id", "teacher_id", "discipline_id",
            name="uq_group_teacher_discipline",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False
    )
    discipline_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("disciplines.id", ondelete="CASCADE"), nullable=False
    )

    group: Mapped["Group"] = relationship(back_populates="assignments")
    teacher: Mapped["Teacher"] = relationship(back_populates="assignments")
    discipline: Mapped["Discipline"] = relationship(back_populates="assignments")
