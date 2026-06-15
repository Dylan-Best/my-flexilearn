from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models_db import Subject, Guide, Profile
from pydantic import BaseModel
from typing import Optional
from schemas import SubjectCreate, SubjectResponse,SubjectUpdate,GuideResponse
from datetime import datetime
import json
import os
from google import genai

router = APIRouter(
    prefix="/cours",
    tags=["cours"]
)


VAK_LABELS = {"V": "Visuel", "A": "Auditif", "K": "Kinesthésique"}

# Mapping
VAK_CODE = {
    "Visuel": "V", "visuel": "V",
    "Auditif": "A", "auditif": "A",
    "Kinesthésique": "K", "kinesthésique": "K", "Kinesthesique": "K",
    "V": "V", "A": "A", "K": "K",
}

def to_vak_code(val: str) -> str:
    """Convertit 'Visuel' → 'V', 'A' → 'A', etc."""
    return VAK_CODE.get(val, val[0].upper() if val else "V")




# Prompt VAK 

def build_guide_prompt(profile, profil_dominant: str, profil_secondaire: str, theme: str) -> str:
    """Construit un prompt enrichi depuis les stats et recommandations réelles du profil."""

    stats = profile.statistiques or {}
    reco  = profile.recommendation or {}

    # Scores VAK
    score_v = stats.get("Visuel") or stats.get("V") or 0
    score_a = stats.get("Auditif") or stats.get("A") or 0
    score_k = stats.get("Kinesthésique") or stats.get("K") or stats.get("kinesthesique") or 0

    # Extraire les points clés des recommandations (sections + points)
    reco_points = []
    if isinstance(reco, dict):
        sections = reco.get("sections", [])
        for section in sections:
            title = section.get("title", "")
            for item in section.get("items", []):
                for point in item.get("points", []):
                    reco_points.append(point)
    elif isinstance(reco, str):
        try:
            reco_parsed = json.loads(reco)
            sections = reco_parsed.get("sections", []) if isinstance(reco_parsed, dict) else []
            for section in sections:
                for item in section.get("items", []):
                    for point in item.get("points", []):
                        reco_points.append(point)
        except Exception:
            reco_points = [reco]

    reco_text = "\n".join(f"- {p}" for p in reco_points[:12]) if reco_points else "Pas de recommandations disponibles."

    profil_ter = profile.profil_tertiaire or ""
    label_ter  = VAK_LABELS.get(to_vak_code(profil_ter), "") if profil_ter else ""

    score_dom = score_k if profil_dominant == "K" else score_v if profil_dominant == "V" else score_a
    score_sec = score_a if profil_secondaire == "A" else score_v if profil_secondaire == "V" else score_k
    score_ter = score_v if profil_ter == "V" else score_a if profil_ter == "A" else score_k

    return f"""Génère un guide d'apprentissage personnel au format JSON strict.

Profil réel de la personne :
- Dominant : {profil_dominant} ({VAK_LABELS[profil_dominant]}) — score {score_dom}%
- Secondaire : {profil_secondaire} ({VAK_LABELS[profil_secondaire]}) — score {score_sec}%
- Tertiaire : {profil_ter} ({label_ter}) — score {score_ter}%
- Ce que les données révèlent sur cette personne :
{reco_text}

Sujet à apprendre : {theme}

Règles absolues — à ne jamais enfreindre :
1. Aucun contenu de cours sur {theme}. Jamais. Pas de définition, pas d'explication du sujet.
2. Tout décrit COMMENT travailler, pas QUOI apprendre.
3. Les titres de modules dans le plan = étapes progressives d'apprentissage (vue d'ensemble → bases → propriétés → pratique guidée → liens entre concepts → autonomie), pas des chapitres du sujet.
4. Chaque conseil doit refléter les vraies données du profil — score {score_dom}% dominant, score {score_sec}% secondaire.
5. Phrases courtes, ton naturel et direct, comme un ami qui connaît bien la personne. Pas de jargon.
6. Les ressources = types de formats adaptés au profil (exercices, podcasts, vidéos courtes), jamais des noms de cours sur {theme}.

Règles selon les scores :
- Score {profil_dominant} ({VAK_LABELS[profil_dominant]}) très élevé ({score_dom}%) : chaque étape du plan doit intégrer un geste physique ou une action concrète liée à ce profil
- Score {profil_secondaire} ({VAK_LABELS[profil_secondaire]}) secondaire ({score_sec}%) : renforcer par ce canal à chaque étape clé
- Score {profil_ter} ({label_ter}) faible ({score_ter}%) : ne pas insister sur ce canal, le mentionner au minimum

Structure du plan obligatoire — 6 modules dans cet ordre exact :
1. "Vue d'ensemble" — comprendre à quoi sert le sujet avant toute définition, via le format dominant
2. "Généralités et définitions" — apprendre les notions de base en les reformulant avec ses propres mots, à la main
3. "Propriétés et règles clés" — identifier ce qui revient souvent, l'appliquer sur des exemples simples
4. "Pratique guidée" — exercices avec corrections immédiates, un à la fois, dans le format dominant
5. "Liens entre les concepts" — relier les notions entre elles en les expliquant à voix haute ou en schéma
6. "Pratique autonome" — exercices sans aide pour tester la vraie maîtrise

Pour chaque module, le champ "comment" indique le format concret adapté au profil (ex: "K — debout sur tableau blanc", "A — lire à voix haute en marchant").

JSON uniquement, sans texte autour, sans markdown :

{{
  "plan": {{
    "description": "1-2 phrases naturelles sur comment aborder {theme} avec ce profil précis",
    "modules": [
      {{
        "titre": "Nom de l'étape (Vue d'ensemble, Généralités, etc.)",
        "tache": "Ce que la personne fait concrètement avec sa ressource",
        "comment": "Format adapté au profil dominant/secondaire (ex: K — debout, stylo en main)",
        "duree": "1-2h"
      }}
    ]
  }},
  "session": {{
    "description": "1-2 phrases sur comment structurer une séance pour ce profil",
    "phases": [
      {{"phase": "Nom court", "duree": "X min", "profil": "V ou A ou K", "action": "Geste précis et concret", "ne_pas": "Ce qui nuit spécifiquement à ce profil"}}
    ]
  }},
  "ressources": {{
    "description": "1 phrase sur quel type de support choisir en priorité",
    "ressources": [
      {{"profil": "V ou A ou K", "type": "Vidéo ou Audio ou Exercices ou Livre", "ressource": "Format adapté", "pourquoi": "Raison courte liée aux données du profil"}}
    ]
  }},
  "techniques": {{
    "description": "1 phrase sur comment organiser le travail au quotidien",
    "techniques": [
      {{"technique": "Nom simple", "action": "Ce que la personne fait", "format": "Comment concrètement"}}
    ]
  }},
  "indicateurs": {{
    "description": "1 phrase sur comment savoir qu'on a vraiment compris",
    "signes": ["Signe naturel 1", "Signe naturel 2", "Signe naturel 3"],
    "mini_tests": ["Test pratique 1", "Test pratique 2", "Test pratique 3"]
  }}
}}"""

# Routes subjects

@router.get("/subjects", response_model=list[SubjectResponse])
def get_subjects(user_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Récupérer tous les sujets d'un utilisateur
    """
    q = db.query(Subject).filter(Subject.user_id == user_id)
    if status:
        q = q.filter(Subject.status == status)
    return q.order_by(Subject.created_at.desc()).all()


@router.get("/subjects/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    """
    Récupérer un sujet par son ID
    """
    subject = db.query(Subject).filter(Subject.id_subject == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Sujet introuvable")
    return subject


@router.post("/subjects", response_model=SubjectResponse, status_code=201)
def create_subject(body: SubjectCreate, db: Session = Depends(get_db)):
    """
    Créer un nouveau sujet.
    profil_dominant et profil_secondaire sont extraits automatiquement
    depuis le profil VAK de l'utilisateur (table profiles).
    """
    if not body.title or not body.title.strip():
        raise HTTPException(status_code=400, detail="Le titre est requis")

    valid_status = ["ajoute", "en-cours", "termine"]
    if body.status not in valid_status:
        raise HTTPException(status_code=400, detail="Statut invalide")

    try:
        subject = Subject(
            user_id=body.user_id,
            title=body.title.strip(),
            status=body.status,
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        return subject

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création : {str(e)}")


@router.patch("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, body: SubjectUpdate, db: Session = Depends(get_db)):
    """
    Mettre à jour le titre ou le statut d'un sujet
    """
    subject = db.query(Subject).filter(Subject.id_subject == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    try:
        if body.title is not None:
            subject.title = body.title.strip()
        if body.status is not None:
            subject.status = body.status

        db.commit()
        db.refresh(subject)
        return subject

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour : {str(e)}")


@router.delete("/subjects/{subject_id}", response_model=dict)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    """
    Supprimer un sujet et son guide associé
    """
    subject = db.query(Subject).filter(Subject.id_subject == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    try:
        # Supprimer le guide d'abord (contrainte NOT NULL sur subject_id)
        guide = db.query(Guide).filter(Guide.subject_id == subject_id).first()
        if guide:
            db.delete(guide)
            db.flush()

        db.delete(subject)
        db.commit()
        return {"success": True, "message": "Sujet supprimé"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression : {str(e)}")


# Routes guides

@router.get("/subjects/{subject_id}/guide", response_model=GuideResponse)
def get_or_generate_guide(subject_id: int, db: Session = Depends(get_db)):
    """
    Retourner le guide existant ou en générer un nouveau via Gemini Flash
    """
    subject = db.query(Subject).filter(Subject.id_subject == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    # Retourner le guide existant
    existing = db.query(Guide).filter(Guide.subject_id == subject_id).first()
    if existing:
        return existing

    # Lire le profil VAK depuis la table profiles
    profile = db.query(Profile).filter(Profile.user_id == subject.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil VAK introuvable pour cet utilisateur")

    profil_dominant   = to_vak_code(profile.profil_dominant)   if profile.profil_dominant   else (profile.profile_code[0].upper() if profile.profile_code else None)
    profil_secondaire = to_vak_code(profile.profil_secondaire) if profile.profil_secondaire else (profile.profile_code[1].upper() if profile.profile_code and len(profile.profile_code) >= 2 else None)

    if not profil_dominant or not profil_secondaire:
        raise HTTPException(status_code=400, detail="Profil VAK incomplet. Complétez d'abord le test VAK.")

    # Générer via l'IA
    try:
        prompt = build_guide_prompt(
            profile=profile,
            profil_dominant=profil_dominant,
            profil_secondaire=profil_secondaire,
            theme=subject.title,
        )
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
        )
        raw = response.text.strip().replace("```json", "").replace("```", "").strip()
        contenu = json.loads(raw)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Réponse IA invalide : {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erreur génération guide : {str(e)}")

    try:
        guide = Guide(
            subject_id=subject_id,
            profil_dominant=profil_dominant,
            profil_secondaire=profil_secondaire,
            contenu=contenu,
        )
        db.add(guide)
        db.commit()
        db.refresh(guide)
        return guide

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur sauvegarde guide : {str(e)}")


@router.delete("/subjects/{subject_id}/guide", response_model=dict)
def delete_guide(subject_id: int, db: Session = Depends(get_db)):
    """
    Supprimer le guide d'un sujet pour forcer la régénération
    """
    guide = db.query(Guide).filter(Guide.subject_id == subject_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide introuvable")

    db.delete(guide)
    db.commit()
    return {"success": True, "message": "Guide supprimé"}