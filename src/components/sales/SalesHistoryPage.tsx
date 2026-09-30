import React, { useState, useEffect } from 'react';
import { Sale } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDateTime, getStatusBadgeClass } from '../../lib/format.ts';
import { ReceiptModal } from '../pos/ReceiptModal.tsx';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Selected sale for viewing or reprinting
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [reprintSale, setReprintSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSales();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = sales.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.payment_status === statusFilter;
    const matchesMethod = methodFilter === 'all' || s.payment_method === methodFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus && matchesMethod;
    return (
      matchesStatus &&
      matchesMethod &&
      (s.receipt_no.toLowerCase().includes(q) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        s.cashier_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#0f2942]" />
            <span>Sales History &amp; Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full ledger of customer transactions, payment breakdowns, and receipt reprinting
          </p>
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
            placeholder="Search receipt number, customer, or cashier..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial Payment</option>
          <option value="unpaid">Unpaid / Debt</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
        >
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="transfer">Bank Transfer</option>
          <option value="pos">POS Card</option>
          <option value="credit">Credit (On Account)</option>
        </select>
      </div>

      {/* Sales List Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading sales records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No sales recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Sales made through the POS register will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Cashier</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Method</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {sale.receipt_no}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {formatDateTime(sale.created_at)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {sale.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 capitalize">{sale.cashier_name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatNaira(sale.total)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-mono font-medium">
                      {formatNaira(sale.amount_paid)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {sale.balance > 0 ? (
                        <span className="text-rose-600 font-bold">{formatNaira(sale.balance)}</span>
                      ) : (
                        <span className="text-slate-400">₦0.00</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center uppercase text-[10px] font-semibold text-slate-700">
                      {sale.payment_method}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${getStatusBadgeClass(
                          sale.payment_status
                        )}`}
                      >
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReprintSale(sale)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium rounded transition-colors"
                          title="Reprint Receipt"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Reprint</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-900">
                  Sale Breakdown: {selectedSale.receipt_no}
                </h3>
                <p className="text-[10px] text-slate-500">{formatDateTime(selectedSale.created_at)}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200 gap-1.5">
                <div>
                  <span className="text-slate-500">Customer:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedSale.customer_name || 'Walk-in'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Cashier:</span>{' '}
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedSale.cashier_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Payment:</span>{' '}
                  <span className="uppercase font-semibold text-slate-800">
                    {selectedSale.payment_method}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <span className="uppercase font-semibold text-slate-800">
                    {selectedSale.payment_status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Item</th>
                      <th className="py-2 px-2.5">Batch</th>
                      <th className="py-2 px-2.5 text-center">Qty</th>
                      <th className="py-2 px-2.5 text-right">Price</th>
                      <th className="py-2 px-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {selectedSale.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-2.5 font-medium text-slate-900">{item.product_name}</td>
                        <td className="py-2 px-2.5 text-slate-500 font-mono text-[10px]">
                          {item.batch_number || '—'}
                        </td>
                        <td className="py-2 px-2.5 text-center">{item.quantity}</td>
                        <td className="py-2 px-2.5 text-right">{formatNaira(item.unit_price)}</td>
                        <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                          {formatNaira(item.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatNaira(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatNaira(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Grand Total:</span>
                  <span>{formatNaira(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Amount Paid:</span>
                  <span>{formatNaira(selectedSale.amount_paid)}</span>
                </div>
                {selectedSale.balance > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                    <span>Remaining Debt:</span>
                    <span>{formatNaira(selectedSale.balance)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const toPrint = selectedSale;
                  setSelectedSale(null);
                  setReprintSale(toPrint);
                }}
                className="px-3 py-1.5 bg-[#0f2942] text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reprint Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      {reprintSale && (
        <ReceiptModal
          sale={reprintSale}
          onClose={() => setReprintSale(null)}
          isReprint={true}
        />
      )}
    </div>
  );
};
