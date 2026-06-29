#!/bin/bash
# scripts/deploy.sh
set -e # Arrête le script en cas d'erreur

NAMESPACE="flexilearn-dev"
IMAGE_TAG=${1:-latest}

echo " Démarrage du déploiement FlexiLearn (Tag: $IMAGE_TAG) dans le namespace $NAMESPACE..."

# 1. Vérification / Création du Namespace
kubectl get namespace $NAMESPACE >/dev/null 2>&1 || kubectl create namespace $NAMESPACE

# 2. Injection de la configuration de chiffrement si absente (SecOps)
if ! kubectl get secret postgres-secrets -n $NAMESPACE >/dev/null 2>&1; then
    echo "⚠️ Le Secret 'postgres-secrets' n'existe pas. Assure-toi de l'avoir créé !"
fi

# 3. Application des manifestes Kubernetes
# It works only in pipeline

echo " Application des manifests YAML..."

kubectl apply -f k8s/postgres/postgres-deployment.yaml -n $NAMESPACE # pas besoin d'injecter ici
envsubst < k8s/fastapi/backend-deployment.yaml | kubectl apply -f - -n flexilearn-dev
envsubst < k8s/react/frontend-deployment.yaml | kubectl apply -f - -n flexilearn-dev
kubectl apply -f k8s/ingress.yaml -n $NAMESPACE

# 4. Forcer la mise à jour des Pods avec la nouvelle image buildée
echo " Redémarrage des déploiements pour appliquer les changements..."
kubectl rollout restart deployment/flexilearn-backend -n $NAMESPACE
kubectl rollout restart deployment/flexilearn-frontend -n $NAMESPACE

# 5. Vérification du statut du déploiement
kubectl rollout status deployment/flexilearn-backend -n $NAMESPACE --timeout=60s

echo " Déploiement réussi avec succès !"