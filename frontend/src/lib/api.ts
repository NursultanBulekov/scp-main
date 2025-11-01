import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


export const getConversations = async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
};

export const getMessages = async (conversationId: number) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
    const response = await api.put(`/orders/${orderId}`, { status });
    return response.data;
};

// Team Management
export const getTeamMembers = async () => {
    const response = await api.get('/team/members/');
    return response.data;
};

export const addTeamMember = async (memberData: any) => {
    const response = await api.post('/team/members/', memberData);
    return response.data;
};

// Complaint Management
export const createComplaint = async (orderId: number, description: string) => {
    const response = await api.post(`/complaints/order/${orderId}`, { description });
    return response.data;
};

export const getComplaints = async () => {
    const response = await api.get('/complaints/');
    return response.data;
};

export const updateComplaint = async (complaintId: number, updateData: any) => {
    const response = await api.put(`/complaints/${complaintId}`, updateData);
    return response.data;
};

export const updateProduct = async (productId: number, productData: any) => {
    const response = await api.put(`/products/${productId}`, productData);
    return response.data;
};

export const updateCatalog = async (catalogId: number, catalogData: any) => {
    const response = await api.put(`/catalogs/${catalogId}`, catalogData);
    return response.data;
};

export const deleteProduct = async (productId: number) => {
    await api.delete(`/products/${productId}`);
};

export const deleteCatalog = async (catalogId: number) => {
    await api.delete(`/catalogs/${catalogId}`);
};

export default api;
