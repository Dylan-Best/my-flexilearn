from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, test_connection
from models_db import Base,User
from schemas import UserSchema
from utils.hashing import hash_password
from routes import users
from routes import predict
from routes import update_users
from routes import recommandations
from routes import chat
from routes import feedback
from routes import profile
from routes import admin
from routes import cours
import logging
from fastapi.responses import JSONResponse
from fastapi.requests import Request


logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(name)s - %(message)s"
)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:80","http://localhost"], #lié back et front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#  Crée les tables au démarrage(create_table_if_not_exist) 
Base.metadata.create_all(bind=engine)

#a chaque fois qu'un truc se passe
@app.on_event("startup")
def startup_event(): 
    test_connection()

@app.get("/")
def root():
    return {"message": "FastAPI tourne bien"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Toujours renvoyer JSON, FastAPI ajoute CORS automatiquement
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

#**********ROUTE USER***************
app.include_router(users.router)
app.include_router(predict.router, prefix="/api")
app.include_router(update_users.router)
app.include_router(chat.router)
app.include_router(recommandations.router)
app.include_router(feedback.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(cours.router)


