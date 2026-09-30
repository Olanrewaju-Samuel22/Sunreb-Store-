import React, { useState, useEffect } from 'react';
import { Customer, Sale, DebtPayment } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDate, formatDateTime } from '../../lib/format.ts';
import {
  CreditCard,
  Search,
  DollarSign,
  History,
  MessageCircle,
  PlusCircle,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const DebtorsPage: React.FC = () => {
  const [debtors, setDebtors] = useState<
    { customer: Customer; total_debt: number; sales: Sale[]; last_payment?: DebtPayment }[]
  >([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Payment Modal
  const [payingDebtor, setPayingDebtor] = useState<{
    customer: Customer;
    sale: Sale;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History Modal
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [customerPayments, setCustomerPayments] = useState<DebtPayment[]>([]);

  useEffect(() => {
    loadDebtors();
  }, []);

  const loadDebtors = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDebtors();
      setDebtors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPayment = (customer: Customer, sale: Sale) => {
    setPayingDebtor({ customer, sale });
    setPaymentAmount(String(sale.balance));
    setPaymentMethod('cash');
  };

  const handleOpenHistory = async (customer: Customer) => {
    setHistoryCustomer(customer);
    try {
      const payments = await api.getDebtPayments(customer.id);
      setCustomerPayments(payments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebtor) return;
    const amount = Number(paymentAmount);
    if (amount <= 0 || amount > payingDebtor.sale.balance) {
      alert(`Invalid amount. Must be between ₦1 and ₦${payingDebtor.sale.balance}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.recordDebtPayment({
        sale_id: payingDebtor.sale.id,
        customer_id: payingDebtor.customer.id,
        amount,
        payment_method: paymentMethod,
      });
      setPayingDebtor(null);
      loadDebtors();
    } catch (err: any) {
      alert(err.message || 'Failed to record debt payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppReminderUrl = (customer: Customer, totalDebt: number) => {
    if (!customer.phone) return '#';
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const intPhone = cleanPhone.startsWith('0') ? `234${cleanPhone.slice(1)}` : cleanPhone;
    const message = encodeURIComponent(
      `Hello ${customer.name}, this is a gentle reminder from SUNREB GEO-VISION AND GROCERIES regarding your outstanding account balance of ${formatNaira(
        totalDebt
      )}. Please let us know when payment will be settled. Thank you for your business!`
    );
    return `https://wa.me/${intPhone}?text=${message}`;
  };

  const totalOutstanding = debtors.reduce((sum, d) => sum + d.total_debt, 0);

  const filtered = debtors.filter((d) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      d.customer.name.toLowerCase().includes(q) ||
      (d.customer.phone && d.customer.phone.includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0f2942]" />
            <span>Debtors &amp; Credit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track credit sales, record part payments, and monitor due dates
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-lg flex items-center gap-3">
          <div className="text-[11px] font-semibold text-rose-700 uppercase">
            Total Outstanding Debts
          </div>
          <div className="text-base font-bold text-rose-700 font-mono">
            {formatNaira(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search debtor by customer name or phone number..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>
      </div>

      {/* Debtors List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-xs text-slate-400">
            Loading debtor records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 stroke-1 mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-700">No outstanding customer debts!</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Sales completed on credit or with partial payment will automatically show up here.
            </p>
          </div>
        ) : (
          filtered.map((debtor) => (
            <div
              key={debtor.customer.id}
              className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden"
            >
              {/* Customer Row Header */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs uppercase">
                    {debtor.customer.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{debtor.customer.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      {debtor.customer.phone && <span>Tel: {debtor.customer.phone}</span>}
                      {debtor.customer.address && <span>• {debtor.customer.address}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Total Debt Balance
                    </span>
                    <span className="text-sm font-bold text-rose-600 font-mono">
                      {formatNaira(debtor.total_debt)}
                    </span>
                  </div>

                  {debtor.customer.phone && (
                    <a
                      href={getWhatsAppReminderUrl(debtor.customer, debtor.total_debt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition-colors"
                      title="Send WhatsApp Payment Reminder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenHistory(debtor.customer)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1 border border-slate-200"
                    title="View Payment History"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </button>
                </div>
              </div>

              {/* Sub-table: Unsettled Sales for this Customer */}
              <div className="p-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-100">
                      <th className="pb-1.5 font-semibold">Receipt No</th>
                      <th className="pb-1.5 font-semibold">Sale Date</th>
                      <th className="pb-1.5 font-semibold">Due Date</th>
                      <th className="pb-1.5 text-right font-semibold">Original Total</th>
                      <th className="pb-1.5 text-right font-semibold">Amount Paid</th>
                      <th className="pb-1.5 text-right font-semibold">Balance Due</th>
                      <th className="pb-1.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {debtor.sales.map((sale) => {
                      const isOverdue =
                        sale.due_date && new Date(sale.due_date).getTime() < new Date().getTime();
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/50">
                          <td className="py-2 font-mono font-semibold text-slate-800">
                            {sale.receipt_no}
                          </td>
                          <td className="py-2 text-slate-600">{formatDate(sale.created_at)}</td>
                          <td className="py-2">
                            {sale.due_date ? (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  isOverdue ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-700'
                                }`}
                              >
                                {formatDate(sale.due_date)} {isOverdue && '(Overdue)'}
                              </span>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                          <td className="py-2 text-right text-slate-700 font-mono">
                            {formatNaira(sale.total)}
                          </td>
                          <td className="py-2 text-right text-emerald-700 font-mono">
                            {formatNaira(sale.amount_paid)}
                          </td>
                          <td className="py-2 text-right font-bold text-rose-600 font-mono">
                            {formatNaira(sale.balance)}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => handleOpenPayment(debtor.customer, sale)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>Record Payment</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Payment Modal */}
      {payingDebtor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-900">Record Part Payment</h3>
              <button
                onClick={() => setPayingDebtor(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800">
                    {payingDebtor.customer.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Ref:</span>
                  <span className="font-mono text-slate-800">
                    {payingDebtor.sale.receipt_no}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                  <span>Current Balance Due:</span>
                  <span>{formatNaira(payingDebtor.sale.balance)}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Payment Amount (₦) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingDebtor.sale.balance}
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0f2942]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="pos">POS Card</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayingDebtor(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Payment History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-900">Payment Audit Trail</h3>
                <p className="text-[10px] text-slate-500">{historyCustomer.name}</p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {customerPayments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No payment history recorded for this customer.
                </div>
              ) : (
                customerPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 font-mono">
                        {formatNaira(p.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Method: <span className="uppercase font-medium">{p.payment_method}</span> •
                        Ref: {p.receipt_no}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <div>{formatDateTime(p.paid_at)}</div>
                      <div>By: {p.recorded_by_name || 'Staff'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 mt-3">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
