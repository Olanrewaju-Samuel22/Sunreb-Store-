import React from 'react';
import { Sale } from '../../types/index.ts';
import { formatNaira, formatDateTime } from '../../lib/format.ts';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
  isReprint?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, isReprint = false }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden my-6">
        {/* Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isReprint ? 'Reprint Sales Receipt' : 'Sale Completed Successfully'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Container */}
        <div className="p-6 bg-white text-slate-900 font-mono text-xs" id="printable-receipt">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-400">
            <h2 className="text-sm font-bold tracking-tight uppercase text-black leading-snug">
              SUNREB GEO-VISION &amp; GROCERIES
            </h2>
            <p className="text-[11px] font-semibold text-slate-700 uppercase">MULTIVENTURE</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Drinks &amp; Groceries Retail Store</p>
            <p className="text-[10px] text-slate-600">WhatsApp / Tel: +234 803 505 5041</p>
            {isReprint && (
              <span className="inline-block mt-1 px-1.5 py-0.5 border border-black text-[9px] uppercase font-bold">
                *** REPRINT ***
              </span>
            )}
          </div>

          {/* Receipt Info */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Receipt No:</span>
              <span className="font-bold">{sale.receipt_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date &amp; Time:</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cashier:</span>
              <span className="capitalize">{sale.cashier_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Customer:</span>
              <span className="font-medium">{sale.customer_name || 'Walk-in Customer'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-400">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] text-slate-600 uppercase">
                  <th className="pb-1 font-semibold">Item</th>
                  <th className="pb-1 text-center font-semibold">Qty</th>
                  <th className="pb-1 text-right font-semibold">Price</th>
                  <th className="pb-1 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item) => (
                    <tr key={item.id} className="py-1">
                      <td className="py-1 font-medium pr-1 max-w-[140px] truncate">
                        {item.product_name}
                        {item.batch_number && (
                          <div className="text-[9px] text-slate-500 font-normal">
                            Batch: {item.batch_number}
                          </div>
                        )}
                      </td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">{formatNaira(item.unit_price)}</td>
                      <td className="py-1 text-right font-semibold">{formatNaira(item.line_total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-2 text-center text-slate-400">
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payments */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span>{formatNaira(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-{formatNaira(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-black pt-1 border-t border-slate-200">
              <span>GRAND TOTAL:</span>
              <span>{formatNaira(sale.total)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Payment Method:</span>
              <span className="uppercase font-semibold">{sale.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Amount Paid:</span>
              <span className="font-semibold">{formatNaira(sale.amount_paid)}</span>
            </div>
            <div className="flex justify-between text-black font-semibold">
              <span>{sale.balance > 0 ? 'Balance / Debt Due:' : 'Change Given:'}</span>
              <span className={sale.balance > 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                {sale.balance > 0
                  ? formatNaira(sale.balance)
                  : formatNaira(Math.max(0, sale.amount_paid - sale.total))}
              </span>
            </div>
            {sale.balance > 0 && sale.due_date && (
              <div className="flex justify-between text-[10px] text-amber-700">
                <span>Payment Due Date:</span>
                <span>{sale.due_date}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 pb-2 space-y-1">
            <p className="font-semibold text-slate-800 text-[11px]">Thank you for your patronage!</p>
            <p className="text-[10px] text-slate-500">Goods sold in good condition are not returnable</p>
            <div className="pt-2 flex items-center justify-center">
              <div className="text-[9px] tracking-widest text-slate-400 font-mono">
                * * * SUNREB POS SYSTEM * * *
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 border-t border-slate-200 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0f2942] hover:bg-[#153a5b] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt (Thermal / A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
