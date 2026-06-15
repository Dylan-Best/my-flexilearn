from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models_db import Feedback
from pydantic import BaseModel, EmailStr
from typing import Optional
from schemas import FeedbackOut,FeedbackResponse,FeedbackSubmit
from datetime import datetime

router = APIRouter(
    prefix="/feedback",
    tags=["feedback"]
)


@router.post("/submit", response_model=dict)
def submit_feedback(feedback: FeedbackSubmit, db: Session = Depends(get_db)):
    """
    Enregistrer un nouveau feedback utilisateur
    """
    try:
        # Validation du rating
        if feedback.rating < 1 or feedback.rating > 5:
            raise HTTPException(
                status_code=400, 
                detail="La note doit être entre 1 et 5"
            )
        
        # Validation de la catégorie
        valid_categories = ["ui", "accuracy", "performance", "features", "bug", "other"]
        if feedback.category not in valid_categories:
            raise HTTPException(
                status_code=400, 
                detail="Catégorie invalide"
            )
        
        # Validation du texte
        if not feedback.feedback_text or len(feedback.feedback_text.strip()) < 10:
            raise HTTPException(
                status_code=400, 
                detail="Le commentaire doit contenir au moins 10 caractères"
            )
        
        if len(feedback.feedback_text) > 1000:
            raise HTTPException(
                status_code=400, 
                detail="Le commentaire ne peut pas dépasser 1000 caractères"
            )
        
        # Créer le feedback
        new_feedback = Feedback(
            user_id=feedback.user_id,
            rating=feedback.rating,
            category=feedback.category,
            feedback_text=feedback.feedback_text.strip(),
            email=feedback.email.strip() if feedback.email else None
        )
        
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)
        
        return {
            "success": True,
            "message": "Feedback enregistré avec succès",
            "feedback_id": new_feedback.id_feedback
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement du feedback: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=list[FeedbackResponse])
def get_user_feedbacks(user_id: int, db: Session = Depends(get_db)):
    """
    Récupérer tous les feedbacks d'un utilisateur
    """
    feedbacks = db.query(Feedback).filter(Feedback.user_id == user_id).all()
    return feedbacks


@router.get("/all", response_model=list[FeedbackResponse])
def get_all_feedbacks(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Récupérer tous les feedbacks (pour admin)
    """
    feedbacks = db.query(Feedback).offset(skip).limit(limit).all()
    return feedbacks


@router.get("/stats", response_model=dict)
def get_feedback_stats(db: Session = Depends(get_db)):
    """
    Obtenir des statistiques sur les feedbacks
    """
    from sqlalchemy import func
    
    total_feedbacks = db.query(Feedback).count()
    
    # Moyenne des notes
    avg_rating = db.query(func.avg(Feedback.rating)).scalar() or 0
    
    # Répartition par catégorie
    category_counts = db.query(
        Feedback.category,
        func.count(Feedback.id_feedback) 
    ).group_by(Feedback.category).all()
    
    # Répartition par note
    rating_counts = db.query(
        Feedback.rating,
        func.count(Feedback.id_feedback)
    ).group_by(Feedback.rating).all()
    
    return {
        "total_feedbacks": total_feedbacks,
        "average_rating": round(float(avg_rating), 2),
        "by_category": {cat: count for cat, count in category_counts},
        "by_rating": {rating: count for rating, count in rating_counts}
    }


@router.delete("/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    """
    Supprimer un feedback
    """
    feedback = db.query(Feedback).filter(Feedback.id_feedback == feedback_id).first() 
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback non trouvé")
    
    db.delete(feedback)
    db.commit()
    
    return {"success": True, "message": "Feedback supprimé"}