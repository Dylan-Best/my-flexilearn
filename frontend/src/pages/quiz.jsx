import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/quiz.css";
import CustomAlert from "../components/CustomAlert";
import ConfirmModal from "../components/ConfirmModal";

export default function Quiz() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [confirm, setConfirm] = useState({ show: false, message: "", action: null, data: null });
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Fermer l'alerte
  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  // Fermer la confirmation
  const closeConfirm = () => {
    setConfirm({ show: false, message: "", action: null, data: null });
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

  /* ===== Vérif connexion ===== */
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) navigate("/signin");
  }, [navigate]);

  /* ===== Chargement questions ===== */
  useEffect(() => {
    fetch("http://localhost:8000/api/quiz")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setAlert({
          show: true,
          message: "Erreur lors du chargement du quiz. Vérifiez votre connexion.",
          type: "error",
        });
        setLoading(false);
      });
  }, []);

  /* ===== Sélection réponse ===== */
  const handleSelect = (letter) => {
    setAnswers({ ...answers, [current + 1]: letter.toUpperCase() });
  };

  /* ===== Suivant / Soumission ===== */
  const handleNext = () => {
    if (!answers[current + 1]) {
      setAlert({
        show: true,
        message: "Choisis une réponse avant de continuer 😊",
        type: "warning",
      });
      return;
    }

    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      finishQuiz();
    }
  };

  /* ===== Fin du quiz → redirection chat ===== */
  const finishQuiz = async () => {
    if (Object.keys(answers).length !== 20) {
      setAlert({
        show: true,
        message: "Toutes les questions doivent être répondues (20/20)",
        type: "warning",
      });
      return;
    }

    const responsesArray = Array.from({ length: 20 }, (_, i) => answers[i + 1]);
    console.log("Réponses envoyées au chat :", responsesArray);

    setPopupVisible(true);
    setPopupMessage("Enregistrement de vos réponses...");

    try {
      const userId = localStorage.getItem("user_id");

      const res = await fetch(`http://127.0.0.1:8000/api/predict?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: responsesArray }),
      });

      if (!res.ok) throw new Error("Erreur serveur lors de la prédiction");

      const result = await res.json();
      console.log("Profil prédit :", result.result);

      setPopupMessage("✅ Profil enregistré avec succès !");

      setTimeout(() => {
        setPopupVisible(false);
        navigate("/chat", { 
          state: { 
            answers: responsesArray, 
            profile: result.result.Profil
          } 
        });
      }, 1500);
    } catch (err) {
      console.error(err);
      setPopupVisible(false);
      setAlert({
        show: true,
        message: "Erreur lors de l'enregistrement du profil. Réessayez.",
        type: "error",
      });
    }
  };

  /* ===== Déconnexion ===== */
  const handleLogout = () => {
    setConfirm({
      show: true,
      message: "Êtes-vous sûr de vouloir vous déconnecter ?",
      action: "logout",
      data: null
    });
  };

  const confirmLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/signin");
  };

  // Gestionnaire des confirmations
  const handleConfirm = () => {
    switch (confirm.action) {
      case "logout":
        confirmLogout();
        break;
      default:
        break;
    }
    closeConfirm();
  };

  /* ===== Loading ===== */
  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-content">Chargement du quiz...</div>
      </div>
    );
  }

  /* ===== AFFICHAGE QUIZ ===== */
  const q = questions[current];
  const progressPercent =
    questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  return (
    <div className="quiz-container">
      <header className="quiz-top">
        <div className="quiz-brand">🎓 FlexiLearn</div>
        <h1 className="quiz-title">Test de Profil d'Apprentissage</h1>
        <p className="quiz-subtitle">
          Répondez honnêtement à chaque question pour obtenir votre profil le
          plus précis
        </p>
        <button className="quiz-logout-btn" onClick={handleLogout} title="Déconnexion">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>
      <div className="quiz-wrapper">
        <div className="progress-card">
          <span>
            Question {current + 1} sur {questions.length}
          </span>
          <span>{Math.round(progressPercent)}%</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="quiz-card">
          <span className="question-badge">Question {current + 1}</span>
          <h2 className="question">{q?.Question}</h2>

          <div className="options">
            {["A", "B", "C"].map((letter) => (
              <div
                key={letter}
                className={`option-card ${
                  answers[current + 1] === letter ? "selected" : ""
                }`}
                onClick={() => handleSelect(letter)}
              >
                <div className="option-icon">{letter}</div>
                <div className="option-text">{q?.[`Option_${letter}`]}</div>
              </div>
            ))}
          </div>

          <button className="next-btn" onClick={handleNext}>
            {current === questions.length - 1
              ? "Finaliser mon test et commencer le chat"
              : "Suivant →"}
          </button>
        </div>
      </div>

      {/* Popup personnalisé pour le chargement */}
      {popupVisible && (
        <div className="quiz-popup">
          <div className="quiz-popup-content">
            <span className="quiz-popup-spinner"></span>
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

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