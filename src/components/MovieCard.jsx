import { Bookmark, Heart, Play, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../services/tmdb";
import { isSaved, toggleItem } from "../services/storage";

export default function MovieCard({ movie, compact = false }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(() => isSaved("watchlist", movie.id));
  const [liked, setLiked] = useState(() => isSaved("favorites", movie.id));

  useEffect(() => {
    const sync = () => {
      setSaved(isSaved("watchlist", movie.id));
      setLiked(isSaved("favorites", movie.id));
    };
    window.addEventListener("cinevault-storage", sync);
    return () => window.removeEventListener("cinevault-storage", sync);
  }, [movie.id]);

  const year = movie.release_date?.slice(0, 4) || "—";
  const genre = movie.genre_names?.[0] || "Movie";
  const open = () => navigate(`/movie/${movie.id}`);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(toggleItem("favorites", movie));
  };

  const handleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleItem("watchlist", movie));
  };

  return (
    <article className={`movie-card ${compact ? "compact" : ""}`}>
      <div
        className="poster-wrap"
        onClick={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
      >
        <img src={imageUrl(movie.poster_path)} alt={movie.title} loading="lazy" />
        <div className="poster-shade" />

        <div className="card-topline">
          <span>{year}</span>
          <span className="rating">
            <Star size={10} fill="currentColor" /> {movie.vote_average?.toFixed(1) || "—"}
          </span>
        </div>

        <button
          type="button"
          className="quick-play"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            open();
          }}
          aria-label={`Open ${movie.title}`}
        >
          <Play size={14} fill="currentColor" />
        </button>

        <div className="poster-actions">
          <button
            type="button"
            title={saved ? "Remove from watchlist" : "Add to watchlist"}
            className={saved ? "active" : ""}
            onClick={handleWatchlist}
            aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
          </button>

          <button
            type="button"
            title={liked ? "Remove from favorites" : "Like this movie"}
            aria-label={liked ? "Remove from favorites" : "Like this movie"}
            className={`favorite-btn ${liked ? "active" : ""}`}
            onClick={handleFavorite}
          >
            <Heart size={17} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="movie-info">
        <h3 title={movie.title}>{movie.title}</h3>
        <p>{genre}<span>•</span>{movie.original_language?.toUpperCase() || "EN"}</p>
      </div>
    </article>
  );
}
