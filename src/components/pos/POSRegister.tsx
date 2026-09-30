import React, { useState, useEffect, useRef } from 'react';
import { Product, Customer, CartItem, PaymentMethod, Sale, HeldCart } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira } from '../../lib/format.ts';
import { ReceiptModal } from './ReceiptModal.tsx';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  PlayCircle,
  X,
  CreditCard,
  Banknote,
  Send,
  UserPlus,
  ShoppingBag,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

export const POSRegister: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Completed sale receipt
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Held Carts
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try {
      const saved = localStorage.getItem('sunreb_held_carts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHeldModal, setShowHeldModal] = useState(false);

  // New Customer Modal
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, custs] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomers(),
      ]);
      setProducts(prods.filter((p) => p.is_active));
      setCategories(cats);
      setCustomers(custs.filter((c) => c.is_active));
    } catch (err: any) {
      setError(err.message || 'Failed to load POS data');
    } finally {
      setIsLoading(false);
    }
  };

  // Save held carts to local storage
  const saveHeldCarts = (carts: HeldCart[]) => {
    setHeldCarts(carts);
    try {
      localStorage.setItem('sunreb_held_carts', JSON.stringify(carts));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Product to Cart
  const addToCart = (product: Product) => {
    if (!product.total_stock || product.total_stock <= 0) {
      setError(`Cannot add "${product.name}" - out of stock.`);
      return;
    }
    setError(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= (product.total_stock || 0)) {
          setError(`Cannot add more "${product.name}". Max available in stock: ${product.total_stock}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unit_price: product.selling_price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setError(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > (item.product.total_stock || 0)) {
              setError(`Max available stock for "${item.product.name}" is ${item.product.total_stock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateUnitPrice = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, unit_price: Math.max(0, newPrice) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid('');
    setSelectedCustomerId('');
    setError(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const numericAmountPaid = Number(amountPaid) || 0;
  const balance = grandTotal - numericAmountPaid; // > 0: debt owed, < 0: change due to customer

  // Quick tendering button click
  const handleTender = (tender: number) => {
    setAmountPaid(String(tender));
  };

  // Hold Cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const newHeld: HeldCart = {
      id: String(Date.now()),
      name: customer ? customer.name : `Held Cart #${heldCarts.length + 1}`,
      customer_id: selectedCustomerId || undefined,
      customer_name: customer?.name,
      items: [...cart],
      discount,
      held_at: new Date().toISOString(),
    };
    saveHeldCarts([...heldCarts, newHeld]);
    clearCart();
  };

  // Recall Held Cart
  const handleRecallCart = (held: HeldCart) => {
    if (cart.length > 0) {
      if (!window.confirm('Current cart will be replaced with held cart. Continue?')) {
        return;
      }
    }
    setCart(held.items);
    setDiscount(held.discount);
    if (held.customer_id) setSelectedCustomerId(held.customer_id);
    saveHeldCarts(heldCarts.filter((c) => c.id !== held.id));
    setShowHeldModal(false);
  };

  // Search filter
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  // Handle barcode scanner enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;

      // Exact barcode or SKU match
      const exact = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase() === q.toLowerCase()) ||
          p.name.toLowerCase() === q.toLowerCase()
      );
      if (exact) {
        addToCart(exact);
        setSearchQuery('');
        return;
      }

      // If only one match in filtered list, add it
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Quick Add Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      const created = await api.createCustomer({
        name: newCustName,
        phone: newCustPhone,
        address: newCustAddress,
      });
      setCustomers((prev) => [...prev, created]);
      setSelectedCustomerId(created.id);
      setShowNewCustModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
    } catch (err: any) {
      setError(err.message || 'Failed to add customer');
    }
  };

  // Complete Sale (Single Atomic RPC call to backend)
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('Please add products to cart before completing sale.');
      return;
    }

    if (paymentMethod === 'credit' && !selectedCustomerId) {
      setError('A customer must be selected for Credit / Debt sales.');
      return;
    }

    const tender = paymentMethod === 'credit' ? numericAmountPaid : (numericAmountPaid || grandTotal);

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        customer_id: selectedCustomerId || undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount,
        payment_method: paymentMethod,
        amount_paid: tender,
        due_date: balance > 0 ? dueDate || undefined : undefined,
      };

      const result = await api.completeSale(payload);
      setCompletedSale(result);
      clearCart();
      // Reload products to refresh stock counts
      loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Please check stock levels.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5.5rem)]">
      {/* LEFT: Product Catalog & Search (60%) */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {/* Top Controls: Search Bar + Categories */}
        <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode or search product name, SKU..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f2942] focus:border-[#0f2942]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Held Carts Button */}
            {heldCarts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHeldModal(true)}
                className="px-2.5 py-1 text-xs bg-amber-50 text-amber-800 border border-amber-300 rounded-md flex items-center gap-1 font-semibold hover:bg-amber-100 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Recall Held ({heldCarts.length})</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#0f2942] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#0f2942] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg border border-slate-200" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">No products found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {products.length === 0
                  ? 'No inventory registered yet. Go to Products or Stock Receiving to add stock.'
                  : 'Try searching with a different name or category.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((prod) => {
                const stock = prod.total_stock || 0;
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= prod.reorder_level;

                return (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    disabled={isOutOfStock}
                    className={`text-left p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-[#0f2942] hover:shadow-xs active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                          {prod.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {prod.brand || prod.category_name || prod.unit}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {formatNaira(prod.selling_price)}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Out of stock' : `${stock} ${prod.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Panel (40%) */}
      <div className="w-full lg:w-96 flex flex-col bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden shrink-0">
        {/* Cart Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Current Sale ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </h2>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleHoldCart}
                className="px-2 py-0.5 text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded flex items-center gap-1 font-medium transition-colors"
                title="Hold Sale"
              >
                <PauseCircle className="w-3 h-3" />
                <span>Hold</span>
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="px-2 py-0.5 text-[10px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded flex items-center gap-1 font-medium transition-colors"
                title="Clear Cart"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Customer Select Bar */}
        <div className="px-3 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="flex-1 text-xs py-1 px-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''} {c.total_debt ? `[Debt: ₦${c.total_debt}]` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewCustModal(true)}
            className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200"
            title="Register New Customer"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <p className="text-xs">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click or scan items to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{formatNaira(item.unit_price)} each</span>
                    <span className="text-slate-300">•</span>
                    <span>Max: {item.product.total_stock}</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total & Remove */}
                <div className="text-right pl-1 min-w-[70px]">
                  <div className="text-xs font-bold text-slate-900">
                    {formatNaira(item.quantity * item.unit_price)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span className="truncate">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Billing & Payment Panel */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          {/* Subtotal & Discount */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Discount (₦):</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-24 text-right py-0.5 px-1.5 border border-slate-300 rounded text-xs bg-white"
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-[#0f2942] text-base">{formatNaira(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'transfer', label: 'Transfer', icon: Send },
                  { id: 'pos', label: 'POS Card', icon: CreditCard },
                  { id: 'credit', label: 'Credit', icon: RotateCcw },
                ] as const
              ).map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id);
                      if (method.id === 'cash' && !amountPaid) {
                        setAmountPaid(String(grandTotal));
                      }
                    }}
                    className={`py-1.5 px-1 rounded border text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0f2942] text-white border-[#0f2942] font-semibold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Paid & Quick Tenders */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">
                Amount Paid (₦):
              </label>
              <input
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={String(grandTotal)}
                className="w-32 text-right py-1 px-2 border border-slate-300 rounded text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
              />
            </div>

            {/* Quick cash denomination chips */}
            {paymentMethod === 'cash' && grandTotal > 0 && (
              <div className="flex gap-1 overflow-x-auto text-[10px] pb-1">
                <button
                  type="button"
                  onClick={() => handleTender(grandTotal)}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold whitespace-nowrap"
                >
                  Exact
                </button>
                {[500, 1000, 2000, 5000, 10000, 20000].map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => handleTender(denom)}
                    className="px-1.5 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded whitespace-nowrap"
                  >
                    ₦{denom.toLocaleString()}
                  </button>
                ))}
              </div>
            )}

            {/* Credit Due Date (shown if balance > 0 or paymentMethod is credit) */}
            {(paymentMethod === 'credit' || balance > 0) && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                <label className="text-[10px] font-bold text-amber-700">Due Date:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs py-0.5 px-2 border border-amber-300 bg-amber-50 rounded"
                />
              </div>
            )}

            {/* Balance / Change Calculation */}
            <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-200">
              <span className="text-slate-600">
                {balance > 0 ? 'Remaining Balance (Debt):' : 'Change Due:'}
              </span>
              <span
                className={`text-sm font-bold ${
                  balance > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {balance > 0 ? formatNaira(balance) : formatNaira(Math.max(0, -balance))}
              </span>
            </div>
          </div>

          {/* Complete Sale Button */}
          <button
            type="button"
            onClick={handleCompleteSale}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Complete Sale ({formatNaira(grandTotal)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal (Upon Complete Sale) */}
      {completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}

      {/* Held Carts Modal */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-800">Held Sales ({heldCarts.length})</h3>
              <button onClick={() => setShowHeldModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {heldCarts.map((held) => (
                <div
                  key={held.id}
                  className="p-2.5 border border-slate-200 rounded-md flex items-center justify-between bg-slate-50 hover:bg-white transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{held.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {held.items.length} items • Held at {new Date(held.held_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRecallCart(held)}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#0f2942] text-white rounded hover:bg-[#153a5b]"
                    >
                      Recall
                    </button>
                    <button
                      onClick={() => saveHeldCarts(heldCarts.filter((c) => c.id !== held.id))}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inline Quick Add Customer Modal */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-800">Add New Customer</h3>
              <button onClick={() => setShowNewCustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Alhaji Musa / Mrs. Johnson"
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0f2942]"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0f2942]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Address / Notes</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Store / Location"
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0f2942]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0f2942] text-white rounded text-xs font-semibold hover:bg-[#153a5b]"
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
