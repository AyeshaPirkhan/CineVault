import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bookmark, Clock3, Film, Heart, Home, Search, Settings, UserRound, Compass, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import "../index.css";
import { getStore } from "../services/storage";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");
  const [counts, setCounts] = useState(getStore());

  useEffect(() => {
    const sync = () => setCounts(getStore());
    window.addEventListener("cinevault-storage", sync);
    return () => window.removeEventListener("cinevault-storage", sync);
  }, []);

  useEffect(() => { if (location.pathname === "/") setQ(""); }, [location.pathname]);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const linkClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  return <div className="site-frame"><div className="app-shell">
    <aside className="sidebar">
      <button type="button" className="brand" onClick={() => navigate("/")} aria-label="CineVault home">
        <span className="brand-mark"><Film size={19}/></span>
      </button>
      <nav className="side-nav">
        <NavLink to="/" className={linkClass} end title="Home"><Home size={18}/><span>Home</span></NavLink>
        <NavLink to="/explore" className={linkClass} title="Explore"><Compass size={18}/><span>Explore</span></NavLink>
        <NavLink to="/watchlist" className={linkClass} title="Watchlist"><Bookmark size={18}/><span>Watchlist</span>{counts.watchlist.length>0&&<em>{counts.watchlist.length}</em>}</NavLink>
        <NavLink to="/favorites" className={linkClass} title="Favorites"><Heart size={18}/><span>Favorites</span>{counts.favorites.length>0&&<em>{counts.favorites.length}</em>}</NavLink>
        <NavLink to="/history" className={linkClass} title="History"><Clock3 size={18}/><span>History</span></NavLink>
      </nav>
      <div className="side-bottom">
        <NavLink to="/profile" className={linkClass} title="Profile"><UserRound size={18}/><span>Profile</span></NavLink>
        <NavLink to="/settings" className={linkClass} title="Settings"><Settings size={18}/><span>Settings</span></NavLink>
        <button type="button" className="nav-link" title="Log out" onClick={logout}><LogOut size={18}/><span>Log out</span></button>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="top-title"><span>CineVault</span></div>
        <form className="global-search" onSubmit={submit}>
          <Search size={16}/><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search movies, actors, genres..."/><kbd>⌘ K</kbd>
        </form>
        <div className="top-actions">
          <button type="button" className="avatar" onClick={()=>navigate("/profile")} aria-label="Profile">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </button>
        </div>
      </header>
      <div className="page-content">{children}</div>
    </main>
  </div></div>;
}
