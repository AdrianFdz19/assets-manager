import { useLogoutMutation } from '../features/api/apiSlice'
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Asumiendo que usas react-router

export default function Header() {
    const [logout] = useLogoutMutation();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    // Helper para marcar el link activo
    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="hidden lg:block bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    
                    {/* Logo y Branding */}
                    <div className="flex items-center gap-8">
                        <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate('/')} >
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <span className="text-white text-xl">📦</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
                                AssetFlow
                            </h2>
                        </div>

                        {/* Navegación Principal */}
                        <nav className="hidden md:flex items-center gap-1">
                            <NavLink to="/dashboard" active={isActive('/dashboard')} label="Dashboard" />
                            <NavLink to="/inventory" active={isActive('/inventory')} label="Inventory" />
                            <NavLink to="/categories" active={isActive('/categories')} label="Categories" />
                        </nav>
                    </div>

                    {/* Acciones de Usuario */}
                    <div className="flex items-center gap-4">
                        <div 
                        onClick={()=>navigate('/profile')}
                        className="cursor-pointer hidden sm:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-slate-900">Admin User</span>
                            <span className="text-[10px] text-slate-500">Premium Account</span>
                        </div>
                        
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                            <span>Logout</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

// Sub-componente para links de navegación
function NavLink({ to, active, label }: { to: string, active: boolean, label: string }) {
    return (
        <Link 
            to={to} 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                active 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
            {label}
        </Link>
    );
}