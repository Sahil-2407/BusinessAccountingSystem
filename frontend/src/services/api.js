import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/";

const api = axios.create({
    baseURL: API_URL,
});

// Add access token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Automatically refresh expired access token
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !originalRequest?.url?.includes("auth/refresh/")
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refresh");

            if (!refreshToken) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                window.location.href = "/";
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(
                    `${API_URL}auth/refresh/`,
                    {
                        refresh: refreshToken,
                    }
                );

                const newAccessToken = response.data.access;

                localStorage.setItem("access", newAccessToken);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                console.error(
                    "TOKEN REFRESH FAILED:",
                    refreshError
                );

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                window.location.href = "/";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;