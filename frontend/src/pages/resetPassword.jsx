import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/reset.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const email = params.get("email");

  const handleReset = async () => {
    try {
      await fetch("http://localhost:8000/user/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          new_password: password,
        }),
      });

      alert("Mot de passe changé !");
      navigate("/signin");
    } catch (error) {
      alert("Erreur reset");
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-box">
        <h2>Réinitialisation</h2>
        <p>
          Email : <strong>{email}</strong>
        </p>

        <input
          placeholder="Code reçu"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleReset}>Valider</button>
      </div>
    </div>
  );
}
