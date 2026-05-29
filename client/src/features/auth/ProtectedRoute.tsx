import { Navigate, Outlet } from 'react-router-dom';
import { useCheckAuthQuery } from '../api/apiSlice';
import { selectCurrentUser, setCredentials } from './authSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useEffect } from 'react';

const ProtectedRoute = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectCurrentUser);
    const { data, isSuccess, isLoading, isFetching, isError } = useCheckAuthQuery();

    useEffect(() => {
        if (isSuccess && data?.user) {
            dispatch(setCredentials({ user: data.user }));
        }
    }, [data, isSuccess, dispatch]);

    if (isLoading || isFetching) {
        return <div>Verificando sesión...</div>;
    }

    // CAMBIO CLAVE AQUÍ: 
    // Si Redux aún no tiene al usuario (user es null) 
    // pero la Query SÍ lo tiene (data.user existe), 
    // dejamos que pase. El useEffect lo guardará en Redux en un milisegundo.
    if (!user && !data?.user) {
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;