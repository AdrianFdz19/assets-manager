import React from 'react';
import { User, Package, DollarSign, Calendar, ShieldCheck } from 'lucide-react';
import { useAppSelector } from '../../app/hooks';
import { selectAllAssets, useGetAssetsQuery, useUserAssets, type Asset } from '../assets/assetsSlice';
import { selectUserById } from './usersSlice';
import type { RootState } from '../../app/store';
import { selectCurrentUser } from '../auth/authSlice';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
    const navigate = useNavigate();
    const currentUser = useAppSelector(selectCurrentUser);

    // 1. Añadimos la opción 'skip'
    // La query solo se ejecutará cuando skip sea false (cuando exista el ID)
    const { data: assetsData, isLoading, isFetching } = useGetAssetsQuery(
        {
            userId: currentUser?.id,
            limit: 100
        },
        { skip: !currentUser?.id } // <--- ESTO ES LA CLAVE
    );

    // 2. Extraemos los assets (Memoizado para eficiencia)
    const assignedAssets = React.useMemo(() => {
        // Si no hay data o está cargando, devolvemos array vacío
        if (!assetsData || !assetsData.entities) return [];

        return Object.values(assetsData.entities).filter(Boolean) as Asset[];
    }, [assetsData]);

    // 3. Cálculo de valores (seguro con el array vacío inicial)
    const totalResponsibilityValue = React.useMemo(() => {
        return assignedAssets.reduce(
            (sum, asset) => sum + (Number(asset.value) || 0), 0
        );
    }, [assignedAssets]);

    // Estado de carga mejorado
    if (!currentUser?.id || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 font-bold tracking-tight">Verifying credentials & loading assets...</p>
            </div>
        );
    }

    return (
        <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Lateral Izquierdo: Info Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl overflow-hidden">
                            {currentUser?.avatar ? (
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={64} className="text-slate-400" />
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">{currentUser?.name}</h2>
                        <p className="text-slate-500 font-medium mb-6">{currentUser?.email}</p>

                        <div className="flex gap-2 mb-8">
                            <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={14} />
                                {'Admin'}
                            </span>
                        </div>

                        <div className="w-full pt-8 border-t border-slate-100 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-medium">Member since</span>
                                <span className="text-slate-900 font-bold">{'15-january-2025'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lateral Derecho: Stats & Assigned Assets */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Resumen de Responsabilidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <Package className="text-white" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Assigned Assets</p>
                                    <h4 className="text-3xl font-black">{assignedAssets.length}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <DollarSign className="text-white" size={24} />
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Total Custody Value</p>
                                    <h4 className="text-3xl font-black">${totalResponsibilityValue.toLocaleString()}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Activos Bajo su Cargo */}
                    <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Current Assignments</h3>

                        {assignedAssets.length > 0 ? (
                            <div className="space-y-4">
                                {assignedAssets.map(asset => (
                                    <div key={asset.id}
                                        onClick={() => navigate(`/assets/${asset.id}`)}
                                        className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100">
                                                <img src={asset.image_url || '/placeholder.png'} alt={asset.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{asset.name}</p>
                                                <p className="text-xs text-slate-400 font-mono uppercase">{asset.serial_number}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">${asset.value}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Market Value</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-slate-400 italic">No assets currently assigned to this profile.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}