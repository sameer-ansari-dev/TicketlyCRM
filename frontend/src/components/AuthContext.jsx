import { createContext, useContext, useEffect, useState } from "react";

const AUTH_STORAGE_KEY = "ticketly-crm-auth";
const USERS_STORAGE_KEY = "ticketly-crm-users";
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem("sameer-crm-auth") || "TicketlyCRM"
  );

  useEffect(() => {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }
  }, []);

  const login = (username, password) => {
    const matchingUser = getStoredUsers().find(
      (storedUser) =>
        storedUser.username.toLowerCase() === username.trim().toLowerCase() &&
        storedUser.password === password
    );

    if (!matchingUser) return false;

    localStorage.setItem(AUTH_STORAGE_KEY, matchingUser.username);
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}