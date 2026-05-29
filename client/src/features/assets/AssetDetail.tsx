import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks';
import { selectAssetById, useGetAssetsQuery } from './assetsSlice';
import { selectUserById, useGetUsersQuery } from '../users/usersSlice';
import type { RootState } from '../../app/store';
import { ArrowLeft, Edit3, Box, Cpu, DollarSign, Activity, Wrench, Archive } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';
import DemoRestrictionModal from '../../components/DemoRestrictionModal';

export default function AssetDetail() {
    const { isRestrictionOpen, setIsRestrictionOpen, protectAction } = useDemoMode();
    // Pasamos un objeto vacío para que RTK Query sepa qué "caja" de la caché mirar o llenar
    const { isLoading } = useGetAssetsQuery({});
    const { isLoading: isUsersLoading } = useGetUsersQuery();
    const { assetId } = useParams();
    const navigate = useNavigate();

    const asset = useAppSelector((state: RootState) => selectAssetById(state, Number(assetId)));
    const user = useAppSelector((state: RootState) =>
        asset?.user_id ? selectUserById(state, asset.user_id) : null
    );

    if (isLoading || isUsersLoading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-pulse text-gray-400 font-medium">Loading asset details...</div>
        </div>
    );

    if (!asset) return (
        <div className="max-w-[1400px] mx-auto p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Asset not found</h2>
            <p className="text-gray-500 mt-2">The resource you are looking for does not exist or has been removed.</p>
            <button onClick={() => navigate('/assets')} className="mt-6 text-blue-600 font-bold hover:underline">
                Return to Inventory
            </button>
        </div>
    );

    return (
        <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

            {/* Breadcrumb / Back button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Inventory
            </button>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                            Asset Details
                        </span>
                        <span className="text-xs font-mono text-gray-400">#{asset.id}</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{asset.name}</h1>
                </div>

                <button
                    onClick={() => protectAction(() => navigate(`/assets/edit/${asset.id}`))}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-gray-200"
                >
                    <Edit3 size={18} />
                    Edit Asset
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Visual y Specs */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Imagen Principal */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm flex items-center justify-center p-8 min-h-[400px]">
                        <img
                            src={asset.image_url || '/placeholder-asset.png'}
                            alt={asset.name}
                            className="max-h-[500px] w-auto object-contain hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    {/* Detalles Técnicos */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                        <h2 className="text-xl font-black mb-8 text-gray-900">Technical Specifications</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            <DetailItem icon={<Cpu size={16} />} label="Serial Number" value={asset.serial_number} isMono />
                            <DetailItem icon={<DollarSign size={16} />} label="Market Value" value={`$${Number(asset.value).toLocaleString()}`} isBold />
                            <DetailItem icon={<Activity size={16} />} label="Current Status" value={asset.status.replace('-', ' ')} isCaps />
                            <DetailItem icon={<Box size={16} />} label="Category ID" value={asset.category_id} />
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Ownership y Meta */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 text-center">Current Ownership</h2>

                        {(user && asset.status === 'in-use') ? (
                            <div className="flex flex-col items-center text-center">
                                <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-gray-800 shadow-2xl object-cover mb-4" />
                                <p className="text-blue-400 text-xs font-black uppercase mb-1">Assigned To</p>
                                <p className="text-xl font-bold">{user.name}</p>
                                <p className="text-gray-400 text-sm mt-1">{user.role}</p>
                            </div>
                        ) : (asset.status === 'available') ? (
                            <div className="py-8 px-4 bg-white/5 rounded-3xl border border-white/10 text-center">
                                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Box size={24} />
                                </div>
                                <p className="text-emerald-400 font-bold">Available</p>
                                <p className="text-gray-400 text-xs mt-2 italic">This item is currently in storage.</p>
                            </div>
                        ) : (asset.status === 'maintenance') ? (
                            <div className="py-8 px-4 bg-white/5 rounded-3xl border border-white/10 text-center">
                                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Wrench size={24} />
                                </div>
                                <p className="text-amber-400 font-bold uppercase tracking-wider text-sm">Maintenance</p>
                                <p className="text-gray-400 text-xs mt-2 italic">Scheduled repairs or technical inspection.</p>
                            </div>
                        ) : (
                            <div className="py-8 px-4 bg-white/5 rounded-3xl border border-white/10 text-center opacity-75">
                                <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Archive size={24} />
                                </div>
                                <p className="text-rose-400 font-bold uppercase tracking-wider text-sm">Retired</p>
                                <p className="text-gray-400 text-xs mt-2 italic">Asset out of service permanently.</p>
                            </div>
                        )}

                        <div className="mt-10 pt-8 border-t border-white/10">
                            <p className="text-[11px] text-gray-500 leading-relaxed text-center italic">
                                Added to inventory on {new Date(asset.purchase_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {isRestrictionOpen && (
                <DemoRestrictionModal onClose={() => setIsRestrictionOpen(false)} />
            )}
        </main>
    )
}

function DetailItem({ label, value, isMono, isBold, isCaps, icon }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-gray-50 rounded-lg text-gray-400">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">{label}</span>
                <span className={`text-base ${isMono ? 'font-mono text-blue-600' : 'text-gray-700'} ${isBold ? 'font-black text-lg' : 'font-semibold'} ${isCaps ? 'capitalize' : ''}`}>
                    {value || 'N/A'}
                </span>
            </div>
        </div>
    );
}