import { useState } from "react";
import { Film, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,setForm]=useState({name:"",username:"",email:"",password:""});
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=async e=>{
    e.preventDefault(); setError(""); setLoading(true);
    try { await register(form); navigate("/",{replace:true}); }
    catch(err){ setError(err.message || "Registration failed."); }
    finally{ setLoading(false); }
  };

  return <div className="auth-page">
    <div className="auth-card">
      <div className="auth-brand"><span><Film size={20}/></span><strong>CineVault</strong></div>
      <span className="eyebrow">GET STARTED</span>
      <h1>Create account</h1>
      <p className="auth-subtitle">Your movie collections will be saved securely with your account.</p>
      <form onSubmit={submit}>
        <label>Name<input name="name" value={form.name} onChange={change} placeholder="Your name" required /></label>
       <label>
  Username
  <input
    name="username"
    value={form.username}
    onChange={change}
    placeholder="ENTER YOUR USERNAME HERE"
    autoComplete="off"
    minLength="3"
    required
  />
</label>
        <label>Email<input name="email" type="email" value={form.email} onChange={change} placeholder="you@example.com" required /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={change} placeholder="At least 6 characters" minLength="6" required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary auth-submit" disabled={loading}><UserPlus size={16}/>{loading ? "Creating..." : "Create account"}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </div>
  </div>;
}
