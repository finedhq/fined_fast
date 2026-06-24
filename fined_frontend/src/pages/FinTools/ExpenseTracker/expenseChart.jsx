import { PieChart, Pie, Cell, Tooltip } from 'recharts'

const generateColor = (index) => {
  const hue = (index * 137.508) % 360
  return `hsl(${hue}, 70%, 60%)`
}

export default function ExpensesPieChart({ data, filterMonthforPieChart, setFilterMonthforPieChart }) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const filtered = data.filter(item => {
    const transactionMonth = new Date(item.date).toLocaleString('default', { month: 'long' })
    return transactionMonth === filterMonthforPieChart && item.type === "expense"
  })
  const groupedData= Object.values(
    filtered.reduce((acc, curr) => {
      const cat = curr.category
      const amt = Number(curr.amount) || 0
      if (!acc[cat]) {
        acc[cat] = { category: cat, spent: amt }
      } else {
        acc[cat].spent += amt
      }
      return acc
    }, {})
  )

  const hasData = groupedData.length > 0 && groupedData.reduce((sum, item) => sum + item.spent, 0) > 0
  const renderCustomLabel = ({ value, percent }) => {
    const percentage = (percent * 100).toFixed(1)
    return `${percentage}% (Rs.${value})`
  }

  return (
    <div className='h-full w-full min-h-40 text-xs font-medium'>
      <div className='flex items-center justify-between' >
        <p title="Displays how your total monthly expenses are distributed across different categories." className='text-base sm:text-lg font-semibold pl-2'>Expense Categories</p>
        <select
          value={filterMonthforPieChart}
          onChange={(e) => setFilterMonthforPieChart(e.target.value)}
          className="border-2 text-base font-normal border-gray-300 outline-none rounded-xl p-1 cursor-pointer"
        >
          {monthNames.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>

      {hasData ? (
        <>
          <PieChart width={400} height={260}>
            <Pie
              data={groupedData}
              dataKey="spent"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={90}
              fill="#8884d8"
              label={renderCustomLabel}
            >
              {groupedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={generateColor(index)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`₹${value}`, 'Spent']} />
          </PieChart>
          <div className="mb-4 flex flex-wrap justify-center gap-6 max-h-20 overflow-y-scroll scroll-smooth">
            {groupedData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm font-medium">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: generateColor(index) }}
                ></div>
                <span>{entry.category}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 text-xl font-semibold mt-12">No expense data for this month</p>
      )}
    </div>
  )
}
