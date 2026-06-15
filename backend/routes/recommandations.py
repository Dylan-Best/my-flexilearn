from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from google import genai
import os
from database import get_db
from models_db import Profile
from schemas import RecommendationRequest, RecommendationResponse

# CONFIG GEMINI
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY non défini")

client = genai.Client(api_key=API_KEY)

# ROUTER
router = APIRouter(prefix="/recommendation", tags=["Recommandations"])

# PROMPT DE GENERATION
def build_recommendation_prompt(profile: str, answers: List[str]) -> str:
    formatted_answers = "\n".join([f"- Réponse {i+1}: {a}" for i, a in enumerate(answers)])
    
    return f"""
Tu es un expert en pédagogie et en styles d'apprentissage (VAK).

Profil détecté : {profile}

Réponses de l'apprenant :
{formatted_answers}

Analyse demandée :
1. Vérifie la cohérence entre le profil et les réponses.
2. Identifie les forces d'apprentissage.
3. Identifie les difficultés potentielles.
4. Propose une méthode d'apprentissage personnalisée.
5. Donne 5 recommandations concrètes et applicables.

Réponds sous forme de liste courte, claire et concise.
"""

# ENDPOINT - GÉNÉRER DES RECOMMANDATIONS
@router.post("/", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest):
    """
    Génère des recommandations personnalisées basées sur le profil et les réponses
    """
    try:
        prompt = build_recommendation_prompt(req.profile.upper(), req.answers)
        
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        
        # Transformer la réponse en liste
        raw_text = response.text.strip()
        recommendations = [
            line.strip("- ").strip()
            for line in raw_text.split("\n")
            if line.strip()
        ]
        
        return RecommendationResponse(recommendations=recommendations)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Gemini: {str(e)}")


# ENDPOINT - RÉCUPÉRER LA RECOMMANDATION D'UN UTILISATEUR
@router.get("/user/{user_id}")
def get_user_recommendation(user_id: int, db: Session = Depends(get_db)):
    """
    Récupère la recommandation enregistrée pour un utilisateur spécifique
    """
    # Chercher le profil de l'utilisateur
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profil non trouvé pour cet utilisateur"
        )
    
    # Vérifier si une recommandation existe
    if not profile.recommendation or profile.recommendation == {}:
        raise HTTPException(
            status_code=404,
            detail="Aucune recommandation trouvée pour cet utilisateur"
        )
    
    return {
        "user_id": user_id,
        "profile_code": profile.profile_code,
        "profil_dominant": profile.profil_dominant,
        "recommendation": profile.recommendation,
        "chat_answers": profile.chat_answers,
        "created_at": profile.created_at
    }


# ENDPOINT - RÉCUPÉRER LA RECOMMANDATION PAR ID DE PROFIL
@router.get("/profile/{profile_id}")
def get_profile_recommendation(profile_id: int, db: Session = Depends(get_db)):
    """
    Récupère la recommandation enregistrée pour un profil spécifique
    """
    # Chercher le profil
    profile = db.query(Profile).filter(Profile.id_profile == profile_id).first()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profil non trouvé"
        )
    
    # Vérifier si une recommandation existe
    if not profile.recommendation or profile.recommendation == {}:
        raise HTTPException(
            status_code=404,
            detail="Aucune recommandation trouvée pour ce profil"
        )
    
    return {
        "profile_id": profile_id,
        "user_id": profile.user_id,
        "profile_code": profile.profile_code,
        "profil_dominant": profile.profil_dominant,
        "recommendation": profile.recommendation,
        "chat_answers": profile.chat_answers,
        "created_at": profile.created_at
    }


# ENDPOINT - VÉRIFIER SI UN UTILISATEUR A UNE RECOMMANDATION
@router.get("/check/{user_id}")
def check_user_recommendation(user_id: int, db: Session = Depends(get_db)):
    """
    Vérifie si un utilisateur a déjà une recommandation enregistrée
    """
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    
    if not profile:
        return {
            "user_id": user_id,
            "has_recommendation": False,
            "has_chat_answers": False
        }
    
    has_recommendation = (
        profile.recommendation is not None and 
        profile.recommendation != {} and
        len(profile.recommendation) > 0
    )
    
    has_chat_answers = (
        profile.chat_answers is not None and 
        profile.chat_answers != [] and
        len(profile.chat_answers) > 0
    )
    
    return {
        "user_id": user_id,
        "has_recommendation": has_recommendation,
        "has_chat_answers": has_chat_answers,
        "profile_code": profile.profile_code,
        "profil_dominant": profile.profil_dominant
    }