import axios from "axios";

// Auto-detect base API URL:
// 1. Explicit VITE_API_URL environment variable if provided
// 2. Relative '/api' if running on a live web host (Vercel deployment)
// 3. Fallback to 'http://localhost:8000/api' for local development
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "/api";
  }
  return "http://localhost:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const getTickets = async (params = {}) => {
  const cleanParams = {};
  if (params.status && params.status !== "All") {
    cleanParams.status = params.status;
  }
  if (params.priority) {
    cleanParams.priority = params.priority;
  }
  if (params.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }
  if (params.sort) {
    cleanParams.sort = params.sort;
  }

  const response = await API.get("/tickets", { params: cleanParams });
  return response.data;
};

export const getTicketById = async (ticketId) => {
  const response = await API.get(`/tickets/${ticketId}`);
  return response.data;
};

export const createTicket = async (ticketData) => {
  const response = await API.post("/tickets", ticketData);
  return response.data;
};

export const updateTicket = async (ticketId, updateData) => {
  const response = await API.put(`/tickets/${ticketId}`, updateData);
  return response.data;
};

export const addTicketNote = async (ticketId, noteData) => {
  const response = await API.post(`/tickets/${ticketId}/notes`, noteData);
  return response.data;
};

export const getTicketStats = async () => {
  const response = await API.get("/tickets/stats/summary");
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await API.get("/health");
  return response.data;
};

export default API;
