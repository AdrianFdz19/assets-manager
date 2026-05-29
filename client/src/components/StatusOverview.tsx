import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';

// Mapa de colores para los degradados
const STATUS_COLORS: Record<string, { start: string; end: string }> = {
    available: { start: '#10b981', end: '#34d399' },
    inuse: { start: '#0ea5e9', end: '#38bdf8' },
    maintenance: { start: '#f43f5e', end: '#fb7185' },
    retired: { start: '#64748b', end: '#94a3b8' },
};

function StatusOverview({ data }: { data: any[] }) {
    return (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-900 font-bold text-lg">Condition Overview</h3>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Live Status</span>
            </div>
            
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        layout="vertical" 
                        data={data} 
                        margin={{ left: -20, right: 40, top: 0, bottom: 0 }}
                        barGap={8}
                    >
                        {/* Definición de degradados SVG */}
                        <defs>
                            {data.map((entry) => (
                                <linearGradient key={`grad-${entry.status}`} id={`grad-${entry.status}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={STATUS_COLORS[entry.status]?.start || '#cbd5e1'} />
                                    <stop offset="100%" stopColor={STATUS_COLORS[entry.status]?.end || '#e2e8f0'} />
                                </linearGradient>
                            ))}
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="status" 
                            type="category" 
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700, textAnchor: 'start' }}
                            width={100}
                            axisLine={false}
                            tickLine={false}
                            // Formatear el texto (ej: "inuse" -> "IN USE")
                            tickFormatter={(value) => value.toUpperCase().replace(/([A-Z])/g, ' $1')}
                        />
                        
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />

                        {/* Barra Principal con estilo mejorado */}
                        <Bar 
                            dataKey="count" 
                            radius={[0, 5, 5, 0]} 
                            barSize={45}
                            background={{ fill: '#f1f5f9', radius: 10 }} // Barra de fondo gris
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={`url(#grad-${entry.status})`} 
                                />
                            ))}
                            <LabelList 
                                dataKey="count" 
                                position="right" 
                                offset={10}
                                style={{ fill: '#64748b', fontSize: 12, fontWeight: 800, paddingLeft: 10 }} 
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default StatusOverview;