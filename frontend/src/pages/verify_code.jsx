import React, { useState } from "react";
import CustomAlert from "../components/CustomAlert";
import "../styles/verify_code.css";
import { useNavigate } from "react-router-dom";

export default function VerifyCode() {
  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  // Fonction pour fermer l'alerte
  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur le champ suivant
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Revenir au champ précédent avec Backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const submitCode = async () => {
    const finalCode = code.join("");

    // Vérification que le code est complet
    if (finalCode.length !== 4) {
      setAlert({
        show: true,
        message: "Veuillez entrer les 4 chiffres du code",
        type: "warning",
      });
      return;
    }

    // Vérification que l'email existe
    if (!email) {
      setAlert({
        show: true,
        message: "Email non trouvé. Veuillez vous réinscrire.",
        type: "error",
      });
      setTimeout(() => {
        navigate("/signup");
      }, 2000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/user/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user_id", data.id);
        localStorage.setItem("username", data.username);

        setAlert({
          show: true,
          message: "Email confirmé avec succès ! Redirection en cours...",
          type: "success",
        });

        // Redirection après 2 secondes
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setAlert({
          show: true,
          message: data.detail || "Code incorrect. Veuillez réessayer.",
          type: "error",
        });
        // Réinitialiser les champs en cas d'erreur
        setCode(["", "", "", ""]);
        // Focus sur le premier champ
        setTimeout(() => {
          const firstInput = document.getElementById("code-input-0");
          if (firstInput) firstInput.focus();
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setAlert({
        show: true,
        message: "Erreur de connexion au serveur. Réessayez dans quelques instants.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour renvoyer le code
  const resendCode = async () => {
    if (!email) {
      setAlert({
        show: true,
        message: "Email non trouvé. Veuillez vous réinscrire.",
        type: "error",
      });
      navigate("/signup");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/user/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setAlert({
          show: true,
          message: "Un nouveau code a été envoyé à votre adresse email.",
          type: "success",
        });
        // Réinitialiser les champs
        setCode(["", "", "", ""]);
        // Focus sur le premier champ
        setTimeout(() => {
          const firstInput = document.getElementById("code-input-0");
          if (firstInput) firstInput.focus();
        }, 100);
      } else {
        setAlert({
          show: true,
          message: data.detail || "Erreur lors du renvoi du code",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        show: true,
        message: "Erreur de connexion au serveur",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="boite-code">
      <div className="code-container">
        <h2>Code de vérification</h2>
        <p>Nous avons envoyé un code à 4 chiffres à votre adresse email</p>
        {email && <p className="email-display" style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>{email}</p>}

        <div className="code-inputs">
          {code.map((digit, i) => (
            <input
              key={i}
              id={`code-input-${i}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              disabled={loading}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button 
          className="verify-btn" 
          onClick={submitCode} 
          disabled={loading}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            backgroundColor: "#22c1a5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Vérification..." : "Vérifier"}
        </button>

        <button 
          className="resend-btn" 
          onClick={resendCode} 
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#22c1a5",
            border: "1px solid #22c1a5",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          Renvoyer le code
        </button>
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