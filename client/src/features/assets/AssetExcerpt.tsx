import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks'
import type { RootState } from '../../app/store';
import { selectUserById } from '../users/usersSlice';
import type { Asset } from './assetsSlice' // Importamos el tipo

interface AssetExcerptType {
    asset: Asset; // Ahora recibimos el objeto completo
}

export default function AssetExcerpt({ asset }: AssetExcerptType) {
    // Ya no necesitamos selectAssetById aquí porque el padre ya nos dio el asset
    const user = useAppSelector((state: RootState) =>
        asset?.user_id ? selectUserById(state, asset.user_id) : null
    );

    if (!asset) return null;

    return (
        <Link
            to={`/assets/${asset.id}`}
            className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300 group shadow-sm h-full"
        >
            {/* Contenedor de la Imagen */}
            <div className="relative h-48 w-full bg-gray-50 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                {asset.image_url ? (
                    <img
                        src={asset.image_url}
                        alt={asset.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <svg className="w-10 h-10 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] uppercase font-bold tracking-tighter">No Image</span>
                    </div>
                )}

                {/* Badge de Usuario Flotante */}
                {user && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 pr-2.5 rounded-full border border-gray-200 shadow-sm">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-100"
                        />
                        <span className="text-[10px] font-bold text-gray-700 truncate max-w-[80px]">
                            {user.name.split(' ')[0]}
                        </span>
                    </div>
                )}

                {/* Badge de Precio */}
                <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    ${Number(asset.value).toLocaleString()}
                </div>
            </div>

            {/* Contenido de texto */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 flex-1 group-hover:text-blue-600 transition-colors">
                        {asset.name}
                    </h3>
                    <StatusBadge status={asset.status} />
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-50 mt-auto">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Serial</span>
                        <span className="text-[11px] font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                            {asset.serial_number || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Purchased</span>
                        <span className="text-[11px] text-gray-500 font-medium">
                            {new Date(asset.purchase_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'in-use': 'bg-blue-50 text-blue-600 border-blue-100',
        maintenance: 'bg-amber-50 text-amber-600 border-amber-100',
        retired: 'bg-rose-50 text-rose-600 border-rose-100',
        inuse: 'bg-blue-50 text-blue-600 border-blue-100', // Agregamos por si viene sin guión
    };

    return (
        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border shadow-sm shrink-0 ${colors[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            {status.replace('-', ' ')}
        </span>
    );
}