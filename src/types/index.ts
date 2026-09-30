export type UserRole = 'admin' | 'cashier';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  pin: string; // 4-digit or custom numeric PIN
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  brand?: string;
  size?: string;
  unit: string; // 'piece', 'carton', 'pack', 'bottle', 'crate', 'kg'
  description?: string;
  image_url?: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  total_stock?: number;
}

export interface StockBatch {
  id: string;
  product_id: string;
  product_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  batch_number: string;
  qty_received: number;
  qty_remaining: number;
  cost_price: number;
  selling_price: number;
  production_date?: string;
  expiry_date?: string;
  received_at: string;
  received_by?: string;
  received_by_name?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  total_debt?: number;
}

export type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'credit';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  batch_id?: string;
  batch_number?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
}

export interface Sale {
  id: string;
  receipt_no: string;
  customer_id?: string;
  customer_name?: string;
  cashier_id: string;
  cashier_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  balance: number; // positive = customer owes debt, negative = change given to customer
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  due_date?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface DebtPayment {
  id: string;
  sale_id: string;
  receipt_no?: string;
  customer_id: string;
  customer_name?: string;
  amount: number;
  payment_method: string;
  recorded_by: string;
  recorded_by_name?: string;
  paid_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  order_no: string;
  customer_id?: string;
  customer_name?: string;
  status: OrderStatus;
  total: number;
  amount_paid: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

export type ExpenseCategory =
  | 'Transport'
  | 'Electricity'
  | 'Staff'
  | 'Rent'
  | 'Packaging'
  | 'Repairs'
  | 'Marketing'
  | 'Supplier-related'
  | 'Other';

export interface Expense {
  id: string;
  expense_date: string;
  category: ExpenseCategory;
  description?: string;
  amount: number;
  payment_method?: string;
  recorded_by: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

export interface HeldCart {
  id: string;
  name: string;
  customer_id?: string;
  customer_name?: string;
  items: CartItem[];
  discount: number;
  held_at: string;
}

export interface DashboardMetrics {
  today_sales_count: number;
  today_revenue: number;
  today_cash_collected: number;
  today_profit: number; // Admin only
  total_outstanding_debt: number;
  stock_valuation_cost: number;
  stock_valuation_retail: number;
  low_stock_count: number;
  expiring_batches_count: number;
  recent_sales: Sale[];
  low_stock_products: Product[];
  expiring_batches: (StockBatch & { days_left: number })[];
}
