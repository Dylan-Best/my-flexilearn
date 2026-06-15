import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupPage from "./pages/signup.jsx";
import SigninPage from "./pages/signin.jsx";
import Quiz from "./pages/quiz.jsx";
import Home from "./pages/home.jsx";
import QuizResult from "./pages/QuizResult";
import ChatPage from "./pages/chat.jsx";
import VerifyCode from "./pages/verify_code.jsx";
import UserPage from "./pages/user.jsx";
import FeedbackPage from "./pages/feedbackPage";
import AdminPanel from "./pages/adminpanel";
import UserSpace from "./pages/userspace";
import Cours from "./pages/cours.jsx";
import ResetPassword from "./pages/resetPassword.jsx";
import ForgotPassword from "./pages/forgotPassword.jsx";
import Equipe from './pages/equipes.jsx';
import About from './pages/about';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/equipe-page" element={<Equipe />} />
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/user-page" element={<UserPage />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/quiz_result" element={<QuizResult />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/quiz-result" element={<QuizResult />} />
        <Route path="/feedbackPage" element={<FeedbackPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/userspace" element={<UserSpace />} />
        <Route path="/cours" element={<Cours />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}
export default App;
