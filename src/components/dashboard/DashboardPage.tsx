import React, { useState, useEffect } from 'react';
import { DashboardMetrics } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDate, formatDateTime, getStatusBadgeClass } from '../../lib/format.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Package,
  Layers,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboard();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Welcome & Summary Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#0f2942]" />
            <span>Store Operations Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance for SUNREB GEO-VISION AND GROCERIES MULTIVENTURE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS Register</span>
          </button>
          <button
            onClick={() => onNavigate('batches')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Receive Stock</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Today's Revenue */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today&apos;s Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {formatNaira(metrics.today_revenue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Completed sales:</span>
            <span className="font-semibold text-slate-700">{metrics.today_sales_count}</span>
          </div>
        </div>

        {/* Metric 2: Cash Collected Today */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cash Collected</span>
            <ShoppingCart className="w-4 h-4 text-[#0f2942]" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {formatNaira(metrics.today_cash_collected)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Sales tenders + debt recoveries
          </div>
        </div>

        {/* Metric 3: Today's Profit (Admin only) or Stock Retail Value (Cashier) */}
        {isAdmin ? (
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Today&apos;s Gross Profit
              </span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-700 font-mono">
              {formatNaira(metrics.today_profit)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Revenue minus FEFO batch costs
            </div>
          </div>
        ) : (
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Stock Valuation</span>
              <Package className="w-4 h-4 text-[#0f2942]" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {formatNaira(metrics.stock_valuation_retail)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">At current retail prices</div>
          </div>
        )}

        {/* Metric 4: Outstanding Customer Debts */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Outstanding Debts
            </span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-600 font-mono">
            {formatNaira(metrics.total_outstanding_debt)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <button
              onClick={() => onNavigate('debtors')}
              className="text-[#0f2942] hover:underline font-semibold"
            >
              View debtors ledger →
            </button>
          </div>
        </div>
      </div>

      {/* Admin Valuation Bar */}
      {isAdmin && (
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-700" />
            <span className="font-semibold text-slate-800">Total Inventory Valuation:</span>
            <span className="text-slate-600">
              Cost: <strong className="font-mono text-slate-900">{formatNaira(metrics.stock_valuation_cost)}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              Retail: <strong className="font-mono text-slate-900">{formatNaira(metrics.stock_valuation_retail)}</strong>
            </span>
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold">
            Potential Margin: {formatNaira(metrics.stock_valuation_retail - metrics.stock_valuation_cost)}
          </div>
        </div>
      )}

      {/* Critical Stock & Expiry Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Alerts */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Stock Alerts ({metrics.low_stock_count})</span>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <span>View catalog</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {metrics.low_stock_products.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              All active products are adequately stocked above reorder thresholds.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {metrics.low_stock_products.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="text-[10px] text-slate-500">
                      Reorder level: {p.reorder_level} {p.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        (p.total_stock || 0) === 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {(p.total_stock || 0) === 0 ? 'Out of Stock' : `${p.total_stock} ${p.unit} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon Alerts (FEFO Vigilance) */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
              <Clock className="w-4 h-4 text-rose-500" />
              <span>Batches Expiring Soon ({metrics.expiring_batches_count})</span>
            </div>
            <button
              onClick={() => onNavigate('batches')}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <span>View batches</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {metrics.expiring_batches.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No batches near expiration in inventory.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {metrics.expiring_batches.map((b) => (
                <div key={b.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{b.product_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Batch: {b.batch_number} • Qty remaining: {b.qty_remaining}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        b.days_left < 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {b.days_left < 0
                        ? `Expired (${Math.abs(b.days_left)}d ago)`
                        : `${b.days_left} days left`}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Exp: {formatDate(b.expiry_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold uppercase text-slate-800">Recent Sales Activity</div>
          <button
            onClick={() => onNavigate('sales')}
            className="text-[11px] text-[#0f2942] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Full Sales Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {metrics.recent_sales.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No sales recorded yet today.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="py-2 px-3">Receipt No</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Cashier</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {metrics.recent_sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {sale.receipt_no}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{formatDateTime(sale.created_at)}</td>
                    <td className="py-2 px-3 text-slate-800">{sale.customer_name || 'Walk-in'}</td>
                    <td className="py-2 px-3 text-slate-600 capitalize">{sale.cashier_name}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatNaira(sale.total)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${getStatusBadgeClass(
                          sale.payment_status
                        )}`}
                      >
                        {sale.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
