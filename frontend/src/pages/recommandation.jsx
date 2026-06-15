import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/recommandation.css";

const LearningRecommandations = () => {
  const location = useLocation();
  const data = location.state?.recommendationsData;

  // Sécurité si accès direct à la page
  if (!data) {
    return <p style={{ textAlign: "center" }}>Aucune recommandation disponible.</p>;
  }

  const { dominant_style, methods } = data;

  const icons = {
    brain: "https://cdn-icons-png.flaticon.com/512/2784/2784461.png",
    eye: "https://cdn-icons-png.flaticon.com/512/159/159604.png",
    ear: "https://cdn-icons-png.flaticon.com/512/3094/3094642.png",
    hand: "https://cdn-icons-png.flaticon.com/512/1165/1165674.png",
    lightbulb: "https://cdn-icons-png.flaticon.com/512/3176/3176369.png"
  };

  const styleConfig = {
    visuel: {
      icon: icons.eye,
      color: "#5f9cff",
      gradient: "linear-gradient(135deg, #5f9cff 0%, #7f7ab1 50%)"
    },
    auditif: {
      icon: icons.ear,
      color: "#7f7ab1",
      gradient: "linear-gradient(135deg, #7f7ab1 0%, #5f9cff 50%)"
    },
    kinesthesique: {
      icon: icons.hand,
      color: "#4caf50",
      gradient: "linear-gradient(135deg, #4caf50 0%, #5f9cff 50%)"
    }
  };

  const currentStyle = styleConfig[dominant_style];

  return (
    <div className="learning-container">
      <div className="learning-content">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <img src={icons.brain} alt="Brain" className="brain-icon" />
          </div>
          <h1 className="header-title">Vos Recommandations Personnalisées</h1>
          <p className="header-subtitle">
            Votre profil d'apprentissage dominant a été identifié
          </p>
        </div>

        {/* Profil dominant */}
        <div className="recommendations">
          <div className="style-header">
            <div
              className="style-icon"
              style={{ background: currentStyle.gradient }}
            >
              <img
                src={currentStyle.icon}
                alt={dominant_style}
                className="icon-white"
              />
            </div>
            <h2
              className="style-title"
              style={{ color: currentStyle.color }}
            >
              Apprenant {dominant_style.toUpperCase()}
            </h2>
            <p className="style-description">
              Vous apprenez principalement avec un style {dominant_style}.
              Voici des méthodes adaptées à votre profil :
            </p>
          </div>

          {/* Méthodes */}
          <div
            className="strategy-card"
            style={{ borderLeftColor: currentStyle.color }}
          >
            <div className="strategy-header">
              <div
                className="category-icon"
                style={{ background: `${currentStyle.color}20` }}
              >
                <img
                  src={icons.brain}
                  alt="Méthodes"
                  className="category-icon-svg"
                />
              </div>
              <h3
                className="strategy-title"
                style={{ color: currentStyle.color }}
              >
                Méthodes recommandées
              </h3>
            </div>

            <div className="tips-grid">
              {methods.map((method, index) => (
                <div key={index} className="tip-item">
                  <div
                    className="tip-number"
                    style={{ background: currentStyle.gradient }}
                  >
                    <span className="tip-number-text">{index + 1}</span>
                  </div>
                  <span className="tip-text">{method}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message final */}
        <div className="final-message">
          <img
            src={icons.lightbulb}
            alt="Lightbulb"
            className="lightbulb-icon"
          />
          <h3 className="final-title">Conseil Final</h3>
          <p className="final-text">
            Testez ces méthodes dans votre quotidien et ajustez-les selon ce
            qui fonctionne le mieux pour vous.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningRecommandations;
