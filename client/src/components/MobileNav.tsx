import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, UserCircle } from 'lucide-react';

export default function MobileNav() {
    const navItems = [
        { to: '/', icon: <LayoutDashboard size={22} />, label: 'Home' },
        { to: '/assets', icon: <Package size={22} />, label: 'Inventory' },
        { to: '/categories', icon: <Tags size={22} />, label: 'Categories' },
        { to: '/profile', icon: <UserCircle size={22} />, label: 'Profile' },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
            <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-2xl flex justify-around items-center p-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `
        relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300
        ${isActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'}
    `}
                    >
                        {({ isActive }) => ( // Usamos render props de NavLink
                            <>
                                {item.icon}
                                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                                {isActive && (
                                    <div className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

// Componente auxiliar para no repetir lógica
function ActiveIndicator({ to }: { to: string }) {
    return (
        <NavLink to={to} className="contents">
            {({ isActive }) => isActive ? (
                <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
            ) : null}
        </NavLink>
    );
}