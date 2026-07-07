import axios from 'axios';   //library to make http req to the backend.    

const api = axios.create({ //create a reusable axios object called api with base url and headers.use this object to make req.
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',   //tell backend that req body is json.
  },
});

// Attach JWT token to every request automatically.orelse for every api call we need to write this code attach token in headers.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; //without this the req wont be sent to backend.
});

// Handle 401 - redirect to login.runs after every api response.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) { //user is not authorized.token is invalid or expired.
      localStorage.removeItem('token');
      window.location.href = '/login'; //redirect to login page.
    }
    return Promise.reject(error);
  }
);

export default api;
//for each request the token get added in the http headers.