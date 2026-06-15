from pydantic import BaseModel 
from typing import Dict, List, Optional
from datetime import datetime
class QuizInput(BaseModel):
    responses: List[str] 
    
class UserSchema(BaseModel):
    username : str 
    email : str 
    password : str
    
class UserLoginSchema(BaseModel):
    email : str
    password : str

class UserUpdate(BaseModel):
    id: int
    answers: Dict
    profile_code: str
    profil_dominant: str
    profil_secondaire: str
    profil_tertiaire: str
    statistiques: Dict
    recommendation: Optional[str] 

class VerifyCodeSchema(BaseModel):
    email: str
    code: str

class RecommendationRequest(BaseModel):
    profile: str
    answers: List[str]

class RecommendationResponse(BaseModel):
    recommendations: List[str]


class FeedbackOut(BaseModel):
    id_feedback: int
    rating: int
    category: str
    feedback_text: str
    created_at: datetime

    class Config:
        from_attributes = True
        
class FeedbackSubmit(BaseModel):
    user_id: Optional[int] = None
    rating: int
    category: str
    feedback_text: str
    email: Optional[str] = None
    method_helpfulness: Optional[str] = None
    created_at: Optional[str] = None

class FeedbackResponse(BaseModel):
    id_feedback: int  # ✅ Changé de 'id' à 'id_feedback'
    user_id: Optional[int]
    rating: int
    category: str
    feedback_text: str
    email: Optional[str]
    method_helpfulness: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
        
class SubjectCreate(BaseModel):
    user_id: int
    title: str
    status: Optional[str] = "ajoute"


class SubjectUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None


class SubjectResponse(BaseModel):
    id_subject: int
    user_id: int
    title: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class GuideResponse(BaseModel):
    id_guide: int
    subject_id: int
    profil_dominant: str
    profil_secondaire: str
    contenu: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True

        
class ResetPasswordSchema(BaseModel):
    email: str
    code: str
    new_password: str
    
