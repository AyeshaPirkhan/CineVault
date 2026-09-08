import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  api,
  clearAuth,
  getAuth,
  setAuth,
} from "../services/api";

import {
  saveStore,
} from "../services/storage";


const AuthContext = createContext(null);


// =========================================================
// LOAD USER COLLECTIONS FROM BACKEND
// =========================================================

async function syncCollectionsFromServer() {
  const [
    favorites,
    watchlist,
    history,
  ] = await Promise.all([
    api.getCollection("favorites"),
    api.getCollection("watchlist"),
    api.getCollection("history"),
  ]);

  // Backend is the source of truth.
  saveStore({
    favorites,
    watchlist,
    history,
  });

  return {
    favorites,
    watchlist,
    history,
  };
}


// =========================================================
// SAFE COLLECTION SYNC
// =========================================================

async function syncCollectionsSafely() {
  try {
    await syncCollectionsFromServer();
  } catch (error) {
    console.error(
      "Could not sync CineVault collections:",
      error
    );

    // Do not invalidate the login just because
    // collections temporarily failed to load.
  }
}


// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {

  const [
    auth,
    setAuthState,
  ] = useState(getAuth());

  const [
    loading,
    setLoading,
  ] = useState(true);


  // =======================================================
  // RESTORE EXISTING LOGIN
  // =======================================================

  useEffect(() => {

    const syncAuthState = () => {
      setAuthState(getAuth());
    };

    window.addEventListener(
      "cinevault-auth",
      syncAuthState
    );


    const boot = async () => {

      const current = getAuth();

      // No logged-in user.
      if (!current?.token) {
        setLoading(false);
        return;
      }


      try {

        // Verify the token and get the
        // currently authenticated user.
        const user = await api.profile();


        const updatedAuth = {
          ...current,
          user,
        };


        setAuth(
          updatedAuth
        );

        setAuthState(
          updatedAuth
        );


        // IMPORTANT:
        // Load only this user's data from backend.
        await syncCollectionsSafely();

      } catch (error) {

        console.error(
          "Session restoration failed:",
          error
        );

        clearAuth();
        setAuthState(null);

      } finally {

        setLoading(false);

      }
    };


    boot();


    return () => {
      window.removeEventListener(
        "cinevault-auth",
        syncAuthState
      );
    };

  }, []);


  // =======================================================
  // LOGIN
  // =======================================================

  const login = async (
    email,
    password
  ) => {

    const data = await api.login({
      email,
      password,
    });


    // Store the new user's authentication.
    setAuth(data);
    setAuthState(data);


    // IMPORTANT:
    // Do NOT import localStorage data into
    // this account.
    //
    // Instead, retrieve this user's collections
    // from the backend.
    await syncCollectionsSafely();


    return data;
  };


  // =======================================================
  // REGISTER
  // =======================================================
const register = async (payload) => {
  const data = await api.register(payload);

  // New accounts always start with empty collections
  saveStore({
    favorites: [],
    watchlist: [],
    history: [],
  });

  setAuth(data);
  setAuthState(data);

  // Backend is also expected to return empty collections
  // for a newly created account.
  await syncCollectionsSafely();

  return data;
};

  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = () => {

    clearAuth();

    setAuthState(null);

  };


  // =======================================================
  // CONTEXT
  // =======================================================

  return (
    <AuthContext.Provider
      value={{
        auth,
        user: auth?.user || null,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// =========================================================
// USE AUTH
// =========================================================

export function useAuth() {
  return useContext(AuthContext);
}