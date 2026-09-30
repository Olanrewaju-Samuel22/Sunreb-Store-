import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product, Customer } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDate, getStatusBadgeClass } from '../../lib/format.ts';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle,
  Clock,
  X,
  Trash2,
} from 'lucide-react';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready',
  'completed',
  'cancelled',
];

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Order Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([]);
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [notes, setNotes] = useState('');

  // Status Update Modal
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [newAmountPaid, setNewAmountPaid] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orderList, prodList, custList] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers(),
      ]);
      setOrders(orderList);
      setProducts(prodList);
      setCustomers(custList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItemToOrder = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setOrderItems((prev) => [
      ...prev,
      { product_id: prod.id, quantity: 1, unit_price: prod.selling_price },
    ]);
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Please add at least one product item to the order');
      return;
    }
    try {
      await api.createOrder({
        customer_id: selectedCustomerId || undefined,
        items: orderItems,
        amount_paid: Number(amountPaid) || 0,
        notes,
      });
      setShowAddModal(false);
      setOrderItems([]);
      setAmountPaid('0');
      setNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrder) return;
    try {
      await api.updateOrderStatus(
        updatingOrder.id,
        newStatus,
        newAmountPaid !== '' ? Number(newAmountPaid) : undefined
      );
      setUpdatingOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus;
    return (
      matchesStatus &&
      (o.order_no.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.notes && o.notes.toLowerCase().includes(q)))
    );
  });

  const orderSubtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#0f2942]" />
            <span>Customer Pre-Orders &amp; Bookings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage advance bulk orders, event drink reservations, and fulfillment statuses
          </p>
        </div>

        <button
          onClick={() => {
            setOrderItems([]);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0f2942] hover:bg-[#153a5b] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Order</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number, customer name, notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#0f2942] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium uppercase whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#0f2942] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No orders recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;New Customer Order&quot; to register bulk advance requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items Summary</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Deposit Paid</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{o.order_no}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDate(o.created_at)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {o.customer_name || 'Walk-in'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="max-w-[200px] truncate">
                        {o.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ') ||
                          'No items'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatNaira(o.total)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-mono">
                      {formatNaira(o.amount_paid)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase border ${getStatusBadgeClass(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setUpdatingOrder(o);
                          setNewStatus(o.status);
                          setNewAmountPaid(String(o.amount_paid));
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-900">Create Customer Pre-Order</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="">Walk-in / Anonymous</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Item Select */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Add Product Item
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItemToOrder(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="">Select product to add...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatNaira(p.selling_price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded max-h-48 overflow-y-auto divide-y divide-slate-100">
                {orderItems.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No items added yet</div>
                ) : (
                  orderItems.map((item, index) => {
                    const prod = products.find((p) => p.id === item.product_id);
                    return (
                      <div key={index} className="p-2 flex items-center justify-between text-xs gap-2">
                        <div className="font-medium text-slate-800 truncate flex-1">
                          {prod?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQty(index, Number(e.target.value))}
                            className="w-14 text-center p-1 border border-slate-300 rounded text-xs"
                          />
                          <span className="font-mono font-bold w-20 text-right">
                            {formatNaira(item.quantity * item.unit_price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                <span>Calculated Total:</span>
                <span>{formatNaira(orderSubtotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Deposit Amount Paid (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Event date, delivery notes..."
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-900">
                Update Order {updatingOrder.order_no}
              </h3>
              <button
                onClick={() => setUpdatingOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Progress Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white uppercase font-semibold"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Total Paid So Far (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newAmountPaid}
                  onChange={(e) => setNewAmountPaid(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUpdatingOrder(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2942] text-white rounded text-xs font-semibold"
                >
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
