import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCard from "./MovieCard";

export default function Section({ title, movies = [], link, compact = false }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <h2>{title}</h2>
        {link && <Link to={link}>View all <ChevronRight size={15}/></Link>}
      </div>
      <div className="movie-grid">
        {movies.map((movie) => <MovieCard key={movie.id} movie={movie} compact={compact} />)}
      </div>
    </section>
  );
}
