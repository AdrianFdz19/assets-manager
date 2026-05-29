import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../auth/authSlice'; // Tu slice de estado
import { useNavigate } from 'react-router-dom';
import { useLoginWithGoogleMutation } from '../api/apiSlice';
import SignUpForm from './SignUpForm';
import SignInForm from './SignInForm';
import { useState } from 'react';

export default function SignIn() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    // 1. Hook de la mutación
    const [loginWithGoogle, { isLoading }] = useLoginWithGoogleMutation();

    // Función genérica para manejar el éxito de Google
    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const result = await loginWithGoogle({
                token: credentialResponse.credential
            }).unwrap();
            dispatch(setCredentials(result.data));
            navigate('/assets');
        } catch (err) {
            console.error("Backend login failed:", err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">

            <section className="max-w-[450px] w-full bg-white border border-gray-200 rounded-3xl p-10 shadow-xl shadow-blue-900/5">

                {/* Logo o Icono en el Auth */}
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        <span className="text-3xl">📦</span>
                    </div>
                </div>

                <header className="text-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {isLogin
                            ? 'Ingresa tus credenciales para acceder al panel'
                            : 'Únete a AssetFlow y gestiona tus recursos'
                        }
                    </p>
                </header>

                {/* Renderizado condicional del formulario */}
                <div className="space-y-4">
                    {isLogin ? <SignInForm /> : <SignUpForm />}
                </div>

                {/* Separador elegante */}
                <div className="my-8 flex items-center gap-4">
                    <hr className="flex-1 border-gray-100" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">o continuar con</span>
                    <hr className="flex-1 border-gray-100" />
                </div>

                {/* Google Login Container */}
                <div className="flex justify-center mb-8">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-bold animate-pulse">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            Autenticando...
                        </div>
                    ) : (
                        <div className="w-full flex justify-center transform scale-110">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => console.log('Login Failed')}
                                theme="outline" // "outline" suele verse más limpio en fondos blancos
                                shape="pill"
                            />
                        </div>
                    )}
                </div>

                {/* Switch para cambiar de formulario (Footer del Card) */}
                <footer className="text-center pt-6 border-t border-gray-50">
                    <p className="text-sm text-gray-600">
                        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes una cuenta? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 font-bold hover:underline underline-offset-4 transition-all"
                        >
                            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                        </button>
                    </p>
                </footer>

            </section>
        </div>
    );
}