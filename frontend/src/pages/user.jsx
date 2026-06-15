import React, { useState, useEffect } from "react";
import "../styles/user.css";
import avatar_icone from "../assets/icones/avatar.png";
import mascott_image from "../assets/images/mascott.png";
import illustration_image from "../assets/images/illustration.png";
import { useNavigate } from "react-router-dom";

const UserPage = () => {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("user-page-body");
    return () => {
      document.body.classList.remove("user-page-body");
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const userId = localStorage.getItem("user_id");

        if (!userId) {
          alert("Veuillez vous connecter");
          navigate("/signin");
          return;
        }

        const response = await fetch(
          `http://localhost:8000/get_profile/profile?user_id=${userId}`
        );

        if (response.status === 404) {
          // Profil non encore créé → quiz
          navigate("/quiz");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erreur serveur");
        }

        const data = await response.json();
        console.log("Données reçues:", data);
        
        setUserData(data.user);
        setProfile(data.profile);
        setLoading(false);
      } catch (err) {
        console.error("Erreur:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
  if (!loading && userData && !profile) {
    navigate("/quiz");
  }
}, [loading, userData, profile, navigate]);


  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/signin");
  };

  const handleRetakeTest = () => {
    const confirmation = window.confirm(
      "Êtes-vous sûr de vouloir repasser le test ? Votre profil actuel sera supprimé."
    );
    if (confirmation) {
      navigate("/quiz");
    }
  };

  const handleSendFeedback = () => {
    navigate("/feedbackpage");
  };

  const handleDeleteAccount = () => {
    const confirmation = window.confirm(
      "⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible !"
    );
    if (confirmation) {
      localStorage.removeItem("user_id");
      alert("Compte supprimé");
      navigate("/signin");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          fontSize: '1.5rem',
          color: '#6366f1'
        }}>
          <p>Chargement de votre profil... 🧠</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          gap: '1rem'
        }}>
          <p style={{ color: 'red', fontSize: '1.2rem' }}>❌ Erreur: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!userData || !profile) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          gap: '1rem'
        }}>
          <p style={{ fontSize: '1.2rem' }}>Aucun profil trouvé</p>
          <button 
            onClick={() => navigate("/quiz")}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Passer le test
          </button>
        </div>
      </div>
    );
  }

  // Traduction des profils
  const profileTitles = {
    "Visual Learner": "Apprenant Visuel",
    "Auditory Learner": "Apprenant Auditif",
    "Kinesthetic Learner": "Apprenant Kinesthésique"
  };

  const profileDescriptions = {
    "Visual Learner": "Vous avez une mémoire visuelle. Vous apprenez mieux avec des diagrammes, des couleurs et des cartes mentales.",
    "Auditory Learner": "Vous apprenez mieux en écoutant. Les discussions et les explications orales vous aident à mémoriser.",
    "Kinesthetic Learner": "Vous apprenez par la pratique. L'expérimentation et le mouvement facilitent votre apprentissage."
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="main-header">
        <div className="logo-section">
          <div className="logo-icon">🧠</div>
          <span className="welcome-text">Bonjour {userData.name}!</span>
        </div>
        <div className="user-controls">
          <div className="avatar-circle">
            <img src={avatar_icone} alt="avatar" />
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </header>

      {/* SECTION PROFIL ACTUEL */}
      <section className="profile-card">
        <div className="card-content">
          <span className="profile-badge">{profile.icon} Style d'apprentissage</span>
          <h1 className="profile-title">{profileTitles[profile.title] || profile.title}</h1>
          <p className="profile-subtitle">
            Expérience d'apprentissage personnalisée basée sur vos habitudes.
          </p>
          <button className="retake-link" onClick={handleRetakeTest}>
            🔄 Repasser le test
          </button>
        </div>
        <div className="card-illustration">
          <img src={illustration_image} alt="Illustration robot" />
        </div>
      </section>

      {/* SECTION POURQUOI / CONSEILS */}
      <section className="details-card">
        <h3>Pourquoi ça vous correspond</h3>
        <p>{profileDescriptions[profile.title] || profile.description}</p>
        
        <div className="tips-grid">
          {profile.tips && profile.tips.map((tip, index) => {
            // Traduction des conseils
            const tipTranslations = {
              "Use diagrams and mind maps to organize information": "Utilisez des schémas",
              "Color-code your notes and use highlighters": "Utilisez des surligneurs",
              "Watch video tutorials and visual demonstrations": "Visualisez des concepts",
              "Listen to podcasts and audio lectures": "Écoutez des podcasts",
              "Discuss topics with peers and study groups": "Discutez avec vos pairs",
              "Read your notes aloud to reinforce learning": "Lisez à haute voix",
              "Practice with real-world examples and experiments": "Pratiquez avec des exemples",
              "Take breaks to move around while studying": "Prenez des pauses actives",
              "Write notes by hand to reinforce learning": "Écrivez à la main"
            };

            return (
              <div className="tip-item" key={index}>
                <span className="tip-icon">{tip.icon}</span>
                {tipTranslations[tip.text] || tip.text}
              </div>
            );
          })}
        </div>
        
        <div className="robot-floating">
          <img src={mascott_image} alt="Robot mascotte" />
        </div>
      </section>

      {/* FOOTER / FEEDBACK & ACTIONS */}
      <footer className="footer-section">
        <div className="feedback-box">
          <div className="input-group">
            <button className="send-btn" onClick={handleSendFeedback}>
              Envoyer un avis
            </button>
          </div>
          <a href="#about" className="about-link">
            À propos
          </a>
        </div>
        <div className="bottom-row">
          <div className="coming-soon-card">
            <div className="soon-badge">Bientôt disponible</div>
            <p>🎓 Apprendre un sujet spécifique</p>
          </div>
          <button className="delete-btn" onClick={handleDeleteAccount}>
            Supprimer mon compte
          </button>
        </div>
      </footer>
    </div>
  );
};

export default UserPage;