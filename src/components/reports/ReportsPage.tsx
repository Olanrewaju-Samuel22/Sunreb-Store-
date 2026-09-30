import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDate, formatDateTime } from '../../lib/format.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  CreditCard,
  Layers,
  Filter,
} from 'lucide-react';

type ReportTab = 'sales' | 'profit' | 'stock' | 'expiry' | 'debtors' | 'expenses';

export const ReportsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<ReportTab>('sales');

  // Date filters
  const [datePreset, setDatePreset] = useState<'today' | '7days' | 'month' | 'all' | 'custom'>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Batches, products, debtors supplementary data
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allDebtors, setAllDebtors] = useState<any[]>([]);

  useEffect(() => {
    applyDatePreset('7days');
  }, []);

  const applyDatePreset = (preset: 'today' | '7days' | 'month' | 'all' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      loadReport(todayStr, todayStr);
    } else if (preset === '7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStartDate(past7);
      setEndDate(todayStr);
      loadReport(past7, todayStr);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(startOfMonth);
      setEndDate(todayStr);
      loadReport(startOfMonth, todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      loadReport('', '');
    }
  };

  const loadReport = async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const [rep, bList, pList, dList] = await Promise.all([
        api.getReports(start || undefined, end || undefined),
        api.getBatches(),
        api.getProducts(),
        api.getDebtors(),
      ]);
      setReportData(rep);
      setAllBatches(bList);
      setAllProducts(pList);
      setAllDebtors(dList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDatePreset('custom');
    loadReport(startDate, endDate);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0f2942]" />
            <span>Management &amp; Financial Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit sales performance, FEFO margins, stock expiry risk, and debtor reconciliation
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-200 transition-colors"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print / Export Report</span>
        </button>
      </div>

      {/* Date Filter Controls */}
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date:
          </span>
          <button
            onClick={() => applyDatePreset('today')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              datePreset === 'today'
                ? 'bg-[#0f2942] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => applyDatePreset('7days')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              datePreset === '7days'
                ? 'bg-[#0f2942] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => applyDatePreset('month')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              datePreset === 'month'
                ? 'bg-[#0f2942] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => applyDatePreset('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              datePreset === 'all'
                ? 'bg-[#0f2942] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Custom Date Form */}
        <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-1.5 text-xs w-full md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1 px-2 border border-slate-200 rounded text-xs"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1 px-2 border border-slate-200 rounded text-xs"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#0f2942] text-white rounded text-xs font-medium hover:bg-[#153a5b]"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Report Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-3 pt-2 rounded-t-lg gap-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setCurrentTab('sales')}
          className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'sales'
              ? 'border-[#0f2942] text-[#0f2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales &amp; Revenue</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setCurrentTab('profit')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'profit'
                ? 'border-[#0f2942] text-[#0f2942]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Profit &amp; Net Income</span>
          </button>
        )}

        <button
          onClick={() => setCurrentTab('stock')}
          className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'stock'
              ? 'border-[#0f2942] text-[#0f2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock &amp; Valuation</span>
        </button>

        <button
          onClick={() => setCurrentTab('expiry')}
          className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'expiry'
              ? 'border-[#0f2942] text-[#0f2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Expiry Risk (FEFO)</span>
        </button>

        <button
          onClick={() => setCurrentTab('debtors')}
          className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'debtors'
              ? 'border-[#0f2942] text-[#0f2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Debts &amp; Collections</span>
        </button>

        <button
          onClick={() => setCurrentTab('expenses')}
          className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'expenses'
              ? 'border-[#0f2942] text-[#0f2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Operating Expenses</span>
        </button>
      </div>

      {/* Main Report Body */}
      {isLoading || !reportData ? (
        <div className="bg-white p-12 border border-slate-200 rounded-b-lg text-center text-xs text-slate-400">
          Generating financial and operational reports...
        </div>
      ) : (
        <div className="space-y-4">
          {/* TAB 1: SALES & REVENUE */}
          {currentTab === 'sales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">
                    Total Period Sales
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {formatNaira(reportData.summary.total_revenue)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {reportData.summary.total_sales_count} receipts issued
                  </div>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">
                    Debt Recoveries
                  </div>
                  <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
                    {formatNaira(reportData.summary.total_debt_collected)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Part payments settled in period
                  </div>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">
                    Average Basket Value
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {reportData.summary.total_sales_count > 0
                      ? formatNaira(
                          reportData.summary.total_revenue / reportData.summary.total_sales_count
                        )
                      : '₦0.00'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Per transaction</div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                <h3 className="text-xs font-bold uppercase text-slate-800 mb-3">
                  Payment Channels Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['cash', 'transfer', 'pos', 'credit'].map((method) => {
                    const data = reportData.payment_methods[method] || { count: 0, total: 0 };
                    return (
                      <div key={method} className="p-3 bg-slate-50 border border-slate-200 rounded">
                        <div className="text-[11px] uppercase font-bold text-slate-600">
                          {method === 'credit' ? 'Credit / Debt' : method}
                        </div>
                        <div className="text-base font-bold text-slate-900 font-mono mt-1">
                          {formatNaira(data.total)}
                        </div>
                        <div className="text-[10px] text-slate-500">{data.count} transactions</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-800">
                  Top Selling Products in Selected Period
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3 text-center">Qty Sold</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {reportData.top_products.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400">
                            No sales in selected date range
                          </td>
                        </tr>
                      ) : (
                        reportData.top_products.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                            <td className="py-2 px-3 text-center">{p.quantity}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                              {formatNaira(p.revenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFIT & NET INCOME (Admin only) */}
          {currentTab === 'profit' && isAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">Gross Revenue</div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {formatNaira(reportData.summary.total_revenue)}
                  </div>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">
                    Cost of Goods (FEFO)
                  </div>
                  <div className="text-lg font-bold text-slate-700 font-mono mt-1">
                    -{formatNaira(reportData.summary.total_cogs)}
                  </div>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">
                    Gross Margin / Profit
                  </div>
                  <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
                    {formatNaira(reportData.summary.gross_profit)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {reportData.summary.total_revenue > 0
                      ? `${(
                          (reportData.summary.gross_profit / reportData.summary.total_revenue) *
                          100
                        ).toFixed(1)}% margin`
                      : '0%'}
                  </div>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">Net Income</div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      reportData.summary.net_profit >= 0 ? 'text-purple-700' : 'text-rose-600'
                    }`}
                  >
                    {formatNaira(reportData.summary.net_profit)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Gross profit minus {formatNaira(reportData.summary.total_expenses)} expenses
                  </div>
                </div>
              </div>

              {/* Profit & Loss Statement Summary */}
              <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-2xs">
                <h3 className="text-xs font-bold uppercase text-slate-900 mb-4 pb-2 border-b border-slate-200">
                  Income Statement Summary ({startDate || 'All Time'} to {endDate || 'Today'})
                </h3>
                <div className="space-y-2.5 max-w-lg text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">Total Sales Revenue:</span>
                    <span className="font-bold text-slate-900">
                      {formatNaira(reportData.summary.total_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Less: Cost of Goods Sold (Actual Batch Deduction):</span>
                    <span>-{formatNaira(reportData.summary.total_cogs)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 font-bold text-emerald-800 bg-emerald-50/50 px-2 rounded">
                    <span>Gross Operating Profit:</span>
                    <span>{formatNaira(reportData.summary.gross_profit)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                    <span>Less: Operating Overhead Expenses:</span>
                    <span>-{formatNaira(reportData.summary.total_expenses)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-900 font-bold text-sm bg-purple-50 px-2 rounded text-purple-900">
                    <span>NET PROFIT / (LOSS):</span>
                    <span>{formatNaira(reportData.summary.net_profit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STOCK & VALUATION */}
          {currentTab === 'stock' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-800">
                  Current Inventory Master &amp; Valuation
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-center">Remaining Stock</th>
                        <th className="py-2.5 px-3 text-right">Selling Price</th>
                        <th className="py-2.5 px-3 text-right">Retail Value</th>
                        {isAdmin && <th className="py-2.5 px-3 text-right">Cost Value</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {allProducts.map((p) => {
                        const stock = p.total_stock || 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                            <td className="py-2 px-3 text-slate-500">{p.category_name || '—'}</td>
                            <td className="py-2 px-3 text-center font-bold">
                              {stock} {p.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatNaira(p.selling_price)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                              {formatNaira(stock * p.selling_price)}
                            </td>
                            {isAdmin && (
                              <td className="py-2 px-3 text-right text-slate-600 font-mono">
                                {formatNaira(stock * p.cost_price)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPIRY RISK (FEFO) */}
          {currentTab === 'expiry' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-800">
                  Batches Expiration Audit (Sorted Earliest Expiry First)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Batch No</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-center">Remaining</th>
                        <th className="py-2.5 px-3">Expiry Date</th>
                        <th className="py-2.5 px-3">Days Left</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {allBatches
                        .filter((b) => b.qty_remaining > 0 && b.expiry_date)
                        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                        .map((b) => {
                          const now = new Date();
                          const exp = new Date(b.expiry_date);
                          const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          const isExpired = daysLeft < 0;
                          const isWarning = daysLeft >= 0 && daysLeft <= 60;
                          return (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                {b.batch_number}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-800">{b.product_name}</td>
                              <td className="py-2 px-3 text-center font-bold">{b.qty_remaining}</td>
                              <td className="py-2 px-3 text-slate-700">{formatDate(b.expiry_date)}</td>
                              <td className="py-2 px-3 font-bold font-mono">
                                {isExpired ? (
                                  <span className="text-rose-600">Expired ({Math.abs(daysLeft)}d ago)</span>
                                ) : (
                                  <span className={isWarning ? 'text-amber-600' : 'text-slate-700'}>
                                    {daysLeft} days
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                    isExpired
                                      ? 'bg-rose-100 text-rose-700'
                                      : isWarning
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {isExpired ? 'Urgent: Expired' : isWarning ? 'Warning' : 'Good'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEBTS & COLLECTIONS */}
          {currentTab === 'debtors' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-800">
                  Debtors Aging &amp; Recovery Status
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Debtor Customer</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3 text-center">Unsettled Sales Count</th>
                        <th className="py-2.5 px-3 text-right">Total Debt</th>
                        <th className="py-2.5 px-3">Last Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {allDebtors.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            Zero outstanding customer balances
                          </td>
                        </tr>
                      ) : (
                        allDebtors.map((d) => (
                          <tr key={d.customer.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{d.customer.name}</td>
                            <td className="py-2 px-3 text-slate-600 font-mono">
                              {d.customer.phone || '—'}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{d.sales.length}</td>
                            <td className="py-2 px-3 text-right font-bold text-rose-600 font-mono">
                              {formatNaira(d.total_debt)}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {d.last_payment
                                ? `${formatNaira(d.last_payment.amount)} on ${formatDate(
                                    d.last_payment.paid_at
                                  )}`
                                : 'No payments yet'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OPERATING EXPENSES */}
          {currentTab === 'expenses' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-800">
                  Expenses Log in Selected Period ({formatNaira(reportData.summary.total_expenses)})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {reportData.expenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No expenses recorded in this period
                          </td>
                        </tr>
                      ) : (
                        reportData.expenses.map((e: any) => (
                          <tr key={e.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-slate-600">{formatDate(e.expense_date)}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{e.category}</td>
                            <td className="py-2 px-3 text-slate-600">{e.description || '—'}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                              {formatNaira(e.amount)}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{e.recorded_by_name || 'Staff'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
