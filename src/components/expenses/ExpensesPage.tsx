import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDate } from '../../lib/format.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DollarSign, Plus, Search, Trash2, X, Calendar, Filter } from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
  'Transport',
  'Electricity',
  'Staff',
  'Rent',
  'Packaging',
  'Repairs',
  'Marketing',
  'Supplier-related',
  'Other',
];

export const ExpensesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Expense Form
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    category: 'Transport' as ExpenseCategory,
    description: '',
    amount: '',
    payment_method: 'cash',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (amt <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }
    try {
      await api.createExpense({
        expense_date: form.expense_date,
        category: form.category,
        description: form.description,
        amount: amt,
        payment_method: form.payment_method,
      });
      setShowAddModal(false);
      setForm({
        expense_date: new Date().toISOString().slice(0, 10),
        category: 'Transport',
        description: '',
        amount: '',
        payment_method: 'cash',
      });
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesCat = selectedCat === 'all' || e.category === selectedCat;
    const q = search.toLowerCase().trim();
    if (!q) return matchesCat;
    return (
      matchesCat &&
      ((e.description && e.description.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q) ||
        (e.recorded_by_name && e.recorded_by_name.toLowerCase().includes(q)))
    );
  });

  const totalExpenseAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#0f2942]" />
            <span>Store Operating Expenses</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log overheads, utilities, logistics, repairs, and miscellaneous operational costs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 uppercase">Total Logged:</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {formatNaira(totalExpenseAmount)}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0f2942] hover:bg-[#153a5b] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, category, staff..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading expense logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DollarSign className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No expenses recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;Record Expense&quot; to log shop expenses and overhead costs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Payment Method</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  {isAdmin && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {formatDate(item.expense_date)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{item.description || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatNaira(item.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center uppercase text-[10px] font-medium text-slate-500">
                      {item.payment_method || 'Cash'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {item.recorded_by_name || 'Staff'}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-900">Record Shop Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Expense Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0f2942]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="pos">POS Card</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Description / Details
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Generator petrol purchase, shop repairs..."
                  className="w-full text-xs p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2942] hover:bg-[#153a5b] text-white rounded text-xs font-semibold shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
