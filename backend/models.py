from sqlalchemy.orm import Mapped, mapped_column, validates, relationship
from sqlalchemy import JSON, Integer, String, DateTime, Boolean, ForeignKey, Enum as SQLAlchemyEnum
from datetime import datetime
from typing import List, Optional, Dict, Any
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    

class Survey(Base):
    __tablename__ = "surveys"
 
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    title: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255))
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    survey_id: Mapped[int] = mapped_column(ForeignKey("surveys.id", ondelete="CASCADE"))
    survey: Mapped["Survey"] = relationship(back_populates="answers")

    group: Mapped[str] = mapped_column(String(6))

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

    answers: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
 

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    username: Mapped[str] = mapped_column(
        String(255), 
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String)
    
    role: Mapped[UserRole] =  mapped_column(SQLAlchemyEnum(UserRole), default=UserRole.USER)
