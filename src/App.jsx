import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import SearchResults from "./pages/SearchResults";
import MovieDetails from "./pages/MovieDetails";
import Collection from "./pages/Collection";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";

function ProtectedLayout() {
  const { auth, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="auth-loading">Loading CineVault...</div>;
  if (!auth?.token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Layout><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/explore" element={<Explore/>}/>
    <Route path="/search" element={<SearchResults/>}/>
    <Route path="/movie/:id" element={<MovieDetails/>}/>
    <Route path="/watchlist" element={<Collection type="watchlist" title="My Watchlist" eyebrow="YOUR COLLECTION" description="Movies you want to watch later."/>}/>
    <Route path="/favorites" element={<Collection type="favorites" title="Favorites" eyebrow="YOUR COLLECTION" description="Your favorite movies in one place."/>}/>
    <Route path="/history" element={<History/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/settings" element={<Settings/>}/>
  </Routes></Layout>;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/*" element={<ProtectedLayout/>}/>
  </Routes>;
}
