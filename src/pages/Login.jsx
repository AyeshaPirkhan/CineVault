import { useState } from "react";
import { Film, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="auth-page">
    <div className="auth-card">
      <div className="auth-brand"><span><Film size={20}/></span><strong>CineVault</strong></div>
      <span className="eyebrow">WELCOME BACK</span>
      <h1>Sign in</h1>
      <p className="auth-subtitle">Access your favorites, watchlist and viewing history.</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary auth-submit" disabled={loading}><LogIn size={16}/>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="auth-switch">New to CineVault? <Link to="/register">Create an account</Link></p>
    </div>
  </div>;
}
