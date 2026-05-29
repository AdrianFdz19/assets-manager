import { createEntityAdapter, createSelector } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import type { RootState } from "../../app/store";

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string;
};

const usersAdapter = createEntityAdapter<User>();

const initialState = usersAdapter.getInitialState();

export const usersSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<ReturnType <typeof usersAdapter.getInitialState>, void>({ // Sustituí el EntityState por la forma manual con typeof
            query: () => '/users',
            transformResponse: (res: { data: User[] }) => {
                return usersAdapter.setAll(initialState, res.data);
            },
            providesTags: (result) => {
                if (result?.ids) {
                    return [
                        { type: 'Users', id: 'List' },
                        ...result.ids.map(id => ({ type: 'Users' as const, id }))
                    ]
                } else {
                    return [ { type: 'Users', id: 'List' } ] 
                }
            }
        }),
    }),
});

export const {
    useGetUsersQuery,
} = usersSlice;

export const selectUsersResult = usersSlice.endpoints.getUsers.select();

export const selectUsersData = createSelector(
    selectUsersResult, 
    ( usersResult ) => usersResult.data
);

export const {
    selectAll: selectAllUsers,
    selectById: selectUserById,
    selectIds: selectUsersIds
} = usersAdapter.getSelectors((state: RootState) => selectUsersData(state) ?? initialState);