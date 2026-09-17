import { createContext, useContext, useEffect, useState } from "react";

const AUTH_STORAGE_KEY = "ticketly-crm-session";
const USERS_STORAGE_KEY = "ticketly-crm-users";
const LEGACY_AUTH_STORAGE_KEYS = ["ticketly-crm-auth", "sameer-crm-auth"];
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const DEFAULT_USERS = [
  { username: "TicketlyCRM", password: "TicketlyCRM123" },
  { username: "SameerCRM", password: "CRMsameer" },
];

const AuthContext = createContext(null);

function getStoredUsers() {
  try {
    const storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));
    if (Array.isArray(storedUsers) && storedUsers.length) return storedUsers;
  } catch {
    // Recover with default accounts if storage contains invalid data.
  }
  return DEFAULT_USERS;
}

function getValidSession() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    const username = typeof session?.username === "string" ? session.username : "";
    const expiresAt = Number(session?.expiresAt);
    const userExists = getStoredUsers().some(
      (storedUser) => storedUser.username.toLowerCase() === username.toLowerCase()
    );

    if (session?.token && username && Number.isFinite(expiresAt) && expiresAt > Date.now() && userExists) {
      return username;
    }
  } catch {
    // A malformed or missing session is not authenticated.
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }

    // Plain username values from older versions are deliberately not sessions.
    LEGACY_AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    setUser(getValidSession());
    setIsLoading(false);
  }, []);

  const login = (username, password) => {
    const matchingUser = getStoredUsers().find(
      (storedUser) =>
        storedUser.username.toLowerCase() === username.trim().toLowerCase() &&
        storedUser.password === password
    );

    if (!matchingUser) return false;

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: crypto.randomUUID(),
        username: matchingUser.username,
        expiresAt: Date.now() + SESSION_DURATION_MS,
      })
    );
    setUser(matchingUser.username);
    return true;
  };

  const signup = (username, password) => {
    const users = getStoredUsers();
    const alreadyExists = users.some(
      (storedUser) => storedUser.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (alreadyExists) return false;

    const newUser = { username: username.trim(), password };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
    return true;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    LEGACY_AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
