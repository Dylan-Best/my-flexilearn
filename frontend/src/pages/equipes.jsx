import { Link } from "react-router-dom";
import "../styles/home.css";
import "../styles/equipe.css";
import andriantendryPhoto from "../assets/images/equipe/tendry.jpg";
import dylanPhoto from "../assets/images/equipe/dylan.jpg";
import haritinaPhoto from "../assets/images/equipe/haritina.jpg";
import noroPhoto from "../assets/images/equipe/noro.jpg";
const membres = [
  {
    nom: "ANDRIANTENDRY",
    role: "DevOps & Chef de projet",
    description: "Garant de l’infrastructure et de l’organisation du projet. Il assure la stabilité des déploiements et la coordination de l’équipe.",
    tel: "+261 33 37 570 89",
    email: "andriantendry20@gmail.com",
    photo: andriantendryPhoto,
  },
  {
    nom: "RASOLOFOMANANA Jean Dylan",
    role: "Développeur Backend & Frontend",
    description: "Polyvalent, il construit l’interface utilisateur et les API qui font communiquer le cœur de l’application.",
    tel: "+261 32 74 944 91",
    email: "dylan.rasolo@flexilearn.mg",
    photo: dylanPhoto,
  },
  {
    nom: "Haritina",
    role: "Lead Tech",
    description: "Responsable de l’architecture technique et de la cohérence des choix technologiques. Il veille à la qualité et à la maintenabilité du code.",
    tel: "+261 34 95 590 13",
    email: "haritina@flexilearn.mg",
    photo: haritinaPhoto,
  },
  {
    nom: "ANDRIANOELISOA Iangotiana Noro Malala",
    role: "Développeuse IA",
    description: "Elle conçoit les modèles d’intelligence artificielle pour personnaliser les parcours d’apprentissage et analyser les progrès.",
    tel: "+261 38 07 782 35",
    email: "noro.malala@flexilearn.mg",
    photo: noroPhoto,
  },
];

function MembreCard({ nom, role, description, tel, email, photo }) {
  return (
    <div className="team-card">
      <img
        src={photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
        alt={`Avatar de ${nom}`}
        className="team-avatar"
      />
      <h3 className="team-name">{nom}</h3>
      <span className="team-role">{role}</span>
      <p className="team-description">{description}</p>
      <div className="team-contacts">
        <div className="team-contact-item">
          📞 <a href={`tel:${tel}`}>{tel}</a>
        </div>
        <div className="team-contact-item">
          ✉️ <a href={`mailto:${email}`}>{email}</a>
        </div>
      </div>
    </div>
  );
}

export default function Equipe() {
  return (
    <div className="landing-container">
      <header className="navbar">
        <div className="logo">
          📘 <span>FlexiLearn</span>
        </div>
        <nav>
          <Link to="/" className="nav-link">Accueil</Link>
          <Link to="/about" className="nav-link">À propos</Link>
          <Link to="/equipe-page" className="nav-link active">Équipe</Link>
        </nav>
      </header>

      <section className="equipe-hero">
        <h1>Notre équipe</h1>
        <p>
          Nous sommes quatre étudiants en <strong>L3 informatique</strong>, passionnés par les technologies modernes.
          Chacun met ses compétences au service de FlexiLearn pour offrir une plateforme d’apprentissage innovante.
        </p>
      </section>
      <section className="team-grid">
        {membres.map((membre) => (
          <MembreCard key={membre.nom} {...membre} />
        ))}
      </section>
    </div>
  );
}