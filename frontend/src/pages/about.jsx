import { Link } from "react-router-dom";
import "../styles/home.css";
import "../styles/about.css"; // on va le créer

export default function About() {
  return (
    <div className="landing-container">
      <header className="navbar">
        <div className="logo">
          📘 <span>FlexiLearn</span>
        </div>
        <nav>
          <Link to="/" className="nav-link">Accueil</Link>
          <Link to="/about" className="nav-link active">À propos</Link>
          <Link to="/equipe-page" className="nav-link">Équipe</Link>
        </nav>
      </header>

      <main>
        {/* Section hero */}
        <section className="about-hero">
          <h1>Apprendre à sa façon</h1>
          <p>
            FlexiLearn est une plateforme d’apprentissage personnalisée qui identifie <strong>comment vous apprenez</strong> pour vous proposer la méthode la plus efficace.
          </p>
        </section>

        {/* Problème */}
        <section className="about-section">
          <div className="about-section-content">
            <h2>Un constat simple</h2>
            <p>
              Chaque personne apprend différemment, mais la plupart des plateformes imposent un modèle unique. Résultat : on perd du temps, on se décourage, et on ne progresse pas vraiment.
            </p>
          </div>
          <div className="about-section-icon">🎯</div>
        </section>

        {/* Solution */}
        <section className="about-section reverse">
          <div className="about-section-content">
            <h2>Notre solution</h2>
            <p>
              FlexiLearn évalue votre style d’apprentissage, vous recommande une méthode sur mesure, et valide immédiatement son efficacité par un mini‑exercice. Finis les parcours standardisés.
            </p>
          </div>
          <div className="about-section-icon">💡</div>
        </section>

        {/* Fonctionnement (étapes) */}
        <section className="about-steps">
          <h2>Comment ça marche ?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Testez votre style</h3>
              <p>Un questionnaire rapide pour comprendre comment vous apprenez le mieux.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Recevez une méthode</h3>
              <p>Notre IA vous propose une approche personnalisée.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Testez et validez</h3>
              <p>Un mini‑exercice concret pour voir la méthode en action.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Affinez en continu</h3>
              <p>Vos retours améliorent les recommandations.</p>
            </div>
          </div>
        </section>

        {/* Public cible */}
        <section className="about-section">
          <div className="about-section-content">
            <h2>Pour qui ?</h2>
            <p>
              Étudiants, auto‑apprenants, formateurs… Toute personne qui souhaite optimiser son temps et apprendre avec une méthode qui lui correspond vraiment.
            </p>
          </div>
          <div className="about-section-icon">👥</div>
        </section>

        {/* Vision future */}
        <section className="about-section reverse">
          <div className="about-section-content">
            <h2>Notre vision</h2>
            <p>
              Créer une plateforme évolutive où chaque utilisateur a un parcours unique, alimenté par l’IA et la pédagogie adaptative. Nous voulons faire de l’apprentissage une expérience fluide et motivante.
            </p>
          </div>
          <div className="about-section-icon">🚀</div>
        </section>

        {/* Appel à l'action */}
        <div className="about-cta">
          <h2>Prêt à découvrir votre style ?</h2>
          <Link to="/signup" className="cta-btn">Commencer l’aventure</Link>
        </div>
      </main>
    </div>
  );
}