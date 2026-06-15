import pickle
import os
import json
from pathlib import Path
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, model_validator
from typing import List, Union
from database import get_db
from models_db import Profile

router = APIRouter()

# PATHS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../model_AI/model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "../model_AI/encoders.pkl")
# INPUT MODEL
class QuizInput(BaseModel):
    responses: List[Union[int, str]]  # accepte nombres ou lettres

    @model_validator(mode="before")
    def check_responses_length(cls, values):
        responses = values.get("responses")
        if responses is None or len(responses) != 20:
            raise ValueError("Il doit y avoir exactement 20 réponses.")
        return values

# FEATURES
FEATURE_NAMES = [f"question_{i}" for i in range(1, 21)]

# NORMALISATION
LETTER_TO_INT = {"A": 1, "B": 2, "C": 3}

def normalize(val):
    if isinstance(val, int) and val in [1, 2, 3]:
        return val
    if isinstance(val, str):
        v = val.strip().upper()
        if v in ["1", "2", "3"]:
            return int(v)
        if v in LETTER_TO_INT:
            return LETTER_TO_INT[v]
    raise ValueError("Réponse invalide (1/2/3 ou A/B/C)")

# PREDICTION
class VAKPredictor:
    letters_map = {"Visuel": "V", "Auditif": "A", "Kinesthésique": "K"}

    def __init__(self):
        self.model = None
        self.encoder = None

    def load(self):
        if self.model is None:
            with open(MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)
        if self.encoder is None:
            with open(ENCODER_PATH, "rb") as f:
                self.encoder = pickle.load(f)

    def predict(self, responses: list[int]) -> dict:
        self.load()
        if len(responses) != len(FEATURE_NAMES):
            raise ValueError(f"20 réponses attendues, {len(responses)} fournies")

        X = pd.DataFrame([responses], columns=FEATURE_NAMES)
        probs = self.model.predict_proba(X)[0]
        classes = self.encoder.classes_
        sorted_idx = np.argsort(probs)[::-1]

        profil_dominant = classes[sorted_idx[0]]
        profil_secondaire = classes[sorted_idx[1]]
        profil_tertiaire = classes[sorted_idx[2]]
        profil_code = f"{self.letters_map[profil_dominant]}{self.letters_map[profil_secondaire]}"
        statistiques = {cls: round(probs[i] * 100, 1) for i, cls in enumerate(classes)}
        confiance = round(probs[sorted_idx[0]] * 100, 1)

        return {
            "Profil": profil_code,
            "profil_dominant": profil_dominant,
            "profil_secondaire": profil_secondaire,
            "profil_tertiaire": profil_tertiaire,
            "statistiques": statistiques,
            "confiance": confiance
        }

predictor = VAKPredictor()

@router.post("/predict")
async def predict_endpoint(
    input_data: QuizInput,
    user_id: int,
    db: Session = Depends(get_db)
):
    # Normalisation
    normalized_responses = [normalize(r) for r in input_data.responses]

    # Prédiction ML
    result = predictor.predict(normalized_responses)

    # Vérifier si un profil existe déjà
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if profile is None:
        # création
        profile = Profile(
            user_id=user_id,
            answers=input_data.responses,
            profile_code=result["Profil"],
            profil_dominant=result["profil_dominant"],
            profil_secondaire=result["profil_secondaire"],
            profil_tertiaire=result["profil_tertiaire"],
            statistiques=result["statistiques"]
        )
        db.add(profile)
    else:
        # mise à jour
        profile.answers = input_data.responses
        profile.profile_code = result["Profil"]
        profile.profil_dominant = result["profil_dominant"]
        profile.profil_secondaire = result["profil_secondaire"]
        profile.profil_tertiaire = result["profil_tertiaire"]
        profile.statistiques = result["statistiques"]

    db.commit()
    db.refresh(profile)

    # Retour frontend
    return {
        "message": "Profil prédit et enregistré avec succès",
        "result": result
    }

@router.get("/quiz")
def get_quiz():
    # chemin vers le dossier backend
    base_dir = Path(__file__).resolve().parent.parent

    # chemin vers quiz.json
    quiz_path = base_dir / "quiz.json"

    # lecture du fichier JSON
    with open(quiz_path, "r", encoding="utf-8") as f:
        quiz_data = json.load(f)

    return {
        "questions": quiz_data
    }

