import { useState, useEffect } from "react";
import CustomAlert from "../components/CustomAlert";
import "../styles/signin&signup.css";
import mail_icone from "../assets/icones/email.png";
import lock_icone from "../assets/icones/lock.png";
import eye_icone from "../assets/icones/eye.png";
import eye_hide_icone from "../assets/icones/eye_hide.png";
import { Link, useNavigate } from "react-router-dom";
import LOGO_SRC from "../assets/images/flexi_logo.png";

function LeftPanel({ mode = "signin" }) {
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

      {(phase === "logo" || phase === "glow" || phase === "melt") && (
        <div className={`lp-logo-wrap lp-logo-${phase}`}>
          <img src={LOGO_SRC} alt="FlexiLearn" className="lp-logo-img" />
        </div>
      )}

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

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  // Auto fermeture de l'alerte
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/user/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      const userId = data.user_id || data.user?.id || data.id;

      if (userId) {
        localStorage.setItem("user_id", userId);

        setAlert({
          message: "Connexion réussie !",
          type: "success",
        });

        setTimeout(() => {
          navigate("/userspace");
        }, 1500);
      } else {
        setAlert({
          message: "Échec de la connexion",
          type: "error",
        });
      }
    } catch (error) {
      setAlert({
        message: "Erreur serveur",
        type: "error",
      });
    }
  };

  return (
    <div className="signin-container">

      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <LeftPanel mode="signin" />

      <div className="signin-right">
        <div className="title">
          <h2>Bienvenue</h2>
          <p className="info">
            Connectez-vous avec votre adresse e-mail et mot de passe
          </p>
        </div>

        <form className="signin-form" onSubmit={handleLogin} autoComplete="off">
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
              placeholder="Entrez votre mot de passe"
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

          <div className="options">
            <label>
              <input type="checkbox" /> Se souvenir de moi
            </label>
            <Link to="/forgot-password" className="forgot-link underline-link">
              Mot de passe oublié ?
            </Link>
          </div>

          <button className="login-btn">CONNEXION</button>
        </form>
      </div>
    </div>
  );
}
