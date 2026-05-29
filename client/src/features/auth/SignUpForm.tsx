import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Loader2 } from 'lucide-react';
import { useSignUpMutation } from '../api/apiSlice';
import { useNavigate } from 'react-router-dom';

const SignUpForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const [signUp, { isLoading }] = useSignUpMutation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (serverError) setServerError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signUp(formData).unwrap();
            navigate('/assets');
        } catch (err: any) {
            setServerError(err.data?.message || 'Ocurrió un error inesperado');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            
            {/* Campo Nombre Completo */}
            <div className="flex flex-col gap-1.5 text-left">
                <label 
                    htmlFor="name" 
                    className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1"
                >
                    Nombre Completo
                </label>
                <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Ej. Adrian Fernandez"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm text-gray-700 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Campo Correo Electrónico */}
            <div className="flex flex-col gap-1.5 text-left">
                <label 
                    htmlFor="email" 
                    className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1"
                >
                    Correo Electrónico
                </label>
                <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm text-gray-700 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Campo Contraseña */}
            <div className="flex flex-col gap-1.5 text-left">
                <label 
                    htmlFor="password" 
                    className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1"
                >
                    Contraseña
                </label>
                <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm text-gray-700 placeholder:text-gray-400 font-mono"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        disabled={isLoading}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* Manejo de Errores */}
            {serverError && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                    <p className="text-xs text-red-600 font-bold text-center italic">
                        {serverError}
                    </p>
                </div>
            )}

            {/* Botón de envío */}
            <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 mt-2
                    ${isLoading 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5'}`}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Creando cuenta...
                    </>
                ) : (
                    'Crear cuenta ahora'
                )}
            </button>
        </form>
    );
};

export default SignUpForm;