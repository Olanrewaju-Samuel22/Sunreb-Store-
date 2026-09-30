import React, { useState, useEffect } from 'react';
import { StockBatch, Product, Supplier } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDate } from '../../lib/format.ts';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Truck,
  X,
  Clock,
} from 'lucide-react';

interface StockReceivingPageProps {
  initialProductId?: string;
}

export const StockReceivingPage: React.FC<StockReceivingPageProps> = ({ initialProductId }) => {
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || 'all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [form, setForm] = useState({
    product_id: initialProductId || '',
    supplier_id: '',
    batch_number: '',
    qty_received: 10,
    cost_price: 0,
    selling_price: 0,
    production_date: '',
    expiry_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
      setForm((prev) => ({ ...prev, product_id: initialProductId }));
    }
  }, [initialProductId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [batchList, prodList, suppList] = await Promise.all([
        api.getBatches(),
        api.getProducts(),
        api.getSuppliers(),
      ]);
      setBatches(batchList);
      setProducts(prodList);
      setSuppliers(suppList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = (prodId?: string) => {
    const targetProd = products.find((p) => p.id === (prodId || selectedProductId || products[0]?.id));
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const defaultBatchNo = `BCH-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    setForm({
      product_id: targetProd ? targetProd.id : products[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
      batch_number: defaultBatchNo,
      qty_received: 10,
      cost_price: targetProd?.cost_price || 0,
      selling_price: targetProd?.selling_price || 0,
      production_date: '',
      expiry_date: '',
    });
    setShowAddModal(true);
  };

  const handleProductChange = (prodId: string) => {
    const p = products.find((prod) => prod.id === prodId);
    setForm((prev) => ({
      ...prev,
      product_id: prodId,
      cost_price: p?.cost_price || prev.cost_price,
      selling_price: p?.selling_price || prev.selling_price,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.batch_number || form.qty_received <= 0) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.createBatch({
        product_id: form.product_id,
        supplier_id: form.supplier_id || undefined,
        batch_number: form.batch_number.trim(),
        qty_received: Number(form.qty_received),
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        production_date: form.production_date || undefined,
        expiry_date: form.expiry_date || undefined,
      });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record stock batch');
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesProduct = selectedProductId === 'all' || b.product_id === selectedProductId;
    const q = search.toLowerCase().trim();
    if (!q) return matchesProduct;
    return (
      matchesProduct &&
      (b.batch_number.toLowerCase().includes(q) ||
        (b.product_name && b.product_name.toLowerCase().includes(q)) ||
        (b.supplier_name && b.supplier_name.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0f2942]" />
            <span>Stock Receiving &amp; Batch Management (FEFO)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log shipments by batch. POS checkout automatically deducts from the earliest expiry batch first.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0f2942] hover:bg-[#153a5b] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Receive New Stock Batch</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch number, product, or supplier..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>

        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
        >
          <option value="all">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading stock batches...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No stock batches recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;Receive New Stock Batch&quot; to intake inventory with batch number and expiry dates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-center">Remaining / Received</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Received At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => {
                  const isExhausted = b.qty_remaining <= 0;
                  // Expiry evaluation
                  let expiryStatus: 'safe' | 'warning' | 'expired' = 'safe';
                  let daysLeft = 999;
                  if (b.expiry_date) {
                    const exp = new Date(b.expiry_date);
                    const now = new Date();
                    daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysLeft < 0) expiryStatus = 'expired';
                    else if (daysLeft <= 60) expiryStatus = 'warning';
                  }

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isExhausted ? 'opacity-50 bg-slate-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {b.batch_number}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{b.product_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{b.supplier_name || 'Direct / General'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            isExhausted
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {b.qty_remaining} / {b.qty_received}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                        {formatNaira(b.cost_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatNaira(b.selling_price)}
                      </td>
                      <td className="py-2.5 px-3">
                        {b.expiry_date ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                              expiryStatus === 'expired'
                                ? 'bg-rose-100 text-rose-700'
                                : expiryStatus === 'warning'
                                ? 'bg-amber-100 text-amber-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {expiryStatus === 'expired' && <AlertTriangle className="w-3 h-3" />}
                            {formatDate(b.expiry_date)}
                            {expiryStatus === 'expired' && ' (Expired)'}
                            {expiryStatus === 'warning' && ` (${daysLeft}d left)`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Expiry</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {formatDate(b.received_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Intake Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Intake Stock Batch (FEFO Receiving)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Target Product *
                </label>
                <select
                  required
                  value={form.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="">Select product to receive</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.batch_number}
                    onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                    placeholder="e.g. BCH-20260930-01"
                    className="w-full text-xs p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Supplier</label>
                  <select
                    value={form.supplier_id}
                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="">Direct / Walk-in Purchase</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.company ? `(${s.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Qty Received *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.qty_received}
                    onChange={(e) => setForm({ ...form, qty_received: Number(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Batch Cost (₦) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Selling Price (₦) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-300 rounded font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Production Date
                  </label>
                  <input
                    type="date"
                    value={form.production_date}
                    onChange={(e) => setForm({ ...form, production_date: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1 text-emerald-800">
                    Expiry Date (For FEFO Priority) *
                  </label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full text-xs p-2 border border-emerald-300 bg-emerald-50/40 rounded"
                  />
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">FEFO Note:</span> Batches with the nearest
                expiry dates are automatically chosen first during POS checkout to prevent goods from
                spoiling in stock.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2942] hover:bg-[#153a5b] text-white rounded text-xs font-semibold shadow-xs"
                >
                  Commit Batch to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
