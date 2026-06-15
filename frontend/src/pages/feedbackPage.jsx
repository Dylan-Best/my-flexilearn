import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/feedback.css";
import CustomAlert from "../components/CustomAlert";

export default function FeedbackPage() {
  const navigate = useNavigate();

  const [rating, setRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("ui");
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [includeEmail, setIncludeEmail] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });

  const categories = [
    { id: "ui", label: "Interface utilisateur" },
    { id: "accuracy", label: "Précision des recommandations" },
    { id: "performance", label: "Performance" },
    { id: "features", label: "Fonctionnalités" },
    { id: "bug", label: "Bug / Problème technique" },
    { id: "other", label: "Autre" },
  ];

  // Fermer l'alerte
  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  // Fermeture automatique pour les messages de succès après 3 secondes
  useEffect(() => {
    if (alert.show && alert.type === "success") {
      const timer = setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show, alert.type]);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const validateForm = () => {
    if (rating === 0) {
      setAlert({
        show: true,
        message: "⚠️ Veuillez sélectionner une note.",
        type: "warning",
      });
      return false;
    }
    if (!category) {
      setAlert({
        show: true,
        message: "⚠️ Veuillez choisir une catégorie.",
        type: "warning",
      });
      return false;
    }
    if (!feedback.trim()) {
      setAlert({
        show: true,
        message: "⚠️ Veuillez entrer votre commentaire.",
        type: "warning",
      });
      return false;
    }
    if (feedback.trim().length < 10) {
      setAlert({
        show: true,
        message: "⚠️ Votre commentaire doit contenir au moins 10 caractères.",
        type: "warning",
      });
      return false;
    }
    if (feedback.trim().length > 1000) {
      setAlert({
        show: true,
        message: "⚠️ Votre commentaire ne peut pas dépasser 1000 caractères.",
        type: "warning",
      });
      return false;
    }
    if (includeEmail && !email.trim()) {
      setAlert({
        show: true,
        message: "⚠️ Veuillez entrer votre email ou décocher l'option.",
        type: "warning",
      });
      return false;
    }
    if (includeEmail && !isValidEmail(email)) {
      setAlert({
        show: true,
        message: "⚠️ Veuillez entrer un email valide.",
        type: "warning",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const userId = localStorage.getItem("user_id");
      const feedbackData = {
        user_id: userId ? parseInt(userId) : null,
        rating,
        category,
        feedback_text: feedback.trim(),
        email: includeEmail ? email.trim() : null,
        created_at: new Date().toISOString(),
      };

      const response = await fetch("http://localhost:8000/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors de l'envoi");
      }

      setAlert({
        show: true,
        message: "✅ Merci pour votre feedback ! Redirection en cours...",
        type: "success",
      });
      
      setSubmitted(true);
      setTimeout(() => navigate("/userspace"), 3000);
    } catch (err) {
      console.error("Erreur:", err);
      setAlert({
        show: true,
        message: `❌ ${err.message}`,
        type: "error",
      });
      setLoading(false);
    }
  };

  const getRatingLabel = () => {
    const labels = { 1: "Très mauvais", 2: "Mauvais", 3: "Moyen", 4: "Très bon", 5: "Excellent" };
    return labels[rating] || "";
  };

  if (submitted) {
    return (
      <div className="feedback-page light">
        <div className="success-container">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
          <h1 className="success-title">Merci pour votre feedback !</h1>
          <p className="success-message">
            Votre avis nous aide à améliorer l'expérience pour tous les utilisateurs.
          </p>
          <div className="success-redirect">
            <span className="spinner">⏳</span>
            Redirection en cours...
          </div>
        </div>
        
        {/* CustomAlert intégré aussi en cas de besoin */}
        {alert.show && (
          <CustomAlert
            message={alert.message}
            type={alert.type}
            onClose={closeAlert}
          />
        )}
      </div>
    );
  }

  return (
    <div className="feedback-page light">
      <div className="flex-container">

        {/* LEFT — Visual Panel */}
        <div className="visual-panel">
          <div className="grid-overlay">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="visual-content">
            <div className="icon-box">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h1 className="visual-title">Grandir Ensemble</h1>
            <p className="visual-text">
              Chaque retour que vous partagez nous aide à perfectionner l'écosystème Flexilearn,
              rendant l'éducation plus accessible et efficace pour les apprenants du monde entier.
            </p>
            <div className="image-box">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxwv-cgZVRc-RHc7CwjiV4dJpNA0AigrjHhk2IDdGwg1OBAeTj56r8L89pGByfVgmsnLz6DuwYE7x8ONNe-XkqChWik-aepE4bao8Gxg27BE02Ax52u_Ic5K11FCPS_ja36SV3JhtdB4CjRh1BbZIpmpyZ4ulO8LmhUuwXbu_dn1vzP00T3Zug6QDTyWv6_v88hiR0Eg23tDSLVfHttYAKf9fTl0dM3wEVR8r8q9GP3fpSm0Vs01e--0se-WF0sPdjf6-yqvuFonc"
                alt="Learners collaborating on laptops"
              />
            </div>
          </div>
        </div>

        {/* RIGHT — Form Panel */}
        <div className="form-side">

          {/* Header */}
          <header className="top-header">
            <div className="logo-group">
              <div className="logo-shape">
                <svg className="logo-svg" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="logo-name">Flexilearn</span>
            </div>
            <div className="header-right">
              <button className="icon-button">
                <span className="material-symbols-outlined">light_mode</span>
              </button>
              <div
                className="profile-pic"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAm4tUu65c43Ed7emuK4oizoci0HfLsPE6WE79oHsjUzpuRtlh8vw_oSvZ8TVeYgkbg0dW9VHILxZ-jxG6sqXonG1FcFgL5NSIW-w-gmsjsi07Han1nTyHvaLLENns3iE3PfZc6LuWXUl18K_gNiIZ90zo4LjI1cSV7xlFYiICJ-Sys4VY5VoGEbBOvO8Kz8GdYv55LR0omfq7-dx1MRgkC5xkT-VXDaVPOPIvNhWYj3mM6QtbkZH4z7CYcwIEDzASDA2jdok3SwG0")',
                }}
              ></div>
            </div>
          </header>

          {/* Main Content */}
          <main className="main-content">
            <div className="intro-section">
              <h2 className="page-title">Votre Parcours Compte pour Nous</h2>
              <p className="page-subtitle">
                Aidez-nous à façonner l'avenir de Flexilearn en partageant votre expérience.
              </p>
            </div>

            <form className="main-form" onSubmit={handleSubmit}>
              <div className="form-grid">

                {/* Rating */}
                <div className="field-group">
                  <label className="field-label">Évaluation globale</label>
                  <div className="rating-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="star-button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <span
                          className={`material-symbols-outlined${
                            star <= (hoverRating || rating) ? " filled" : ""
                          }`}
                        >
                          star
                        </span>
                      </button>
                    ))}
                    {rating > 0 && <span className="rating-text">{getRatingLabel()}</span>}
                  </div>
                </div>

                {/* Category */}
                <div className="field-group">
                  <label className="field-label">Catégorie</label>
                  <div className="category-row">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`cat-button${category === cat.id ? " selected" : ""}`}
                        onClick={() => setCategory(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="field-group full-width">
                  <label className="field-label" htmlFor="comments">
                    Dites-nous en plus
                  </label>
                  <textarea
                    id="comments"
                    className="text-area"
                    placeholder="Qu'avez-vous aimé ? Que pouvons-nous améliorer ?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                  />
                </div>

                {/* Email */}
                <div className="field-group full-width">
                  <label className="field-label">
                    <input
                      type="checkbox"
                      checked={includeEmail}
                      onChange={(e) => setIncludeEmail(e.target.checked)}
                      style={{ marginRight: "0.5rem", accentColor: "#137fec" }}
                    />
                    Je souhaite être contacté pour un suivi (optionnel)
                  </label>
                  {includeEmail && (
                    <input
                      type="email"
                      className="email-input"
                      placeholder="votre.email@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  )}
                </div>

              </div>

              {/* Affichage des erreurs via CustomAlert uniquement, plus de error box */}
              <div className="submit-section">
                <div className="submit-row">
                  <p className="legal-text">
                    En soumettant, vous acceptez nos{" "}
                    <a href="#" className="legal-link">Conditions d'utilisation</a> et notre{" "}
                    <a href="#" className="legal-link">Politique de confidentialité</a>.
                  </p>
                  <button type="submit" className="primary-button" disabled={loading}>
                    <span>{loading ? "Envoi en cours..." : "Envoyer le feedback"}</span>
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </form>

            <div className="page-footer">
              <button className="link-button" onClick={() => navigate(-1)}>
                <span className="material-symbols-outlined">arrow_back</span>
                Retour au tableau de bord
              </button>
              <div className="footer-actions">
                <a href="#" className="action-link">
                  <span className="material-symbols-outlined">help</span>
                </a>
                <a href="#" className="action-link">
                  <span className="material-symbols-outlined">settings</span>
                </a>
              </div>
            </div>
          </main>

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
    </div>
  );
}