import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  Оценка: number;
}

interface CalculatorChartProps {
  data: ChartData[];
}

const CalculatorChart: React.FC<CalculatorChartProps> = ({ data }) => {
  // FIX: Removed access to window.Recharts and used imported components directly.
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} tickLine={{ stroke: '#94a3b8' }} />
        <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8' }} tickLine={{ stroke: '#94a3b8' }} />
        <Tooltip
            contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderColor: '#475569',
                borderRadius: '0.75rem',
            }}
            labelStyle={{ color: '#cbd5e1' }}
            itemStyle={{ fontWeight: 'bold' }}
        />
        <Legend wrapperStyle={{ color: '#e2e8f0' }} />
        <Bar dataKey="Оценка" fill="url(#colorUv)" />
        <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#9013FE" stopOpacity={0.9}/>
            </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CalculatorChart;