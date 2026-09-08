import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchMoviesOrGenre, getMovieGenres } from "../services/tmdb";
import MovieCard from "../components/MovieCard";
import Loader from "../components/Loader";
import ErrorBox from "../components/ErrorBox";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isGenre, setIsGenre] = useState(false);

  useEffect(() => { getMovieGenres().then(setGenres).catch(() => {}); }, []);
  useEffect(() => {
    let alive = true;
    if (!q) { setMovies([]); setLoading(false); return; }
    setPage(1); setLoading(true); setError("");
    searchMoviesOrGenre(q, 1, genres).then(data => { if (alive) { setMovies(data); setIsGenre(!!genres.find(g => g.name.toLowerCase() === q.toLowerCase())); } }).catch(e => alive && setError(e.message)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, genres]);

  const more = async () => {
    setLoadingMore(true);
    try { const next = page + 1; const data = await searchMoviesOrGenre(q, next, genres); setMovies(prev => [...prev, ...data.filter(m => !prev.some(x => x.id === m.id))]); setPage(next); }
    catch (e) { setError(e.message); } finally { setLoadingMore(false); }
  };

  return <>
    <div className="page-title-row"><div><span className="eyebrow">SEARCH</span><h1>{isGenre ? `${q} Movies` : `Results for “${q}”`}</h1><p>{isGenre ? `Discover popular movies in the ${q} genre.` : "Search across TMDB's movie catalogue."}</p></div></div>
    {loading ? <Loader text="Searching the cinema..."/> : error && !movies.length ? <ErrorBox message={error}/> : movies.length ? <><div className="movie-grid large">{movies.map(m => <MovieCard key={m.id} movie={m}/>)}</div><div className="load-more-wrap"><button className="load-more-btn" onClick={more} disabled={loadingMore}>{loadingMore ? "Loading..." : "Load more results"}</button></div>{error && <ErrorBox message={error}/>}</> : <div className="empty-state"><h2>No movies found</h2><p>Try a movie title or a genre such as Action, Comedy, Horror, Romance or Sci-Fi.</p></div>}
  </>;
}
