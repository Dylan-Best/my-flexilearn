import "../styles/chat.css";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import human from "../assets/icones/person.png";
import robot from "../assets/images/logo.png";
import CustomAlert from "../components/CustomAlert";
import ConfirmModal from "../components/ConfirmModal";

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sessionId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [profile, setProfile] = useState("");
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingReco, setGeneratingReco] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [confirm, setConfirm] = useState({ show: false, message: "", action: null, data: null });

  const chatEndRef = useRef(null);

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

  // Scroll automatique
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Vérification et initialisation
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      navigate("/signin");
      return;
    }

    // ✅ Récupérer le profil depuis location.state
    const receivedProfile = location.state?.profile;
    
    console.log("Profile reçu depuis quiz:", receivedProfile);
    console.log("Type du profile:", typeof receivedProfile);

    // ✅ Validation stricte
    if (!receivedProfile || typeof receivedProfile !== 'string') {
      console.error("Profil invalide ou manquant, redirection vers quiz");
      setAlert({
        show: true,
        message: "Profil non trouvé. Veuillez d'abord compléter le quiz.",
        type: "warning",
      });
      setTimeout(() => navigate("/quiz"), 2000);
      return;
    }

    setProfile(receivedProfile);
  }, [navigate, location.state]);

  // Chargement des questions
  useEffect(() => {
    if (!profile) return; // Attendre que le profil soit défini

    const fetchStart = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Envoi au backend:", { 
          session_id: sessionId, 
          profile: profile 
        });

        const res = await fetch("http://localhost:8000/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            session_id: sessionId, 
            profile: profile
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Erreur serveur:", text);
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const data = await res.json();
        console.log("Données reçues:", data);

        setMessages([{ type: "bot", text: data.question }]);
        setCurrentStep(data.step);
        setTotalSteps(data.total);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError(err.message);
        setAlert({
          show: true,
          message: "Erreur de connexion au serveur. Vérifiez que le backend est démarré.",
          type: "error",
        });
        setMessages([{ 
          type: "bot", 
          text: "Une erreur s'est produite. Veuillez réessayer." 
        }]);
        setLoading(false);
      }
    };

    fetchStart();
  }, [profile, sessionId]);

  const handleSend = async () => {
    if (!input.trim() || quizFinished || generatingReco) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setInput("");
    setSendError(null);

    // Si c'est la dernière question, afficher le chargement
    const isLastQuestion = currentStep === totalSteps;
    
    if (isLastQuestion) {
      setGeneratingReco(true);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "⏳ Génération de vos recommandations personnalisées en cours..." },
      ]);
    }

    try {
      const res = await fetch("http://localhost:8000/chat/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id: sessionId, 
          answer: userMessage 
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();

      if (data.question) {
        // Question suivante
        setMessages((prev) => [...prev, { type: "bot", text: data.question }]);
        setCurrentStep(data.step);
        setTotalSteps(data.total);
      } else if (data.recommendations) {
        // Recommandations prêtes
        setQuizFinished(true);
        setGeneratingReco(false);
        
        // Remplacer le message de chargement par le message de succès
        setMessages((prev) => {
          const filtered = prev.filter(msg => !msg.text.includes("⏳ Génération"));
          return [
            ...filtered,
            { type: "bot", text: "✅ Quiz terminé ! Vos recommandations sont prêtes. Appuyez sur 'Voir recommandations'." },
          ];
        });
        
        localStorage.setItem("recommendations", JSON.stringify(data.recommendations));
        
        setAlert({
          show: true,
          message: "Recommandations générées avec succès !",
          type: "success",
        });
      }
    } catch (err) {
      console.error("Erreur:", err);
      setGeneratingReco(false);
      
      // Gestion d'erreur spécifique pour les erreurs 503
      let errorMessage = "❌ Erreur lors de l'envoi. Veuillez réessayer.";
      
      if (err.message.includes('503') || err.message.includes('overloaded')) {
        errorMessage = "⚠️ Le service est temporairement surchargé. Veuillez patienter quelques instants et réessayer.";
        setSendError("overloaded");
      } else if (err.message.includes('500')) {
        errorMessage = "⚠️ Une erreur serveur s'est produite. Veuillez réessayer dans quelques instants.";
        setSendError("server_error");
      } else {
        setSendError("general");
      }
      
      setAlert({
        show: true,
        message: errorMessage,
        type: "error",
      });
      
      // Remplacer le message de chargement par l'erreur
      setMessages((prev) => {
        const filtered = prev.filter(msg => !msg.text.includes("⏳ Génération"));
        return [
          ...filtered,
          { type: "bot", text: errorMessage },
        ];
      });
    }
  };

  const handleRetry = () => {
    setSendError(null);
    // Relancer l'envoi avec la dernière réponse si disponible
    const lastUserMessage = messages.filter(m => m.type === "user").pop();
    if (lastUserMessage) {
      setInput(lastUserMessage.text);
    }
  };

  const handleReco = () => {
    const recoString = localStorage.getItem("recommendations") || "";
    const recommendations = recoString ? JSON.parse(recoString) : null;
    navigate("/quiz-result", { state: { profile, recommendations } });
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

  if (loading) {
    return (
      <div className="boite-chat">
        <div className="chat-wrapper">
          <div className="chat-header">
            <div className="header-title">Assistant IA</div>
          </div>
          <div className="chat-window">
            <div className="loading-screen">
              <span className="spinner" style={{fontSize: '40px'}}>⏳</span>
              <p>Chargement des questions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boite-chat">
        <div className="chat-wrapper">
          <div className="chat-header">
            <div className="header-title">Erreur</div>
          </div>
          <div className="chat-window">
            <div className="error-screen">
              <p>❌ {error}</p>
              <button onClick={() => navigate("/quiz")}>
                Retour au quiz
              </button>
            </div>
          </div>
        </div>
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
    <div className="boite-chat">
      <div className="chat-wrapper">
        <div className="chat-header">
          <div className="header-title">Assistant IA - Profil {profile}</div>
          <div className="header-right">
            <span>Question {currentStep}/{totalSteps}</span>
            <img src={robot} className="header-icon" alt="Robot" />
            <button onClick={handleLogout} style={{marginLeft: '10px'}}>
              Déconnexion
            </button>
          </div>
        </div>

        <div className="chat-window">
          {messages.map((msg, i) => {
            // Déterminer la classe de style du message
            let bubbleClass = `bubble ${msg.type}`;
            if (msg.text.includes("⏳ Génération")) {
              bubbleClass += " loading pulse";
            } else if (msg.text.includes("✅")) {
              bubbleClass += " success";
            } else if (msg.text.includes("❌") || msg.text.includes("⚠️")) {
              bubbleClass += " error";
            }

            return (
              <div key={i} className={`msg-row ${msg.type}`}>
                {msg.type === "bot" && <img src={robot} className="avatar" alt="Bot" />}
                <div className={bubbleClass}>{msg.text}</div>
                {msg.type === "user" && <img src={human} className="avatar" alt="User" />}
              </div>

            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input">
          {quizFinished ? (
            <button className="reco-btn" onClick={handleReco}>
              Voir recommandations
            </button>
          ) : generatingReco ? (
            <div className="generating-box">
              <span className="generating-text">
                <span className="spinner">⏳</span>
                Génération en cours...
              </span>
            </div>
          ) : (
            <div className="input-box">
              <input
                placeholder="Répondre..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={generatingReco}
              />
              <span 
                className="send-icon" 
                onClick={handleSend}
                style={{
                  cursor: generatingReco ? 'not-allowed' : 'pointer',
                  opacity: generatingReco ? 0.5 : 1
                }}
              >
                ➤
              </span>
            </div>
          )}
          
          {/* Bouton de réessai en cas d'erreur */}
          {sendError && !quizFinished && !generatingReco && (
            <button className="retry-btn" onClick={handleRetry}>
              <span>🔄</span>
              <span>Réessayer</span>
            </button>
          )}
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