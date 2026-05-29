import React, { useEffect, useState, useMemo } from 'react';
import { useAppSelector } from '../../app/hooks';
import { assetsAdapter, useGetAssetsQuery, type Asset } from './assetsSlice';
import { selectAllCategories, useGetCategoriesQuery } from '../categories/categoriesSlice';
import AddAssetForm from './AddAssetForm';
import AssetExcerpt from './AssetExcerpt';
import { Search, RotateCcw, Loader2, Filter, Plus, X } from 'lucide-react';

export default function AssetsList() {
    // 1. CARGA DE CATEGORÍAS (Para el Select)
    const { isLoading: isCatsLoading } = useGetCategoriesQuery();
    const categories = useAppSelector(selectAllCategories);
    const [page, setPage] = useState(1);
    const [limit] = useState(8); // 8 items por página
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 2. ESTADOS LOCALES (Controlan los inputs de forma instantánea)
    const [searchTerm, setSearchTerm] = useState('');
    const [catId, setCatId] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // 3. ESTADO DE FILTROS "DEBOUNCED" (Lo que dispara la petición al servidor)
    const [debouncedParams, setDebouncedParams] = useState({
        search: '',
        categoryId: '',
        status: 'all',
        page: 1,
        limit: 8
    });

    // Dentro de AssetsList.tsx
    useEffect(() => {
        // Esto moverá el scroll al top de la ventana cada vez que cambie el número de página
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Opcional: para que el movimiento sea fluido y no brusco
        });
    }, [page]); // Escuchamos el cambio de 'page'

    // 4. PETICIÓN RTK QUERY
    // Al pasar 'debouncedParams', RTK Query crea una cache key única para esta combinación
    const {
        data: assetsData,
        isLoading,
        isFetching,
        isError,
        error
    } = useGetAssetsQuery(debouncedParams);

    const totalItems = assetsData?.totalCount || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Genera un array de números [1, 2, 3...] basado en totalPages
    const pageNumbers = useMemo(() => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }, [totalPages]);

    // 5. TRANSFORMACIÓN DE DATOS
    // Convertimos las entidades del adaptador en un array para el renderizado
    const assets = useMemo(() => {
        if (!assetsData) return [];
        // selectAll devuelve el array siguiendo el orden del sortComparer
        return assetsAdapter.getSelectors().selectAll(assetsData);
    }, [assetsData]);

    // 1. Efecto para el DEBOUNCE (Sincroniza los inputs con la petición)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedParams({
                search: searchTerm,
                categoryId: catId,
                status: statusFilter,
                page, // Aquí viaja la página actual
                limit
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, catId, statusFilter, page, limit]); // Añade limit aquí por seguridad

    // 2. Efecto para RESETEAR página (Solo cuando cambian los filtros de texto/categoría)
    // IMPORTANTE: NO incluyas 'page' en las dependencias de este efecto
    useEffect(() => {
        setPage(1);
    }, [searchTerm, catId, statusFilter]);

    // 7. HANDLERS
    const resetFilters = () => {
        setSearchTerm('');
        setCatId('');
        setStatusFilter('all');
    };

    // MANEJO DE ESTADOS DE CARGA Y ERROR
    if (isLoading && !isFetching) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        </div>
    );

    if (isError) {
        const errMsg = 'status' in error ? ('error' in error ? JSON.stringify(error.data) : 'Error fetching data.') : error.message;
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-[1400px] mx-auto mt-10">
                <p className="font-bold">Error loading assets:</p>
                <p className="text-sm">{errMsg as string}</p>
            </div>
        );
    }

    return (
        <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 min-h-screen">

            <header className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Assets</h1>
                <p className="text-slate-500 font-medium mb-8">Manage and track company resources with real-time filtering.</p>

                {/* --- BARRA DE HERRAMIENTAS UNIFICADA --- */}
                <div className="flex flex-col xl:flex-row gap-4 items-center">

                    {/* Lado Izquierdo: Buscador y Filtros */}
                    <div className="bg-white p-2 md:p-3 flex-1 w-full rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-3">

                        {/* Input de Búsqueda */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or serial..."
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                            />
                        </div>

                        {/* Selectores y Reset */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={catId}
                                onChange={(e) => setCatId(e.target.value)}
                                className="flex-1 md:w-40 bg-gray-50 border-none rounded-2xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm cursor-pointer"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex-1 md:w-40 bg-gray-50 border-none rounded-2xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="available">Available</option>
                                <option value="in-use">In Use</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="retired">Retired</option>
                            </select>

                            <button
                                onClick={resetFilters}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Reset Filters"
                            >
                                <RotateCcw size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Lado Derecho: Botón de Acción Principal */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full xl:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Add New Asset
                    </button>
                </div>
            </header>

            <section>
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                        Results ({assets.length}) {isFetching && <span className="ml-2 lowercase font-normal animate-pulse">updating...</span>}
                    </h2>
                </div>

                {assets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {assets.map((asset: Asset) => (
                            <AssetExcerpt key={asset.id} asset={asset} /> // Pasamos asset en lugar de assetId
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-3xl">
                        <p className="text-gray-400 font-medium text-lg">No assets found matching your criteria.</p>
                    </div>
                )}
                {/* --- SECCIÓN DE PAGINACIÓN --- */}
                {totalPages > 1 && (
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm">

                        {/* Información de Resultados */}
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-bold text-slate-900">{assets.length}</span> of{" "}
                            <span className="font-bold text-slate-900">{totalItems}</span> assets
                        </div>

                        {/* Controles de Navegación */}
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1 || isFetching}
                                onClick={() => setPage(p => p - 1)}
                                className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-all"
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            {/* Números de Página Dinámicos */}
                            <div className="flex items-center gap-1">
                                {pageNumbers.map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setPage(n)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === n
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={page >= totalPages || isFetching}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-all"
                            >
                                <span className="sr-only">Next</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </section>
            {/* --- MODAL PARA AGREGAR ASSET --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop (Fondo oscuro) */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Contenedor del Modal */}
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">New Asset</h2>
                                    <p className="text-slate-500 text-sm">Fill in the details to register a new resource.</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={20} className="cursor-pointer" /> {/* O usa un icono X de Lucide */}
                                </button>
                            </div>

                            {/* Pasamos el cierre del modal al formulario por si quieres cerrarlo tras éxito */}
                            <AddAssetForm onSuccess={() => setIsModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}