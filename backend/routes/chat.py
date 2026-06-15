from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from google import genai
import os
import json
from fastapi.responses import JSONResponse

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY non défini")

client = genai.Client(api_key=API_KEY)

QUESTIONS_BY_PROFILE = {
    "VA": [
        "Quand tu découvres un nouveau sujet, décris comment tu aimes qu’on te l’explique du début à la fin.",
        "Qu’est-ce qui t’aide le plus à retenir une information après l’avoir apprise ?",
        "Si tu ne comprends pas une notion au premier essai, que fais-tu généralement ?",
        "Décris un souvenir d’apprentissage que tu as trouvé particulièrement efficace. Pourquoi ?",
        "Comment aimes-tu qu’un enseignant ou un formateur t’accompagne pendant un cours ?"
    ],
    "VK": [
        "Explique comment tu préfères apprendre quelque chose de nouveau que tu n’as jamais fait auparavant.",
        "Qu’est-ce qui te donne l’impression d’avoir vraiment compris une notion ?",
        "Raconte une situation où tu as appris en pratiquant. Qu’est-ce qui t’a aidé ?",
        "Quand tu vois un exemple ou une démonstration, que fais-tu ensuite naturellement ?",
        "Comment réagis-tu face à un cours trop théorique ?"
    ],
    "AV": [
        "Quand quelqu’un t’explique une idée complexe, qu’est-ce qui t’aide à la comprendre plus facilement ?",
        "Comment préfères-tu réviser une leçon déjà vue ?",
        "Explique comment tu fais pour mémoriser une information importante.",
        "Dans quel type de situation d’apprentissage te sens-tu le plus à l’aise ?",
        "Que fais-tu quand une explication manque de clarté ?"
    ],
    "AK": [
        "Décris comment tu apprends le mieux lorsque quelqu’un t’explique quelque chose oralement.",
        "Que fais-tu après avoir écouté une explication pour t’assurer que tu as compris ?",
        "Raconte une expérience où tu as appris en faisant.",
        "Comment aimes-tu recevoir des corrections ou des conseils ?",
        "Qu’est-ce qui te motive le plus quand tu apprends ?"
    ],
    "KV": [
        "Explique comment tu préfères commencer l’apprentissage d’un nouveau sujet.",
        "Qu’est-ce qui te permet de progresser rapidement dans un apprentissage ?",
        "Quand tu fais une erreur, comment réagis-tu et que fais-tu ensuite ?",
        "Décris le type d’exercice ou d’activité qui t’aide le plus à apprendre.",
        "Comment sais-tu que tu maîtrises vraiment une compétence ?"
    ],
    "KA": [
        "Décris comment tu apprends le mieux lorsque tu dois acquérir une nouvelle compétence.",
        "Qu’est-ce qui t’aide à rester concentré pendant un apprentissage ?",
        "Raconte une situation où quelqu’un t’a bien accompagné dans ton apprentissage.",
        "Comment préfères-tu qu’on t’explique une erreur ?",
        "Qu’est-ce qui te donne envie de continuer à apprendre ?"
    ]
}



router = APIRouter(prefix="/chat", tags=["Chat"])

sessions: Dict[str, dict] = {}

class StartChatRequest(BaseModel):
    session_id: str
    profile: str

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

class QuestionResponse(BaseModel):
    question: str
    step: int
    total: int

class FinalResponse(BaseModel):
    recommendations: str

def build_analysis_prompt(profile: str, answers: list) -> str:
    formatted_answers = "\n".join([f"- Réponse {i+1}: {a}" for i, a in enumerate(answers)])
    return f"""
Tu es un expert en pédagogie et en styles d’apprentissage VAK (Visuel, Auditif, Kinesthésique).

Profil détecté : {profile}

Réponses de l’apprenant :
{formatted_answers}

Analyse et recommandations demandées :
1. Vérifie la cohérence entre le profil {profile} et les réponses fournies.
2. Identifie les forces d’apprentissage spécifiques à ce profil.
3. Identifie les difficultés potentielles et obstacles à l’apprentissage.
4. Propose une méthode d’apprentissage personnalisée et structurée, incluant :
   - Ambiance idéale (son, rythme, fond sonore, distractions à éviter)
   - Espace physique recommandé (mobilier, isolation, température)
   - Supports principaux (audio, visuel, interactif, papier)
   - Méthode d’apprentissage en étapes claires (encodage, récupération, consolidation)
   - Conseils pratiques pour chaque étape
5. Fournis des recommandations concrètes et applicables, sous forme de liste ou d’étapes.

**IMPORTANT** : Réponds **uniquement en JSON**, avec exactement cette structure :

{{
  "sections": [
    {{
      "title": "Nom de la section",
      "items": [
        {{
          "subtitle": "Sous-titre optionnel",
          "points": ["point1", "point2", "..."]
        }}
      ]
    }}
  ]
}}
Ne réponds jamais en texte brut, ni en Markdown, uniquement en JSON.
"""


@router.post("/start", response_model=QuestionResponse)
def start_chat(req: StartChatRequest):
    profile = req.profile.upper()
    if profile not in QUESTIONS_BY_PROFILE:
        raise HTTPException(status_code=400, detail="Profil inconnu")
    sessions[req.session_id] = {"profile": profile, "current_index": 0, "answers": []}
    return QuestionResponse(
        question=QUESTIONS_BY_PROFILE[profile][0],
        step=1,
        total=len(QUESTIONS_BY_PROFILE[profile])
    )

@router.post("/answer")
def answer_chat(req: AnswerRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session inconnue")

    session["answers"].append(req.answer)
    session["current_index"] += 1

    profile = session["profile"]
    questions = QUESTIONS_BY_PROFILE[profile]

    if session["current_index"] < len(questions):
        return QuestionResponse(
            question=questions[session["current_index"]],
            step=session["current_index"] + 1,
            total=len(questions)
        )

    #Gemini analyse
    prompt = build_analysis_prompt(profile, session["answers"])
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )

        raw_text = response.text.strip()

        # Essayer de parser le JSON renvoyé par Gemini
        try:
            recommendations_json = json.loads(raw_text)
        except json.JSONDecodeError:
            # fallback si l'IA ne renvoie pas un JSON valide
            raise HTTPException(status_code=500, detail=f"IA n'a pas renvoyé un JSON valide : {raw_text}")

        # Retourne directement le JSON au frontend
        # return JSONResponse(content=recommendations_json)
        # Retourne le JSON wrappé dans un objet avec la clé "recommendations"
        return JSONResponse(content={"recommendations": recommendations_json})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Gemini: {str(e)}")

    return FinalResponse(recommendations=recommendations)
