import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Jobs
  getJobs: (skip = 0, limit = 20) =>
    axios.get(`${API_URL}/jobs?skip=${skip}&limit=${limit}`, { headers: getAuthHeader() }),
  getJob: (id) => axios.get(`${API_URL}/jobs/${id}`, { headers: getAuthHeader() }),
  createJob: (data) => axios.post(`${API_URL}/jobs`, data, { headers: getAuthHeader() }),
  getMyJobs: () => axios.get(`${API_URL}/jobs/my/posted`, { headers: getAuthHeader() }),

  // Applications
  applyJob: (data) => axios.post(`${API_URL}/applications`, data, { headers: getAuthHeader() }),
  getMyApplications: () => axios.get(`${API_URL}/applications/my`, { headers: getAuthHeader() }),
  getJobApplications: (jobId) =>
    axios.get(`${API_URL}/applications/job/${jobId}`, { headers: getAuthHeader() }),

  // Mentors
  getMentors: (skip = 0, limit = 20) =>
    axios.get(`${API_URL}/mentors?skip=${skip}&limit=${limit}`, { headers: getAuthHeader() }),
  getMentor: (id) => axios.get(`${API_URL}/mentors/${id}`, { headers: getAuthHeader() }),
  createMentorProfile: (data) =>
    axios.post(`${API_URL}/mentors/profile`, data, { headers: getAuthHeader() }),

  // Sessions
  bookSession: (data) => axios.post(`${API_URL}/sessions`, data, { headers: getAuthHeader() }),
  getMySessions: () => axios.get(`${API_URL}/sessions/my`, { headers: getAuthHeader() }),

  // Messages
  sendMessage: (data) => axios.post(`${API_URL}/messages`, data, { headers: getAuthHeader() }),
  getConversation: (userId) =>
    axios.get(`${API_URL}/messages/${userId}`, { headers: getAuthHeader() }),
  getConversations: () =>
    axios.get(`${API_URL}/messages/conversations/list`, { headers: getAuthHeader() }),

  // Profile
  updateProfile: (data) => axios.put(`${API_URL}/profile`, data, { headers: getAuthHeader() }),
  getUserProfile: (userId) => axios.get(`${API_URL}/profile/${userId}`, { headers: getAuthHeader() }),

  // AI
  matchJobs: () => axios.post(`${API_URL}/ai/match-jobs`, {}, { headers: getAuthHeader() }),

  // Payments
  createPaymentOrder: (data) =>
    axios.post(`${API_URL}/payments/create-order`, data, { headers: getAuthHeader() }),
};

export default api;