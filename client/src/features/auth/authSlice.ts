import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

// 🏢 Definimos el tipado de la organización activa
interface OrganizationContext {
    id: number;
    name: string;
}

// 👤 Extendemos el usuario para incluir el rol y su organización
interface User {
    id: number;
    name: string;
    email: string;
    role: string; // 'ADMIN' o 'USER'
    avatar?: string;
    organization: OrganizationContext | null; // 🧠 Guardamos el objeto completo o null si aplica
}

interface AuthState {
    user: User | null;
}

const initialState: AuthState = {
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User }>) => {
            state.user = action.payload.user;
        },
        logOut: (state) => {
            state.user = null;
        },
    },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

// 🔍 Selectores útiles para tus componentes
export const selectCurrentUser = (state: RootState) => state.auth.user;

// Selector directo para obtener el ID de la organización en cualquier hook de tus assets
export const selectCurrentOrganizationId = (state: RootState) => state.auth.user?.organization?.id || null;