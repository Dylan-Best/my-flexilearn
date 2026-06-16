
# ☸️ Configuration & Déploiement Kubernetes (Minikube) — FlexiLearn

Ce guide documente l'architecture, la configuration et le déploiement du projet FlexiLearn dans un cluster Kubernetes local avec **Minikube**.

---

## 🏗️ Architecture du Cluster

L'application est cloisonnée dans le namespace `flexilearn-dev` et se compose de 3 couches :

1. **Frontend (Nginx + SPA)** : Gère l'interface utilisateur. Contient un reverse-proxy Nginx pour rediriger le trafic `/api` et `/user` vers le backend.
2. **Backend (Python / SQLAlchemy)** : API logique de l'application connectée à la base de données.
3. **Database (PostgreSQL)** : Base de données relationnelle persistante.

L'accès à l'application se fait via un **Contrôleur Ingress** faisant office de point d'entrée unique.

---

## ⚙️ Composants de Configuration (ConfigMap & Secrets)

Pour séparer le code de la configuration, nous utilisons deux types de ressources Kubernetes :

### 1. Les Secrets (`Secret`)
Utilisés pour masquer et stocker de manière sécurisée les données sensibles (mots de passe, URLs de connexion).
*   **Nom** : `flexilearn-secrets`
*   **Variables incluses** : `postgres-user`, `postgres-password`, `database-url`.

### 2. Les ConfigMaps (`ConfigMap`)
Utilisés pour injecter des fichiers de configuration non sensibles.
*   **Nom** : `frontend-nginx-config`
*   **Rôle** : Injecte le fichier `nginx.conf` personnalisé à la racine du serveur Nginx dans le conteneur frontend afin de résoudre les DNS internes (ex: `http://backend-service:8000`).

---

## 🚀 Procédure de Déploiement

### Prerequis
*   Minikube installé et démarré (`minikube start`)
*   `kubectl` installé et configuré

### Étape 1 : Activer le contrôleur Ingress
```bash
minikube addons enable ingress

```

### Étape 2 : Créer l'environnement (Namespace, Secret & ConfigMap)

```bash
# 1. Création du Namespace
kubectl create namespace flexilearn-dev

# 2. Application du Secret
kubectl apply -f k8s/postgres-secret.yaml

# 3. Création de la ConfigMap pour le Reverse-Proxy Nginx
kubectl create configmap frontend-nginx-config --from-file=frontend/nginx.conf -n flexilearn-dev

```

### Étape 3 : Déployer les Applications

Applique les fichiers de déploiement dans l'ordre (Base de données ➡️ Backend ➡️ Frontend & Ingress) :

```bash
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/flexilearn-ingress.yaml

```

---

## 🌐 Accès à l'Application via l'Ingress

L'Ingress est configuré pour répondre à l'hôte virtuel `flexilearn.local`. Pour y accéder depuis ton navigateur :

1. Récupère l'adresse IP de ton cluster Minikube :

```bash
   minikube ip

```

2. Ajoute cette IP à ton fichier `/etc/hosts` local :

```bash
   sudo echo "$(minikube ip) flexilearn.local" >> /etc/hosts

```

3. Ouvre ton navigateur et navigue sur : **`http://flexilearn.local`**

---

## 🛠️ Commandes utiles pour le Debug

```bash
# Vérifier l'état de toutes les ressources
kubectl get all -n flexilearn-dev

# Consulter les logs en temps réel (ex: frontend)
kubectl logs deployment/flexilearn-frontend -n flexilearn-dev -f --tail=50

# Redémarrer un composant après une mise à jour de configuration
kubectl rollout restart deployment/flexilearn-frontend -n flexilearn-dev

# Entrer dans le conteneur backend pour lancer des migrations ou tests
kubectl exec -it deployment/flexilearn-backend -n flexilearn-dev -- /bin/bash

```
