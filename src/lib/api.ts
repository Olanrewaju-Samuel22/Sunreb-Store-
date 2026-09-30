import {
  Profile,
  Category,
  Supplier,
  Product,
  StockBatch,
  Customer,
  Sale,
  DebtPayment,
  Order,
  Expense,
  DashboardMetrics,
} from '../types/index.ts';

let authToken: string | null = sessionStorage.getItem('sunreb_pos_token');

export const setToken = (token: string | null) => {
  authToken = token;
  if (token) {
    sessionStorage.setItem('sunreb_pos_token', token);
  } else {
    sessionStorage.removeItem('sunreb_pos_token');
  }
};

export const getToken = () => authToken;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (pin: string) =>
    request<{ token: string; user: Profile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  getMe: () => request<Profile>('/api/auth/me'),

  // Profiles
  getProfiles: () => request<Profile[]>('/api/profiles'),
  createProfile: (data: { full_name: string; role: 'admin' | 'cashier'; pin: string }) =>
    request<Profile>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (id: string, data: Partial<Profile>) =>
    request<Profile>(`/api/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Categories
  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (name: string) =>
    request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/api/suppliers'),
  createSupplier: (data: { name: string; company?: string; phone?: string; email?: string }) =>
    request<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplier: (id: string, data: Partial<Supplier>) =>
    request<Supplier>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: () => request<Product[]>('/api/products'),
  createProduct: (data: Omit<Product, 'id' | 'created_at' | 'total_stock'>) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  // Stock Batches
  getBatches: (productId?: string) =>
    request<StockBatch[]>(`/api/batches${productId ? `?productId=${productId}` : ''}`),
  createBatch: (data: {
    product_id: string;
    supplier_id?: string;
    batch_number: string;
    qty_received: number;
    cost_price: number;
    selling_price: number;
    production_date?: string;
    expiry_date?: string;
  }) =>
    request<StockBatch>('/api/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Customers
  getCustomers: () => request<Customer[]>('/api/customers'),
  createCustomer: (data: { name: string; phone?: string; address?: string }) =>
    request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Sales (POS)
  completeSale: (payload: {
    customer_id?: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
    discount: number;
    payment_method: 'cash' | 'transfer' | 'pos' | 'credit';
    amount_paid: number;
    due_date?: string;
  }) =>
    request<Sale>('/api/sales/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSales: () => request<Sale[]>('/api/sales'),
  getSaleById: (id: string) => request<Sale>(`/api/sales/${id}`),

  // Debtors
  getDebtors: () =>
    request<{ customer: Customer; total_debt: number; sales: Sale[]; last_payment?: DebtPayment }[]>('/api/debtors'),
  getDebtPayments: (customerId?: string) =>
    request<DebtPayment[]>(`/api/debt-payments${customerId ? `?customerId=${customerId}` : ''}`),
  recordDebtPayment: (payload: {
    sale_id: string;
    customer_id: string;
    amount: number;
    payment_method: string;
  }) =>
    request<{ payment: DebtPayment; updatedSale: Sale }>('/api/debt-payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Expenses
  getExpenses: () => request<Expense[]>('/api/expenses'),
  createExpense: (data: {
    expense_date: string;
    category: Expense['category'];
    description?: string;
    amount: number;
    payment_method?: string;
  }) =>
    request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Orders
  getOrders: () => request<Order[]>('/api/orders'),
  createOrder: (payload: {
    customer_id?: string;
    status?: Order['status'];
    items: { product_id: string; quantity: number; unit_price: number }[];
    amount_paid?: number;
    notes?: string;
  }) =>
    request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateOrderStatus: (id: string, status: Order['status'], amount_paid?: number) =>
    request<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, amount_paid }),
    }),

  // Dashboard & Reports
  getDashboard: () => request<DashboardMetrics>('/api/dashboard'),
  getReports: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return request<any>(`/api/reports?${params.toString()}`);
  },
};
