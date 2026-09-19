import axios from "axios";

// Production requests must stay on the current origin so Vercel rewrites,
// deployment-protection cookies, and preview URLs work consistently. An
// explicit VITE_API_URL is only honored during local development.
const getApiBaseUrl = () => {
  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (!isLocalHost) {
    return "/api";
  }

  return import.meta.env.VITE_API_URL || "http://localhost:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const getApiErrorMessage = (error) => {
  const detail = error.response?.data?.detail;
  if (detail) {
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((err) => {
          const field = err.loc ? err.loc.filter((p) => p !== "body").join(".") : "";
          return field ? `${field}: ${err.msg}` : err.msg;
        })
        .join(", ");
    }
    if (typeof detail === "object" && detail !== null) {
      return detail.message || JSON.stringify(detail);
    }
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "The CRM backend took too long to respond. Please try again.";
  }
  if (error.code === "ERR_NETWORK" || !error.response) {
    return "Could not connect to CRM backend API. Start it with `npm run backend` and try again.";
  }
  return "The CRM backend returned an unexpected error. Please try again.";
};

API.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  }
);

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

export const uploadTicketAttachment = async (ticketId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await API.post(`/tickets/${ticketId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

export const deleteTicket = async (ticketId) => {
  const response = await API.delete(`/tickets/${ticketId}`);
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

// Components are mounted independently, so this gives successful mutations an
// immediate same-tab refresh without coupling screens to a shared cache library.
export const notifyTicketDataChanged = () => {
  window.dispatchEvent(new Event("ticketly:tickets-changed"));
};

export default API;
