export default function FinancialSummarySection({ transactions }) {
  const now = new Date();
  const thisMonth = now.toLocaleString('default', { month: 'long' });
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toLocaleString('default', { month: 'long' });
  const lastYear = lastMonthDate.getFullYear();

  const thisMonthData = transactions.find(
    (t) => t.month === thisMonth && t.year === thisYear
  ) || { income: 0, expense: 0, investment: 0, saving: 0 };

  const lastMonthData = transactions.find(
    (t) => t.month === lastMonth && t.year === lastYear
  ) || { income: 0, expense: 0, investment: 0, saving: 0 };

  const getChange = (curr, prev) => {
    if (prev === 0) return curr === 0 ? 0 : 100;
    return ((curr - prev) / prev * 100).toFixed(1);
  };

  const balance = thisMonthData.income - (
    thisMonthData.expense + thisMonthData.investment + thisMonthData.saving
  );

  const safeIncome = thisMonthData.income === 0 ? 1 : thisMonthData.income;

  const clamp = (val) => Math.min(Math.max(val, 0), 100);

  const expensePct = clamp((thisMonthData.expense / safeIncome) * 100);
  const investPct = clamp((thisMonthData.investment / safeIncome) * 100);
  const savingPct = clamp((thisMonthData.saving / safeIncome) * 100);
  const remainingPct = clamp(100 - (expensePct + investPct + savingPct));

  return (
    <div className="w-full rounded-3xl border-2 border-gray-300 shadow-sm p-3 sm:p-6 space-y-3 sm:space-y-6 bg-gray-50">
      <p title="Displays your income, expenses, investments, savings, and balance with a monthly comparison." className="text-md sm:text-xl font-bold text-gray-900">Summary</p>

      <div className="flex justify-between items-center gap-4 sm:gap-12">
        <div>
          <p className="text-sm text-gray-500 font-medium">Balance</p>
          <p className="text-lg sm:text-2xl font-semibold text-black">
            ₹{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex-1">
          <div className="h-2 rounded-full overflow-hidden flex w-full">
            <div className="bg-red-500" style={{ width: `${expensePct}%` }} />
            <div className="bg-purple-600" style={{ width: `${investPct}%` }} />
            <div className="bg-yellow-400" style={{ width: `${savingPct}%` }} />
            <div className="bg-gray-300" style={{ width: `${remainingPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center text-sm font-medium">
        <div>
          <p className="text-green-600">Income</p>
          <p className="font-semibold text-lg">₹{thisMonthData.income.toLocaleString()}</p>
          <p className={`text-xs ${thisMonthData.income >= lastMonthData.income ? "text-green-500" : "text-red-500"}`}>
            {thisMonthData.income >= lastMonthData.income ? "↑" : "↓"} {getChange(thisMonthData.income, lastMonthData.income)}% vs last month
          </p>
        </div>
        <div>
          <p className="text-red-600">Expense ({expensePct.toFixed(0)}%)</p>
          <p className="font-semibold text-lg">₹{thisMonthData.expense.toLocaleString()}</p>
          <p className={`text-xs ${thisMonthData.expense <= lastMonthData.expense ? "text-green-500" : "text-red-500"}`}>
            {thisMonthData.expense <= lastMonthData.expense ? "↓" : "↑"} {getChange(thisMonthData.expense, lastMonthData.expense)}% vs last month
          </p>
        </div>
        <div>
          <p className="text-purple-600">Investments ({investPct.toFixed(0)}%)</p>
          <p className="font-semibold text-lg">₹{thisMonthData.investment.toLocaleString()}</p>
          <p className={`text-xs ${thisMonthData.investment <= lastMonthData.investment ? "text-red-500" : "text-green-500"}`}>
            {thisMonthData.investment <= lastMonthData.investment ? "↓" : "↑"} {getChange(thisMonthData.investment, lastMonthData.investment)}% vs last month
          </p>
        </div>
        <div>
          <p className="text-yellow-600">Savings ({savingPct.toFixed(0)}%)</p>
          <p className="font-semibold text-lg">₹{thisMonthData.saving.toLocaleString()}</p>
          <p className={`text-xs ${thisMonthData.saving >= lastMonthData.saving ? "text-green-500" : "text-red-500"}`}>
            {thisMonthData.saving >= lastMonthData.saving ? "↑" : "↓"} {getChange(thisMonthData.saving, lastMonthData.saving)}% vs last month
          </p>
        </div>
      </div>
    </div>
  );
}
