'use client';

import React, { SetStateAction, useEffect, useState } from "react"
import instance from "../../../lib/axios"
import ExpensesPieChart from './expenseChart'
import SpendVsBudgetGauge from "./gaugeChart"
import WorkingCapitalChart from "./workingCapitalChart"
import FinancialSummaryBar from "./financialSummaryChart"
import { GrNotes } from "react-icons/gr"
import { RxCross2 } from "react-icons/rx"
import { AiTwotoneDelete } from "react-icons/ai"
import toast from "react-hot-toast"
import { useNavigate as useRouter } from "react-router-dom";
import { useAuth0 as useUser } from "@auth0/auth0-react";
import SmartImage from "./SmartImage";

export default function ExpenseTracker() {

  const router = useRouter()

  const { user, isLoading } = useUser()
  const isAuthenticated = !!user;
  const [role, setrole] = useState("")

  const [email, setEmail] = useState("")
  const [automatePopup, setAutomatePopup] = useState(false)
  const [isUnderstood, setIsUnderstood] = useState(false)
  const [isAutoFetch, setIsAutoFetch] = useState(true)
  const [dbAtoFetch, setDbAutoFetch] = useState(true)
  const [isStatusChanged, setIsStatusChanged] = useState(false)
  const [isGmailConnected, setisGmailConnected] = useState(false)
  const [isBudgetEditing, setIsBudgetEditing] = useState(false)
  const [isMonthlyBudgetEditing, setIsMonthlyBudgetEditing] = useState(false)
  const [budgets, setBudgets] = useState([{
    category: "Food",
    limit: "",
    spent: null
  }])
  const [monthlyBudget, setMonthlyBudget] = useState({
    category: "Monthly",
    limit: "",
    spent: null
  })

  const [hasUnseen, setHasUnseen] = useState(false)

  const [userCategories, setUserCategories] = useState([])
  const [categoryExpenses, setCategoryExpenses] = useState([])

  const [customCategoryIndex, setCustomCategoryIndex] = useState(null)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customFetchedCategoryIndex, setCustomFetchedCategoryIndex] = useState(null)
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [transaction, setTransaction] = useState({
    title: "",
    category: "Food",
    type: "expense",
    amount: "",
    date: ""
  })
  const [isSaving, setIsSaving] = useState(false)

  const [fetchedTransactions, setFetchedTransactions] = useState([])
  const [pieFetchedTransactions, setPieFetchedTransactions] = useState([])
  const [recentFetchedTransactions, setRecentFetchedTransactions] = useState([])
  const [seeAll, setSeeAll] = useState(false)
  const [exceededBudgets, setExceededBudgets] = useState([])
  const [showExceededPopup, setShowExceededPopup] = useState(false)
  const [fetchingFromMails, setFetchingFromMails] = useState(false)
  const [bankEmail, setBankEmail] = useState("")
  const [isData, setIsData] = useState(false)
  const [fetchedFromMails, setFetchedFromMails] = useState([])

  const [monthsRange, setMonthsRange] = useState(3)
  const [filterMonthforTransactions, setFilterMonthforTransactions] = useState(new Date().toLocaleString('default', { month: 'long' }))
  const [filterMonthforGaugeChart, setFilterMonthforGaugeChart] = useState(new Date().toLocaleString('default', { month: 'long' }))
  const [filterMonthforPieChart, setFilterMonthforPieChart] = useState(new Date().toLocaleString('default', { month: 'long' }))

  const [gaugeBudgets, setGaugeBudgets] = useState([])

  const [page, setPage] = useState(0)
  const [newTransactions, setNewTransactions] = useState([])
  const [hasMore, setHasMore] = useState(true)

  const [isFetching, setIsFetching] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [warning, setWarning] = useState("")
  const [deleteWarning, setDeleteWarning] = useState("")
  const [disconnectWarning, setDisconnectWarning] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        console.log("Data from /api/me: ", data);
        setEmail(user.email || '')
        setrole(data.roles?.[0] || "");
      })
      .catch(() => setrole(""));

  }, [isLoading, isAuthenticated]);
  useEffect(() => {
    console.log("Role updated:", role);
  }, [role]);

  // async function fetchBankEmail() {
  //   const res = await instance.post("/fin-tools/expensetracker/fetchBankEmail", { email })
  //   if (res.data.data[0]?.bankEmail) {
  //     setBankEmail(res.data.data[0].bankEmail)
  //     setisGmailConnected(true)
  //     setIsAutoFetch(res.data.data[0].autofetchStatus)
  //     setDbAutoFetch(res.data.data[0].autofetchStatus)
  //   }
  // }

  // useEffect(() => {
  //   if (!email) return
  //   fetchBankEmail()
  // }, [isGmailConnected, email])

  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search)
  //   const queryEmail = params.get('email')
  //   if (queryEmail) {
  //     setWarning("Connected to automated expense tracker successfully !")
  //   }
  //   const cleanUrl = window.location.origin + window.location.pathname
  //   window.history.replaceState({}, document.title, cleanUrl)
  // })

  const fetchUserCategories = async () => {
    try {
      const res = await instance.post("/fin-tools/expensetracker/fetchcategories", { email })
      const categories = res.data.categories || []
      setUserCategories(categories)
      setIsDataLoading(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchHasUnseen() {
    try {
      const res = await instance.post("/home/hasunseen", { email })
      if (res) {
        setHasUnseen(res.data)
      }
    } catch (error) {
      toast.error("Failed to fetch notifications status.")
    }
  }

  useEffect(() => {
    if (!email) return
    fetchUserCategories()
    fetchHasUnseen()
  }, [email])

  async function fetchCategoryBudgets() {
    if (!email) return
    try {
      const res = await instance.post("/fin-tools/expensetracker/fetchcategorybudgets", {
        email,
        month: new Date().toLocaleString('default', { month: 'long' }),
        excludeMonthly: true
      })

      const budgetsFromDB = res.data?.data || []
      const exceeded = budgetsFromDB.filter((b) => Number(b.limit) > 0 && Number(b.spent) > Number(b.limit))

      if (exceeded.length > 0) {
        setExceededBudgets(exceeded)
        setShowExceededPopup(true)
      }

      setCategoryExpenses(budgetsFromDB)
      if (budgetsFromDB.length > 0) {
        setBudgets(budgetsFromDB)
      }
    } catch (err) {
      setWarning("Failed to fetch category budgets.")
    }
  }

  async function fetchGaugeCategoryBudgets() {
    if (!email) return
    try {
      const res = await instance.post("/fin-tools/expensetracker/fetchcategorybudgets", {
        email,
        month: filterMonthforGaugeChart,
        excludeMonthly: false
      })
      setGaugeBudgets(res.data?.data || [])
    } catch (err) {
      setWarning("Failed to fetch category budgets")
    }
  }

  useEffect(() => {
    fetchGaugeCategoryBudgets()
  }, [filterMonthforGaugeChart, fetchedTransactions, email])

  async function fetchMonthlyBudget() {
    if (!email) return

    try {
      const res = await instance.post("/fin-tools/expensetracker/fetchmonthlybudget", { email })
      setMonthlyBudget(res.data?.data?.[0] || {})
    } catch (err) {
      console.error("Error fetching monthly budget:", err.response?.data || err.message)
    }
  }

  async function fetchExpenses() {
    if (!email) return

    try {
      const res = await instance.post("/fin-tools/expensetracker/fetchexpenses", {
        email,
        monthsRange
      })
      setFetchedTransactions(res.data?.data || [])
    } catch (err) {
      console.error("Error fetching expenses:", err.response?.data || err.message)
    }
  }
  useEffect(() => {
    async function fetch() {
      if (email) {
        await fetchMonthlyBudget()
      }
    }
    fetch()
  }, [email])

  useEffect(() => {
    if (email) {
      fetchExpenses()
    }
  }, [monthsRange, email])

  useEffect(() => {
    if (fetchedTransactions.length >= 0) {
      fetchCategoryBudgets()
    }
  }, [fetchedTransactions])

  async function fetchPieOrRecentExpenses(targetMonth, setter) {
    if (!email || !targetMonth) return

    try {
      const res = await instance.post("/fin-tools/expensetracker/fetchexpensesPie", {
        email,
        month: targetMonth
      })
      setter(res.data?.data || [])
    } catch (err) {
      console.error("Error fetching expenses:", err.response?.data || err.message)
    } finally {
      setIsDataLoading(false)
    }
  }

  useEffect(() => {
    if (email) {
      fetchPieOrRecentExpenses(filterMonthforPieChart, setPieFetchedTransactions)
    }
  }, [filterMonthforPieChart, email])

  useEffect(() => {
    if (email) {
      fetchPieOrRecentExpenses(filterMonthforTransactions, setRecentFetchedTransactions)
    }
  }, [filterMonthforTransactions, email])

  function handleBudgetChange(index, field, value) {
    const updated = budgets.map((b, i) => i === index ? { ...b, [field]: field === "category" ? value : value === "" ? "" : Number(value) } : b)
    setBudgets(updated)
  }

  function addCategory() {
    setBudgets([...budgets, { category: "Food", limit: "", spent: null }])
  }

  async function saveBudget() {
    const currentDate = new Date()
    const month = currentDate.toLocaleString('default', { month: 'long' })
    const year = currentDate.getFullYear()

    const updatedBudgets = budgets
      .filter(b => Number(b.limit) > 0)
      .map(budget => ({
        ...budget,
        email,
        month,
        year
      }))

    const categoryNames = updatedBudgets.map(b => b.category)
    const uniqueCategoryNames = new Set(categoryNames)
    if (categoryNames.length !== uniqueCategoryNames.size) {
      setWarning("Each category must be unique. Please remove duplicates.")
      return
    }

    const updatedCategories = budgets.map(b => b.category)
    const filteredSavedCategories = categoryExpenses?.filter(
      saved => !updatedCategories.includes(saved.category)
    )
    const totalSavedCategoryLimit = filteredSavedCategories?.reduce(
      (acc, b) => acc + Number(b.limit), 0
    ) || 0
    const newBudgetLimit = budgets.reduce(
      (acc, b) => acc + Number(b.limit || 0), 0
    )
    const monthlyLimit = Number(monthlyBudget.limit)
    const finalCategoryTotal = totalSavedCategoryLimit + newBudgetLimit

    if (monthlyLimit > 0 && finalCategoryTotal > monthlyLimit) {
      setWarning(`Total category budgets (${finalCategoryTotal}) exceed the monthly limit (${monthlyLimit}).`)
      return
    }

    setIsBudgetEditing(false)
    setIsMonthlyBudgetEditing(false)
    setCategoryExpenses(null)

    const updatedMonthlyBudget = {
      ...monthlyBudget,
      email,
      category: "Monthly",
      month,
      year
    }
    const finalBudgets = [...updatedBudgets]
    if (Number(updatedMonthlyBudget.limit) > 0) {
      finalBudgets.push(updatedMonthlyBudget)
    }

    const res = await instance.post("/fin-tools/expensetracker/budgets", {
      budgets: finalBudgets
    })

    if (res) {
      await fetchMonthlyBudget()
      await fetchExpenses()
    }
  }

  async function fetchMoreTransactions() {
    if (!hasMore) return

    try {
      const res = await instance.post("/fin-tools/expensetracker/fetchexpensesnew", {
        email,
        page,
        limit: 30
      })

      const fetched = res.data?.data || []

      if (fetched.length === 0) {
        setHasMore(false)
      } else {
        setNewTransactions(prev => [...prev, ...fetched])
        setPage(prev => prev + 1)
      }
    } catch (err) {
      console.error("Failed to fetch more transactions", err)
    }
  }

  useEffect(() => {
    if (!email) return
    fetchMoreTransactions()
  }, [email, seeAll])

  useEffect(() => {
    if (seeAll) {
      setPage(1)
      setHasMore(true)
    }
  }, [seeAll])

  useEffect(() => {
    if (!seeAll) return

    const container = document.getElementById("scrollable-transactions")
    if (!container) return

    let isFetching = false
    let timeoutId= null

    const handleScroll = () => {
      if (isFetching) return

      const { scrollTop, scrollHeight, clientHeight } = container

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        isFetching = true
        fetchMoreTransactions().finally(() => {
          timeoutId = setTimeout(() => {
            isFetching = false
          }, 500)
        })
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener("scroll", handleScroll)
    }
  }, [seeAll, hasMore, page])

  function handleCross() {
    setIsBudgetEditing(false)
    setIsMonthlyBudgetEditing(false)
    setCategoryExpenses(null)
  }

  function handleMonthlyBudgetChange(field, value) {
    setMonthlyBudget(prev => ({
      ...prev,
      [field]: value === "" ? "" : Number(value)
    }))
  }

  async function saveTransaction() {
    setIsSaving(true)
    setIsCustomCategory(false)

    if (!transaction.title || !transaction.amount || !transaction.date) {
      setWarning("Please fill in all fields.")
      return
    }

    const transactionData = {
      ...transaction,
      email,
      messageId: null
    }

    try {
      const res = await instance.post("/fin-tools/expensetracker/transaction", {
        transaction: transactionData
      })

      if (res.data?.message) {
        setTransaction({
          title: "",
          category: "Food",
          type: "expense",
          amount: "",
          date: ""
        })

        await fetchExpenses()
        await fetchPieOrRecentExpenses(filterMonthforPieChart, setPieFetchedTransactions)
        await fetchPieOrRecentExpenses(filterMonthforTransactions, setRecentFetchedTransactions)
        await fetchCategoryBudgets()
        await fetchUserCategories()
        const txnMonth = new Date(transactionData.date).toLocaleString("default", { month: "long" })
        const currentMonth = new Date().toLocaleString("default", { month: "long" })

        if (txnMonth === currentMonth) {
          setNewTransactions(prev => [...prev, transactionData])
        }
      }
    } catch (err) {
      setWarning("Failed to save transaction.")
    } finally {
      setIsSaving(false)
      setIsAddingTransaction(false)
    }
  }

  async function saveFetchedTransactions() {
    if (!fetchedFromMails.length) {
      setWarning("No transactions to save.")
      return
    }
    setIsSaving(true)
    const transactionsToSave = fetchedFromMails.map((t) => ({
      title: t.title || "",
      amount: t.amount || "",
      date: t.date || "",
      category: t.category || "Food",
      type: t.type || "expense",
      messageId: t.messageId || null,
      email
    }))

    try {
      const res = await instance.post("/fin-tools/expensetracker/transactions-bulk", {
        transactions: transactionsToSave
      })

      if (res.data?.message) {
        await fetchExpenses()
        await fetchPieOrRecentExpenses(filterMonthforPieChart, setPieFetchedTransactions)
        await fetchPieOrRecentExpenses(filterMonthforTransactions, setRecentFetchedTransactions)
        await fetchCategoryBudgets()
        await fetchUserCategories()

        const currentMonth = new Date().toLocaleString("default", { month: "long" })
        const currentMonthTxns = transactionsToSave.filter(txn => {
          const txnMonth = new Date(txn.date).toLocaleString("default", { month: "long" })
          return txnMonth === currentMonth
        })

        if (currentMonthTxns.length > 0) {
          setNewTransactions(prev => [...prev, ...currentMonthTxns])
        }
      } else {
        setWarning("Failed to save transactions.")
      }
    } catch (err) {
      setWarning("Error saving transactions.")
    } finally {
      setIsSaving(false)
      setIsAddingTransaction(false)
      setFetchingFromMails(false)
      setFetchedFromMails([])
      setCustomFetchedCategoryIndex(null)
    }
  }

  async function handleCheckAndFetch(showNotice) {
    try {
      setIsFetching(true)
      const res = await instance.post("/fin-tools/expensetracker/checkandfetch", { email })
      const data = res.data
      if (data.length === 0) {
        setWarning("✔️ All transactions are already up-to-date.")
        setFetchingFromMails(false)
      } else {
        setIsData(false)
        setFetchedFromMails(data)
        if (showNotice) {
          setIsData(true)
          setNotice("✔️ Transactions found from mails! Click Review to review and save.")
        }
      }
      setIsFetching(false)
    } catch (err) {
      if (!showNotice) {
        if (err.response?.status === 401) {
          const state = JSON.stringify({ email, status: isAutoFetch })
          const encodedState = encodeURIComponent(state)
          window.location.href = `https://finedwebmvp-production.up.railway.app/api/fin-tools/expensetracker/bank-auth?state=${encodedState}`
        } else {
          setWarning("Error fetching Gmail transactions. Try again.")
        }
      }
    }
    setIsFetching(false)
  }

  useEffect(() => {
    if (dbAtoFetch) {
      handleCheckAndFetch(true)
    }
  }, [dbAtoFetch])

  function updateFetchedTransactionField(index, field, value) {
    const updated = [...fetchedFromMails]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setFetchedFromMails(updated)
  }

  async function handleDeleteTransaction(transactionId) {
    setIsFetching(true)
    try {
      await instance.post("/fin-tools/expensetracker/deleteTransaction", {
        email,
        transactionId
      })
      await fetchPieOrRecentExpenses(filterMonthforPieChart, setPieFetchedTransactions)
      await fetchPieOrRecentExpenses(filterMonthforTransactions, setRecentFetchedTransactions)
      await fetchExpenses()
      setNewTransactions(prev => prev.filter(t => t.id !== transactionId))
    } catch (err) {
      setWarning("Error deleting transaction.")
    } finally {
      setIsFetching(false)
    }
  }

  // function handleDeleteFetchedTransaction(messageId) {
  //   setFetchedFromMails(prev =>
  //     prev.filter(t => t.messageId !== messageId)
  //   )
  // }

  // async function confirmDisconnect() {
  //   try {
  //     const res = await instance.post("/fin-tools/expensetracker/disconnect", { email })
  //     if (res.data?.message) {
  //       setWarning("Disconnected successfully.")
  //       setisGmailConnected(false)
  //     } else {
  //       setWarning("Disconnection failed.")
  //     }
  //   } catch (err) {
  //     setWarning("Something went wrong while disconnecting.")
  //   } finally {
  //     setDisconnectWarning(false);
  //   }
  // }

  // async function saveStatusChange() {
  //   try {
  //     const res = await instance.post("/fin-tools/expensetracker/statuschange", { email, isAutoFetch })
  //     if (res.data?.message) {
  //       setWarning("Changes saved successfully.")
  //       setAutomatePopup(false)
  //       setIsStatusChanged(false)
  //     } else {
  //       setWarning("Failed to save changes")
  //     }
  //   } catch (err) {
  //     setWarning("Something went wrong while making changes.")
  //   }
  // }

  // function handleFetch() {
  //   if (isGmailConnected) {
  //     handleCheckAndFetch()
  //   }
  //   else {
  //     setAutomatePopup(true)
  //   }
  // }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const filteredTransactionsforPieChart = pieFetchedTransactions.filter((txn) => {
    if (!filterMonthforPieChart) return true
    const txnMonthIndex = new Date(txn.date).getMonth()
    return monthNames[txnMonthIndex] === filterMonthforPieChart
  })


  return (
    <div className="relative bg-gray-100" >
      {isDataLoading ?
        <div className="animate-pulse px-12 py-8 space-y-6 bg-gray-100 min-h-screen">
          <div className="flex gap-4">
            <div className="w-3/4 h-32 bg-gray-300 rounded-xl"></div>
            <div className="w-1/4 h-32 bg-gray-300 rounded-xl"></div>
          </div>
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1/3 h-16 bg-gray-300 rounded-xl"></div>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="w-3/5 space-y-4">
              <div className="h-64 bg-gray-300 rounded-xl"></div>
              <div className="flex gap-4">
                <div className="w-1/2 h-72 bg-gray-300 rounded-xl"></div>
                <div className="w-1/2 h-72 bg-gray-300 rounded-xl"></div>
              </div>
            </div>
            <div className="w-2/5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-40 h-6 bg-gray-300 rounded-md"></div>
                <div className="w-28 h-8 bg-gray-300 rounded-md"></div>
              </div>
              <div className="space-y-4 max-h-162.5 overflow-y-scroll pr-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2 border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="w-32 h-4 bg-gray-300 rounded-md"></div>
                        <div className="w-20 h-3 bg-gray-200 rounded-md"></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-4 bg-gray-300 rounded-md"></div>
                        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <div className="w-32 h-5 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        :
        <div>
          <main className="px-4 py-5 sm:py-10 sm:px-10" >
            <div className="sm:flex gap-3" >
              <div className="sm:w-3/4" >
                <FinancialSummaryBar transactions={fetchedTransactions} />
              </div>
              <div className="sm:w-1/4 h-60">
                {/* Automate Card Removed Temporarily */}
              </div>
            </div>
            <div className="sm:flex gap-3 mt-4" >
              <div className="sm:w-3/5 space-y-4" >
                <div className="flex justify-between" >
                  <button onClick={() => setIsAddingTransaction(true)} className="bg-violet-900 hover:bg-violet-950 transition-all duration-200 p-2 sm:py-4 sm:px-6 text-white shadow-sm text-sm sm:text-lg font-semibold rounded-xl flex items-center justify-center gap-2 sm:gap-4 cursor-pointer" ><p className="hidden sm:block text-3xl" >+</p>Add transaction</button>
                  <button onClick={() => setIsBudgetEditing(true)} className="bg-gray-50 hover:bg-gray-50 transition-all duration-200 p-2 sm:py-4 sm:px-6 shadow-sm text-sm sm:text-lg font-semibold rounded-xl border-2 border-gray-300 flex items-center justify-center gap-2 sm:gap-4 cursor-pointer" ><GrNotes className="hidden sm:block text-2xl" />Set budget goals</button>
                  <button title="Coming Soon ..." onClick={() => toast("ℹ️ Coming Soon ...")} className="bg-gray-50 hover:bg-gray-50 transition-all duration-200 p-2 sm:py-4 sm:px-6 shadow-sm text-sm sm:text-lg font-semibold rounded-xl border-2 border-gray-300 flex items-center justify-center gap-2 sm:gap-4 cursor-pointer" ><GrNotes className="hidden sm:block text-2xl" />Add receipts & trips</button>
                </div>
                <div>
                  <WorkingCapitalChart data={fetchedTransactions} monthsRange={monthsRange} setMonthsRange={setMonthsRange} />
                </div>
                <div className="sm:flex gap-3" >
                  <div className="sm:w-1/2 border-2 border-gray-300 bg-gray-50 shadow-sm rounded-2xl p-2" >
                    <ExpensesPieChart data={filteredTransactionsforPieChart} filterMonthforPieChart={filterMonthforPieChart} setFilterMonthforPieChart={setFilterMonthforPieChart} />
                  </div>
                  <div className="mt-4 sm:mt-0 sm:w-1/2 border-2 border-gray-300 bg-gray-50 shadow-sm rounded-2xl p-2" >
                    <SpendVsBudgetGauge data={gaugeBudgets} filterMonthforGaugeChart={filterMonthforGaugeChart} setFilterMonthforGaugeChart={setFilterMonthforGaugeChart} />
                  </div>
                </div>
              </div>
              <div className="sm:w-2/5 mt-4 sm:mt-0 border-2 border-gray-300 bg-gray-50 shadow-sm rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4" >
                  <p title="Displays a list of your most recent transactions for the selected month." className="font-semibold text-lg">Recent Transactions</p>
                  <select value={filterMonthforTransactions} onChange={(e) => setFilterMonthforTransactions(e.target.value)} className="border-2 border-gray-300 outline-none rounded-xl p-1 cursor-pointer" >
                    {monthNames.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4 max-h-162.5 overflow-y-scroll px-4">
                  {recentFetchedTransactions.length > 0 ? (
                    recentFetchedTransactions.map((transaction, index) => (
                      <div key={index} className="space-y-1 border-b border-gray-200 pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{transaction.title}</p>
                            <p className="text-xs text-gray-500">{transaction.category}</p>
                          </div>
                          <div className="flex gap-4 items-center justify-between" >
                            <p className={`text-sm font-semibold mt-1 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount}
                            </p>
                            <AiTwotoneDelete
                              onClick={() => {
                                setDeleteWarning("Are you sure you want to delete this transaction ?")
                                setTransactionToDelete(transaction.id)
                              }}
                              className="text-xl text-gray-500 hover:text-red-500 hover:scale-125 cursor-pointer transition-all duration-200"
                              title="Delete"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No transactions in this month</p>
                  )}
                </div>
                {recentFetchedTransactions.length > 0 &&
                  <div className="pt-4 flex justify-end">
                    <button title="View all transactions saved across all months." onClick={() => setSeeAll(true)} className="text-sm text-blue-600 hover:text-blue-700 hover:scale-110 transition-all duration-200 font-semibold cursor-pointer">See all transactions →</button>
                  </div>
                }
              </div>
            </div>
          </main>
          {/* Automate Popup Removed Temporarily */}
          {isBudgetEditing &&
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-150 max-h-[90vh] overflow-y-auto space-y-6">
                <div className="flex justify-between items-center" >
                  <p className="text-md sm:text-2xl font-bold text-violet-800">Set Budget Goals</p>
                  {isMonthlyBudgetEditing ?
                    <button onClick={() => setIsMonthlyBudgetEditing(false)} className="bg-violet-800 hover:bg-violet-900 transition-all duration-200 text-white text-sm sm:text-base font-semibold p-1 sm:px-4 sm:py-2 rounded-lg cursor-pointer" >Set category budget</button>
                    :
                    <button onClick={() => setIsMonthlyBudgetEditing(true)} className="bg-violet-800 hover:bg-violet-900 transition-all duration-200 text-white text-sm sm:text-base font-semibold p-1 sm:px-4 sm:py-2 rounded-lg cursor-pointer" >Set monthly budget</button>
                  }
                  <RxCross2 onClick={handleCross} className="text-xl sm:text-3xl cursor-pointer" />
                </div>
                {isMonthlyBudgetEditing ?
                  <div className="flex flex-col" >
                    <p className="text-lg font-semibold mb-6" >Month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    <div>
                      <p className="text-md font-semibold mb-1">Limit</p>
                      <input autoFocus type="number" placeholder="Enter limit" value={monthlyBudget.limit ?? ""} onChange={(e) => handleMonthlyBudgetChange("limit", e.target.value)} onWheel={(e) => (e.target).blur()} className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700" />
                    </div>
                    <button onClick={saveBudget} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer mt-6 self-center" >Save Budget</button>
                  </div>
                  :
                  <div className="space-y-3" >
                    {budgets.map((budget, index) => {
                      const spent = budget.spent ?? 0
                      const limit = Number(budget.limit) || 0
                      const isExceeded = spent > limit

                      return (
                        <div key={index} className="border border-gray-300 rounded-xl p-4 space-y-4 bg-gray-50">
                          <div>
                            <p className="text-md font-semibold mb-1">Category</p>
                            {customCategoryIndex === index ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={budget.category}
                                  onChange={(e) => handleBudgetChange(index, "category", e.target.value)}
                                  placeholder="Enter your category"
                                  className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700"
                                />
                                <RxCross2
                                  onClick={() => setCustomCategoryIndex(null)}
                                  className="text-2xl cursor-pointer"
                                  title="Cancel custom category"
                                />
                              </div>
                            ) : (
                              <select
                                value={budget.category}
                                onChange={(e) => {
                                  if (e.target.value === "custom") {
                                    setCustomCategoryIndex(index)
                                    handleBudgetChange(index, "category", "")
                                  } else {
                                    handleBudgetChange(index, "category", e.target.value)
                                  }
                                }}
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700 cursor-pointer"
                              >
                                <optgroup label="Common Categories">
                                  <option value="Food">🍔 Food</option>
                                  <option value="Travel">🌍 Travel</option>
                                  <option value="Rent">🚗 Rent</option>
                                  <option value="Apparel">👕 Apparel</option>
                                  <option value="Health">💊 Health</option>
                                  <option value="Education">📚 Education</option>
                                  <option value="Transportation">🚌 Transportation</option>
                                  <option value="Bills & Utilities">💡 Bills & Utilities</option>
                                  <option value="Shopping">🛍️ Shopping</option>
                                  <option value="Entertainment">🎮 Entertainment</option>
                                  <option value="Investments">📈 Investments</option>
                                  <option value="Savings">💰 Savings</option>
                                  <option value="Salary">💵 Salary</option>
                                </optgroup>
                                {userCategories.length > 0 && (
                                  <optgroup label="Your Categories">
                                    {userCategories.map((cat, i) => (
                                      <option key={`custom-${i}`} value={cat}>
                                        📝 {cat}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                <option value="custom">➕ Add your own category</option>
                              </select>
                            )}
                          </div>
                          <div>
                            <p className="text-md font-semibold mb-1">Limit</p>
                            <input
                              type="number"
                              placeholder="Enter limit"
                              value={budget.limit ?? ""}
                              onChange={(e) => handleBudgetChange(index, "limit", e.target.value)}
                              onWheel={(e) => (e.target).blur()}
                              className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700"
                            />
                            <p className="text-sm mt-4 text-gray-700">Spent: ₹{spent}</p>
                            {isExceeded && (
                              <p className="text-sm text-red-600 font-semibold mt-1">
                                ⚠️ Limit exceeded by ₹{(spent - limit).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-between items-center pt-4">
                      <button onClick={addCategory} className="bg-green-600 hover:bg-green-700 transition-all duration-200 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer" >Add Category</button>
                      <button onClick={saveBudget} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer" >Save Budget</button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          {isAddingTransaction &&
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-150 max-h-[90vh] overflow-y-auto space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-violet-800">Add Transaction</p>
                  {/* <div className="flex justify-end">
                    {isFetching ? (
                      <div className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg cursor-not-allowed text-white font-semibold">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Fetching...
                      </div>
                    ) : (
                      <button
                        onClick={handleFetch}
                        className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Fetch transactions from mails
                      </button>
                    )}
                  </div> */}
                  <RxCross2 onClick={() => { setIsAddingTransaction(false); setIsCustomCategory(false) }} className="text-3xl cursor-pointer" />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-md font-semibold mb-1">Title</p>
                    <input autoFocus type="text" value={transaction.title} onChange={(e) => setTransaction(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Netflix Monthly Subscription" className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700" />
                  </div>
                  <div>
                    <p className="text-md font-semibold mb-1">Category</p>
                    {isCustomCategory ? (
                      <div className="flex gap-2 items-center">
                        <input
                          autoFocus
                          type="text"
                          value={transaction.category}
                          onChange={(e) => setTransaction(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="Enter custom category"
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700"
                        />
                        <RxCross2
                          onClick={() => {
                            setIsCustomCategory(false)
                            setTransaction(prev => ({ ...prev, category: "Food" }))
                          }}
                          className="text-2xl cursor-pointer"
                          title="Cancel custom category"
                        />
                      </div>
                    ) : (
                      <select
                        value={transaction.category}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setIsCustomCategory(true)
                            setTransaction(prev => ({ ...prev, category: "" }))
                          } else {
                            setTransaction(prev => ({ ...prev, category: e.target.value }))
                          }
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700 cursor-pointer"
                      >
                        <optgroup label="Common Categories">
                          <option value="Food">🍔 Food</option>
                          <option value="Travel">🌍 Travel</option>
                          <option value="Rent">🚗 Rent</option>
                          <option value="Apparel">👕 Apparel</option>
                          <option value="Health">💊 Health</option>
                          <option value="Education">📚 Education</option>
                          <option value="Transportation">🚌 Transportation</option>
                          <option value="Bills & Utilities">💡 Bills & Utilities</option>
                          <option value="Shopping">🛍️ Shopping</option>
                          <option value="Entertainment">🎮 Entertainment</option>
                          <option value="Investments">📈 Investments</option>
                          <option value="Savings">💰 Savings</option>
                          <option value="Salary">💵 Salary</option>
                        </optgroup>
                        {userCategories.length > 0 && (
                          <optgroup label="Your Categories">
                            {userCategories.map((cat, i) => (
                              <option key={`custom-${i}`} value={cat}>
                                📝 {cat}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="custom">➕ Add your own category</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <p className="text-md font-semibold mb-1">Type</p>
                    <select value={transaction.type} onChange={(e) => setTransaction(prev => ({ ...prev, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700 cursor-pointer">
                      <option value="expense">💸 Expense</option>
                      <option value="income">💵 Income</option>
                      <option value="investment">📊 Investment</option>
                      <option value="saving">🏦 Saving</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-md font-semibold mb-1">Amount</p>
                    <input type="number" value={transaction.amount} onChange={(e) => setTransaction(prev => ({ ...prev, amount: e.target.value }))} placeholder="Enter amount" onWheel={(e) => (e.target).blur()} className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700" />
                  </div>
                  <div>
                    <p className="text-md font-semibold mb-1">Date</p>
                    <input type="date" value={transaction.date} onChange={(e) => setTransaction(prev => ({ ...prev, date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700" />
                  </div>
                  <div className="flex justify-center pt-4">
                    {isSaving ?
                      <div className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg cursor-not-allowed text-white font-semibold">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Saving...
                      </div>
                      :
                      <button onClick={saveTransaction} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer">Save Transaction</button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
          {seeAll &&
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-150 max-h-[90vh] overflow-y-auto space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-violet-800">All Transactions</p>
                  <RxCross2 onClick={() => setSeeAll(false)} className="text-3xl cursor-pointer" />
                </div>
                <div
                  id="scrollable-transactions"
                  className="space-y-4 max-h-[66vh] overflow-y-auto p-4"
                >
                  {newTransactions.length > 0 ? (
                    <>
                      {newTransactions.map((transaction, index) => (
                        <div key={index} className="space-y-1 border-b border-gray-200 pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{transaction.title}</p>
                              <p className="text-xs text-gray-500">{transaction.category}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                      ))}

                      {isFetching && (
                        <div className="text-center py-4 text-sm text-gray-500">Loading more...</div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">No transactions found</p>
                  )}
                </div>
              </div>
            </div>
          }
          {showExceededPopup && (
            <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-125 space-y-4">
                <p className="text-xl font-bold text-red-600">⚠️ Budget Limit Exceeded</p>
                <div className="space-y-2 max-h-75 overflow-y-auto">
                  {exceededBudgets.map((b, i) => (
                    <p key={i} className="text-sm text-gray-700">
                      • <strong>{b.category}</strong>: Spent ₹{b.spent} / Limit ₹{b.limit}
                    </p>
                  ))}
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowExceededPopup(false)}
                    className="bg-violet-700 hover:bg-violet-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* {fetchingFromMails && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-125 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-violet-800">Link Bank Gmail</p>
                  <RxCross2 onClick={() => setFetchingFromMails(false)} className="text-3xl cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <p className="text-md font-semibold">Enter bank-linked Gmail address</p>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={bankEmail}
                    onChange={(e) => setBankEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  {isFetching ? (
                    <div className="flex items-center gap-2 text-blue-700 font-semibold">
                      <svg className="animate-spin h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Fetching...
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckAndFetch(false)}
                      className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {fetchedFromMails.length > 0 && !isData > 0 && (
            <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-1/2 h-4/5 overflow-y-scroll space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-violet-800">Fetched Transactions</h2>
                  <RxCross2 onClick={() => { setFetchedFromMails([]); setFetchingFromMails(false); setCustomFetchedCategoryIndex(null) }} className="text-3xl cursor-pointer" />
                </div>
                {fetchedFromMails.map((transaction, index) =>
                  <div key={index} className="space-y-4 border-2 border-gray-300 p-3 rounded-lg">
                    <div>
                      <div className="flex justify-between" >
                        <p className="text-md font-semibold mb-1">Title</p>
                        <AiTwotoneDelete
                          onClick={() => handleDeleteFetchedTransaction(transaction.messageId)}
                          className="text-xl text-gray-500 hover:text-red-500 hover:scale-125 cursor-pointer transition-all duration-200"
                          title="Delete"
                        />
                      </div>
                      <input type="text" value={transaction.title ?? ""} onChange={(e) => updateFetchedTransactionField(index, "title", e.target.value)} placeholder="e.g., Netflix Monthly Subscription" className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700" />
                    </div>
                    <div>
                      <p className="text-md font-semibold mb-1">Category</p>
                      {customFetchedCategoryIndex === index ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={transaction.category}
                            onChange={(e) => updateFetchedTransactionField(index, "category", e.target.value)}
                            placeholder="Enter custom category"
                            className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700"
                          />
                          <RxCross2
                            onClick={() => {
                              setCustomFetchedCategoryIndex(null);
                              updateFetchedTransactionField(index, "category", "Food");
                            }}
                            className="text-2xl cursor-pointer"
                            title="Cancel custom category"
                          />
                        </div>
                      ) : (
                        <select
                          value={transaction.category ?? "Food"}
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setCustomFetchedCategoryIndex(index);
                              updateFetchedTransactionField(index, "category", "");
                            } else {
                              updateFetchedTransactionField(index, "category", e.target.value);
                            }
                          }}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700 cursor-pointer"
                        >
                          <optgroup label="Common Categories">
                            <option value="Food">🍔 Food</option>
                            <option value="Travel">🌍 Travel</option>
                            <option value="Rent">🚗 Rent</option>
                            <option value="Apparel">👕 Apparel</option>
                            <option value="Health">💊 Health</option>
                            <option value="Education">📚 Education</option>
                            <option value="Transportation">🚌 Transportation</option>
                            <option value="Bills & Utilities">💡 Bills & Utilities</option>
                            <option value="Shopping">🛍️ Shopping</option>
                            <option value="Entertainment">🎮 Entertainment</option>
                            <option value="Investments">📈 Investments</option>
                            <option value="Savings">💰 Savings</option>
                            <option value="Salary">💵 Salary</option>
                          </optgroup>
                          {userCategories.length > 0 && (
                            <optgroup label="Your Categories">
                              {userCategories.map((cat, i) => (
                                <option key={`custom-${i}`} value={cat}>
                                  📝 {cat}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <option value="custom">➕ Add your own category</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <p className="text-md font-semibold mb-1">Type</p>
                      <select value={transaction.type ?? "expense"} onChange={(e) => updateFetchedTransactionField(index, "type", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700 cursor-pointer">
                        <option value="expense">💸 Expense</option>
                        <option value="income">💵 Income</option>
                        <option value="investment">📊 Investment</option>
                        <option value="saving">🏦 Saving</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-md font-semibold mb-1">Amount</p>
                      <input type="number" value={transaction.amount} onChange={(e) => updateFetchedTransactionField(index, "amount", e.target.value)} placeholder="Enter amount" onWheel={(e) => e.target.blur()} className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700" />
                    </div>
                    <div>
                      <p className="text-md font-semibold mb-1">Date</p>
                      <input type="date" value={transaction.date} onChange={(e) => updateFetchedTransactionField(index, "date", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-violet-700" />
                    </div>
                    <div className="flex gap-4" >
                      <p className="font-semibold whitespace-nowrap" >Description :</p>
                      <p>{transaction.description}</p>
                    </div>
                  </div>
                )}
                {isSaving ?
                  <div className="flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 mt-4 rounded-lg cursor-not-allowed text-white font-semibold">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </div>
                  :
                  <button onClick={saveFetchedTransactions} className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-white font-medium py-2 rounded-xl mt-4 cursor-pointer">
                    Save Transactions
                  </button>
                }
              </div>
            </div>
          )} */}
          {warning && (
            <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-125 space-y-4">
                <p className="text-xl font-bold text-red-600">⚠️ Warning</p>
                <p className="text-md font-semibold text-gray-700">
                  {warning}
                </p>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setWarning('')}
                    className="bg-violet-700 hover:bg-violet-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {notice && (
            <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-1/2 space-y-4">
                <p className="text-xl font-bold text-red-600">⚠️ Notice</p>
                <p className="text-md font-semibold text-gray-700">{notice}</p>
                <div className="flex justify-end gap-6 pt-4">
                  <button
                    onClick={() => {
                      setNotice("")
                    }}
                    className="bg-red-700 hover:bg-red-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setNotice("")
                      setIsData(false)
                    }}
                    className="bg-violet-700 hover:bg-violet-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          )}
          {deleteWarning !== "" &&
            <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-1/2 space-y-4">
                <p className="text-xl font-bold text-red-600">⚠️ Warning</p>
                <p className="text-md font-semibold text-gray-700">{deleteWarning}</p>
                <div className="flex justify-end gap-6 pt-4">
                  <button
                    onClick={() => {
                      setDeleteWarning("")
                      setTransactionToDelete(null)
                    }}
                    className="bg-red-700 hover:bg-red-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  {isFetching ? (
                    <button
                      disabled
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center gap-2"
                    >
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                        ></path>
                      </svg>
                      Deleting...
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await handleDeleteTransaction(transactionToDelete)
                        setDeleteWarning("")
                        setTransactionToDelete(null)
                      }}
                      className="bg-violet-700 hover:bg-violet-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          }
          {/* {disconnectWarning && (
            <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-1/2 space-y-4">
                <p className="text-xl font-bold text-red-600">⚠️ Disconnect Gmail</p>
                <p className="text-md font-semibold text-gray-700">
                  Are you sure you want to disconnect your Gmail account from automate expense tracker ?
                </p>
                <div className="flex justify-end gap-6 pt-4">
                  <button
                    onClick={() => setDisconnectWarning(false)}
                    className="bg-red-700 hover:bg-red-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDisconnect}
                    className="bg-violet-700 hover:bg-violet-800 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )} */}
        </div>
      }
    </div>
  )
}
