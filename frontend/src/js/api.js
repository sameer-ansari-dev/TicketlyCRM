import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
  if (params.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
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

export default API;