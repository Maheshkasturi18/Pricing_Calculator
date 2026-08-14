import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Auto-extract data on success, format errors on failure
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const err = error.response?.data?.error || {};
    const customError = new Error(err.message || "Something went wrong.");
    customError.code = err.code;
    customError.field = err.field;
    customError.status = error.response?.status;
    throw customError;
  },
);

export const api = {
  get: (path) => axiosInstance.get(path),
  post: (path, body) => axiosInstance.post(path, body),
  put: (path, body) => axiosInstance.put(path, body),
  del: (path) => axiosInstance.delete(path),
};
