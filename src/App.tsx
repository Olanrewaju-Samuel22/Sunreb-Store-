/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginModal } from './components/auth/LoginModal.tsx';
import { AppShell, NavTab } from './components/layout/AppShell.tsx';
import { POSRegister } from './components/pos/POSRegister.tsx';
import { DashboardPage } from './components/dashboard/DashboardPage.tsx';
import { ProductsPage } from './components/inventory/ProductsPage.tsx';
import { StockReceivingPage } from './components/inventory/StockReceivingPage.tsx';
import { SalesHistoryPage } from './components/sales/SalesHistoryPage.tsx';
import { DebtorsPage } from './components/debtors/DebtorsPage.tsx';
import { ExpensesPage } from './components/expenses/ExpensesPage.tsx';
import { OrdersPage } from './components/orders/OrdersPage.tsx';
import { SuppliersPage } from './components/suppliers/SuppliersPage.tsx';
import { ReportsPage } from './components/reports/ReportsPage.tsx';
import { SettingsPage } from './components/settings/SettingsPage.tsx';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('pos');
  const [targetBatchProductId, setTargetBatchProductId] = useState<string | undefined>();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#0f2942]/20 border-t-[#0f2942] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            SUNREB GEO-VISION &amp; GROCERIES
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Initializing POS &amp; Inventory System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  const handleGoToBatches = (productId?: string) => {
    setTargetBatchProductId(productId);
    setCurrentTab('batches');
  };

  return (
    <AppShell currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'pos' && <POSRegister />}
      {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
      {currentTab === 'products' && <ProductsPage onGoToBatches={handleGoToBatches} />}
      {currentTab === 'batches' && (
        <StockReceivingPage initialProductId={targetBatchProductId} />
      )}
      {currentTab === 'sales' && <SalesHistoryPage />}
      {currentTab === 'debtors' && <DebtorsPage />}
      {currentTab === 'expenses' && <ExpensesPage />}
      {currentTab === 'orders' && <OrdersPage />}
      {currentTab === 'suppliers' && <SuppliersPage />}
      {currentTab === 'reports' && <ReportsPage />}
      {currentTab === 'settings' && <SettingsPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
