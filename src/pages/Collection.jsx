import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import MovieCard from "../components/MovieCard";
import { clearHistory, getStore } from "../services/storage";

export default function Collection({ type, title, eyebrow, description }) {
  const [movies, setMovies] = useState([]);

  // Load the correct collection whenever the page/type changes
  useEffect(() => {
    const loadCollection = () => {
      const store = getStore();
      setMovies(Array.isArray(store[type]) ? store[type] : []);
    };

    // Load immediately
    loadCollection();

    // Keep it synchronized with favourite/watchlist changes
    window.addEventListener("cinevault-storage", loadCollection);

    return () => {
      window.removeEventListener("cinevault-storage", loadCollection);
    };
  }, [type]);

  const isHistory = type === "history";

  return (
    <>
      <div className="page-title-row collection-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        <div className="collection-actions">
          <span className="count-pill">
            {movies.length} {movies.length === 1 ? "movie" : "movies"}
          </span>

          {isHistory && movies.length > 0 && (
            <button
              type="button"
              className="outline-btn danger-btn"
              onClick={clearHistory}
            >
              <Trash2 size={14} />
              Clear history
            </button>
          )}
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="movie-grid large">
          {movies.map((movie) => (
            <MovieCard
              key={`${type}-${movie.id}`}
              movie={movie}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            {isHistory ? "◷" : "＋"}
          </div>

          <h2>
            {isHistory
              ? "No watch history yet"
              : "Your collection is empty"}
          </h2>

          <p>
            {isHistory
              ? "Open a movie to start building your watch history."
              : "Open a movie and use the bookmark or heart button to save it here."}
          </p>
        </div>
      )}
    </>
  );
}