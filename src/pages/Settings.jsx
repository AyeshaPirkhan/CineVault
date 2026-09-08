import { Moon, Database, ShieldCheck, Server, CheckCircle2 } from "lucide-react";

export default function Settings() {
  return <>
    <div className="page-title-row"><div><span className="eyebrow">PREFERENCES</span><h1>Settings</h1><p>Manage your CineVault experience.</p></div></div>
    <div className="settings-list">
      <div className="setting-card"><div><Moon/><div><h3>Dark cinematic theme</h3><p>The CineVault interface uses the purple/plum cinematic theme.</p></div></div><span className="toggle on"></span></div>
      <div className="setting-card"><div><Database/><div><h3>Account data</h3><p>Your favorites, watchlist and viewing history are stored in the CineVault database and linked to your account.</p></div></div><span className="status"><CheckCircle2 size={14}/> Synced</span></div>
      <div className="setting-card"><div><Server/><div><h3>Backend connection</h3><p>CineVault uses a FastAPI backend with SQLite for account and activity data.</p></div></div><span className="status">Connected</span></div>
      <div className="setting-card"><div><ShieldCheck/><div><h3>Privacy</h3><p>Your password is stored as a one-way hash. Your movie collections are associated with your CineVault account.</p></div></div><span className="status">Protected</span></div>
    </div>
  </>;
}
