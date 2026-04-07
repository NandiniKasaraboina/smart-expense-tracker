
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function App() {

  // 🔐 AUTH
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(true);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // 🔍 FILTERS
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortType, setSortType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // 💸 EXPENSE
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  // 🔐 LOGIN
  const handleLogin = async () => {
    const res = await fetch("http://127.0.0.1:8000/login/", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username: authUsername, password: authPassword }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error);

    localStorage.setItem("token", data.token);
    setIsLoggedIn(true);
  };

  // 🔐 REGISTER
  const handleRegister = async () => {
    const res = await fetch("http://127.0.0.1:8000/register/", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username: authUsername, password: authPassword }),
    });

    const data = await res.json();
    alert(data.message || data.error);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  // 📥 FETCH
  const fetchExpenses = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://127.0.0.1:8000/expenses/", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Login again");
      setIsLoggedIn(false);
      return;
    }

    setExpenses(data);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchExpenses();
      getAIInsight();
    }
  }, [isLoggedIn]);

  // ➕ ADD / UPDATE
  const addExpense = async () => {
    const token = localStorage.getItem("token");

    if (selectedMonth === "") {
      alert("Please select a month");
      return;
    }

    let url = "http://127.0.0.1:8000/add-expense/";
    if (editId) url = `http://127.0.0.1:8000/update-expense/${editId}/`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        amount,
        category,
        month: selectedMonth   // ✅ key fix
      }),
    });

    setTitle("");
    setAmount("");
    setCategory("");
    setEditId(null);

    fetchExpenses();
  };

  // ❌ DELETE
  const deleteExpense = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`http://127.0.0.1:8000/delete-expense/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchExpenses();
  };

  // ✏️ EDIT
  const editExpense = (item) => {
    setTitle(item.title);
    setAmount(item.amount);
    setCategory(item.category);
    setEditId(item.id);
  };

  // 🤖 AI INSIGHT
  const getAIInsight = async () => {
    setLoading(true);

    const token = localStorage.getItem("token");

    const res = await fetch("http://127.0.0.1:8000/ai-insight/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    setInsight(data.message);
    setLoading(false);
  };

  // 🔥 FILTER LOGIC (ONLY MONTH FIELD)
  let filteredExpenses = expenses;

  if (search) {
    filteredExpenses = filteredExpenses.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (filterCategory) {
    filteredExpenses = filteredExpenses.filter(
      i => i.category === filterCategory
    );
  }

  if (selectedMonth !== "") {
    filteredExpenses = filteredExpenses.filter(
      item => Number(item.month) === Number(selectedMonth)
    );
  }

  if (sortType === "low") {
    filteredExpenses = [...filteredExpenses].sort(
      (a, b) => Number(a.amount) - Number(b.amount)
    );
  } else if (sortType === "high") {
    filteredExpenses = [...filteredExpenses].sort(
      (a, b) => Number(b.amount) - Number(a.amount)
    );
  }

  const totalAmount = expenses.reduce((s, i) => s + Number(i.amount), 0);
  const monthlyTotal = filteredExpenses.reduce((s, i) => s + Number(i.amount), 0);

  // 📊 CHART (UNCHANGED)
  const chartData = Object.values(
    filteredExpenses.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { category: item.category, amount: 0 };
      }
      acc[item.category].amount += Number(item.amount);
      return acc;
    }, {})
  );

  // 🔐 LOGIN UI
  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow w-80">
          <h2 className="text-xl mb-4 text-center">
            {isRegister ? "Register" : "Login"}
          </h2>

          <input className="w-full border p-2 mb-3"
            value={authUsername}
            placeholder="Username"
            onChange={e => setAuthUsername(e.target.value)} />

          <input className="w-full border p-2 mb-3"
            value={authPassword}
            type="password"
            placeholder="Password"
            onChange={e => setAuthPassword(e.target.value)} />

          <button
            onClick={isRegister ? handleRegister : handleLogin}
            className="w-full bg-blue-500 text-white p-2 rounded mb-3"
          >
            {isRegister ? "Register" : "Login"}
          </button>

          <p className="text-center">
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Go to Login" : "Go to Register"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-blue-600">
          Expense Tracker
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="max-w-md mx-auto mb-4 bg-green-100 p-4 text-center rounded">
        Total: ₹{totalAmount}
      </div>

      <div className="max-w-md mx-auto mb-4 bg-blue-100 p-4 text-center rounded">
        Monthly Total: ₹{monthlyTotal}
      </div>

      <div className="max-w-md mx-auto mb-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="Search..."
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="max-w-md mx-auto space-y-3 mb-4">
        <select className="w-full p-2 border" onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="food">Food</option>
          <option value="travel">Travel</option>
          <option value="shopping">Shopping</option>
        </select>

        <select className="w-full p-2 border" onChange={e => setSortType(e.target.value)}>
          <option value="">Sort</option>
          <option value="low">Low</option>
          <option value="high">High</option>
        </select>

        <select className="w-full p-2 border" onChange={e => setSelectedMonth(e.target.value)}>
          <option value="">All Months</option>
          <option value="0">Jan</option>
          <option value="1">Feb</option>
          <option value="2">Mar</option>
          <option value="3">Apr</option>
          <option value="4">May</option>
          <option value="5">Jun</option>
          <option value="6">Jul</option>
          <option value="7">Aug</option>
          <option value="8">Sep</option>
          <option value="9">Oct</option>
          <option value="10">Nov</option>
          <option value="11">Dec</option>
        </select>
      </div>

      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <input className="w-full border p-2 mb-3" placeholder="Title"
          value={title} onChange={(e) => setTitle(e.target.value)} />

        <input className="w-full border p-2 mb-3" placeholder="Amount"
          value={amount} onChange={(e) => setAmount(e.target.value)} />

        <input className="w-full border p-2 mb-3" placeholder="Category"
          value={category} onChange={(e) => setCategory(e.target.value)} />

        <button onClick={addExpense}
          className="w-full bg-blue-500 text-white p-2 rounded">
          {editId ? "Update Expense" : "Add Expense"}
        </button>
      </div>
      {/* 🤖 AI INSIGHT */}
      <div className="max-w-md mx-auto mt-6 bg-purple-500 text-white p-4 rounded shadow">
        <h3 className="text-center mb-2 font-semibold">💡 Smart Insight</h3>
        <p className="text-center">
          {loading ? "Analyzing..." : insight}
        </p>

        <button
          onClick={getAIInsight}
          className="mt-3 w-full bg-white text-purple-600 py-1 rounded"
        >
          Refresh Insight
        </button>
      </div>

      {/* 📊 CHART */}
      <div className="max-w-md mx-auto mt-6 bg-white p-4 rounded shadow">
        <h3 className="text-center mb-2 font-semibold">Category Analysis</h3>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LIST */}
      <div className="max-w-md mx-auto mt-6 space-y-4">
        {filteredExpenses.map(item => (
          <div key={item.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center">

            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-gray-600">
                ₹{item.amount} • {item.category}
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => editExpense(item)}
                className="px-3 py-1 bg-yellow-400 text-white rounded">
                Edit
              </button>

              <button onClick={() => deleteExpense(item.id)}
                className="px-3 py-1 bg-red-500 text-white rounded">
                Delete
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default App;

