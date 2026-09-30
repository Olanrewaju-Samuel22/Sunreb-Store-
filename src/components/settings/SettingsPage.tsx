import React, { useState, useEffect } from 'react';
import { Profile, Category } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { formatDate } from '../../lib/format.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Settings,
  Users,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Store,
  MessageCircle,
  FolderTree,
  X,
  CheckCircle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<'admin' | 'cashier'>('cashier');
  const [staffPin, setStaffPin] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profs, cats] = await Promise.all([api.getProfiles(), api.getCategories()]);
      setProfiles(profs);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffPin.trim()) return;
    try {
      await api.createProfile({
        full_name: staffName.trim(),
        role: staffRole,
        pin: staffPin.trim(),
      });
      setShowStaffModal(false);
      setStaffName('');
      setStaffPin('');
      setStaffRole('cashier');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create staff profile');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory(newCatName.trim());
      setNewCatName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this category?')) return;
    try {
      await api.deleteCategory(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleToggleStaffActive = async (profile: Profile) => {
    try {
      await api.updateProfile(profile.id, { is_active: !profile.is_active });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Top Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#0f2942]" />
          <span>System &amp; Business Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure store identity, employee PIN authorization, and inventory categories
        </p>
      </div>

      {/* Store Identity & WhatsApp Card */}
      <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <h2 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#0f2942]" />
          <span>Store Information &amp; Contact</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Registered Business Name
              </span>
              <span className="font-bold text-slate-900 text-sm">
                SUNREB GEO-VISION AND GROCERIES MULTIVENTURE
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Industry</span>
              <span className="text-slate-700">Drinks &amp; Groceries Retail Store</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Inventory Model</span>
              <span className="text-emerald-700 font-semibold">
                FEFO (First-Expired, First-Out Batch Deductions)
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                WhatsApp Business Link
              </span>
              <a
                href="https://wa.me/2348035055041"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1.5 mt-0.5 text-xs font-mono"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>https://wa.me/2348035055041</span>
              </a>
              <div className="text-[10px] text-slate-500 mt-1">
                International Format: <strong className="font-mono text-slate-800">2348035055041</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <a
                href="https://wa.me/2348035055041"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Test WhatsApp Link</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Management (Admin Only) */}
      <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0f2942]" />
              <span>Staff Management &amp; PIN Authentication</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Cashiers have access to POS and receipts. Admins have access to profit metrics and settings.
            </p>
          </div>

          <button
            onClick={() => setShowStaffModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2942] hover:bg-[#153a5b] text-white text-xs font-semibold rounded shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3">Created</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-semibold text-slate-900">{p.full_name}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        p.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {p.role}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        p.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500">{formatDate(p.created_at)}</td>
                  <td className="py-2 px-3 text-right">
                    {p.id !== user?.id && (
                      <button
                        onClick={() => handleToggleStaffActive(p)}
                        className={`text-[10px] font-semibold hover:underline ${
                          p.is_active ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Categories */}
      <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <h2 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-[#0f2942]" />
          <span>Product Categories</span>
        </h2>

        <form onSubmit={handleCreateCategory} className="flex gap-2">
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New Category Name (e.g. Wines & Spirits, Frozen Foods...)"
            className="flex-1 text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0f2942]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#0f2942] hover:bg-[#153a5b] text-white text-xs font-semibold rounded"
          >
            Add Category
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
            >
              <span className="font-medium text-slate-800 truncate">{c.name}</span>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                title="Remove Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-900">Add Staff Member</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Mary Okon"
                  className="w-full text-xs p-2 border border-slate-300 rounded"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Role *</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as 'admin' | 'cashier')}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="cashier">Cashier (POS &amp; Receipts)</option>
                  <option value="admin">Administrator (Full Access &amp; Profit Reports)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  4-Digit Numeric PIN *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 5678"
                  className="w-full text-sm font-mono tracking-widest p-2 border border-slate-300 rounded"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Staff will use this PIN to log in on the POS terminal
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2942] text-white rounded text-xs font-semibold shadow-xs"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
