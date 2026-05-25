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
    google_sheets_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

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
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    role: Mapped[UserRole] =  mapped_column(SQLAlchemyEnum(UserRole), default=UserRole.USER)

    password_credentials: Mapped[List["UserPasswordCredential"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    ldap_identity: Mapped[Optional["UserLdapIdentity"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )

    @property
    def auth_services(self) -> Dict[str, Any]:
        services: Dict[str, Any] = {
            "password": {
                credential.algorithm: credential.password_hash
                for credential in self.password_credentials
            }
        }

        if self.ldap_identity:
            services["ldap"] = {
                "id": self.ldap_identity.external_id,
                "idAttribute": self.ldap_identity.id_attribute,
            }

        return services


class UserPasswordCredential(Base):
    __tablename__ = "user_password_credentials"
    __table_args__ = (
        UniqueConstraint("user_id", "algorithm", name="uq_user_password_algorithm"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user: Mapped["User"] = relationship(back_populates="password_credentials")


class UserLdapIdentity(Base):
    __tablename__ = "user_ldap_identities"
    __table_args__ = (
        UniqueConstraint("external_id", "id_attribute", name="uq_ldap_external_identity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    id_attribute: Mapped[str] = mapped_column(String(100), nullable=False, default="uid")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user: Mapped["User"] = relationship(back_populates="ldap_identity")


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
            "survey_id", "group_id", "teacher_id", "discipline_id",
            name="uq_survey_group_teacher_discipline",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), nullable=True
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False
    )
    discipline_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("disciplines.id", ondelete="CASCADE"), nullable=False
    )

    survey: Mapped["Survey"] = relationship()
    group: Mapped["Group"] = relationship(back_populates="assignments")
    teacher: Mapped["Teacher"] = relationship(back_populates="assignments")
    discipline: Mapped["Discipline"] = relationship(back_populates="assignments")
