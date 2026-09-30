import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatNaira, formatDate } from '../../lib/format.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Barcode,
  Layers,
} from 'lucide-react';

interface ProductsPageProps {
  onGoToBatches?: (productId?: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onGoToBatches }) => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand: '',
    size: '',
    unit: 'piece',
    description: '',
    cost_price: 0,
    selling_price: 0,
    reorder_level: 10,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category_id: categories[0]?.id || '',
      brand: '',
      size: '',
      unit: 'piece',
      description: '',
      cost_price: 0,
      selling_price: 0,
      reorder_level: 10,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      brand: product.brand || '',
      size: product.size || '',
      unit: product.unit || 'piece',
      description: product.description || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      reorder_level: product.reorder_level,
      is_active: product.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === 'all' || p.category_id === selectedCat;
    const q = search.toLowerCase().trim();
    if (!q) return matchesCat;
    return (
      matchesCat &&
      (p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0f2942]" />
            <span>Product Master &amp; Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage catalogue, prices, reorder alerts, and view total batches
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0f2942] hover:bg-[#153a5b] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2942]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading products catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No products recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;Add New Product&quot; to register drinks, groceries, and provisions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Product Name &amp; SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-center">Stock Level</th>
                  <th className="py-2.5 px-3 text-center">Reorder Lvl</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => {
                  const stock = prod.total_stock || 0;
                  const isLow = stock <= prod.reorder_level;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {prod.sku && <span>SKU: {prod.sku}</span>}
                          {prod.barcode && (
                            <span className="flex items-center gap-0.5">
                              <Barcode className="w-3 h-3" /> {prod.barcode}
                            </span>
                          )}
                          {prod.brand && <span>Brand: {prod.brand}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {prod.category_name || 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                        {isAdmin ? formatNaira(prod.cost_price) : '••••'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatNaira(prod.selling_price)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            stock === 0
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {stock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{prod.reorder_level}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            prod.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {prod.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onGoToBatches && (
                            <button
                              onClick={() => onGoToBatches(prod.id)}
                              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                              title="Receive / View Batches"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(prod)}
                                className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(prod.id, prod.name)}
                                className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                                title="Deactivate / Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Coca-Cola 50cl Pet (Pack of 12)"
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0f2942]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. COC-PET-12"
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Coca-Cola / Nestle"
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="piece">Piece</option>
                    <option value="pack">Pack</option>
                    <option value="carton">Carton</option>
                    <option value="crate">Crate</option>
                    <option value="bottle">Bottle</option>
                    <option value="kg">Kg</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_price: Number(e.target.value) || 0 })
                    }
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
                    value={formData.selling_price}
                    onChange={(e) =>
                      setFormData({ ...formData, selling_price: Number(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_level: Number(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-[#0f2942]"
                    />
                    <span>Active Product</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2942] hover:bg-[#153a5b] text-white rounded text-xs font-semibold shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
