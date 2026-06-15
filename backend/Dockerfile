# --- Étape 1 : Build ---
FROM python:3.11-slim as builder

WORKDIR /app

# Variables d'environnement pour le build
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Si tu as besoin de paquets système pour compiler (ex: gcc, git), décommente la ligne suivante :
# RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Génération des wheels
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# --- Étape 2 : Image Finale ---
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Création d'un utilisateur non-privilégié pour la sécurité
RUN useradd --create-home --shell /bin/bash appuser

# Récupération et installation des wheels
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Copie du code source et attribution des droits à l'utilisateur non-root
COPY --chown=appuser:appuser . .

# Passage à l'utilisateur non-privilégié
USER appuser

EXPOSE 8000

# Utilisation de la forme exec [] pour une bonne gestion des signaux (SIGTERM)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]