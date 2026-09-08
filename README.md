# CineVault

A frontend-only React movie discovery website using the TMDB API.

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env` and add your TMDB API Read Access Token:

```env
VITE_TMDB_TOKEN=your_token_here
```

Then:

```bash
npm run dev
```

## Features

- TMDB-powered trending, popular, now-playing, top-rated and upcoming movies
- Search
- Movie details and YouTube trailer link when available
- Watchlist
- Favorites
- Local watch history
- Profile and settings pages
- Responsive cinematic dashboard
- Purple/plum glassmorphism theme
- No backend/database required

## Important

This project uses the TMDB API. Follow TMDB's current terms and attribution requirements.
Do not commit your real `.env` file or API token to GitHub.

For a production application where the token must not be exposed in browser code, use a server/serverless proxy.
