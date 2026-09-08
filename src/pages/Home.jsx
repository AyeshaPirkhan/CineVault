import {
  ArrowRight,
  
  ChevronRight,
  Heart,
  Play,
  Plus,
  Sparkles,
  Star
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addHistory,
  isSaved,
  toggleItem
} from "../services/storage";

import {
  backdropUrl,
  getNowPlaying,
  getPopular,
  getTrending
} from "../services/tmdb";

import Section from "../components/Section";
import Loader from "../components/Loader";
import ErrorBox from "../components/ErrorBox";


export default function Home() {

  const [data, setData] = useState({
    trending: [],
    popular: [],
    now: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Current featured movie
  const [activeMovie, setActiveMovie] = useState(0);
  const [heroOverride, setHeroOverride] = useState(null);
  const featuredRef = useRef(null);

  const navigate = useNavigate();


  /* =========================================
     LOAD MOVIES
  ========================================= */

  useEffect(() => {

    Promise.all([
      getTrending(1),
      getPopular(1),
      getPopular(2),
      getNowPlaying(1),
      getNowPlaying(2)
    ])

      .then(
        ([
          trending,
          popular1,
          popular2,
          now1,
          now2
        ]) => {

          setData({
            trending,
            popular: [
              ...popular1,
              ...popular2
            ],
            now: [
              ...now1,
              ...now2
            ]
          });

        }
      )

      .catch((e) => {
        setError(e.message);
      })

      .finally(() => {
        setLoading(false);
      });

  }, []);


  /* =========================================
     PLAYLIST
  ========================================= */

  const playList = data.trending.slice(0, 4);

  const hero =
    heroOverride ||
    data.trending[activeMovie] ||
    data.trending[0];


  /* =========================================
     CHECK FAVORITE STATUS
  ========================================= */

  useEffect(() => {

    if (hero) {

      setIsFavorite(isSaved("favorites", hero.id));
      setIsWatchlisted(isSaved("watchlist", hero.id));

    }

  }, [hero]);


  /* =========================================
     AUTOMATIC HERO SLIDER
  ========================================= */

  useEffect(() => {

    if (playList.length <= 1 || heroOverride) return;

    const interval = setInterval(() => {

      setActiveMovie((current) =>
        (current + 1) % playList.length
      );

    }, 5000);

    return () => clearInterval(interval);

  }, [playList.length]);


  /* =========================================
     LOADING / ERROR
  ========================================= */

  if (loading) {
    return <Loader text="Loading your cinema..." />;
  }

  if (error) {
    return <ErrorBox message={error} />;
  }


  /* =========================================
     FAVORITE HANDLER
  ========================================= */

  const handleFavorite = () => {

    if (!hero) return;

    toggleItem("favorites", hero);

    setIsFavorite((previous) => !previous);

  };


  /* =========================================
     WATCHLIST HANDLER
  ========================================= */

  const handleWatchlist = () => {
    if (!hero) return;
    setIsWatchlisted(toggleItem("watchlist", hero));
  };

  const selectFeaturedMovie = (movie) => {
    if (!movie) return;
    const trendingIndex = data.trending.findIndex((item) => String(item.id) === String(movie.id));
    if (trendingIndex >= 0) {
      setHeroOverride(null);
      setActiveMovie(trendingIndex);
    } else {
      setHeroOverride(movie);
    }
    requestAnimationFrame(() => {
      featuredRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };


  return (

    <div className="dashboard-home">

      {/* =====================================
          CINEMATIC PARTICLES
      ===================================== */}

      <div className="cinematic-particles">

        {Array.from({ length: 35 }).map((_, i) => (

          <span
            key={i}
            className="particle"
          />

        ))}

      </div>


      {/* =====================================
          WELCOME
      ===================================== */}

      <div className="welcome-row">

        <div>

          <span className="eyebrow">
            WELCOME BACK
          </span>

          <h1>
            Discover your next{" "}
            <span>favorite story.</span>
          </h1>

        </div>


   

      </div>


      {/* =====================================
          MAIN CINEMA DASHBOARD
      ===================================== */}

      <section className="cinema-dashboard">


        {/* ===================================
            PLAYLIST
        =================================== */}

        <div className="playlist-panel">

          <div className="mini-heading">

            <span>
              Play list
            </span>

            <small>
              Trending
            </small>

          </div>


          <div className="playlist-list">

            {playList.map((movie, index) => (

              <button
                key={movie.id}
                type="button"
                className={`playlist-item ${
                  index === activeMovie
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setHeroOverride(null);
                  setActiveMovie(index);
                }}
              >

                <span className="playlist-index">
                  0{index + 1}
                </span>

                <span className="playlist-title">
                  {movie.title}
                </span>

                <span className="playlist-time">
                  {movie.release_date?.slice(0, 4) ||
                    "Now"}
                </span>

              </button>

            ))}

          </div>


          <div className="playlist-footer">

            <span>
              <Sparkles size={13} />
              Curated for you
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/explore")
              }
            >
              See all
              <ChevronRight size={13} />
            </button>

          </div>

        </div>


        {/* ===================================
            FEATURED MOVIE
        =================================== */}

        {hero && (

          <article
            ref={featuredRef}
            className="featured-cinema"
            style={{
              backgroundImage: `
                linear-gradient(
                  90deg,
                  rgba(18,18,27,.92),
                  rgba(18,18,27,.42) 48%,
                  rgba(18,18,27,.06)
                ),
                url(${backdropUrl(
                  hero.backdrop_path
                )})
              `
            }}
          >

            <div className="featured-copy">

              <span className="featured-kicker">
                FEATURED TONIGHT
              </span>


              <h2>
                {hero.title}
              </h2>


              <div className="hero-meta">

                <span>
                  {hero.release_date?.slice(0, 4)}
                </span>

                <i>•</i>

                <span>
                  Movie
                </span>

                <i>•</i>

                <strong>

                  <Star
                    size={12}
                    fill="currentColor"
                  />

                  {hero.vote_average?.toFixed(1)}

                </strong>

              </div>


              <p>
                {hero.overview ||
                  "A new story is waiting for you."}
              </p>


              {/* =================================
                  HERO BUTTONS
              ================================= */}

              <div className="hero-buttons">


                {/* WATCH DETAILS */}

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {

                    addHistory(hero);

                    navigate(
                      `/movie/${hero.id}`
                    );

                  }}
                >

                  <Play
                    size={15}
                    fill="currentColor"
                  />

                  Watch details

                </button>


                {/* WATCHLIST */}

                <button
                  type="button"
                  className="btn-glass"
                  onClick={handleWatchlist}
                >

                  <Plus size={16} />

                  {isWatchlisted ? "Saved" : "Add to list"}

                </button>


                {/* FAVORITE / LIKE */}

                <button
                  type="button"
                  className={`circle-btn ${isFavorite ? "active" : ""}`}
                  onClick={handleFavorite}
                  aria-label={
                    isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  title={
                    isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >

                  <Heart
                    size={17}
                    fill={isFavorite ? "currentColor" : "none"}
                  />

                </button>


              </div>

            </div>


            {/* =================================
                SLIDER DOTS
            ================================= */}

            <div className="featured-dots">

              {playList.map(
                (movie, index) => (

                  <button
                    type="button"
                    key={movie.id}
                    aria-label={`Show ${movie.title}`}
                    className={
                      index === activeMovie
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setHeroOverride(null);
                      setActiveMovie(index);
                    }}
                  />

                )
              )}

            </div>

          </article>

        )}


        {/* ===================================
            PROMO
        =================================== */}

        <aside className="cinema-promo">

          <div className="promo-orbit orbit-one" />

          <div className="promo-orbit orbit-two" />


          <div className="promo-content">

            <span className="promo-icon">
              <Sparkles size={17} />
            </span>


            <span className="eyebrow">
              CINEVAULT CLUB
            </span>


            <h3>
              Build Your
              <br />
              <strong>
                Own Cinema
              </strong>
            </h3>


            <p>
              Save the movies you love and
              create a personal cinema that
              feels like yours.
            </p>


            <button
              type="button"
              onClick={() =>
                navigate("/watchlist")
              }
            >

              Open my cinema

              <ArrowRight size={15} />

            </button>

          </div>


          <div className="promo-lights">

            <i />
            <i />
            <i />
            <i />

          </div>

        </aside>

      </section>


      {/* =====================================
          MOVIE SECTIONS
      ===================================== */}

      <Section
        title="New Movies"
        movies={data.now.slice(0, 10)}
        link="/explore"
      />


      <Section
        title="Suggested for You"
        movies={data.popular.slice(0, 10)}
        link="/explore"
      />


      <Section
        title="Trending Now"
        movies={data.trending.slice(0, 10)}
        link="/explore"
      />


      {/* =====================================
          TMDB CREDIT
      ===================================== */}
<div className="tmdb-credit">
  <span>Designed & Developed by Ayesha Pirkhan</span>

  <span>
    Movie data & images powered by TMDB.
  </span>

  <small>
    This product uses the TMDB API but is not endorsed or certified by TMDB.
  </small>
</div>

    </div>

  );

}