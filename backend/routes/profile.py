from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models_db import User, Profile

router = APIRouter(
    prefix="/get_profile",
    tags=["profile"]
)

# Dictionnaire des descriptions et conseils selon le profil dominant (VAK uniquement)
PROFILE_DATA = {
    "Visuel": {
        "icon": "👁️",
        "title": "Apprenant Visuel",
        "description": "Vous avez une mémoire visuelle. Vous apprenez mieux avec des diagrammes, des couleurs et des cartes mentales.",
        "tips": [
            {"icon": "📊", "text": "Utilisez des schémas"},
            {"icon": "🎨", "text": "Utilisez des surligneurs"},
            {"icon": "📺", "text": "Visualisez des concepts"}
        ]
    },
    "Auditif": {
        "icon": "👂",
        "title": "Apprenant Auditif",
        "description": "Vous apprenez mieux en écoutant. Les discussions et les explications orales vous aident à mémoriser.",
        "tips": [
            {"icon": "🎧", "text": "Écoutez des podcasts"},
            {"icon": "💬", "text": "Discutez avec vos pairs"},
            {"icon": "🗣️", "text": "Lisez à haute voix"}
        ]
    },
    "Kinesthésique": {
        "icon": "✋",
        "title": "Apprenant Kinesthésique",
        "description": "Vous apprenez par la pratique. L'expérimentation et le mouvement facilitent votre apprentissage.",
        "tips": [
            {"icon": "🔧", "text": "Pratiquez avec des exemples"},
            {"icon": "🚶", "text": "Prenez des pauses actives"},
            {"icon": "✍️", "text": "Écrivez à la main"}
        ]
    }
}

# Fonction helper pour extraire l'user_id du token/header
def get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    try:
        # Le frontend envoie "Bearer {user_id}"
        user_id = int(authorization.replace("Bearer ", ""))
        return user_id
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="ID utilisateur invalide")


@router.get("/profile")
def get_user_profile(
    user_id: int,  # ← Paramètre simple
    db: Session = Depends(get_db)
):
    """
    Récupère le profil complet de l'utilisateur avec son type d'apprentissage VAK
    """
    # Récupérer l'utilisateur avec son profil
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Vérifier si l'utilisateur est vérifié
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Compte non vérifié")
    
    # Vérifier si l'utilisateur a un profil d'apprentissage
    if not user.profile:
        raise HTTPException(
            status_code=404, 
            detail="Profil d'apprentissage non trouvé. Veuillez passer le test d'abord."
        )
    
    profile_db = user.profile
    
    # Récupérer le profil dominant
    profil_dominant = profile_db.profil_dominant
    
    # Vérifier que le profil dominant est bien dans VAK
    if profil_dominant not in PROFILE_DATA:
        profil_dominant = "Visuel"
    
    # Récupérer les données du profil
    profile_info = PROFILE_DATA[profil_dominant]
    
    return {
    "user": {
        "id": user.id,
        "name": user.username,
        "email": user.email,
        "role": user.role,
        "avatar": None
    },
        "profile": {
            "profile_code": profile_db.profile_code,
            "dominant": profile_db.profil_dominant,
            "secondary": profile_db.profil_secondaire,
            "tertiary": profile_db.profil_tertiaire,
            "statistics": profile_db.statistiques,
            "icon": profile_info["icon"],
            "title": profile_info["title"],
            "description": profile_info["description"],
            "tips": profile_info["tips"],
            "created_at": profile_db.created_at.isoformat() if profile_db.created_at else None
        }
    }