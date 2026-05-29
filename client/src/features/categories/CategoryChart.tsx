import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

function CategoryChart({ data }: { data: any[] }) {
    const formattedData = data.map(item => ({
        name: item.category_name,
        value: parseInt(item.total)
    }));

    if (data.length === 0) {
        return (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm h-[400px] flex flex-col items-center justify-center">
                <p className="text-slate-400 font-medium">No category data available</p>
            </div>
        );
    }

    return (
        /* 1. Asegúrate de que el div padre tenga una altura fija o mínima clara */
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm h-[400px] w-full">
            <h3 className="text-slate-900 font-bold text-lg mb-6 text-left">Assets by Category</h3>

            <div className="h-[300px] w-full"> {/* Contenedor intermedio con altura definida */}
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                        <Pie
                            data={formattedData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            /* 2. Añade animación para que se vea más profesional */
                            animationBegin={0}
                            animationDuration={1200}
                        >
                            {formattedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default CategoryChart;