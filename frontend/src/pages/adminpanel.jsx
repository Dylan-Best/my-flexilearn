import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/adminpanel.css";
import CustomAlert from "../components/CustomAlert";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminPanel() {
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVAK, setFilterVAK] = useState("Tous");
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [confirm, setConfirm] = useState({ show: false, message: "", action: null, data: null });

  const usersPerPage = 10;
  const feedbacksPerPage = 10;
  const adminUserId = localStorage.getItem("user_id");

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
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/signin");
  };

  const getProfileColor = (letter) => {
    const colors = { "V": "blue", "A": "purple", "K": "amber" };
    return colors[letter] || "blue";
  };

  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:8000/admin/stats?user_id=${adminUserId}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des stats");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Erreur stats:", err);
        setError(err.message);
        setAlert({
          show: true,
          message: "Erreur lors du chargement des statistiques",
          type: "error",
        });
      }
    };
    if (adminUserId) fetchStats();
  }, [adminUserId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        let url = `http://localhost:8000/admin/users?user_id=${adminUserId}&limit=100`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs");
        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur users:", err);
        setError(err.message);
        setAlert({
          show: true,
          message: "Erreur lors du chargement des utilisateurs",
          type: "error",
        });
        setLoading(false);
      }
    };
    if (adminUserId && activeTab === "users") fetchUsers();
  }, [adminUserId, searchQuery, activeTab]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/admin/feedbacks?user_id=${adminUserId}&limit=100`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des feedbacks");
        const data = await response.json();
        setFeedbacks(data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur feedbacks:", err);
        setError(err.message);
        setAlert({
          show: true,
          message: "Erreur lors du chargement des feedbacks",
          type: "error",
        });
        setLoading(false);
      }
    };
    if (adminUserId && activeTab === "feedback") fetchFeedbacks();
  }, [adminUserId, activeTab]);

  useEffect(() => {
    const fetchFeedbackStats = async () => {
      try {
        const response = await fetch(`http://localhost:8000/feedback/stats`);
        if (!response.ok) throw new Error("Erreur stats feedbacks");
        const data = await response.json();
        setFeedbackStats(data);
      } catch (err) {
        console.error("Erreur stats feedbacks:", err);
      }
    };
    if (activeTab === "feedback") fetchFeedbackStats();
  }, [activeTab]);

  const handleDeleteUser = (userId, username) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.role === "superadmin") {
      setAlert({
        show: true,
        message: "Impossible de supprimer un superadmin !",
        type: "warning",
      });
      return;
    }
    setConfirm({
      show: true,
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`,
      action: "deleteUser",
      data: { userId, username }
    });
  };

  const confirmDeleteUser = async (data) => {
    const { userId, username } = data;
    try {
      const response = await fetch(`http://localhost:8000/admin/user/${userId}?user_id=${adminUserId}`, { 
        method: "DELETE" 
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      setUsers(users.filter(u => u.id !== userId));
      setAlert({
        show: true,
        message: `Utilisateur "${username}" supprimé avec succès`,
        type: "success",
      });
    } catch (err) {
      setAlert({
        show: true,
        message: "Erreur lors de la suppression",
        type: "error",
      });
    }
  };

  const handleChangeRole = (userId, currentRole, username) => {
    if (currentRole === "superadmin") {
      setAlert({
        show: true,
        message: "Impossible de modifier le rôle d'un superadmin !",
        type: "warning",
      });
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    setConfirm({
      show: true,
      message: `Voulez-vous changer le rôle de "${username}" de "${currentRole}" à "${newRole}" ?`,
      action: "changeRole",
      data: { userId, newRole, username, currentRole }
    });
  };

  const confirmChangeRole = async (data) => {
    const { userId, newRole, username, currentRole } = data;
    try {
      const response = await fetch(`http://localhost:8000/admin/user/${userId}/role?user_id=${adminUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors du changement de rôle");
      }
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setAlert({
        show: true,
        message: `Rôle de "${username}" modifié : ${currentRole} → ${newRole}`,
        type: "success",
      });
    } catch (err) {
      setAlert({
        show: true,
        message: err.message || "Erreur lors du changement de rôle",
        type: "error",
      });
    }
  };

  const handleDeleteFeedback = (feedbackId) => {
    setConfirm({
      show: true,
      message: "Êtes-vous sûr de vouloir supprimer ce feedback ?",
      action: "deleteFeedback",
      data: { feedbackId }
    });
  };

  const confirmDeleteFeedback = async (data) => {
    const { feedbackId } = data;
    try {
      const response = await fetch(`http://localhost:8000/admin/feedback/${feedbackId}?user_id=${adminUserId}`, { 
        method: "DELETE" 
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      setFeedbacks(feedbacks.filter(f => f.id_feedback !== feedbackId));
      setAlert({
        show: true,
        message: "Feedback supprimé avec succès",
        type: "success",
      });
    } catch (err) {
      setAlert({
        show: true,
        message: "Erreur lors de la suppression",
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
      case "deleteUser":
        confirmDeleteUser(confirm.data);
        break;
      case "changeRole":
        confirmChangeRole(confirm.data);
        break;
      case "deleteFeedback":
        confirmDeleteFeedback(confirm.data);
        break;
      default:
        break;
    }
    closeConfirm();
  };

  const categoryLabels = {
    "ui": "Interface", "accuracy": "Précision", "performance": "Performance",
    "features": "Fonctionnalités", "bug": "Bug", "other": "Autre"
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (filterCategory !== "Tous" && feedback.category !== filterCategory) return false;
    return true;
  });

  const filteredUsers = users
    .filter(user => {
      if (filterVAK === "Tous") return true;
      const profileMapping = { "Visuel": "V", "Auditif": "A", "Kinesthésique": "K" };
      return user.profile_type === profileMapping[filterVAK];
    })
    .sort((a, b) => {
      if (a.role === "superadmin" && b.role !== "superadmin") return -1;
      if (a.role !== "superadmin" && b.role === "superadmin") return 1;
      if (a.role === "admin" && b.role === "user") return -1;
      if (a.role === "user" && b.role === "admin") return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const indexOfLastFeedback = currentPage * feedbacksPerPage;
  const indexOfFirstFeedback = indexOfLastFeedback - feedbacksPerPage;
  const currentFeedbacks = filteredFeedbacks.slice(indexOfFirstFeedback, indexOfLastFeedback);
  const feedbackTotalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (!adminUserId) {
    return (
      <div className="admin-panel">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Accès refusé</h2>
          <p>Vous devez être connecté en tant qu'administrateur.</p>
          <button onClick={() => navigate("/signin")}>Se connecter</button>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="admin-panel">
        <div style={{ padding: "2rem", textAlign: "center" }}><p>Chargement...</p></div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div>
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue"><span className="material-symbols-outlined">group</span></div>
          </div>
          <p className="stat-label">Utilisateurs Totaux</p>
          <h3 className="stat-badge green">{stats?.total_users?.toLocaleString() || 0}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon purple"><span className="material-symbols-outlined">quiz</span></div>
          </div>
          <p className="stat-label">Tests VAK Complétés</p>
          <h3 className="stat-badge green">{stats?.total_profiles?.toLocaleString() || 0}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon amber"><span className="material-symbols-outlined">verified_user</span></div>
          </div>
          <p className="stat-label">Utilisateurs Vérifiés</p>
          <h3 className="stat-badge green">{stats?.verified_users?.toLocaleString() || 0}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon emerald"><span className="material-symbols-outlined">feedback</span></div>
          </div>
          <p className="stat-label">Retours Totaux</p>
          <h3 className="stat-badge green">{stats?.total_feedbacks?.toLocaleString() || 0}</h3>
        </div>
      </div>

      <div className="chart-section" style={{ marginTop: "2rem" }}>
        <div className="chart-header">
          <div>
            <h3>Distribution des Styles d'Apprentissage</h3>
            <p>Répartition des profils VAK</p>
          </div>
          <div className="chart-legend">
            <span><span className="dot blue"></span> Visuel ({stats?.profiles_by_type?.V || 0})</span>
            <span><span className="dot purple"></span> Auditif ({stats?.profiles_by_type?.A || 0})</span>
            <span><span className="dot amber"></span> Kinesthésique ({stats?.profiles_by_type?.K || 0})</span>
          </div>
        </div>
        <div className="chart-area">
          {stats?.profiles_by_type && (
            <div style={{ display: "flex", gap: "2rem", justifyContent: "center", alignItems: "flex-end", height: "250px", padding: "2rem" }}>
              {Object.entries(stats.profiles_by_type).map(([letter, count]) => {
                const colors = { "V": "#226D68", "A": "#2ecc71", "K": "#16a085" };
                const labels = { "V": "Visuel", "A": "Auditif", "K": "Kinesthésique" };
                const maxCount = Math.max(...Object.values(stats.profiles_by_type));
                const height = maxCount > 0 ? (count / maxCount) * 200 : 0;
                return (
                  <div key={letter} style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ height: `${height}px`, minHeight: "40px", backgroundColor: colors[letter], borderRadius: "8px 8px 0 0", marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
                      {count}
                    </div>
                    <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6B9E98" }}>{labels[letter]}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="user-table-section">
        <div className="table-controls">
          <div className="search-container">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Rechercher par nom, email ou ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-buttons">
            <span className="filter-label">FILTRE VAK :</span>
            {["Tous", "Visuel", "Auditif", "Kinesthésique"].map(f => (
              <button key={f} className={filterVAK === f ? "active" : ""} onClick={() => setFilterVAK(f)}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div> : (
          <>
            <table className="user-table">
              <thead>
                <tr>
                  <th>UTILISATEUR</th><th>PROFIL VAK</th><th>RÔLE</th><th>STATUT</th><th>CRÉÉ LE</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>Aucun utilisateur trouvé</td></tr>
                ) : (
                  currentUsers.map((user) => {
                    const color = getProfileColor(user.profile_type);
                    const initials = getInitials(user.username);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="user-info-cell">
                            <div className={`user-avatar-circle ${color}`}>{initials}</div>
                            <div>
                              <p className="user-name-text">{user.username}</p>
                              <p className="user-email-text">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{user.profile_type ? <span className={`vak-tag ${color}`}>{user.profile_type}</span> : <span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>Pas de profil</span>}</td>
                        <td><span className={`vak-tag ${user.role === "admin" || user.role === "superadmin" ? "purple" : "blue"}`}>{user.role.toUpperCase()}</span></td>
                        <td>
                          <div className="status-indicator">
                            <span className={`status-dot ${user.is_verified ? "active" : "offline"}`}></span>
                            {user.is_verified ? "Vérifié" : "Non vérifié"}
                          </div>
                        </td>
                        <td className="activity-text">{new Date(user.created_at).toLocaleDateString("fr-FR")}</td>
                        <td>
                          {user.role === "superadmin" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9CA3AF", fontSize: "0.75rem", fontStyle: "italic" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>lock</span>Protégé
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button className="more-btn" onClick={() => handleChangeRole(user.id, user.role, user.username)} title={user.role === "admin" ? "Rétrograder" : "Promouvoir en admin"} style={{ background: user.role === "admin" ? "#F59E0B" : "#226D68" }}>
                                <span className="material-symbols-outlined">{user.role === "admin" ? "arrow_downward" : "arrow_upward"}</span>
                              </button>
                              <button className="more-btn" onClick={() => handleDeleteUser(user.id, user.username)} title="Supprimer" style={{ background: "#EF4444" }}>
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {filteredUsers.length > 0 && (
              <div className="table-pagination">
                <p>Affichage <strong>{indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)}</strong> sur {filteredUsers.length} utilisateurs</p>
                <div className="pagination-buttons">
                  <button className={currentPage === 1 ? "disabled" : ""} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><span className="material-symbols-outlined">chevron_left</span></button>
                  {[...Array(Math.min(usersTotalPages, 5))].map((_, i) => <button key={i+1} className={currentPage === i+1 ? "active" : ""} onClick={() => setCurrentPage(i+1)}>{i+1}</button>)}
                  <button className={currentPage === usersTotalPages ? "disabled" : ""} onClick={() => setCurrentPage(prev => Math.min(usersTotalPages, prev + 1))} disabled={currentPage === usersTotalPages}><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div>
      {feedbackStats && (
        <div className="stats-cards" style={{ marginBottom: "2rem" }}>
          <div className="stat-card"><div className="stat-top"><div className="stat-icon blue"><span className="material-symbols-outlined">chat</span></div></div><p className="stat-label">Total Retours</p><h3 className="stat-number">{feedbackStats.total_feedbacks}</h3></div>
          <div className="stat-card"><div className="stat-top"><div className="stat-icon amber"><span className="material-symbols-outlined">star</span></div></div><p className="stat-label">Note Moyenne</p><h3 className="stat-number">{feedbackStats.average_rating}/5</h3></div>
          <div className="stat-card"><div className="stat-top"><div className="stat-icon emerald"><span className="material-symbols-outlined">thumb_up</span></div></div><p className="stat-label">Notes 5 étoiles</p><h3 className="stat-number">{feedbackStats.by_rating[5] || 0}</h3></div>
          <div className="stat-card"><div className="stat-top"><div className="stat-icon purple"><span className="material-symbols-outlined">category</span></div></div><p className="stat-label">Catégories</p><h3 className="stat-number">{Object.keys(feedbackStats.by_category).length}</h3></div>
        </div>
      )}

      <div className="user-table-section">
        <div className="table-controls">
          <div className="filter-buttons">
            <span className="filter-label">CATÉGORIE :</span>
            {[["Tous","Tous"],["ui","Interface"],["accuracy","Précision"],["features","Fonctionnalités"],["bug","Bug"]].map(([val, label]) => (
              <button key={val} className={filterCategory === val ? "active" : ""} onClick={() => { setFilterCategory(val); setCurrentPage(1); }}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div> : (
          <>
            <div className="feedback-list">
              {currentFeedbacks.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "12px", border: "2px dashed #d4eeea" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "#9CA3AF" }}>chat_bubble_outline</span>
                  <h3 style={{ marginTop: "1rem", color: "#6B9E98" }}>Aucun retour</h3>
                  <p style={{ color: "#9CA3AF", marginTop: "0.5rem" }}>Les retours utilisateurs apparaîtront ici</p>
                </div>
              ) : (
                currentFeedbacks.map((feedback) => (
                  <div key={feedback.id_feedback} className="feedback-item">
                    <div className="feedback-header">
                      <div className="feedback-user-info">
                        <div className="feedback-avatar">{feedback.username ? feedback.username[0].toUpperCase() : "?"}</div>
                        <div>
                          <p className="feedback-username">{feedback.username || "Utilisateur anonyme"}</p>
                          <p className="feedback-email">{feedback.email || "Pas d'email"}</p>
                        </div>
                      </div>
                      <div className="feedback-meta">
                        <div className="feedback-rating">
                          {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined" style={{ color: i < feedback.rating ? "#F59E0B" : "#E5E7EB", fontSize: "1.25rem" }}>star</span>)}
                        </div>
                        <span className={`feedback-category ${feedback.category}`}>{categoryLabels[feedback.category] || feedback.category}</span>
                      </div>
                    </div>
                    <div className="feedback-content"><p>{feedback.feedback_text}</p></div>
                    <div className="feedback-footer">
                      <span className="feedback-date">{new Date(feedback.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <button className="feedback-delete-btn" onClick={() => handleDeleteFeedback(feedback.id_feedback)}><span className="material-symbols-outlined">delete</span>Supprimer</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredFeedbacks.length > 0 && (
              <div className="table-pagination">
                <p>Affichage <strong>{indexOfFirstFeedback + 1} - {Math.min(indexOfLastFeedback, filteredFeedbacks.length)}</strong> sur {filteredFeedbacks.length} retours</p>
                <div className="pagination-buttons">
                  <button className={currentPage === 1 ? "disabled" : ""} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><span className="material-symbols-outlined">chevron_left</span></button>
                  {[...Array(Math.min(feedbackTotalPages, 5))].map((_, i) => <button key={i+1} className={currentPage === i+1 ? "active" : ""} onClick={() => setCurrentPage(i+1)}>{i+1}</button>)}
                  <button className={currentPage === feedbackTotalPages ? "disabled" : ""} onClick={() => setCurrentPage(p => Math.min(feedbackTotalPages, p + 1))} disabled={currentPage === feedbackTotalPages}><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon"><span className="material-symbols-outlined">school</span></div>
            <div className="logo-text">
              <h1>FlexiLearn</h1>
              <p>PANNEAU ADMIN</p>
            </div>
          </div>

          <nav className="sidebar-menu">
            {[
              { tab: "dashboard", icon: "dashboard", label: "Tableau de bord" },
              { tab: "users",     icon: "group",     label: "Gestion Utilisateurs" },
              { tab: "feedback",  icon: "chat",      label: "Retours" },
            ].map(({ tab, icon, label }) => (
              <a key={tab} href="#" className={`menu-item ${activeTab === tab ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setActiveTab(tab); setCurrentPage(1); }}>
                <span className="material-symbols-outlined">{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVrxh2tZPtW0zjRnvfcXZelJX0rCEee1HbEJIE8YBMAGFbei05F1SDg5b6IX9F5ZSpcp0EA_gfstgayz8YJydcW2GGVPOKkPbRt5ww5y1htZGNxZxlrtribsLkFJ7isb_ztVd_XVBfj6HHxuDvPnJCJgtKOTgCw2KwceZ-83OuZRVwgU6lEOotahW--q9xYrMw9jzkihvZokxsF8X2Zyyt2OsbzpGTp_hFG62FhtnObOqr9GdVSf7YsR5hcbKcl4-liu2b4ryAWDY" alt="Admin" className="user-avatar" />
              <div className="user-info">
                <p className="user-name">{localStorage.getItem("username") || "Admin"}</p>
                <p className="user-role">Super Admin</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Se déconnecter">
              <span className="material-symbols-outlined">logout</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <header className="admin-header">
            <div className="header-left">
              <h1>
                {activeTab === "dashboard" && "Tableau de bord"}
                {activeTab === "users" && "Gestion des Utilisateurs"}
                {activeTab === "feedback" && "Retours Utilisateurs"}
              </h1>
              <p>
                {activeTab === "dashboard" && "Vue d'ensemble de la plateforme"}
                {activeTab === "users" && "Gérez les utilisateurs et leurs rôles"}
                {activeTab === "feedback" && "Consultez et gérez les retours des utilisateurs"}
              </p>
            </div>
            <div className="header-right">
              <Link to="/userspace" className="back-btn" title="Retour à l'espace utilisateur">
                <span className="material-symbols-outlined">arrow_back</span>
                Espace utilisateur
              </Link>
            </div>
          </header>

          <div className="admin-content">
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "users" && renderUsers()}
            {activeTab === "feedback" && renderFeedback()}
          </div>
        </main>
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