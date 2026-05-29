import { createEntityAdapter, createSelector, type EntityState } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import { type RootState } from "../../app/store";

type Category = {
    id: number;
    name: string;
}

const categoriesAdapter = createEntityAdapter<Category>();

const initialState = categoriesAdapter.getInitialState();

export const categoriesSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCategories: builder.query<EntityState<Category, number>, void>({
            query: () => '/categories',
            transformResponse: (res: { data: Category[] }) => {
                return categoriesAdapter.setAll(initialState, res.data);
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'Categories', id: 'LIST' },
                        ...result?.ids.map((id: number) => ({ type: 'Categories' as const, id }))
                    ]
                } else {
                    return [{ type: 'Categories', id: 'LIST' }]
                }
            }
        }),
        addCategory: builder.mutation({
            query: (newCategory) => ({
                url: '/categories',
                method: 'POST',
                body: newCategory
            }),
            invalidatesTags: (res, err, arg) => ([{ type: 'Categories' as const, id: 'LIST' }])
        }),
        updateCategory: builder.mutation({
            query: (categoryUpdated) => ({
                url: `/categories/${categoryUpdated.id}`,
                method: 'PUT',
                body: categoryUpdated
            }),
            invalidatesTags: (res, err, arg) => [
                { type: 'Categories' as const, id: 'LIST' },
                { type: 'Categories' as const, id: arg.id }
            ]
        }),
        deleteCategory: builder.mutation({
            query: ({ id }) => ({
                url: `/categories/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (res, err, arg) => [
                { type: 'Categories' as const, id: 'LIST' }, 
                { type: 'Categories' as const, id: arg.id }
            ]
        })
    })
});

export const selectCategoriesResult = categoriesSlice.endpoints.getCategories.select();
export const selectCategoriesData = createSelector(
    selectCategoriesResult,
    categoriesResult => categoriesResult.data
);

export const {
    selectAll: selectAllCategories,
    selectById: selectCategoryById,
    selectIds: selectCategoriesIds,
} = categoriesAdapter.getSelectors((state: RootState) => selectCategoriesData(state) ?? initialState);

export const {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} = categoriesSlice;

