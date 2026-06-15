from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models_db import User, Profile
from pydantic import BaseModel
from typing import Dict, Optional
from schemas import UserUpdate

router = APIRouter(
    prefix="/user",
    tags=["update_users"]
)

@router.post("/save-results")
def update_user(data: UserUpdate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == data.id).first()
    
    if not profile:
        profile = Profile(
            user_id=data.id,  
            answers=data.answers,
            profile_code=data.profile_code,
            profil_dominant=data.profil_dominant,
            profil_secondaire=data.profil_secondaire,
            profil_tertiaire=data.profil_tertiaire,
            statistiques=data.statistiques,
            recommendation=data.recommendation
        )
        db.add(profile)
    else:
        profile.chat_answers = data.answers
        profile.recommendation = data.recommendation
    
    db.commit()
    db.refresh(profile)
    return {"message": "Données enregistrés avec succès", "data": profile}