import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

export default function WorkingCapitalChart({ data, monthsRange, setMonthsRange }) {
  const monthsList= [];
  const now = new Date();

  // ✅ Generate last N months
  for (let i = monthsRange - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();

    // Find matching summary from data
    const summary = data.find(
      (entry) =>
        entry.month.toLowerCase().startsWith(month.toLowerCase()) &&
        Number(entry.year) === year
    );

    monthsList.push({
      month,
      year,
      income: summary?.income || 0,
      expense: summary?.expense || 0
    });
  }

  const hasData = monthsList.some(item => item.income > 0 || item.expense > 0);

  const handleRangeChange = (e) => {
    setMonthsRange(Number(e.target.value));
  };

  return (
    <div className="bg-gray-50 shadow-sm p-2 sm:p-4 rounded-xl border-2 border-gray-300">
      <div className="flex justify-between items-center mb-2">
        <h2
          title="Visualizes income vs expenses month-wise to help track your working capital trend."
          className="font-semibold text-base sm:text-lg"
        >
          Working Capital
        </h2>
        <select
          value={monthsRange}
          onChange={handleRangeChange}
          className="border-2 border-gray-300 outline-none rounded-xl p-1 cursor-pointer"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthsList}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#8884d8"
                strokeWidth={2}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#FF8042"
                strokeWidth={2}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-500 mt-20 w-full flex items-center justify-center text-xl font-semibold">
          No records found
        </p>
      )}
    </div>
  );
}

