import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShoppingCart,
  Package,
  Layers,
  Receipt,
  Users,
  CreditCard,
  DollarSign,
  ClipboardList,
  Truck,
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Store,
  MessageCircle,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export type NavTab =
  | 'pos'
  | 'products'
  | 'batches'
  | 'sales'
  | 'debtors'
  | 'expenses'
  | 'orders'
  | 'suppliers'
  | 'dashboard'
  | 'reports'
  | 'settings';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentTab, onSelectTab, children }) => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'pos', label: 'POS Checkout', icon: ShoppingCart },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'batches', label: 'Stock Receiving', icon: Layers },
    { id: 'sales', label: 'Sales History', icon: Receipt },
    { id: 'debtors', label: 'Debtors Ledger', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'orders', label: 'Customer Orders', icon: ClipboardList },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Staff', icon: Settings, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col antialiased text-slate-800">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#0f2942] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Store className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
                  <span>SUNREB GEO-VISION &amp; GROCERIES</span>
                </div>
                <div className="text-[10px] text-slate-500 hidden sm:block">
                  Multiventure Retail Drinks &amp; Groceries
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* WhatsApp Contact Action */}
            <a
              href="https://wa.me/2348035055041"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              title="Chat with SUNREB on WhatsApp (+234 803 505 5041)"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="text-[10px] text-emerald-800 font-mono hidden md:inline">0803 505 5041</span>
            </a>

            {/* Current Active Staff Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-semibold text-slate-800 max-w-[90px] sm:max-w-[130px] truncate">
                {user?.full_name}
              </span>
              <span
                className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                  isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {user?.role}
              </span>
            </div>

            {/* Logout / Switch Cashier */}
            <button
              onClick={logout}
              title="Lock Register / Switch Staff"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-rose-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-14 md:pb-0">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-3.5rem)] p-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 pt-1 pb-2">
            Operations Menu
          </div>
          <nav className="space-y-1 flex-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#0f2942] text-white shadow-xs font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick System Info in sidebar footer */}
          <div className="pt-3 border-t border-slate-100 px-2 text-[10px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>Inventory Strategy:</span>
              <span className="font-semibold text-emerald-600">FEFO Active</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span>Currency:</span>
              <span className="font-medium text-slate-600">NGN (₦)</span>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="bg-white w-64 h-full p-4 flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="font-bold text-xs uppercase text-slate-800">Menu</div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-left ${
                        isActive
                          ? 'bg-[#0f2942] text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 font-medium rounded hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Lock Register / Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-3 sm:p-5 overflow-x-hidden min-w-0">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-center justify-around h-13 px-2 shadow-xs">
        <button
          onClick={() => onSelectTab('pos')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            currentTab === 'pos' ? 'text-[#0f2942] font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">POS</span>
        </button>
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            currentTab === 'dashboard' ? 'text-[#0f2942] font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>
        <button
          onClick={() => onSelectTab('products')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            currentTab === 'products' ? 'text-[#0f2942] font-bold' : 'text-slate-500'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Products</span>
        </button>
        <button
          onClick={() => onSelectTab('sales')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            currentTab === 'sales' ? 'text-[#0f2942] font-bold' : 'text-slate-500'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Sales</span>
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
};
