import React, { useState } from "react"; 
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/quiz-result.css";
import CustomAlert from "../components/CustomAlert";
import ConfirmModal from "../components/ConfirmModal";

export default function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, recommendations } = location.state || {};
  const [activeStep, setActiveStep] = useState(0);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [confirm, setConfirm] = useState({ show: false, message: "", action: null, data: null });

  // Fermer l'alerte
  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  // Fermer la confirmation
  const closeConfirm = () => {
    setConfirm({ show: false, message: "", action: null, data: null });
  };

  // Fermeture automatique pour les messages de succès après 3 secondes
  React.useEffect(() => {
    if (alert.show && alert.type === "success") {
      const timer = setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show, alert.type]);

  if (!profile || !recommendations) {
    return (
      <div className="result-container">
        <div className="result-card">
          <h2>⚠️ Aucune donnée disponible</h2>
          <p>Veuillez d'abord compléter le quiz.</p>
          <button className="btn-primary" onClick={() => navigate("/quiz")}>
            Retour au quiz
          </button>
        </div>
      </div>
    );
  }

  const profileNames = {
    "VA": "Visuel-Auditif",
    "VK": "Visuel-Kinesthésique",
    "AV": "Auditif-Visuel",
    "AK": "Auditif-Kinesthésique",
    "KV": "Kinesthésique-Visuel",
    "KA": "Kinesthésique-Auditif"
  };
  const profileName = profileNames[profile] || profile;

  const handleRestart = () => {
    setConfirm({
      show: true,
      message: "Êtes-vous sûr de vouloir refaire le test ? Vos résultats actuels seront remplacés.",
      action: "restart",
      data: null
    });
  };

  const confirmRestart = () => {
    localStorage.removeItem("recommendations");
    navigate("/quiz");
  };

  const handleLogout = () => {
    setConfirm({
      show: true,
      message: "Êtes-vous sûr de vouloir vous déconnecter ?",
      action: "logout",
      data: null
    });
  };

  const confirmLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/signin");
  };

  const saveProfile = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const response = await fetch("http://localhost:8000/user/save-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parseInt(userId),
          answers: {},
          profile_code: profile,
          profil_dominant: profile[0] || "",
          profil_secondaire: profile[1] || "",
          profil_tertiaire: "",
          statistiques: {},
          recommendation: JSON.stringify(recommendations)
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAlert({
          show: true,
          message: "Profil et recommandations sauvegardés avec succès !",
          type: "success",
        });
      } else {
        setAlert({
          show: true,
          message: data.message || "Erreur lors de la sauvegarde du profil.",
          type: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({
        show: true,
        message: "Erreur de connexion lors de la sauvegarde du profil.",
        type: "error",
      });
    }
  };

  // Gestionnaire des confirmations
  const handleConfirm = () => {
    switch (confirm.action) {
      case "logout":
        confirmLogout();
        break;
      case "restart":
        confirmRestart();
        break;
      default:
        break;
    }
    closeConfirm();
  };

  // Utiliser directement les sections des recommandations
  const learningSteps = recommendations.sections?.map((section, index) => {
    const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];
    const icons = ["analytics", "workspace_premium", "warning", "home", "school", "tips_and_updates"];
    
    return {
      id: index + 1,
      title: section.title,
      icon: icons[index] || "article",
      description: `Section ${index + 1}`,
      color: colors[index] || "#64748b"
    };
  }) || [];

  return (
    <div className="result-container">
      {/* Header */}
      <header className="result-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-icon material-symbols-outlined">school</span>
            <span className="brand-text">FlexiLearn</span>
          </div>
          <h1 className="header-title">Vos Recommandations Personnalisées</h1>
          <div className="header-actions">
            <button className="header-btn" onClick={() => navigate("/userspace")} title="Mon Espace">
              <span className="material-symbols-outlined">dashboard</span>
            </button>
            <button className="header-btn" onClick={saveProfile} title="Sauvegarder">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
            <button className="header-btn" onClick={handleLogout} title="Déconnexion">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Carte du profil - Hero Section */}
      <div className="hero-section">
        <div className="profile-hero-card">
          <div className="profile-badge-wrapper">
            <div className="profile-icon-large">
              {profile === "VA" || profile === "VK" ? "👁️" : 
               profile === "AV" || profile === "AK" ? "👂" : "✋"}
            </div>
            <div className="profile-details">
              <h2 className="profile-name">{profileName}</h2>
              <p className="profile-subtitle">Profil d'apprentissage identifié</p>
              <div className="profile-tags">
                {/* Ordre correct: le profil dominant en premier */}
                {profile[0] === "A" && <span className="tag tag-auditory">Auditif</span>}
                {profile[0] === "V" && <span className="tag tag-visual">Visuel</span>}
                {profile[0] === "K" && <span className="tag tag-kinesthetic">Kinesthésique</span>}
                
                {profile[1] === "A" && <span className="tag tag-auditory">Auditif</span>}
                {profile[1] === "V" && <span className="tag tag-visual">Visuel</span>}
                {profile[1] === "K" && <span className="tag tag-kinesthetic">Kinesthésique</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper de progression */}
      <div className="stepper-container">
        <div className="stepper">
          {learningSteps.map((step, index) => (
            <div 
              key={step.id}
              className={`step-item ${activeStep === index ? 'active' : ''} ${activeStep > index ? 'completed' : ''}`}
              onClick={() => setActiveStep(index)}
            >
              <div className="step-indicator" style={{ borderColor: step.color }}>
                <span 
                  className="material-symbols-outlined step-icon"
                  style={{ color: activeStep >= index ? step.color : '#94a3b8' }}
                >
                  {activeStep > index ? 'check_circle' : step.icon}
                </span>
              </div>
              <div className="step-content">
                <p className="step-title">{step.title}</p>
                <p className="step-description">{step.description}</p>
              </div>
              {index < learningSteps.length - 1 && (
                <div className={`step-connector ${activeStep > index ? 'completed' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu des étapes */}
      <div className="content-area">
        <div className="content-wrapper">
          {/* Affichage dynamique de toutes les sections */}
          {recommendations.sections && recommendations.sections.map((section, sectionIndex) => (
            activeStep === sectionIndex && (
              <div key={sectionIndex} className="step-content-card animate-in">
                <div className="content-header">
                  <span 
                    className="material-symbols-outlined header-icon" 
                    style={{ color: learningSteps[sectionIndex]?.color || '#64748b' }}
                  >
                    {learningSteps[sectionIndex]?.icon || 'article'}
                  </span>
                  <div>
                    <h2>{section.title}</h2>
                    <p className="content-subtitle">Section {sectionIndex + 1} sur {recommendations.sections.length}</p>
                  </div>
                </div>

                <div className="content-body">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="recommendation-section">
                      {item.subtitle && (
                        <h3 className="section-subtitle">
                          <span className="subtitle-dot" style={{ backgroundColor: learningSteps[sectionIndex]?.color }}></span>
                          {item.subtitle}
                        </h3>
                      )}
                      
                      {item.points && item.points.length > 0 && (
                        <div className="points-container">
                          {item.points.map((point, pointIndex) => {
                            const hasColon = point.includes(" :");
                            const [key, ...rest] = hasColon ? point.split(" :") : ["", point];
                            
                            return (
                              <div key={pointIndex} className="point-card">
                                <div className="point-icon-wrapper">
                                  <span className="material-symbols-outlined point-icon">
                                    {sectionIndex === 0 ? 'analytics' :
                                     sectionIndex === 1 ? 'emoji_objects' :
                                     sectionIndex === 2 ? 'report' :
                                     sectionIndex === 3 ? 'home' :
                                     sectionIndex === 4 ? 'psychology' :
                                     'check_circle'}
                                  </span>
                                </div>
                                <div className="point-content">
                                  {hasColon ? (
                                    <>
                                      <h4 className="point-title">{key.trim()}</h4>
                                      <p className="point-description">{rest.join(" :").trim()}</p>
                                    </>
                                  ) : (
                                    <p className="point-description full-width">{point}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {item.text && (
                        <div className="item-text-block">
                          <p>{item.text}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* CTA pour la dernière section */}
                  {sectionIndex === recommendations.sections.length - 1 && (
                    <div className="final-cta-section">
                      <div className="cta-card">
                        <span className="material-symbols-outlined cta-icon">emoji_events</span>
                        <h3>Félicitations ! Vous avez parcouru toutes vos recommandations</h3>
                        <p>N'oubliez pas de sauvegarder votre profil pour y accéder à tout moment</p>
                        <div className="cta-buttons">
                          <button className="btn-primary-large" onClick={saveProfile}>
                            <span className="material-symbols-outlined">bookmark</span>
                            Sauvegarder mes recommandations
                          </button>
                          <button className="btn-secondary-large" onClick={handleRestart}>
                            <span className="material-symbols-outlined">refresh</span>
                            Refaire le test
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Navigation */}
        <div className="navigation-controls">
          <button 
            className="nav-btn nav-prev"
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Précédent
          </button>
          
          <div className="step-indicator-dots">
            {learningSteps.map((step, index) => (
              <button
                key={step.id}
                className={`dot ${activeStep === index ? 'active' : ''}`}
                onClick={() => setActiveStep(index)}
                style={{ backgroundColor: activeStep === index ? step.color : '#cbd5e1' }}
              />
            ))}
          </div>

          <button 
            className="nav-btn nav-next"
            onClick={() => setActiveStep(Math.min(learningSteps.length - 1, activeStep + 1))}
            disabled={activeStep === learningSteps.length - 1}
          >
            Suivant
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Intégration du CustomAlert */}
      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={closeAlert}
        />
      )}

      {/* Intégration du ConfirmModal */}
      {confirm.show && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}