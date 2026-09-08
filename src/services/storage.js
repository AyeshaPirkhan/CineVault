import { api, getToken } from "./api";

const BASE_KEY = "cinevault-data-v2";

const defaults = {
  watchlist: [],
  favorites: [],
  history: [],
};


// =========================================================
// GET CURRENT USER ID
// =========================================================

function getActiveUserId() {
  try {
    const auth = JSON.parse(
      localStorage.getItem("cinevault-auth") || "null"
    );

    return auth?.user?.id
      ? String(auth.user.id)
      : "guest";
  } catch {
    return "guest";
  }
}


// =========================================================
// USER-SPECIFIC STORAGE KEY
// =========================================================

function getKey() {
  return `${BASE_KEY}:${getActiveUserId()}`;
}


// =========================================================
// SAFE ARRAY
// =========================================================

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}


// =========================================================
// GET STORE
// =========================================================

export function getStore() {
  try {
    const saved = localStorage.getItem(getKey());

    if (!saved) {
      return {
        ...defaults,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      watchlist: safeArray(parsed.watchlist),
      favorites: safeArray(parsed.favorites),
      history: safeArray(parsed.history),
    };

  } catch {
    return {
      ...defaults,
    };
  }
}


// =========================================================
// SAVE STORE
// =========================================================

export function saveStore(store) {
  const cleanStore = {
    watchlist: safeArray(store.watchlist),
    favorites: safeArray(store.favorites),
    history: safeArray(store.history),
  };

  localStorage.setItem(
    getKey(),
    JSON.stringify(cleanStore)
  );

  window.dispatchEvent(
    new Event("cinevault-storage")
  );
}


// =========================================================
// BACKEND HELPERS
// =========================================================

function pushToBackend(type, movie) {
  if (!getToken()) {
    return;
  }

  api.add(type, movie).catch((error) => {
    console.error(
      `Failed to save ${type} to backend:`,
      error
    );
  });
}


function removeFromBackend(type, movieId) {
  if (!getToken()) {
    return;
  }

  api.remove(type, movieId).catch((error) => {
    console.error(
      `Failed to remove ${type} from backend:`,
      error
    );
  });
}


// =========================================================
// CHECK IF MOVIE IS SAVED
// =========================================================

export function isSaved(type, id) {
  const store = getStore();

  return safeArray(store[type]).some(
    (item) =>
      String(item.id) === String(id)
  );
}


// =========================================================
// TOGGLE MOVIE
// =========================================================

export function toggleItem(type, movie) {
  const store = getStore();

  const list = safeArray(store[type]);

  const exists = list.some(
    (item) =>
      String(item.id) === String(movie.id)
  );

  const nowSaved = !exists;

  if (nowSaved) {
    store[type] = [
      movie,
      ...list.filter(
        (item) =>
          String(item.id) !== String(movie.id)
      ),
    ];
  } else {
    store[type] = list.filter(
      (item) =>
        String(item.id) !== String(movie.id)
    );
  }

  // Keep only the latest 30 history entries.
  if (type === "history") {
    store[type] = store[type].slice(0, 30);
  }

  saveStore(store);

  // Sync authenticated users with backend.
  if (nowSaved) {
    pushToBackend(type, movie);
  } else {
    removeFromBackend(type, movie.id);
  }

  return nowSaved;
}


// =========================================================
// ADD TO HISTORY
// =========================================================

export function addHistory(movie) {
  const store = getStore();

  store.history = [
    {
      ...movie,
      viewedAt: new Date().toISOString(),
    },

    ...store.history.filter(
      (item) =>
        String(item.id) !== String(movie.id)
    ),
  ].slice(0, 30);

  saveStore(store);

  if (getToken()) {
    api.add(
      "history",
      store.history[0]
    ).catch((error) => {
      console.error(
        "Failed to save history to backend:",
        error
      );
    });
  }
}


// =========================================================
// CLEAR HISTORY
// =========================================================

export function clearHistory() {
  const store = getStore();

  store.history = [];

  saveStore(store);

  if (getToken()) {
    api.clear("history").catch((error) => {
      console.error(
        "Failed to clear history on backend:",
        error
      );
    });
  }
}


// =========================================================
// COLLECTION GETTERS
// =========================================================

export const getFavorites = () =>
  getStore().favorites;

export const getWatchlist = () =>
  getStore().watchlist;

export const getHistory = () =>
  getStore().history;


// =========================================================
// FAVORITES
// =========================================================

export const isFavorite = (id) =>
  isSaved("favorites", id);

export const toggleFavorite = (movie) =>
  toggleItem("favorites", movie);

export const addFavorite = (movie) => {
  if (!isFavorite(movie.id)) {
    toggleFavorite(movie);
  }
};

export const removeFavorite = (id) => {
  if (!isFavorite(id)) {
    return;
  }

  const movie = getStore().favorites.find(
    (item) =>
      String(item.id) === String(id)
  );

  if (movie) {
    toggleFavorite(movie);
  }
};


// =========================================================
// WATCHLIST
// =========================================================

export const isInWatchlist = (id) =>
  isSaved("watchlist", id);

export const toggleWatchlist = (movie) =>
  toggleItem("watchlist", movie);

export const addToWatchlist = (movie) => {
  if (!isInWatchlist(movie.id)) {
    toggleWatchlist(movie);
  }
};

export const removeFromWatchlist = (id) => {
  if (!isInWatchlist(id)) {
    return;
  }

  const movie = getStore().watchlist.find(
    (item) =>
      String(item.id) === String(id)
  );

  if (movie) {
    toggleWatchlist(movie);
  }
};