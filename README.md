# 🧠 Plateforme d’assistance à l’apprentissage personnalisée

## 📌 Présentation du projet

Ce projet est une **plateforme intelligente d’apprentissage personnalisée** dont l’objectif principal est d’aider les utilisateurs à **mieux apprendre**, en identifiant _comment_ ils apprennent le plus efficacement.

Contrairement aux plateformes classiques qui se concentrent sur le contenu, cette application met l’accent sur **la méthode d’apprentissage**, en s’adaptant au profil cognitif de chaque utilisateur.

---

## 🎯 Problèmes résolus

- Les apprenants ne savent pas quelle méthode d’apprentissage leur convient réellement
- Les plateformes actuelles proposent une approche unique pour tous
- Aucune validation rapide de l’efficacité d’une méthode d’apprentissage

---

## 💡 Solution proposée

La plateforme :

1. Évalue le style d’apprentissage de l’utilisateur (test cognitif)
2. Utilise une IA simple (KNN) pour identifier le profil dominant
3. Propose une méthode d’apprentissage personnalisée
4. Fait tester immédiatement cette méthode via un mini-exercice
5. Récupère un feedback pour améliorer les recommandations

---

## 🧪 MVP (Minimum Viable Product)

Le MVP se concentre sur les fonctionnalités essentielles :

- Inscription / Connexion basique
- Test court de style d’apprentissage
- Prédiction du style via KNN (scikit-learn)
- Recommandation personnalisée
- Mini-exercice (validation immédiate)
- Feedback utilisateur simple

---

## 👥 Cibles principales

- Étudiants (lycée, université)
- Auto-apprenants (langues, programmation, reconversion)
- Formateurs / coachs pédagogiques

---

## 🛠️ Stack technique

### Backend

- **Python**
- **Flask** (API REST)
- **scikit-learn** (KNN)
- **PostgreSQL** (ou SQLite pour le MVP)

### IA

- Algorithme KNN
- Dataset de profils d’apprentissage
- Modèle sauvegardé (.pkl)

### DevOps

- Docker / Docker Compose
- GitHub Actions (CI/CD)
- Variables d’environnement (.env)

---

## 📂 Structure du projet (simplifiée)

```
project-root/
├── app/
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── app.py
├── ml/
│   ├── train.py
│   ├── model.pkl
│   └── dataset.csv
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 🔁 Fonctionnement global

1. L’utilisateur s’inscrit
2. Il passe un test de style d’apprentissage
3. Les réponses sont envoyées à l’API
4. Le modèle KNN prédit le style dominant
5. Une méthode est recommandée
6. Un mini-exercice valide l’efficacité
7. L’utilisateur donne son feedback

---

## 🚀 Objectifs futurs

- Apprentissage continu du modèle IA
- Personnalisation par domaine (langues, code, maths)
- Historique et statistiques avancées
- Dashboard admin
- Gamification de l’apprentissage

---

## 👨‍💻 Contributeurs

Projet développé dans un objectif **pédagogique, technique et évolutif**, orienté **IA, DevOps et apprentissage adaptatif**.

---

## 📜 Licence

Projet open-source (licence à définir).
