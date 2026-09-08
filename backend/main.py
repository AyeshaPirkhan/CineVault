import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "cinevault.db")

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "cinevault-dev-secret-change-me"
)

ALGORITHM = "HS256"


configured_origins = os.getenv("FRONTEND_ORIGINS", "").strip()

if configured_origins:
    FRONTEND_ORIGINS = [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
else:
    FRONTEND_ORIGINS = [
    "http://localhost:4173",
    "http://127.0.0.1:4173",

    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "http://localhost:5175",
    "http://127.0.0.1:5175",
]


app = FastAPI(
    title="CineVault API",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

def db():
    conn = sqlite3.connect(
        DB_PATH,
        timeout=10
    )

    conn.row_factory = sqlite3.Row

    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")

    return conn


def init_db():
    conn = db()

    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            bio TEXT NOT NULL DEFAULT 'Movie explorer • CineVault member',
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER NOT NULL,
            movie_id INTEGER NOT NULL,
            movie_json TEXT NOT NULL,
            created_at TEXT NOT NULL,

            PRIMARY KEY (user_id, movie_id),

            FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS watchlist (
            user_id INTEGER NOT NULL,
            movie_id INTEGER NOT NULL,
            movie_json TEXT NOT NULL,
            created_at TEXT NOT NULL,

            PRIMARY KEY (user_id, movie_id),

            FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS history (
            user_id INTEGER NOT NULL,
            movie_id INTEGER NOT NULL,
            movie_json TEXT NOT NULL,
            viewed_at TEXT NOT NULL,

            PRIMARY KEY (user_id, movie_id),

            FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_favorites_user
            ON favorites(user_id);

        CREATE INDEX IF NOT EXISTS idx_watchlist_user
            ON watchlist(user_id);

        CREATE INDEX IF NOT EXISTS idx_history_user
            ON history(user_id);
        """
    )

    conn.commit()
    conn.close()


init_db()


# =========================================================
# MODELS
# =========================================================

class RegisterIn(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=80
    )

    username: str = Field(
        min_length=3,
        max_length=40,
        pattern=r"^[A-Za-z0-9_.-]+$"
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=128
    )


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileIn(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=80
    )

    username: str = Field(
        min_length=3,
        max_length=40,
        pattern=r"^[A-Za-z0-9_.-]+$"
    )

    bio: str = Field(
        max_length=180
    )


class MovieIn(BaseModel):
    movie: dict


class ImportIn(BaseModel):
    favorites: list[dict] = []
    watchlist: list[dict] = []
    history: list[dict] = []


# =========================================================
# PASSWORD SECURITY
# =========================================================

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        210_000
    )

    return (
        f"pbkdf2_sha256$210000$"
        f"{salt.hex()}${digest.hex()}"
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, rounds, salt_hex, digest_hex = stored.split("$")

        if scheme != "pbkdf2_sha256":
            return False

        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            bytes.fromhex(salt_hex),
            int(rounds)
        )

        return hmac.compare_digest(
            digest.hex(),
            digest_hex
        )

    except Exception:
        return False


# =========================================================
# JWT AUTHENTICATION
# =========================================================

def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": (
            datetime.now(timezone.utc)
            + timedelta(days=7)
        ),
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def user_from_token(
    authorization: Optional[str] = Header(default=None)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    token = authorization.split(
        " ",
        1
    )[1].strip()

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload["sub"])

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    conn = db()

    user = conn.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    conn.close()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# =========================================================
# USER HELPERS
# =========================================================

def public_user(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "username": row["username"],
        "email": row["email"],
        "bio": row["bio"],
        "created_at": row["created_at"],
    }


# =========================================================
# COLLECTION HELPERS
# =========================================================

VALID_COLLECTIONS = {
    "favorites",
    "watchlist",
    "history",
}


def validate_collection(kind: str):
    if kind not in VALID_COLLECTIONS:
        raise HTTPException(
            status_code=404,
            detail="Unknown collection"
        )


def collection(
    user_id: int,
    table: str
):
    validate_collection(table)

    conn = db()

    if table == "history":
        rows = conn.execute(
            """
            SELECT movie_json, viewed_at
            FROM history
            WHERE user_id = ?
            ORDER BY viewed_at DESC
            """,
            (user_id,)
        ).fetchall()

    else:
        rows = conn.execute(
            f"""
            SELECT movie_json, created_at
            FROM {table}
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()

    conn.close()

    result = []

    for row in rows:
        try:
            item = json.loads(
                row["movie_json"]
            )
        except (
            TypeError,
            json.JSONDecodeError
        ):
            continue

        if table == "history":
            item["viewedAt"] = row["viewed_at"]

        result.append(item)

    return result


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "CineVault API"
    }


# =========================================================
# REGISTER
# =========================================================

@app.post("/api/auth/register")
def register(data: RegisterIn):
    conn = db()

    try:
        email = data.email.lower().strip()
        username = data.username.strip()
        name = data.name.strip()

        existing = conn.execute(
            """
            SELECT id, email, username
            FROM users
            WHERE lower(email) = ?
               OR lower(username) = lower(?)
            """,
            (
                email,
                username
            )
        ).fetchone()

        if existing:

            if existing["email"].lower() == email:
                raise HTTPException(
                    status_code=409,
                    detail="An account with this email already exists"
                )

            raise HTTPException(
                status_code=409,
                detail="This username is already taken"
            )

        now = datetime.now(
            timezone.utc
        ).isoformat()

        cursor = conn.execute(
            """
            INSERT INTO users
            (
                name,
                username,
                email,
                bio,
                password_hash,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                username,
                email,
                "Movie explorer • CineVault member",
                hash_password(data.password),
                now
            )
        )

        conn.commit()

        user_id = cursor.lastrowid

        user = conn.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        ).fetchone()

        return {
            "token": create_token(user_id),
            "user": public_user(user)
        }

    except sqlite3.IntegrityError:

        conn.rollback()

        raise HTTPException(
            status_code=409,
            detail="Email or username already exists"
        )

    finally:
        conn.close()


# =========================================================
# LOGIN
# =========================================================

@app.post("/api/auth/login")
def login(data: LoginIn):

    conn = db()

    user = conn.execute(
        """
        SELECT *
        FROM users
        WHERE lower(email) = ?
        """,
        (
            data.email.lower().strip(),
        )
    ).fetchone()

    conn.close()

    if (
        not user
        or not verify_password(
            data.password,
            user["password_hash"]
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "token": create_token(user["id"]),
        "user": public_user(user)
    }


# =========================================================
# PROFILE
# =========================================================

@app.get("/api/profile")
def get_profile(
    user=Depends(user_from_token)
):
    return public_user(user)


@app.put("/api/profile")
def update_profile(
    data: ProfileIn,
    user=Depends(user_from_token)
):
    conn = db()

    try:
        username = data.username.strip()
        name = data.name.strip()
        bio = data.bio.strip()

        duplicate = conn.execute(
            """
            SELECT id
            FROM users
            WHERE lower(username) = lower(?)
              AND id != ?
            """,
            (
                username,
                user["id"]
            )
        ).fetchone()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Username already exists"
            )

        conn.execute(
            """
            UPDATE users
            SET
                name = ?,
                username = ?,
                bio = ?
            WHERE id = ?
            """,
            (
                name,
                username,
                bio,
                user["id"]
            )
        )

        conn.commit()

        row = conn.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (user["id"],)
        ).fetchone()

        return public_user(row)

    finally:
        conn.close()


# =========================================================
# GET COLLECTION
# =========================================================

@app.get("/api/collections/{kind}")
def get_collection(
    kind: str,
    user=Depends(user_from_token)
):
    validate_collection(kind)

    return collection(
        user["id"],
        kind
    )


# =========================================================
# ADD MOVIE
# =========================================================

@app.post("/api/collections/{kind}")
def add_movie(
    kind: str,
    data: MovieIn,
    user=Depends(user_from_token)
):
    validate_collection(kind)

    movie = data.movie

    if (
        not isinstance(movie, dict)
        or "id" not in movie
    ):
        raise HTTPException(
            status_code=400,
            detail="Movie must contain an id"
        )

    try:
        movie_id = int(movie["id"])
    except (
        TypeError,
        ValueError
    ):
        raise HTTPException(
            status_code=400,
            detail="Movie id must be a number"
        )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    conn = db()

    try:

        if kind == "history":

            conn.execute(
                """
                INSERT OR REPLACE INTO history
                (
                    user_id,
                    movie_id,
                    movie_json,
                    viewed_at
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    user["id"],
                    movie_id,
                    json.dumps(movie),
                    movie.get(
                        "viewedAt",
                        now
                    )
                )
            )

        else:

            conn.execute(
                f"""
                INSERT OR REPLACE INTO {kind}
                (
                    user_id,
                    movie_id,
                    movie_json,
                    created_at
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    user["id"],
                    movie_id,
                    json.dumps(movie),
                    now
                )
            )

        conn.commit()

    finally:
        conn.close()

    return {
        "saved": True
    }


# =========================================================
# CLEAR COLLECTION
# =========================================================

@app.delete("/api/collections/{kind}")
def clear_collection(
    kind: str,
    user=Depends(user_from_token)
):
    validate_collection(kind)

    conn = db()

    try:

        conn.execute(
            f"""
            DELETE FROM {kind}
            WHERE user_id = ?
            """,
            (user["id"],)
        )

        conn.commit()

    finally:
        conn.close()

    return {
        "cleared": True
    }


# =========================================================
# REMOVE ONE MOVIE
# =========================================================

@app.delete("/api/collections/{kind}/{movie_id}")
def remove_movie(
    kind: str,
    movie_id: int,
    user=Depends(user_from_token)
):
    validate_collection(kind)

    conn = db()

    try:

        conn.execute(
            f"""
            DELETE FROM {kind}
            WHERE user_id = ?
              AND movie_id = ?
            """,
            (
                user["id"],
                movie_id
            )
        )

        conn.commit()

    finally:
        conn.close()

    return {
        "saved": False
    }


# =========================================================
# IMPORT COLLECTIONS
# =========================================================

@app.post("/api/import-collections")
def import_collections(
    data: ImportIn,
    user=Depends(user_from_token)
):
    now = datetime.now(
        timezone.utc
    ).isoformat()

    conn = db()

    try:

        for kind in (
            "favorites",
            "watchlist",
            "history"
        ):

            movies = getattr(
                data,
                kind
            )

            for movie in movies:

                if (
                    not isinstance(movie, dict)
                    or "id" not in movie
                ):
                    continue

                try:
                    movie_id = int(
                        movie["id"]
                    )
                except (
                    TypeError,
                    ValueError
                ):
                    continue

                if kind == "history":

                    viewed_at = movie.get(
                        "viewedAt",
                        now
                    )

                    conn.execute(
                        """
                        INSERT OR REPLACE INTO history
                        (
                            user_id,
                            movie_id,
                            movie_json,
                            viewed_at
                        )
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            user["id"],
                            movie_id,
                            json.dumps(movie),
                            viewed_at
                        )
                    )

                else:

                    conn.execute(
                        f"""
                        INSERT OR IGNORE INTO {kind}
                        (
                            user_id,
                            movie_id,
                            movie_json,
                            created_at
                        )
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            user["id"],
                            movie_id,
                            json.dumps(movie),
                            now
                        )
                    )

        conn.commit()

    finally:
        conn.close()

    return {
        "imported": True
    }