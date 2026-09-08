import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../services/tmdb";

export default function SeriesCard({ show }) {
  const navigate = useNavigate();
  return (
    <article className="series-card" onClick={() => show.id && navigate(`/search?q=${encodeURIComponent(show.name)}`)}>
      <div className="series-poster">
        <img src={imageUrl(show.poster_path, "w500")} alt={show.name} loading="lazy" />
      </div>
      <div className="series-copy">
        <div className="series-title-row">
          <h3>{show.name}</h3>
          <span>{show.meta || "Series"}</span>
        </div>
        <p>{show.overview || "A story worth adding to your cinema."}</p>
        <span className="series-arrow"><ArrowRight size={17}/></span>
      </div>
    </article>
  );
}
