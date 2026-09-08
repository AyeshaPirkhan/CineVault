import { useEffect, useState } from "react";
import { Film, Heart, Bookmark, Clock3, Pencil, X, Save, LogOut } from "lucide-react";
import { getStore } from "../services/storage";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const defaultProfile = {
  name: "Ayesha",
  username: "ayesha",
  bio: "Movie explorer • CineVault member",
};

const PROFILE_KEY = "cinevault-profile";

function getLocalProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [store, setStore] = useState(getStore());
  const [profile, setProfile] = useState(user || getLocalProfile());
  const [form, setForm] = useState(user || getLocalProfile());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setProfile(user);
      setForm(user);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    const sync = () => setStore(getStore());
    window.addEventListener("cinevault-storage", sync);
    return () => window.removeEventListener("cinevault-storage", sync);
  }, []);

  const openEdit = () => {
    setForm(profile);
    setError("");
    setEditing(true);
  };

  const closeEdit = () => {
    setForm(profile);
    setError("");
    setEditing(false);
  };

  const handleChange = (e) =>
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    const updated = {
      name: form.name.trim() || "Ayesha",
      username: form.username.trim() || "ayesha",
      bio: form.bio.trim() || "Movie explorer • CineVault member",
    };

    setSaving(true);
    setError("");

    try {
      const result = await api.updateProfile(updated);
      setProfile(result);
      setForm(result);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(result));
      setEditing(false);
      window.dispatchEvent(new Event("cinevault-profile"));
      window.dispatchEvent(new Event("cinevault-auth"));
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-card">
        <div className="profile-avatar">{profile.name?.charAt(0).toUpperCase() || "A"}</div>
        <div className="profile-main-info">
          <span className="eyebrow">PROFILE</span>
          <h1>{profile.name}</h1>
          <p>{profile.bio}</p>
          <small>@{profile.username}</small>
          {profile.email && <small>{profile.email}</small>}
        </div>
        <div className="profile-card-actions">
          <button type="button" className="outline-btn" onClick={openEdit}>
            <Pencil size={15} /> Edit profile
          </button>
          <button type="button" className="outline-btn" onClick={logout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </section>

      <div className="stat-grid">
        <div><Bookmark /><strong>{store.watchlist.length}</strong><span>Watchlist</span></div>
        <div><Heart /><strong>{store.favorites.length}</strong><span>Favorites</span></div>
        <div><Clock3 /><strong>{store.history.length}</strong><span>Watched</span></div>
        <div><Film /><strong>{store.history.length}</strong><span>Discoveries</span></div>
      </div>

      <section className="info-card">
        <div className="section-heading">
          <div><span className="eyebrow">ACTIVITY</span><h2>Your CineVault activity</h2></div>
        </div>
        <div className="activity-list">
          {store.history.length > 0 && <div className="activity-item"><Clock3 size={18}/><div><strong>Movies watched</strong><p>You have opened {store.history.length} movie{store.history.length !== 1 ? "s" : ""}.</p></div><span>{store.history.length}</span></div>}
          {store.favorites.length > 0 && <div className="activity-item"><Heart size={18}/><div><strong>Favorite movies</strong><p>You have saved {store.favorites.length} movie{store.favorites.length !== 1 ? "s" : ""} as favorites.</p></div><span>{store.favorites.length}</span></div>}
          {store.watchlist.length > 0 && <div className="activity-item"><Bookmark size={18}/><div><strong>Watchlist</strong><p>You currently have {store.watchlist.length} movie{store.watchlist.length !== 1 ? "s" : ""} in your watchlist.</p></div><span>{store.watchlist.length}</span></div>}
          {store.history.length === 0 && store.favorites.length === 0 && store.watchlist.length === 0 && <div className="empty-activity"><Film size={24}/><p>Your CineVault activity will appear here as you explore movies.</p></div>}
        </div>
      </section>

      <div className="info-card">
        <span className="eyebrow">ABOUT</span>
        <h2>About CineVault</h2>
        <p>Your profile and movie activity are now stored in the CineVault backend. Favorites, watchlist and history are linked to your account, so they can persist beyond this browser.</p>
      </div>

      {editing && (
        <div className="profile-modal-overlay" onMouseDown={closeEdit}>
          <div className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><span className="eyebrow">PROFILE</span><h2>Edit profile</h2></div>
              <button type="button" className="modal-close" onClick={closeEdit}><X size={18}/></button>
            </div>
            <form onSubmit={saveProfile}>
              <label>Name<input name="name" value={form.name || ""} onChange={handleChange} /></label>
              <label>Username<input name="username" value={form.username || ""} onChange={handleChange} /></label>
              <label>Bio<textarea name="bio" value={form.bio || ""} onChange={handleChange} rows="3" /></label>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEdit}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : <><Save size={15}/> Save changes</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
