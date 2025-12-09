import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-app-ne22.onrender.com/api';
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/auth/me')
};
export const userAPI = {
    getUser: (id) => api.get(`/users/${id}`),
    updateUser: (id, data) => {
        const isFormData = data instanceof FormData;
        return api.put(`/users/${id}`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },
    followUser: (id) => api.post(`/users/${id}/follow`),
    getFollowers: (id) => api.get(`/users/${id}/followers`),
    getFollowing: (id) => api.get(`/users/${id}/following`)
};
export const postAPI = {
    getPosts: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),
    getFriendsPosts: (page = 1, limit = 10) => api.get(`/posts/friends?page=${page}&limit=${limit}`),
    searchPosts: (query) => api.get(`/posts/search?query=${encodeURIComponent(query)}`),
    getPost: (id) => api.get(`/posts/${id}`),
    getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
    createPost: (data) => {
        const isFormData = data instanceof FormData;
        return api.post('/posts', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },
    deletePost: (id) => api.delete(`/posts/${id}`),
    likePost: (id) => api.post(`/posts/${id}/like`),
    addComment: (id, data) => api.post(`/posts/${id}/comment`, data),
    likeComment: (postId, commentId) => api.post(`/posts/${postId}/comment/${commentId}/like`),
    replyToComment: (postId, commentId, data) => api.post(`/posts/${postId}/comment/${commentId}/reply`, data)
};
export const messageAPI = {
    getConversations: () => api.get('/messages/conversations'),
    getMessages: (userId) => api.get(`/messages/${userId}`),
    sendMessage: (data) => {
        const formData = new FormData();
        formData.append('receiverId', data.receiverId);
        if (data.content) formData.append('content', data.content);
        if (data.image) formData.append('image', data.image);
        return api.post('/messages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
    markConversationAsRead: (userId) => api.put(`/messages/conversation/${userId}/read`)
};

export default api;
