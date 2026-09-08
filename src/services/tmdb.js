const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export const imageUrl = (path, size = "w500") =>
  path ? `${IMG}/${size}${path}` : "https://placehold.co/500x750/222331/F5F3F7?text=No+Poster";
export const posterUrl = imageUrl;
export const backdropUrl = (path, size = "w1280") => path ? `${IMG}/${size}${path}` : "";

async function request(endpoint, params = {}) {
  if (!TOKEN || TOKEN === "your_tmdb_read_access_token_here") {
    throw new Error("TMDB token missing. Add VITE_TMDB_TOKEN to your .env file.");
  }
  const url = new URL(`${BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" } });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.status_message || ""; } catch {}
    throw new Error(`TMDB request failed (${res.status})${detail ? `: ${detail}` : "."}`);
  }
  return res.json();
}

const list = (endpoint) => async (page = 1, extra = {}) => {
  const data = await request(endpoint, { language: "en-US", page, ...extra });
  return data.results || [];
};

export const getTrending = async (page = 1) => {
  const data = await request("/trending/movie/week", { language: "en-US", page });
  return data.results || [];
};
export const getTrendingMovies = getTrending;
export const getPopular = list("/movie/popular");
export const getPopularMovies = getPopular;
export const getNowPlaying = list("/movie/now_playing");
export const getNowPlayingMovies = getNowPlaying;
export const getTopRated = list("/movie/top_rated");
export const getTopRatedMovies = getTopRated;
export const getUpcoming = list("/movie/upcoming");
export const getUpcomingMovies = getUpcoming;

export async function searchMovies(query, page = 1) {
  if (!query?.trim()) return [];
  const data = await request("/search/movie", { query: query.trim(), page, include_adult: false, language: "en-US" });
  return data.results || [];
}

export async function getMovie(id) {
  return request(`/movie/${id}`, { language: "en-US", append_to_response: "videos,credits,recommendations" });
}
export const getMovieDetails = getMovie;
export const getMovieCredits = (id) => request(`/movie/${id}/credits`, { language: "en-US" });

export async function getMovieGenres() {
  const data = await request("/genre/movie/list", { language: "en-US" });
  return data.genres || [];
}

export async function discoverMovies(params = {}) {
  const data = await request("/discover/movie", {
    language: "en-US",
    include_adult: false,
    include_video: false,
    sort_by: "popularity.desc",
    ...params,
  });
  return data.results || [];
}

// Search by either a movie title/keyword OR a TMDB genre name.
export async function searchMoviesOrGenre(query, page = 1, genres = []) {
  const clean = query?.trim();
  if (!clean) return [];
  const exact = genres.find((g) => g.name.toLowerCase() === clean.toLowerCase());
  const partial = genres.find((g) => g.name.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(g.name.toLowerCase()));
  const genre = exact || partial;
  if (genre) return discoverMovies({ page, with_genres: genre.id, sort_by: "popularity.desc" });
  return searchMovies(clean, page);
}
