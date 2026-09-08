import {
  ArrowLeft,
  Bookmark,
  Clock3,
  Heart,
  Play,
  Star,
  X,
  ExternalLink,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  addHistory,
  isSaved,
  toggleItem,
} from "../services/storage";

import {
  backdropUrl,
  getMovie,
  imageUrl,
} from "../services/tmdb";

import Loader from "../components/Loader";
import ErrorBox from "../components/ErrorBox";
import MovieCard from "../components/MovieCard";


export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saved, setSaved] = useState(false);
  const [fav, setFav] = useState(false);

  const [trailerOpen, setTrailerOpen] = useState(false);


  // =========================================================
  // LOAD MOVIE
  // =========================================================

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");
    setTrailerOpen(false);

    getMovie(id)
      .then((m) => {
        if (!alive) return;

        setMovie(m);

        setSaved(
          isSaved("watchlist", m.id)
        );

        setFav(
          isSaved("favorites", m.id)
        );

        // Add movie to viewing history.
        addHistory(m);
      })
      .catch((e) => {
        if (alive) {
          setError(
            e.message || "Unable to load movie."
          );
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [id]);


  // =========================================================
  // CLOSE TRAILER WITH ESCAPE
  // =========================================================

  useEffect(() => {
    const closeTrailer = (e) => {
      if (e.key === "Escape") {
        setTrailerOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      closeTrailer
    );

    return () => {
      window.removeEventListener(
        "keydown",
        closeTrailer
      );
    };
  }, []);


  // =========================================================
  // LOADING / ERROR
  // =========================================================

  if (loading) {
    return (
      <Loader text="Opening movie..." />
    );
  }

  if (error) {
    return (
      <ErrorBox message={error} />
    );
  }

  if (!movie) {
    return null;
  }


  // =========================================================
  // TRAILER
  // =========================================================

  const videos =
    movie.videos?.results || [];

  const trailer =
    videos.find(
      (v) =>
        v.site === "YouTube" &&
        v.type === "Trailer" &&
        v.official
    ) ||
    videos.find(
      (v) =>
        v.site === "YouTube" &&
        v.type === "Trailer"
    ) ||
    videos.find(
      (v) =>
        v.site === "YouTube" &&
        ["Teaser", "Clip"].includes(v.type)
    );


  // =========================================================
  // RECOMMENDATIONS
  // =========================================================

  const recommendations =
    movie.recommendations?.results
      ?.slice(0, 10) || [];


  // =========================================================
  // WATCHLIST / FAVORITE
  // =========================================================

  const watch = () => {
    const result = toggleItem(
      "watchlist",
      movie
    );

    setSaved(result);
  };


  const favorite = () => {
    const result = toggleItem(
      "favorites",
      movie
    );

    setFav(result);
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* =====================================================
          BACK BUTTON
      ===================================================== */}

      <button
        type="button"
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} />
        Back
      </button>


      {/* =====================================================
          MOVIE HERO
      ===================================================== */}

      <section
        className="detail-hero"
        style={{
          backgroundImage: `url(${backdropUrl(
            movie.backdrop_path,
            "original"
          )})`,
        }}
      >

        <img
          className="detail-poster"
          src={imageUrl(
            movie.poster_path,
            "w500"
          )}
          alt={movie.title}
        />


        <div className="detail-copy">

          <span className="eyebrow">
            MOVIE DETAILS
          </span>


          <h1>
            {movie.title}
          </h1>


          {movie.tagline && (
            <blockquote>
              {movie.tagline}
            </blockquote>
          )}


          <div className="hero-meta">

            <span>
              {movie.release_date?.slice(0, 4) ||
                "—"}
            </span>

            <i>•</i>

            <span>
              {movie.runtime
                ? `${Math.floor(
                    movie.runtime / 60
                  )}h ${
                    movie.runtime % 60
                  }m`
                : "Runtime —"}
            </span>

            <i>•</i>

            <strong>
              <Star
                size={13}
                fill="currentColor"
              />

              {movie.vote_average?.toFixed(
                1
              ) || "—"}
            </strong>

          </div>


          <p>
            {movie.overview ||
              "No overview available."}
          </p>


          <div className="genre-pills">
            {movie.genres?.map((genre) => (
              <span key={genre.id}>
                {genre.name}
              </span>
            ))}
          </div>


          {/* =================================================
              HERO BUTTONS
          ================================================= */}

          <div className="hero-buttons">

            {trailer ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setTrailerOpen(true)
                }
              >
                <Play
                  size={16}
                  fill="currentColor"
                />

                Watch Trailer
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary disabled-btn"
                disabled
              >
                <Play size={16} />
                Trailer unavailable
              </button>
            )}


            <button
              type="button"
              className="btn-secondary"
              onClick={watch}
            >
              <Bookmark
                size={16}
                fill={
                  saved
                    ? "currentColor"
                    : "none"
                }
              />

              {saved
                ? "Saved"
                : "Watchlist"}
            </button>


            <button
              type="button"
              aria-label="Favorite"
              className={`circle-btn ${
                fav ? "active" : ""
              }`}
              onClick={favorite}
            >
              <Heart
                size={17}
                fill={
                  fav
                    ? "currentColor"
                    : "none"
                }
              />
            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          MOVIE STATS
      ===================================================== */}

      <div className="detail-stats">

        <div>
          <Clock3 />

          <span>
            Popularity
          </span>

          <strong>
            {Math.round(
              movie.popularity || 0
            )}
          </strong>
        </div>


        <div>
          <Star />

          <span>
            Votes
          </span>

          <strong>
            {movie.vote_count
              ?.toLocaleString() || "—"}
          </strong>
        </div>


        <div>
          <Play />

          <span>
            Status
          </span>

          <strong>
            {movie.status ||
              "Released"}
          </strong>
        </div>

      </div>


      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      {recommendations.length > 0 && (
        <section className="section-block">

          <div className="section-heading">

            <h2>
              You May Also Like
            </h2>

          </div>


          <div className="movie-grid">

            {recommendations.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
              />
            ))}

          </div>

        </section>
      )}


      {/* =====================================================
          TRAILER MODAL
      ===================================================== */}
{trailerOpen && trailer && (
  <div
    className="trailer-modal"
    role="dialog"
    aria-modal="true"
    aria-label={`${movie.title} trailer`}
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setTrailerOpen(false);
      }
    }}
  >
    <div className="trailer-dialog">

      <div className="trailer-header">

        {/* Movie title + exit instruction */}
        <div className="trailer-title">
          <div className="trailer-title-info">
            <span>{movie.title}</span>

            <div className="trailer-exit-hint">
              Tap outside the video box to exit the video
            </div>
          </div>

          {/* YouTube link */}
          <a
            href={`https://www.youtube.com/watch?v=${trailer.key}`}
            target="_blank"
            rel="noreferrer"
          >
            Open on YouTube
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Close button */}
        <button
          type="button"
          className="trailer-close"
          aria-label="Close trailer"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTrailerOpen(false);
          }}
        >
          <X size={20} strokeWidth={2.2} />
        </button>

      </div>

      {/* Video */}
      <div className="trailer-video">
        <iframe
          key={trailer.key}
          src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&playsinline=1`}
          title={`${movie.title} trailer`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>

    </div>
  </div>
)}

    </>
  );
}