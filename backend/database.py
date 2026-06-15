# database.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os 

DATABASE_URL = os.getenv("DATABASE_URL") # dans le fichier .env
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
     
def get_db():
    #injecter la session dans les routes
    db = SessionLocal()
    try:
        yield db 
    finally:
        db.close()
        
def test_connection():
    try:
        with engine.connect() as conn:
            print("=> Connexion PostgreSQL OK ")
    except Exception as e:
        print("Connexion échouée :", e)
