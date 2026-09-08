import { useEffect, useMemo, useState } from "react";
import { Filter, ChevronDown, Loader2 } from "lucide-react";
import { discoverMovies, getMovieGenres, getPopular, getTopRated, getUpcoming } from "../services/tmdb";
import MovieCard from "../components/MovieCard";
import Loader from "../components/Loader";
import ErrorBox from "../components/ErrorBox";

const tabs = [["popular", "Popular"], ["top", "Top Rated"], ["upcoming", "Upcoming"]];

export default function Explore() {
  const [tab, setTab] = useState("popular");
  const [genre, setGenre] = useState("");
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getMovieGenres().then(setGenres).catch(() => {}); }, []);

  const genreName = useMemo(() => genres.find(g => String(g.id) === String(genre))?.name, [genres, genre]);

  useEffect(() => {
    let alive = true;
    setPage(1); setLoading(true); setError("");
    const load = async () => {
      try {
        const data = genre
          ? await discoverMovies({ page: 1, with_genres: genre, sort_by: "popularity.desc" })
          : await (tab === "popular" ? getPopular(1) : tab === "top" ? getTopRated(1) : getUpcoming(1));
        if (alive) setMovies(data);
      } catch (e) { if (alive) setError(e.message); }
      finally { if (alive) setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [tab, genre]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true); setError("");
    try {
      const next = page + 1;
      const data = genre
        ? await discoverMovies({ page: next, with_genres: genre, sort_by: "popularity.desc" })
        : await (tab === "popular" ? getPopular(next) : tab === "top" ? getTopRated(next) : getUpcoming(next));
      setMovies(prev => [...prev, ...data.filter(m => !prev.some(x => x.id === m.id))]);
      setPage(next);
    } catch (e) { setError(e.message); }
    finally { setLoadingMore(false); }
  };

  return <>
    <div className="page-title-row">
      <div><span className="eyebrow">DISCOVER</span><h1>Explore Movies</h1><p>{genreName ? `Showing popular ${genreName} movies.` : "Browse thousands of movies by popularity, rating, release and genre."}</p></div>
      <button type="button" className="outline-btn genre-filter-button"><Filter size={16}/> {genreName || "All Genres"}<ChevronDown size={14}/>
        <select value={genre} onChange={e => setGenre(e.target.value)} aria-label="Filter by genre"><option value="">All Genres</option>{genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
      </button>
    </div>

    <div className="tabs">{tabs.map(([id, label]) => <button type="button" key={id} className={!genre && tab === id ? "active" : ""} onClick={() => { setGenre(""); setTab(id); }}>{label}</button>)}</div>

    <div className="genre-chips"><button className={!genre ? "selected" : ""} onClick={() => setGenre("")}>All</button>{genres.map(g => <button key={g.id} className={String(genre) === String(g.id) ? "selected" : ""} onClick={() => setGenre(String(g.id))}>{g.name}</button>)}</div>

    {loading ? <Loader text="Loading movies..."/> : error && !movies.length ? <ErrorBox message={error}/> : <>
      <div className="movie-grid large">{movies.map(m => <MovieCard key={m.id} movie={m}/>)}</div>
      <div className="load-more-wrap"><button type="button" className="load-more-btn" onClick={loadMore} disabled={loadingMore}>{loadingMore ? <><Loader2 size={15} className="spin"/> Loading more...</> : <>Load more movies</>}</button></div>
      {error && <ErrorBox message={error}/>} 
    </>}
  </>;
}
