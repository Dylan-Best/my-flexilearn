from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
from database import get_db
from models_db import User, Profile, Feedback
from utils.roles import verify_admin, verify_superadmin, get_current_user
from pydantic import BaseModel
from fastapi import Depends

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)


# SCHEMAS


class AdminStats(BaseModel):
    total_users: int
    verified_users: int
    unverified_users: int
    total_profiles: int
    total_feedbacks: int
    profiles_by_type: dict
    recent_signups: int
    users_by_role: dict

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_verified: bool
    created_at: datetime
    has_profile: bool
    profile_type: Optional[str] = None

    class Config:
        from_attributes = True

class FeedbackResponse(BaseModel):
    id_feedback: int
    user_id: Optional[int]
    rating: int
    category: str
    feedback_text: str
    email: Optional[str]
    created_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True

class UpdateUserRoleRequest(BaseModel):
    role: str


# ENDPOINTS - STATISTIQUES


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    user_id: int,
    db: Session = Depends(get_db)
):
    """ Récupère les statistiques globales """
    verify_admin(user_id, db)
    
    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()
    unverified_users = total_users - verified_users
    total_profiles = db.query(Profile).count()
    total_feedbacks = db.query(Feedback).count()
    
    # Compter par profil dominant (première lettre du code)
    profiles_by_type = {}
    all_profiles = db.query(Profile).all()
    
    for profile in all_profiles:
        if profile.profile_code and len(profile.profile_code) > 0:
            first_letter = profile.profile_code[0]  # A, V ou K
            profiles_by_type[first_letter] = profiles_by_type.get(first_letter, 0) + 1
    
    users_by_role = {}
    role_counts = db.query(
        User.role,
        func.count(User.id)
    ).group_by(User.role).all()
    
    for role, count in role_counts:
        users_by_role[role] = count
    
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_signups = db.query(User).filter(
        User.create_at >= seven_days_ago
    ).count()
    
    return AdminStats(
        total_users=total_users,
        verified_users=verified_users,
        unverified_users=unverified_users,
        total_profiles=total_profiles,
        total_feedbacks=total_feedbacks,
        profiles_by_type=profiles_by_type,
        recent_signups=recent_signups,
        users_by_role=users_by_role
    )


# ENDPOINTS - GESTION DES UTILISATEURS


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    verified_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """ Récupère la liste de tous les utilisateurs """
    verify_admin(user_id, db)
    
    query = db.query(User).outerjoin(Profile)
    
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.email.ilike(f"%{search}%"))
        )
    
    if verified_only is not None:
        query = query.filter(User.is_verified == verified_only)
    
    query = query.order_by(desc(User.create_at))
    users = query.offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        #  Extraire la première lettre du profile_code OU utiliser profil_dominant
        profile_letter = None
        if user.profile:
            if user.profile.profile_code:
                # Prendre la première lettre du code (ex: "AV" -> "A")
                profile_letter = user.profile.profile_code[0]
            elif user.profile.profil_dominant:
                # Convertir le nom en lettre
                mapping = {"Visuel": "V", "Auditif": "A", "Kinesthésique": "K"}
                profile_letter = mapping.get(user.profile.profil_dominant)
        
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "created_at": user.create_at,
            "has_profile": user.profile is not None,
            "profile_type": profile_letter  # Retourne "V", "A" ou "K"
        }
        result.append(UserResponse(**user_data))
    
    return result
@router.get("/user/{target_user_id}")
def get_user_details(
    target_user_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère les détails complets d'un utilisateur
    """
    verify_admin(user_id, db)
    
    user = db.query(User).filter(User.id == target_user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "created_at": user.create_at
        },
        "profile": {
            "profile_code": user.profile.profile_code,
            "dominant": user.profile.profil_dominant,
            "secondary": user.profile.profil_secondaire,
            "tertiary": user.profile.profil_tertiaire,
            "statistics": user.profile.statistiques,
            "created_at": user.profile.created_at
        } if user.profile else None,
        "feedbacks": [
            {
                "id": fb.id_feedback,
                "rating": fb.rating,
                "category": fb.category,
                "text": fb.feedback_text,
                "created_at": fb.created_at
            } for fb in user.feedbacks
        ]
    }

@router.patch("/user/{target_user_id}/role")
def update_user_role(
    target_user_id: int,
    user_id: int,
    role_data: UpdateUserRoleRequest,
    db: Session = Depends(get_db)
):
    """
    Modifie le rôle d'un utilisateur (superadmin uniquement)
    """
    current_user = verify_superadmin(user_id, db)
    
    valid_roles = ["user", "admin", "superadmin"]
    if role_data.role not in valid_roles:
        raise HTTPException(
            status_code=400, 
            detail=f"Rôle invalide. Rôles autorisés: {', '.join(valid_roles)}"
        )
    
    user = db.query(User).filter(User.id == target_user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Vous ne pouvez pas modifier votre propre rôle"
        )
    
    old_role = user.role
    user.role = role_data.role
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Rôle de {user.username} modifié avec succès",
        "user_id": user.id,
        "old_role": old_role,
        "new_role": user.role
    }

@router.delete("/user/{target_user_id}")
def delete_user(
    target_user_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Supprime un utilisateur
    """
    current_user = verify_admin(user_id, db)
    
    user = db.query(User).filter(User.id == target_user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Vous ne pouvez pas supprimer votre propre compte"
        )
    
    if user.role in ["admin", "superadmin"] and current_user.role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Seul un superadmin peut supprimer un admin ou superadmin"
        )
    
    username = user.username
    db.delete(user)
    db.commit()
    
    return {
        "message": f"Utilisateur {username} supprimé avec succès",
        "deleted_user_id": target_user_id
    }


# ENDPOINTS - GESTION DES FEEDBACKS


@router.get("/feedbacks", response_model=List[FeedbackResponse])
def get_all_feedbacks(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    min_rating: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Récupère tous les feedbacks
    """
    verify_admin(user_id, db)
    
    query = db.query(Feedback).outerjoin(User)
    
    if category:
        query = query.filter(Feedback.category == category)
    
    if min_rating:
        query = query.filter(Feedback.rating >= min_rating)
    
    query = query.order_by(desc(Feedback.created_at))
    feedbacks = query.offset(skip).limit(limit).all()
    
    result = []
    for feedback in feedbacks:
        feedback_data = {
            "id_feedback": feedback.id_feedback,
            "user_id": feedback.user_id,
            "rating": feedback.rating,
            "category": feedback.category,
            "feedback_text": feedback.feedback_text,
            "email": feedback.email,
            "created_at": feedback.created_at,
            "username": feedback.user.username if feedback.user else None
        }
        result.append(FeedbackResponse(**feedback_data))
    
    return result

@router.delete("/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Supprime un feedback
    """
    verify_admin(user_id, db)
    
    feedback = db.query(Feedback).filter(Feedback.id_feedback == feedback_id).first()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback non trouvé")
    
    db.delete(feedback)
    db.commit()
    
    return {
        "message": "Feedback supprimé avec succès",
        "deleted_feedback_id": feedback_id
    }


# ENDPOINTS - ANALYTICS


@router.get("/analytics/profile-distribution")
def get_profile_distribution(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Distribution des profils d'apprentissage
    """
    verify_admin(user_id, db)
    
    total_profiles = db.query(Profile).count()
    
    distribution = db.query(
        Profile.profil_dominant,
        func.count(Profile.id_profile).label('count')
    ).group_by(Profile.profil_dominant).all()
    
    result = {
        "total": total_profiles,
        "distribution": []
    }
    
    for profile_type, count in distribution:
        percentage = (count / total_profiles * 100) if total_profiles > 0 else 0
        result["distribution"].append({
            "type": profile_type,
            "count": count,
            "percentage": round(percentage, 2)
        })
    
    return result

@router.get("/analytics/signups-trend")
def get_signups_trend(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Tendance des inscriptions
    """
    verify_admin(user_id, db)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    signups = db.query(
        func.date(User.create_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.create_at >= start_date
    ).group_by(
        func.date(User.create_at)
    ).order_by('date').all()
    
    return {
        "period": f"{days} derniers jours",
        "data": [
            {
                "date": str(date),
                "signups": count
            } for date, count in signups
        ]
    }