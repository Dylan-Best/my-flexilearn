from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session 
import logging
import random
from database import get_db 
from schemas import UserSchema ,UserLoginSchema,VerifyCodeSchema,ResetPasswordSchema
from models_db import User
import smtplib
from utils.hashing import hash_password,verify_password, check_email_domain,generate_4_digit_code 
from utils.mail import send_verification_email, send_reset_email

router=APIRouter(
    prefix="/user", #toutes les routes commences par /user/
    tags=["users"] #section pour regrouper les routes
)

#si Session dehors ne marche pas?
@router.post("/signup")
def create_user(user : UserSchema, db :Session = Depends(get_db)):
 
    #if not check_email_domain(user.email):
    #    raise HTTPException(status_code=400, detail="Domaine email invalide")
    
    existing_user = db.query(User).filter(User.email == user.email).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    code = generate_4_digit_code()
    hashed_password = hash_password(user.password)
    
    #creer un objet pour l'utilisateur(base pydantic et models)
    db_user = User (
        username = user.username,
        email = user.email,
        password = hashed_password,
        verification_code= code,
        is_verified= False,
        role="user"
    )
    try:
        send_verification_email(user.email, code)
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
        status_code=500,
        detail="Impossible d'envoyer le mail : problème d'authentification SMTP")
    except smtplib.SMTPException:
        raise HTTPException(
        status_code=500,
        detail="Impossible d'envoyer le mail : erreur serveur de messagerie"
    )
    
    except smtplib.SMTPRecipientsRefused:
        raise HTTPException(
            status_code=400,
            detail="Adresse email invalide"
        )
    except Exception as e:
        print("Erreur inconnue:", e)
        raise HTTPException(
            status_code=500,
            detail="Erreur inattendue lors de l'envoi du mail"
        )

    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {
    "id": db_user.id,
    "email": db_user.email,
    "username": db_user.username
}
    

@router.post("/signin")
def login(data : UserLoginSchema, db:Session=Depends(get_db)): #provient de l'url 
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="utilisateur non trouvé")

    # Vérifier mot de passe
    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="mot de passe incorrect") #erreur affiche dans le fichier signin

    return {
        "id" : user.id,
        "username" : user.username,
        "email" : user.email
    } 
    
@router.post("/verify-code")
def verify_code(data: VerifyCodeSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Code invalide")

    user.is_verified = True
    user.verification_code = None
    db.commit()

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username
    }


@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return {"message": "Si cet email existe, un code a été envoyé"}

    code = generate_4_digit_code()

    user.verification_code = code
    db.commit()

    try:
        send_reset_email(user.email, code)
    except Exception as e:
        print("Erreur envoi mail:", e)
        print(f"[FALLBACK] Code pour {user.email}: {code}")

    return {"message": "Code envoyé"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Code invalide")

    # changer mot de passe
    user.password = hash_password(data.new_password)

    # supprimer code
    user.verification_code = None

    db.commit()

    return {"message": "Mot de passe modifié"}