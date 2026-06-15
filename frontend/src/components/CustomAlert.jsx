import "../styles/alert.css";

export default function CustomAlert({ message, type = "success", onClose }) {
  return (
    <div className={`alert-container ${type}`}>
      <div className="alert-content">
        <span>{message}</span>
        <button onClick={onClose}>✕</button>
      </div>
    </div>
  );
}