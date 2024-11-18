import { create } from 'zustand';

interface AuthState {
    email: string;
    name: string;
    password: string;
    userType: string;
    token: string;
    id: string;
    apiKey: string;
    setUserData: (userData: Partial<AuthState>) => void;
    clearUserData: () => void;
}

const isBrowser = typeof window !== 'undefined';
const useAuthStore = create<AuthState>((set) => ({
    email: isBrowser ? localStorage.getItem('email') || '' : '',
    name: isBrowser ? localStorage.getItem('name') || '' : '',
    password: isBrowser ? localStorage.getItem('password') || '' : '',
    userType: isBrowser ? localStorage.getItem('user_type') || '' : '',
    token: isBrowser ? localStorage.getItem('token') || '' : '',
    id: isBrowser ? localStorage.getItem('id') || '' : '',
    apiKey: isBrowser ? localStorage.getItem('api_key') || '' : '',
    
    setUserData: (userData) => {
        set((state) => ({
            ...state,
            ...userData,
        }));

        console.log(userData);
        if (userData.email) localStorage.setItem('email', userData.email);
        if (userData.name) localStorage.setItem('name', userData.name);
        if (userData.password) localStorage.setItem('password', userData.password);
        if (userData.userType) localStorage.setItem('user_type', userData.userType);
        if (userData.token) localStorage.setItem('token', userData.token);
        if (userData.id) localStorage.setItem('id', userData.id);
        if (userData.apiKey) localStorage.setItem('api_key', userData.apiKey);
    },

    clearUserData: () => {
        set({
            email: '',
            name: '',
            password: '',
            userType: '',
            token: '',
            id: '',
            apiKey: '',
        });

        localStorage.removeItem('email');
        localStorage.removeItem('name');
        localStorage.removeItem('password');
        localStorage.removeItem('user_type');
        localStorage.removeItem('token');
        localStorage.removeItem('id');
        localStorage.removeItem('api_key');
    },
}));

export default useAuthStore;
