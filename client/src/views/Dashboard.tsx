import StatusOverview from '../components/StatusOverview';
import { useGetDashboardStatsQuery } from '../features/api/apiSlice'
import CategoryChart from '../features/categories/CategoryChart';

export default function Dashboard() {
    const { data: stats, isSuccess, isLoading, isFetching, isError } = useGetDashboardStatsQuery();

    if (isLoading || isFetching) return <div className="p-8 text-gray-500">Loading dashboard stats...</div>;
    if (isError) return <div className="p-8 text-red-500">Error loading data.</div>;

    // 2. Ahora que sabemos que 'stats' existe, hacemos los cálculos
    const availableAssets = stats?.status_distribution?.find((s: any) => s.status === 'available')?.count || 0;

    // Usamos Number(stats.asset_count) para asegurar que el tipo sea numérico
    const total = Number(stats?.asset_count);
    const availabilityRate = total > 0
        ? ((Number(availableAssets) / total) * 100).toFixed(0)
        : 0;

    console.log(stats);

    return (
        <div className="p-6 lg:p-10 bg-[#f8fafc] min-h-screen">
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Global Overview</h1>
                <p className="text-slate-500 font-medium">Real-time statistics of your asset inventory.</p>
            </header>

            {/* 1. Grid de Stats: Ahora con 5 columnas en LG para que todas quepan en una fila */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
                <StatCard
                    title="Total Value"
                    value={`$${stats?.total_value.toLocaleString()}`}
                    icon="💰" bgColor="bg-emerald-50" textColor="text-emerald-600"
                />
                <StatCard
                    title="Total Assets"
                    value={stats?.asset_count}
                    icon="📦" bgColor="bg-blue-50" textColor="text-blue-600"
                />
                <StatCard
                    title="Categories"
                    value={stats?.category_count}
                    icon="🏷️" bgColor="bg-purple-50" textColor="text-purple-600"
                />
                <StatCard
                    title="Top Asset"
                    value={stats?.top_asset_name}
                    icon="🏆" bgColor="bg-amber-50" textColor="text-amber-600" isSmallText={true}
                />
                <StatCard
                    title="Readiness"
                    value={`${availabilityRate}%`}
                    icon="⚡" bgColor="bg-indigo-50" textColor="text-indigo-600"
                />
            </div>

            {/* 2. Sección de Gráficas: Distribución 2/3 y 1/3 o 50/50 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Gráfica de Categorías */}
                <div className="w-full">
                    <CategoryChart data={stats?.category_distribution || []} />
                </div>

                {/* Gráfica de Estatus */}
                <div className="w-full">
                    <StatusOverview data={stats?.status_distribution || []} />
                </div>
            </div>

            {/* 3. Panel Inferior: "Inventory Health" ahora a lo ancho para cerrar el diseño */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-xl">
                <div className="relative z-10 mb-6 md:mb-0">
                    <h3 className="text-2xl font-bold mb-2">Inventory Health Report</h3>
                    <p className="text-slate-400 max-w-md">
                        Your system is tracking {stats?.asset_count} assets across {stats?.category_count} specialized categories.
                        Operational readiness is currently at {availabilityRate}%.
                    </p>
                </div>
                <div className="relative z-10">
                    <button className="bg-white text-slate-900 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2">
                        <span>Download Full Report</span>
                        <span className="text-xs text-slate-400">PDF</span>
                    </button>
                </div>
                {/* Círculos decorativos para dar profundidad */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, bgColor, textColor, isSmallText = false }: any) {
    return (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${bgColor} text-xl`}>
                    {icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${bgColor} ${textColor}`}>
                    Live
                </span>
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">{title}</h3>
            <p className={`text-slate-900 font-black truncate ${isSmallText ? 'text-lg' : 'text-3xl'}`}>
                {value}
            </p>
        </div>
    );
}