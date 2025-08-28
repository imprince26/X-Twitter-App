import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const api = axios.create({
  baseURL: "http://192.168.174.164:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// api.interceptors.request.use(
//   async (config) => {
//     const token = await AsyncStorage.getItem("token");
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   }
// );

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Handle global errors here
//     console.error("API Error:", error.response?.data || error.message);
//     return Promise.reject(error);
//   }
// );