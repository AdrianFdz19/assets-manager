import { createEntityAdapter, createSelector, type EntityState } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { apiSlice } from "../api/apiSlice";

export type Asset = {
    id: number;
    name: string;
    serial_number: string;
    status: string;
    value: string;
    purchase_date: string;
    category_id: number;
    user_id: number;
    created_at: string;
    image_url: string | null;
    image_public_id: string | null;
};

export interface AssetFilters {
    search?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
    userId?: number;
}

// 1. Dile al adaptador que manejará objetos de tipo 'Asset'
export const assetsAdapter = createEntityAdapter<Asset>({
    sortComparer: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
});

const initialState = assetsAdapter.getInitialState();

const assetsSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAssets: builder.query<EntityState<Asset, number> & { totalCount: number }, AssetFilters>({
            query: (params) => ({
                url: '/assets',
                params: {
                    search: params.search,
                    categoryId: params.categoryId,
                    status: params.status === 'all' ? undefined : params.status,
                    page: params.page,   // <-- ASEGÚRATE DE QUE ESTÉN AQUÍ
                    limit: params.limit,  // <-- ASEGÚRATE DE QUE ESTÉN AQUÍ
                    userId: params.userId
                }
            }),
            transformResponse: (res: { data: Asset[], total: number }) => {
                // Esto está perfecto: crea un estado limpio para cada página
                const state = assetsAdapter.setAll(assetsAdapter.getInitialState(), res.data);
                return {
                    ...state,
                    totalCount: res.total
                };
            },
            providesTags: (result) => [
                { type: 'Assets', id: 'LIST' },
                ...(result?.ids.map(id => ({ type: 'Assets' as const, id })) || [])
            ],
        }),
        addAsset: builder.mutation({
            query: (newAsset) => ({
                url: '/assets',
                method: 'POST',
                body: newAsset
            }),
            // Invalidamos exactamente ese tipo e ID
            invalidatesTags: (result, err, arg) => [
                { type: 'Assets', id: 'LIST' },
                { type: 'Assets', id: arg.id }
            ]
        }),
        updateAsset: builder.mutation({
            query: (asset) => ({
                url: `/assets/${asset.id}`,
                method: 'PUT',
                body: asset
            }),
            invalidatesTags: (result, err, arg) => {
                return [
                    { type: 'Assets', id: 'LIST' },
                    { type: 'Assets', id: arg.id }
                ]
            },
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                // Actualizamos la lista que usa el selector selectAssetById
                const patchList = dispatch(
                    assetsSlice.util.updateQueryData('getAssets', {}, (draft: any) => {
                        const asset = draft.entities[arg.id];
                        // arg contiene los nuevos valores (name, status, etc.)
                        if (asset) Object.assign(asset, arg);
                    })
                );

                try {
                    await queryFulfilled;
                } catch {
                    patchList.undo();
                }
            }
        }),
        updateAssetStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/assets/${id}`,
                method: 'PATCH',
                body: { status }
            }),
            invalidatesTags: (result, err, arg) => [{ type: 'Assets', id: arg.id }]
        }),
        deleteAsset: builder.mutation({
            query: ({ id }) => ({
                url: `/assets/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (res, err, arg) => [
                { type: 'Assets', id: 'LIST' }, // Esto dispara el re-fetch de la lista
                { type: 'Assets', id: arg.id }  // Esto limpia el cache del item individual
            ]
        }),
        uploadImage: builder.mutation<{ url: string; public_id: string }, FormData>({
            query: (formData) => ({
                url: '/assets/upload',
                method: 'POST',
                body: formData,
                // RTK Query detecta automáticamente el FormData y pone el Content-Type correcto
            }),
        }),
    }),
});

// SELECTORES
// 1. Obtenemos los selectores base del adaptador
const adapterSelectors = assetsAdapter.getSelectors();

// 2. Selector para un Asset individual (usado en Detail y Excerpt)
// Este selector busca en la caché por defecto (filtros vacíos)
export const selectAssetById = (state: RootState, id: number) => {
    const assetsResult = assetsSlice.endpoints.getAssets.select({})(state);
    const assetsData = assetsResult.data ?? initialState;
    return adapterSelectors.selectById(assetsData, id);
};

// 3. Si necesitas un selectAll que apunte a la caché base:
export const selectAllAssets = (state: RootState) => {
    const assetsResult = assetsSlice.endpoints.getAssets.select({})(state);
    const assetsData = assetsResult.data ?? initialState;
    return adapterSelectors.selectAll(assetsData);
};

// En tu assetsSlice, crea este hook/selector dedicado
export const useUserAssets = (userId: number) => {
    // Esto crea una entrada de caché UNICA para este usuario: getAssets({"userId": 8, "limit": 100})
    return useGetAssetsQuery({ userId: userId, limit: 100 });
};

// Exportamos los hooks generados
export const {
    useGetAssetsQuery,
    useAddAssetMutation,
    useUpdateAssetMutation,
    useDeleteAssetMutation,
    useUpdateAssetStatusMutation,
    useUploadImageMutation
} = assetsSlice;