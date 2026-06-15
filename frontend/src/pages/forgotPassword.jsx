import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/forgot.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ regex simple email
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async () => {
    // reset erreur
    setError("");

    // ❌ email vide
    if (!email) {
      setError("Veuillez entrer votre email");
      return;
    }

    // ❌ email invalide
    if (!isValidEmail(email)) {
      setError("Email invalide");
      return;
    }

    try {
      await fetch(`http://localhost:8000/user/forgot-password?email=${email}`, {
        method: "POST",
      });

      alert("Code envoyé");
      navigate(`/reset-password?email=${email}`);
    } catch (err) {
      setError("Erreur serveur");
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-box">
        <h2>Mot de passe oublié</h2>
        <p>Entrez votre email pour recevoir un code</p>

        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* 🔴 message d'erreur */}
        {error && <p className="error-text">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!email || !/\S+@\S+\.\S+/.test(email)}
        >
          Envoyer le code
        </button>
      </div>
    </div>
  );
}
