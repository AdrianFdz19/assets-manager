import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut, setCredentials } from "../auth/authSlice";
import type { DashboardStats } from "../../types/dashboard";

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export const apiSlice = createApi({
    reducerPath: 'api',
    tagTypes: ['Assets', "Categories", "Dashboard", "Users"],
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include'
    }),
    endpoints: builder => ({
        checkAuth: builder.query<{ user: User }, void>({
            query: () => '/auth/me',
        }),
        signUp: builder.mutation({
            query: (formData) => ({
                url: '/auth/signup',
                method: 'POST',
                body: formData
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // Actualizamos el authSlice automáticamente al recibir la respuesta
                    dispatch(setCredentials({ user: data.data.user }));
                } catch (err) {
                    console.error('Error en el signup:', err);
                }
            }
        }),
        signIn: builder.mutation({
            query: (formData) => ({
                url: '/auth/signin',
                method: 'POST',
                body: formData
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // Actualizamos el authSlice automáticamente al recibir la respuesta
                    dispatch(setCredentials({ user: data.data.user }));
                } catch (err) {
                    console.error('Error en el signin:', err);
                }
            }
        }),
        loginWithGoogle: builder.mutation({
            query: (token) => ({
                url: '/auth/google',
                method: 'POST',
                body: { token }
            })
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            // Opcional: Esto limpia el caché de RTK Query automáticamente
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(logOut()); // Tu acción de authSlice que pone user: null
                    dispatch(apiSlice.util.resetApiState()); // Limpia TODO el caché (assets, categories, etc.)
                } catch {
                    console.error('Logout failed');
                }
            }
        }),
        getDashboardStats: builder.query<DashboardStats, void>({ // <--- <Respuesta, Argumento>
            query: () => `/assets/dashboard-stats`,
            providesTags: ["Dashboard", "Categories"]
        })
    })
});

export const {
    useLoginWithGoogleMutation,
    useCheckAuthQuery,
    useLogoutMutation,
    useSignUpMutation,
    useSignInMutation,
    useGetDashboardStatsQuery
} = apiSlice;