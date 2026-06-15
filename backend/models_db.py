from sqlalchemy import Integer, Column, Boolean, String, DateTime, JSON, ForeignKey, Text
from datetime import datetime
from sqlalchemy.sql import func
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    create_at = Column(DateTime(timezone=True), server_default=func.now())
    profile = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    feedbacks = relationship("Feedback", back_populates="user")
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String, nullable=True)
    role = Column(String, default="user", nullable=False)


class Profile(Base):
    __tablename__ = "profiles"
    id_profile = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answers = Column(JSON)
    profile_code = Column(String)
    profil_dominant = Column(String)
    profil_secondaire = Column(String)
    profil_tertiaire = Column(String)
    statistiques = Column(JSON)
    chat_answers = Column(JSON, nullable=True)
    recommendation = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user = relationship("User", back_populates="profile")


class Feedback(Base):
    __tablename__ = "feedbacks"
    id_feedback = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rating = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    feedback_text = Column(Text, nullable=False)
    email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="feedbacks")


class Subject(Base):
    __tablename__ = "subjects"
    id_subject = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    status = Column(String, default="ajoute")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    guides = relationship("Guide", back_populates="subject")


class Guide(Base):
    __tablename__ = "guides"
    id_guide = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id_subject"), nullable=False)
    profil_dominant = Column(String, nullable=False)
    profil_secondaire = Column(String, nullable=False)
    contenu = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="guides")
    


    