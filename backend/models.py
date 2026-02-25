from sqlalchemy.orm import Mapped, mapped_column, validates, relationship
from sqlalchemy import JSON, Integer, String, DateTime, Boolean, ForeignKey
from datetime import datetime
from typing import List, Optional, Dict, Any
from .database import Base


class Survey(Base):
    __tablename__ = "surveys"
 
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    title: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255))
    lifetime_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    questions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

    # teacher_id: Mapped[Optional[int]] = mapped_column(
    #     Integer, 
    #     ForeignKey("teachers.id", ondelete="SET NULL"),
    #     nullable=True
    # )
    # teacher: Mapped[Optional["Teacher"]] = relationship(
    #     back_populates="surveys",
    #     foreign_keys=[teacher_id]
    # )

    answers: Mapped[List["Answer"]] = relationship(
        back_populates="survey",
        cascade="all, delete-orphan"
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    survey_id: Mapped[int] = mapped_column(ForeignKey("surveys.id", ondelete="CASCADE"))
    survey: Mapped["Survey"] = relationship(back_populates="answers")

    group: Mapped[str] = mapped_column(String(6))

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

    answers: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)


# class Teacher(Base):
#     __tablename__ = "teachers"

#     id: Mapped[int] = mapped_column(Integer, primary_key=True)

#     full_name: Mapped[str] = mapped_column(
#         String(255),
#         unique=True
#     )
 

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    is_superuser: Mapped[bool] = mapped_column(Boolean, default=True)

    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True,
        index=True,
        nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255))
