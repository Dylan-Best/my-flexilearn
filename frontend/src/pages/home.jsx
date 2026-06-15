import "../styles/home.css";
import { Link } from "react-router-dom";
import hero from "../assets/images/logo.png";

export default function Home() {
  return (
    <div className="landing-container">
      <header className="navbar">
        <div className="logo">
          📘 <span>FlexiLearn</span>
        </div>

        <nav>
          <Link to="/" className="nav-link active">Accueil</Link>
          <Link to="/about" className="nav-link">À propos</Link>
          <Link to="/equipe-page" className="nav-link">Équipe</Link>
        </nav>
          
      </header>

      <main className="hero">
        <div className="hero-left">
          <h1>Platforme d'apprentissage personnalisée</h1>
          <p>Un apprentissage adapté à votre style et à votre rythme</p>
          <Link to="/signup" className="cta-btn">
            Commencer
          </Link>
        </div>

        <div className="hero-right">
          <img className="hero-right"
            src={hero}
            alt="https://storyset.com/images/Online-learning-cuate.svg"
          />
        </div>
      </main>

      <section className="features">
        <div className="feature-card">
          <img src="https://cdn-icons-png.flaticon.com/512/943/943277.png" />
          <h3>Évaluer votre style d'apprentissage</h3>
          <p>
            Déterminez votre meilleure approche d'apprentissage grâce à des tests interactifs
          </p>
        </div>

        <div className="feature-card">
          <img src="https://cdn-icons-png.flaticon.com/512/906/906343.png" />
          <h3>Recommandations personnalisées</h3>
          <p>Recevez des ressources d'apprentissage sur mesure en fonction de votre style</p>
        </div>

        <div className="feature-card">
          <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" />
          <h3>Suivi des progrès</h3>
          <p>Suivez votre progression et ajustez-vous si nécessaire</p>
        </div>
      </section>
    </div>
  );
}
