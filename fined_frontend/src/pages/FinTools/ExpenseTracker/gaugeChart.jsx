import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell } from 'recharts'

export default function SpendVsBudgetGauge({ data, filterMonthforGaugeChart, setFilterMonthforGaugeChart }) {
  const [isTotalBudget, setIsTotalBudget] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const firstNonMonthly = data?.find(item => item.category !== "Monthly")
    return firstNonMonthly?.category || ''
  })

  useEffect(() => {
    if (data?.length > 0 && !selectedCategory) {
      const firstNonMonthly = data.find(item => item.category !== "Monthly")
      if (firstNonMonthly) setSelectedCategory(firstNonMonthly.category)
    }
  }, [data, selectedCategory])

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  let totalSpent = 0
  let totalLimit = 0

  if (isTotalBudget) {
    const monthlySpent = data.find(item => item.category === "Monthly")
    totalSpent = Number(monthlySpent?.spent || 0)

    const monthlyBudget = data.find(item => item.category === "Monthly")
    totalLimit = Number(monthlyBudget?.limit || 0)
  } else {
    const selected = data.find(item => item.category === selectedCategory)
    totalSpent = Number(selected?.spent || 0)
    totalLimit = Number(selected?.limit || 0)
  }

  const hasData = totalSpent > 0 || totalLimit > 0

  if (!hasData) {
    return (
      <div className='min-h-40' >
        <div className='flex items-center justify-between' >
          <p className='text-left text-lg font-semibold pl-4'>Spend vs Budget</p>
          <select value={filterMonthforGaugeChart} onChange={(e) => setFilterMonthforGaugeChart(e.target.value)} className="border-2 border-gray-300 outline-none rounded-xl p-1 cursor-pointer" >
            {monthNames.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <p className="text-center text-xl font-semibold mt-12 text-gray-500">No budgets found</p>
      </div>
    )
  }

  const percentage = Math.min(totalSpent / totalLimit, 1)

  const gaugedata = [
    { name: 'Spent', value: percentage },
    { name: 'Remaining', value: 1 - percentage }
  ]

  const COLORS = ['#000000', '#e0e0e0']

  return (
    <div className="text-center min-h-40">
      {isTotalBudget ?
        <div className='flex flex-col' >
          <div className='flex items-center justify-between' >
            <div>
              <p title='Displays the relationship between the total monthly budget and the total amount spent on categories that have a saved budget.' className='text-left text-lg font-semibold pl-2'>Spend vs Budget</p>
            </div>
            <select value={filterMonthforGaugeChart} onChange={(e) => setFilterMonthforGaugeChart(e.target.value)} className="border-2 border-gray-300 outline-none rounded-xl p-1 cursor-pointer" >
              {monthNames.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className='flex items-center justify-center'>
            <PieChart width={400} height={230}>
              <Pie
                data={gaugedata}
                startAngle={180}
                endAngle={0}
                innerRadius={130}
                outerRadius={180}
                dataKey="value"
                stroke="none"
                cx="50%"
                cy="100%"
              >
                {gaugedata.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <p className="text-lg font-semibold -mt-12">
            ₹{totalSpent.toFixed(2)} / ₹{totalLimit} Spent
          </p>
          <p className="text-sm text-gray-500">
            {Math.round(percentage * 100)}% of Budget
          </p>
          <div className="flex items-center gap-6 self-center mt-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!isTotalBudget} onChange={() => setIsTotalBudget(false)} />
              <span>Category-wise</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={isTotalBudget} onChange={() => setIsTotalBudget(true)} />
              <span>Total budget-wise</span>
            </label>
          </div>
        </div>
        :
        <div className='flex flex-col' >
          <div className='flex items-center justify-between gap-1' >
            <p title='Displays the relationship between the monthly budget of the selected category and the amount spent in that category.' className='text-left text-base font-semibold pl-2 whitespace-nowrap'>Spend vs Budget</p>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border-2 border-gray-300 outline-none rounded-xl p-1 cursor-pointer w-full" >
              {data
                .filter(item => item.category !== "Monthly")
                .map(item => (
                  <option key={item.category} value={item.category}>
                    {item.category}
                  </option>
                ))}
            </select>
            <select value={filterMonthforGaugeChart} onChange={(e) => setFilterMonthforGaugeChart(e.target.value)} className="border-2 border-gray-300 outline-none rounded-xl p-1 cursor-pointer" >
              {monthNames.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className='flex items-center justify-center'>
            <PieChart width={400} height={230}>
              <Pie
                data={gaugedata}
                startAngle={180}
                endAngle={0}
                innerRadius={130}
                outerRadius={180}
                dataKey="value"
                stroke="none"
                cx="50%"
                cy="100%"
              >
                {gaugedata.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <p className="text-lg font-semibold -mt-12">
            ₹{totalSpent.toFixed(2)} / ₹{totalLimit} Spent
          </p>
          <p className="text-sm text-gray-500">
            {Math.round(percentage * 100)}% of Budget
          </p>
          <div className="flex items-center gap-6 self-center mt-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!isTotalBudget} onChange={() => setIsTotalBudget(false)} />
              <span>Category-wise</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={isTotalBudget} onChange={() => setIsTotalBudget(true)} />
              <span>Total budget-wise</span>
            </label>
          </div>
        </div>
      }
    </div>
  )
}
