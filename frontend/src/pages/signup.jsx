import { useState, useEffect } from "react";
import "../styles/signin&signup.css";
import mail_icone from "../assets/icones/email.png";
import eye_icone from "../assets/icones/eye.png";
import eye_hide_icone from "../assets/icones/eye_hide.png";
import lock_icone from "../assets/icones/lock.png";
import user_icone from "../assets/icones/user.png";
import { Link, useNavigate } from "react-router-dom";
import LOGO_SRC from "../assets/images/flexi_logo.png";
import CustomAlert from "../components/CustomAlert";

function LeftPanel({ mode = "signup" }) {
  const [phase, setPhase] = useState("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("glow"), 800);
    const t2 = setTimeout(() => setPhase("melt"), 1800);
    const t3 = setTimeout(() => setPhase("text"), 3100);
    const t4 = setTimeout(() => setPhase("done"), 4600);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  return (
    <div className="lp-root">
      <div className="lp-particles" aria-hidden="true">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="lp-particle"
            style={{
              left: `${((i * 41 + 13) % 90) + 5}%`,
              top: `${((i * 67 + 9) % 85) + 5}%`,
              width: `${(i % 3) + 4}px`,
              height: `${(i % 3) + 4}px`,
              animationDuration: `${4 + (i % 3)}s`,
              animationDelay: `${(i * 0.22) % 2.5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      {(phase === "logo" || phase === "glow" || phase === "melt") && (
        <div className={`lp-logo-wrap lp-logo-${phase}`}>
          <img src={LOGO_SRC} alt="FlexiLearn" className="lp-logo-img" />
        </div>
      )}

      {/* Brand block après fondu */}
      {(phase === "text" || phase === "done") && (
        <div className="lp-brand-block">
          <div className="lp-mini-wrap">
            <img src={LOGO_SRC} alt="" className="lp-mini" />
          </div>

          <div className="lp-name">
            <div className="lp-word">
              {"FLEXI".split("").map((c, i) => (
                <span
                  key={i}
                  className="lp-letter lp-teal"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="lp-word">
              {"LEARN".split("").map((c, i) => (
                <span
                  key={i}
                  className="lp-letter lp-grad"
                  style={{ animationDelay: `${0.4 + i * 0.08}s` }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="lp-line" />

          <p className="lp-subtitle">
            Apprendre à votre rythme · Évoluer sans limites
          </p>
        </div>
      )}

      <p className="lp-foot">
        {mode === "signin" ? (
          <>
            Pas encore de compte ?{" "}
            <Link to="/signup" className="lp-link">
              S'inscrire
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <Link to="/signin" className="lp-link">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

// PAGE INSCRIPTION

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const navigate = useNavigate();

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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Vérification de la correspondance des mots de passe
    if (password !== confirmPassword) {
      setAlert({
        show: true,
        message: "Les mots de passe ne correspondent pas",
        type: "error",
      });
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("email", data.email);
        setAlert({
          show: true,
          message: "E-mail envoyé ! Vérifiez votre boîte de réception.",
          type: "success",
        });
        // Redirection après 2 secondes pour laisser le temps de voir le message
        setTimeout(() => {
          navigate("/verify-code");
        }, 2000);
      } else {
        // Gestion des erreurs spécifiques du backend
        const errorMessage = data.message || "Erreur lors de l'inscription";
        setAlert({
          show: true,
          message: errorMessage,
          type: "error",
        });
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

  return (
    <div className="signin-container signup-mode">
      <LeftPanel mode="signup" />

      <div className="signin-right">
        <div className="title">
          <h2>Créer un compte</h2>
          <p className="info">
            Inscrivez-vous avec votre adresse e-mail et mot de passe
          </p>
        </div>

        <form className="signin-form" onSubmit={handleLogin} autoComplete="off">
          <label className="field-label">Nom d'utilisateur</label>
          <div className="input-box">
            <img src={user_icone} className="input-icon" alt="" />
            <input
              type="text"
              placeholder="Choisissez un nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <label className="field-label">Adresse e-mail</label>
          <div className="input-box">
            <img src={mail_icone} className="input-icon" alt="" />
            <input
              type="email"
              placeholder="Entrez votre e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <label className="field-label">Mot de passe</label>
          <div className="input-box password-box">
            <img src={lock_icone} className="input-icon" alt="" />
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Créez un mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="off"
            />
            <span className="toggle-pwd" onClick={() => setShowPwd(!showPwd)}>
              <img
                src={showPwd ? eye_icone : eye_hide_icone}
                alt="toggle"
                className="pwd-icon"
              />
            </span>
          </div>

          <label className="field-label">Confirmer le mot de passe</label>
          <div className="input-box password-box">
            <img src={lock_icone} className="input-icon" alt="" />
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="off"
            />
            <span className="toggle-pwd" onClick={() => setShowPwd(!showPwd)}>
              <img
                src={showPwd ? eye_icone : eye_hide_icone}
                alt="toggle"
                className="pwd-icon"
              />
            </span>
          </div>

          {confirmPassword && password !== confirmPassword && (
            <p style={{ color: "#c0392b", fontSize: "12px", marginBottom: 8 }}>
              Les mots de passe ne correspondent pas
            </p>
          )}

          <button className="login-btn" disabled={loading}>
            {loading ? "..." : "S'INSCRIRE"}
          </button>
        </form>
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