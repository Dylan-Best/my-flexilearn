import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/cours.css";
import CustomAlert from "../components/CustomAlert";
import ConfirmModal from "../components/ConfirmModal";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ICON_BG_MAP = {
  psychology: "icon-orange", language: "icon-slate", brush: "icon-mint",
  calculate: "icon-orange", history_edu: "icon-slate", biotech: "icon-mint",
  computer: "icon-orange", music_note: "icon-mint", sports_soccer: "icon-slate",
  camera: "icon-orange",
};

const ICON_OPTIONS = [
  { value: "psychology", label: "Sciences" }, { value: "language", label: "Langue" },
  { value: "brush", label: "Art" },           { value: "calculate", label: "Maths" },
  { value: "history_edu", label: "Histoire" },{ value: "biotech", label: "Biologie" },
  { value: "computer", label: "Info" },       { value: "music_note", label: "Musique" },
  { value: "sports_soccer", label: "Sport" }, { value: "camera", label: "Photo" },
];

const STATUS_LABELS = { "en-cours": "En cours", ajoute: "Ajouté", termine: "Terminé" };
const FILTERS       = ["Tous", "Ajouté", "En cours", "Terminé"];
const FILTER_MAP    = { Tous: null, Ajouté: "ajoute", "En cours": "en-cours", Terminé: "termine" };
const VAK_LABELS    = { V: "Visuel", A: "Auditif", K: "Kinesthésique" };
const VAK_COLOR     = { V: "#2563EB", A: "#D97706", K: "#059669" };

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getUserId() {
  return localStorage.getItem("user_id") || "1";
}

function relativeDate(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff}j`;
  if (diff < 30) return `Il y a ${Math.floor(diff/7)}sem`;
  return `Il y a ${Math.floor(diff/30)}mois`;
}

function progressValue(status) {
  return status === "termine" ? 100 : status === "en-cours" ? 35 : 0;
}

// ─── ADD SUBJECT MODAL ────────────────────────────────────────────────────────
function AddSubjectModal({ onClose, onAdd }) {
  const [form, setForm]       = useState({ title: "", status: "ajoute", icon: "psychology" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Le titre est requis."); return; }

    try {
      const saved = await apiFetch("/cours/subjects", {
        method: "POST",
        body: JSON.stringify({ user_id: parseInt(getUserId()), title: form.title.trim(), status: form.status }),
      });

      const newSubject = {
        id_subject:        saved.id_subject,
        title:             saved.title,
        status:            saved.status,
        icon:              form.icon,
        iconBg:            ICON_BG_MAP[form.icon] || "icon-orange",
      };

      setSuccess(true);
      setTimeout(() => { onAdd(newSubject); onClose(); }, 1000);
    } catch (e) {
      setError("Erreur lors de la création. Vérifiez que le backend est démarré.");
    }
  };

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <span className="material-symbols-outlined">add_circle</span>
            </div>
            <div>
              <h2 className="modal-title">Nouveau sujet</h2>
              <p className="modal-subtitle">Un guide VAK sera généré automatiquement</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {success ? (
          <div className="modal-success">
            <div className="modal-success-icon">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <h3>Sujet ajouté !</h3>
            <p>Le guide VAK sera généré à l'ouverture.</p>
          </div>
        ) : (
          <div className="modal-body animate-tab">

            {/* Icône */}
            <div className="modal-field">
              <label className="modal-label">Icône</label>
              <div className="icon-picker">
                {ICON_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    className={`icon-pick-btn${form.icon === opt.value ? " icon-pick-btn--active" : ""}`}
                    onClick={() => set("icon", opt.value)}>
                    <span className="material-symbols-outlined">{opt.value}</span>
                    <span className="icon-pick-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Titre */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="m-title">
                Titre <span className="required">*</span>
              </label>
              <input id="m-title"
                className={`modal-input${error ? " modal-input--error" : ""}`}
                type="text" placeholder="Ex : Algèbre, Japonais, Guitare…"
                value={form.title}
                onChange={e => { set("title", e.target.value); setError(""); }} />
              {error && <span className="modal-error">{error}</span>}
            </div>

            {/* Statut */}
            <div className="modal-field">
              <label className="modal-label">Statut</label>
              <div className="status-picker">
                {[{value:"ajoute",label:"Ajouté"},{value:"en-cours",label:"En cours"},{value:"termine",label:"Terminé"}].map(s => (
                  <button key={s.value} type="button"
                    className={`status-pick-btn status-pick-${s.value}${form.status === s.value ? " status-pick-btn--active" : ""}`}
                    onClick={() => set("status", s.value)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ padding: "1rem 0 0", border: "none" }}>
              <button className="modal-btn-secondary" onClick={onClose}>
                <span className="material-symbols-outlined">close</span> Annuler
              </button>
              <button className="modal-btn-primary modal-btn-submit" onClick={handleSubmit}>
                <span className="material-symbols-outlined">auto_awesome</span> Ajouter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GUIDE PANEL (full view) ─────────────────────────────────────────────────
function GuidePanel({ subject, onClose, onStatusChange }) {
  const [guide,       setGuide]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState(0);
  const [exporting,   setExporting]   = useState(false);
  const [guideProfile, setGuideProfile] = useState({ dom: null, sec: null });

  const GUIDE_TABS = [
    { key: "plan",        icon: "format_list_numbered", label: "Plan" },
    { key: "session",     icon: "timer",               label: "Session" },
    { key: "ressources",  icon: "library_books",       label: "Ressources" },
    { key: "techniques",  icon: "psychology",          label: "Techniques" },
    { key: "indicateurs", icon: "verified",            label: "Maîtrise" },
  ];

  useEffect(() => {
    if (!subject) return;
    setGuide(null); setError(null); setActiveTab(0);
    setGuideProfile({ dom: null, sec: null });
    fetchGuide();
  }, [subject?.id_subject]);

  const fetchGuide = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/cours/subjects/${subject.id_subject}/guide`);
      setGuide(data.contenu || data);
      if (data.profil_dominant) setGuideProfile({ dom: data.profil_dominant, sec: data.profil_secondaire });
    } catch (e) {
      setError("Impossible de charger le guide.");
    } finally {
      setLoading(false);
    }
  };

  const domCode = guideProfile.dom || subject?.profil_dominant;
  const secCode = guideProfile.sec || subject?.profil_secondaire;
  const color = VAK_COLOR[domCode] || "#18a89e";

  const exportPDF = async () => {
    if (!guide || exporting) return;
    setExporting(true);
    try {
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210, margin = 18, lineH = 6, maxW = W - margin * 2;
      let y = 20;
      const primary = [24, 168, 158];
      const addText = (text, size, bold, clr, indent = 0) => {
        doc.setFontSize(size); doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...(clr || [30,30,30]));
        doc.splitTextToSize(String(text || ""), maxW - indent).forEach(line => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin + indent, y); y += lineH;
        });
      };
      const addSection = (title) => {
        if (y > 260) { doc.addPage(); y = 20; }
        y += 4; doc.setFillColor(...primary);
        doc.roundedRect(margin, y - 4, maxW, 8, 2, 2, "F");
        doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255,255,255);
        doc.text(title, margin + 4, y + 1); y += 10; doc.setTextColor(30,30,30);
      };
      doc.setFillColor(...primary); doc.rect(0, 0, W, 14, "F");
      doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(255,255,255);
      doc.text("Flexilearn — Guide VAK", margin, 9); y = 22;
      addText(subject.title, 16, true, primary);
      addText(`Profil : ${VAK_LABELS[domCode] || domCode || "?"} + ${VAK_LABELS[secCode] || secCode || "?"}`, 10, false, [100,100,100]);
      y += 4;
      if (guide.plan) {
        addSection("Plan d'apprentissage");
        addText(guide.plan.description, 9, false, [80,80,80]); y += 2;
        (guide.plan.modules || []).forEach((mod, i) => {
          if (y > 265) { doc.addPage(); y = 20; }
          doc.setFillColor(240,252,250); doc.roundedRect(margin, y-3, maxW, lineH*3.5+4, 2, 2, "F");
          addText(`${i+1}. ${mod.titre}`, 10, true, primary, 3);
          addText(mod.tache, 9, false, [50,50,50], 3);
          if (mod.comment) addText(mod.comment, 8, false, [120,120,120], 3);
          addText(`Durée : ${mod.duree}`, 8, false, [24,168,158], 3); y += 3;
        });
      }
      if (guide.session) {
        addSection("Structure d'une séance"); addText(guide.session.description, 9, false, [80,80,80]); y += 2;
        (guide.session.phases || []).forEach(ph => {
          if (y > 265) { doc.addPage(); y = 20; }
          addText(`${ph.phase} — ${ph.duree} (${ph.profil})`, 10, true, [50,50,50], 2);
          addText(ph.action, 9, false, [50,50,50], 4);
          if (ph.ne_pas) addText(`À éviter : ${ph.ne_pas}`, 8, false, [180,50,50], 4);
          doc.setDrawColor(220,220,220); doc.line(margin, y, W-margin, y); y += 4;
        });
      }
      if (guide.ressources) {
        addSection("Ressources"); addText(guide.ressources.description, 9, false, [80,80,80]); y += 2;
        (guide.ressources.ressources || []).forEach(r => {
          if (y > 265) { doc.addPage(); y = 20; }
          addText(`[${r.profil}] ${r.type} — ${r.ressource}`, 10, true, [50,50,50], 2);
          addText(r.pourquoi, 9, false, [80,80,80], 4); y += 1;
        });
      }
      if (guide.techniques) {
        addSection("Techniques"); addText(guide.techniques.description, 9, false, [80,80,80]); y += 2;
        (guide.techniques.techniques || []).forEach(t => {
          if (y > 265) { doc.addPage(); y = 20; }
          addText(t.technique, 10, true, [50,50,50], 2);
          addText(t.action, 9, false, [80,80,80], 4);
          addText(t.format, 8, false, [120,120,120], 4); y += 2;
        });
      }
      if (guide.indicateurs) {
        addSection("Indicateurs"); addText(guide.indicateurs.description, 9, false, [80,80,80]); y += 2;
        addText("Signes :", 10, true, [50,50,50], 2);
        (guide.indicateurs.signes || []).forEach(s => addText(`• ${s}`, 9, false, [50,50,50], 4)); y += 2;
        addText("Mini-tests :", 10, true, [50,50,50], 2);
        (guide.indicateurs.mini_tests || []).forEach((mt, i) => addText(`${i+1}. ${mt}`, 9, false, [50,50,50], 4));
      }
      doc.save(`Guide_VAK_${subject.title.replace(/\s+/g, "_")}.pdf`);
    } catch (err) { 
      // Remplacé alert par une gestion d'erreur interne
      console.error("Erreur export PDF:", err);
    }
    finally { setExporting(false); }
  };

  if (!subject) return null;

  return (
    <div className="guide-panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="guide-panel">
        {/* Panel Header */}
        <div className="guide-panel-header" style={{ borderTopColor: color }}>
          <div className="guide-panel-header-top">
            <div className="guide-panel-left">
              <div className={`gp-subject-icon ${subject.iconBg || ICON_BG_MAP[subject.icon] || "icon-orange"}`}>
                <span className="material-symbols-outlined">{subject.icon || "psychology"}</span>
              </div>
              <div>
                <h2 className="gp-subject-title">{subject.title}</h2>
                <div className="gp-meta">
                  {domCode && (
                    <span className="gp-vak-badge" style={{ background: color + "18", color }}>
                      <span className="material-symbols-outlined">school</span>
                      {VAK_LABELS[domCode] || domCode}
                      {secCode && ` · ${VAK_LABELS[secCode] || secCode}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="guide-panel-actions">
              {/* Status selector */}
              <div className="gp-status-selector">
                {[
                  { value: "ajoute",   label: "Ajouté",   icon: "bookmark" },
                  { value: "en-cours", label: "En cours", icon: "autorenew" },
                  { value: "termine",  label: "Terminé",  icon: "task_alt" },
                ].map(s => (
                  <button key={s.value}
                    className={`gp-status-btn gp-status-${s.value}${subject.status === s.value ? " gp-status-btn--active" : ""}`}
                    onClick={() => onStatusChange(subject, s.value)}
                    title={s.label}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
              {guide && (
                <button className={`gp-export-btn${exporting ? " gp-export-btn--loading" : ""}`}
                  onClick={exportPDF} disabled={exporting} title="Exporter en PDF">
                  <span className="material-symbols-outlined">{exporting ? "progress_activity" : "picture_as_pdf"}</span>
                  {exporting ? "Export…" : "PDF"}
                </button>
              )}
              <button className="gp-close-btn" onClick={onClose} title="Fermer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="gp-tabs">
            {GUIDE_TABS.map((t, i) => (
              <button key={t.key}
                className={`gp-tab${activeTab === i ? " gp-tab--active" : ""}`}
                style={activeTab === i ? { color, borderBottomColor: color } : {}}
                onClick={() => setActiveTab(i)}>
                <span className="material-symbols-outlined">{t.icon}</span>
                <span className="gp-tab-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel Body */}
        <div className="guide-panel-body">
          {loading && <GuideLoading color={color} />}
          {error   && <GuideError message={error} onRetry={fetchGuide} />}
          {!loading && !error && guide && (
            <div className="gp-content">
              {activeTab === 0 && <PlanSection       data={guide.plan}        color={color} />}
              {activeTab === 1 && <SessionSection    data={guide.session}     color={color} subject={subject} />}
              {activeTab === 2 && <RessourcesSection data={guide.ressources}  color={color} />}
              {activeTab === 3 && <TechniquesSection data={guide.techniques}  color={color} />}
              {activeTab === 4 && <IndicateursSection data={guide.indicateurs} color={color} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GuideLoading({ color }) {
  const msgs = ["Génération du guide VAK…", "Adaptation au profil…", "Sélection des ressources…"];
  const [mi, setMi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMi(i => (i + 1) % msgs.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="guide-loading">
      <div className="guide-loading-spinner" style={{ borderTopColor: color }} />
      <p className="guide-loading-title">Génération du guide VAK…</p>
      <p className="guide-loading-sub">{msgs[mi]}</p>
    </div>
  );
}

function GuideError({ message, onRetry }) {
  return (
    <div className="guide-error">
      <span className="material-symbols-outlined">error_outline</span>
      <p>{message}</p>
      <button className="guide-retry-btn" onClick={onRetry}>
        <span className="material-symbols-outlined">refresh</span> Réessayer
      </button>
    </div>
  );
}

function PlanSection({ data, color }) {
  if (!data?.modules) return null;
  const isLast = (i) => i === data.modules.length - 1;
  return (
    <div className="guide-section">
      <p className="guide-section-intro">{data.description}</p>
      <div className="plan-modules">
        {data.modules.map((mod, i) => (
          <div key={i} className="plan-step-wrap">
            <div className="plan-step-connector">
              <div className="plan-module-num" style={{ background: color + "18", color }}>{i + 1}</div>
              {!isLast(i) && <div className="plan-connector-line" />}
            </div>
            <div className="plan-module">
              <div className="plan-module-title">{mod.titre}</div>
              <div className="plan-module-task">{mod.tache}</div>
              <div className="plan-module-footer">
                {mod.comment && (
                  <span className="plan-module-how" style={{ background: color + "14", color }}>
                    {mod.comment}
                  </span>
                )}
                <span className="plan-module-duration">
                  <span className="material-symbols-outlined">schedule</span>{mod.duree}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionSection({ data, color, subject }) {
  if (!data?.phases) return null;
  return (
    <div className="guide-section">
      <p className="guide-section-intro">{data.description}</p>
      <div className="session-phases">
        {data.phases.map((ph, i) => {
          const pc = VAK_COLOR[ph.profil] || color;
          return (
            <div key={i} className="session-phase">
              <div className="session-phase-left">
                <div className="session-phase-duration" style={{ color: pc }}>{ph.duree}</div>
                <div className="session-phase-line" style={{ background: pc + "30" }} />
              </div>
              <div className="session-phase-body">
                <div className="session-phase-header">
                  <span className="session-phase-name">{ph.phase}</span>
                  <span className="session-phase-badge" style={{ background: pc + "18", color: pc }}>
                    {VAK_LABELS[ph.profil] || ph.profil}
                  </span>
                </div>
                <p className="session-phase-action">{ph.action}</p>
                <p className="session-phase-not">
                  <span className="material-symbols-outlined">block</span>{ph.ne_pas}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RessourcesSection({ data, color }) {
  if (!data?.ressources) return null;
  const typeIcon = { Livre: "menu_book", Vidéo: "play_circle", Exercices: "edit_note", Podcast: "podcasts", Simulation: "biotech", Projet: "build", Article: "article" };
  return (
    <div className="guide-section">
      <p className="guide-section-intro">{data.description}</p>
      <div className="ressources-list">
        {data.ressources.map((r, i) => {
          const rc = VAK_COLOR[r.profil] || color;
          return (
            <div key={i} className="ressource-card">
              <div className="ressource-icon" style={{ background: rc + "18", color: rc }}>
                <span className="material-symbols-outlined">{typeIcon[r.type] || "link"}</span>
              </div>
              <div className="ressource-body">
                <div className="ressource-top">
                  <span className="ressource-name">{r.ressource}</span>
                  <span className="ressource-type-badge" style={{ background: rc + "18", color: rc }}>{r.type}</span>
                </div>
                <p className="ressource-why">{r.pourquoi}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TechniquesSection({ data, color }) {
  if (!data?.techniques) return null;
  return (
    <div className="guide-section">
      <p className="guide-section-intro">{data.description}</p>
      <div className="techniques-list">
        {data.techniques.map((t, i) => (
          <div key={i} className="technique-card">
            <div className="technique-header">
              <div className="technique-dot" style={{ background: color }} />
              <span className="technique-name">{t.technique}</span>
            </div>
            <p className="technique-action">{t.action}</p>
            <div className="technique-format">
              <span className="material-symbols-outlined">tips_and_updates</span>{t.format}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndicateursSection({ data, color }) {
  if (!data) return null;
  return (
    <div className="guide-section">
      <p className="guide-section-intro">{data.description}</p>
      {data.signes?.length > 0 && (
        <div className="indicateurs-block">
          <h4 className="indicateurs-block-title" style={{ color }}>
            <span className="material-symbols-outlined">verified</span> Signes de maîtrise
          </h4>
          <div className="indicateurs-signs">
            {data.signes.map((s, i) => (
              <div key={i} className="indicateur-sign">
                <span className="indicateur-check material-symbols-outlined" style={{ color }}>check_circle</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.mini_tests?.length > 0 && (
        <div className="indicateurs-block">
          <h4 className="indicateurs-block-title" style={{ color }}>
            <span className="material-symbols-outlined">quiz</span> Mini-tests
          </h4>
          <div className="mini-tests-list">
            {data.mini_tests.map((mt, i) => (
              <div key={i} className="mini-test">
                <span className="mini-test-mod" style={{ background: color + "18", color }}>Module {i + 1}</span>
                <p className="mini-test-desc">{mt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Cours() {
  const navigate = useNavigate();
  const [subjects,        setSubjects]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activeFilter,    setActiveFilter]    = useState("Tous");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showGuidePanel,  setShowGuidePanel]  = useState(false);
  const [userData,        setUserData]        = useState(null);
  const [search,          setSearch]          = useState("");
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
  useEffect(() => {
    if (alert.show && alert.type === "success") {
      const timer = setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show, alert.type]);

  useEffect(() => {
    const userId = getUserId();
    fetch(`http://localhost:8000/get_profile/profile?user_id=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUserData(d.user); })
      .catch(() => {});
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
    localStorage.removeItem("user_id");
    navigate("/signin");
  };

  useEffect(() => {
    apiFetch(`/cours/subjects?user_id=${getUserId()}`)
      .then(data => { setSubjects(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = subjects
    .filter(s => FILTER_MAP[activeFilter] === null || s.status === FILTER_MAP[activeFilter])
    .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()));

  const nbTotal = subjects.length;
  const nbCours = subjects.filter(s => s.status === "en-cours").length;
  const nbDone  = subjects.filter(s => s.status === "termine").length;

  const handleAdd = s => {
    setSubjects(prev => [s, ...prev]);
    setSelectedSubject(s);
    setShowGuidePanel(true);
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setShowGuidePanel(true);
  };

  const handleStatusChange = async (subject, status) => {
    try {
      await apiFetch(`/cours/subjects/${subject.id_subject}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (_) {}
    setSubjects(prev => prev.map(s => s.id_subject === subject.id_subject ? { ...s, status } : s));
    setSelectedSubject(prev => prev?.id_subject === subject.id_subject ? { ...prev, status } : prev);
  };

  const handleDeleteSubject = (subject) => {
    setConfirm({
      show: true,
      message: `Supprimer "${subject.title}" et son guide ?`,
      action: "deleteSubject",
      data: subject
    });
  };

  const confirmDeleteSubject = async (subject) => {
    try {
      await apiFetch(`/cours/subjects/${subject.id_subject}`, { method: "DELETE" });
      setSubjects(prev => prev.filter(s => s.id_subject !== subject.id_subject));
      if (selectedSubject?.id_subject === subject.id_subject) {
        setShowGuidePanel(false);
        setSelectedSubject(null);
      }
      setAlert({
        show: true,
        message: `"${subject.title}" a été supprimé avec succès.`,
        type: "success",
      });
    } catch (_) {
      setAlert({
        show: true,
        message: `Erreur lors de la suppression de "${subject.title}".`,
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
      case "deleteSubject":
        confirmDeleteSubject(confirm.data);
        break;
      default:
        break;
    }
    closeConfirm();
  };

  return (
    <div className="cours-page">
      {showAddModal && (
        <AddSubjectModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}

      {showGuidePanel && selectedSubject && (
        <GuidePanel
          subject={selectedSubject}
          onClose={() => setShowGuidePanel(false)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* NAV */}
      <header className="cours-nav">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate("/userspace")}>
            <div className="brand-icon">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
              </svg>
            </div>
            <h1 className="brand-name">Flexilearn</h1>
          </div>
          <nav className="nav-links">
            <a href="#" className="nav-link" onClick={e => { e.preventDefault(); navigate("/userspace"); }}>Tableau de bord</a>
            <a href="#" className="nav-link" onClick={e => { e.preventDefault(); navigate("/feedbackpage"); }}>Feedback</a>
            <a href="#" className="nav-link" onClick={async e => {
              e.preventDefault();
              try {
                const userId = getUserId();
                const recRes = await fetch(`http://localhost:8000/recommendation/user/${userId}`);
                if (!recRes.ok) { navigate("/quiz"); return; }
                const recData = await recRes.json();
                let reco = recData.recommendation;
                if (typeof reco === "string") { reco = JSON.parse(reco); if (typeof reco === "string") reco = JSON.parse(reco); }
                if (!reco?.sections) { navigate("/quiz"); return; }
                const profRes = await fetch(`http://localhost:8000/get_profile/profile?user_id=${userId}`);
                const profData = profRes.ok ? await profRes.json() : {};
                navigate("/quiz-result", { state: { profile: profData?.profile?.profile_code, recommendations: reco } });
              } catch (_) { navigate("/quiz"); }
            }}>Recommandations</a>
            <a href="#" className="nav-link active">Cours</a>
          </nav>
          <div className="nav-actions">
            <div className="nav-user-badge">
              <div className="nav-avatar-initials">{getInitials(userData?.name || userData?.username)}</div>
              <span className="nav-user-name">{userData?.name || userData?.username || ""}</span>
            </div>
            <button className="nav-logout-btn" onClick={handleLogout} title="Déconnexion">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="cours-main">
        <div className="page-hero">
          <div>
            <h2 className="section-title">Mes apprentissages</h2>
            <p className="section-subtitle">{nbTotal} sujet{nbTotal !== 1 ? "s" : ""} · {nbCours} en cours · {nbDone} terminé{nbDone !== 1 ? "s" : ""}</p>
          </div>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            <span className="material-symbols-outlined">add</span>
            Ajouter un sujet
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon stat-icon-total"><span className="material-symbols-outlined">folder_open</span></div>
            <div><div className="stat-val">{nbTotal}</div><div className="stat-lbl">Total</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-cours"><span className="material-symbols-outlined">autorenew</span></div>
            <div><div className="stat-val" style={{color:"#2563eb"}}>{nbCours}</div><div className="stat-lbl">En cours</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-done"><span className="material-symbols-outlined">task_alt</span></div>
            <div><div className="stat-val" style={{color:"#16a34a"}}>{nbDone}</div><div className="stat-lbl">Terminés</div></div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="toolbar-row">
          <div className="search-wrap">
            <div className="search-icon"><span className="material-symbols-outlined">search</span></div>
            <input className="search-input" type="text" placeholder="Rechercher un sujet…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-row">
            {FILTERS.map(f => (
              <button key={f}
                className={`filter-btn${activeFilter === f ? " filter-btn--active" : ""}`}
                onClick={() => setActiveFilter(f)}>{f}
              </button>
            ))}
          </div>
        </div>

        {/* Subject grid */}
        {loading ? (
          <div className="subject-list-empty">
            <span className="material-symbols-outlined spin">progress_activity</span>
            <p>Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="subject-list-empty">
            <span className="material-symbols-outlined">inbox</span>
            <p>{subjects.length === 0 ? "Aucun sujet pour l'instant. Ajoutez votre premier sujet !" : "Aucun résultat pour ce filtre."}</p>
            {subjects.length === 0 && (
              <button className="btn-add" onClick={() => setShowAddModal(true)}>
                <span className="material-symbols-outlined">add</span> Ajouter un sujet
              </button>
            )}
          </div>
        ) : (
          <div className="subject-grid">
            {filtered.map(subject => (
              <div key={subject.id_subject}
                className={`subject-card${subject.status === "en-cours" ? " subject-card--active" : ""}${selectedSubject?.id_subject === subject.id_subject ? " subject-card--selected" : ""}`}
                onClick={() => handleSelectSubject(subject)}>
                <div className="sc-top">
                  <div className={`subject-icon ${subject.iconBg || ICON_BG_MAP[subject.icon] || "icon-orange"}`}>
                    <span className="material-symbols-outlined">{subject.icon || "psychology"}</span>
                  </div>
                  <div className="sc-actions">
                    <button className="sc-delete-btn" title="Supprimer"
                      onClick={e => { e.stopPropagation(); handleDeleteSubject(subject); }}>
                      <span className="material-symbols-outlined">delete_outline</span>
                    </button>
                  </div>
                </div>
                <div className="sc-body">
                  <h3 className="subject-title">{subject.title}</h3>
                  <div className="subject-meta">
                    <span className={`status-badge status-${subject.status}`}>{STATUS_LABELS[subject.status]}</span>
                  </div>
                  <div className="subject-progress">
                    <div className="progress-track">
                      <div className="progress-fill" style={{width: `${progressValue(subject.status)}%`}} />
                    </div>
                    <span className="progress-pct">{progressValue(subject.status)}%</span>
                  </div>
                </div>
                <div className="sc-footer">
                  <span className="subject-date">{relativeDate(subject.created_at)}</span>
                  <div className="sc-status-pills">
                    {["ajoute","en-cours","termine"].map(s => (
                      <button key={s}
                        className={`sc-status-pill sc-sp-${s}${subject.status === s ? " sc-sp--active" : ""}`}
                        title={STATUS_LABELS[s]}
                        onClick={e => { e.stopPropagation(); handleStatusChange(subject, s); }}>
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sc-open-hint">
                  <span className="material-symbols-outlined">open_in_full</span>
                  Ouvrir le guide
                </div>
              </div>
            ))}
            {/* Add card */}
            <div className="subject-card-add" onClick={() => setShowAddModal(true)}>
              <span className="material-symbols-outlined">add_circle</span>
              <span>Ajouter un sujet</span>
            </div>
          </div>
        )}
      </main>

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