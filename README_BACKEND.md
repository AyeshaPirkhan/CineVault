# CineVault — Full Stack

CineVault now has a FastAPI + SQLite backend for user accounts, profiles, favorites, watchlist and viewing history.

## 1. Start the backend

Open a terminal in `CineVault/backend`:

```bash
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Start API:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at:
`http://localhost:8000`

Health check:
`http://localhost:8000/api/health`

## 2. Start the React frontend

Open another terminal in the project root:

```bash
npm install
npm run dev
```

The frontend normally runs at:
`http://localhost:5173`

The frontend already has `VITE_API_URL=http://localhost:8000` in `.env`.

## 3. How the data is saved

- User account → SQLite `backend/cinevault.db`
- Profile → `users` table
- Favorites → `favorites` table
- Watchlist → `watchlist` table
- Viewing history → `history` table
- Passwords → stored as PBKDF2-SHA256 hashes, never plain text
- Login session → JWT stored in the browser
- Existing localStorage movie data → automatically imported into the account after login/register

## 4. Important

Do not commit your real TMDB token or production `SECRET_KEY` to GitHub.

For deployment, set a strong `SECRET_KEY` environment variable on the backend and use a production database such as PostgreSQL.
