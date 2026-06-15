from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models_db import User

# ============================================
# CONSTANTES pour les rôles
# ============================================
class UserRole:
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

# ============================================
# Fonctions d'authentification simplifiées
# ============================================

def get_current_user(
    user_id: int,
    db: Session = Depends(get_db)
) -> User:
    """
    Récupère l'utilisateur depuis la base de données par son ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return user


def verify_admin(user_id: int, db: Session) -> User:
    """
    Vérifie que l'utilisateur est admin ou superadmin
    """
    user = get_current_user(user_id, db)
    
    if user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Accès refusé. Droits administrateur requis."
        )
    return user


def verify_superadmin(user_id: int, db: Session) -> User:
    """
    Vérifie que l'utilisateur est superadmin
    """
    user = get_current_user(user_id, db)
    
    if user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=403,
            detail="Accès refusé. Droits super-administrateur requis."
        )
    return user