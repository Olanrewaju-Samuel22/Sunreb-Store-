import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Profile,
  Category,
  Supplier,
  Product,
  StockBatch,
  Customer,
  Sale,
  SaleItem,
  DebtPayment,
  Order,
  OrderItem,
  Expense,
  DashboardMetrics,
} from '../types/index.ts';

interface DBData {
  profiles: Profile[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  stock_batches: StockBatch[];
  customers: Customer[];
  sales: Sale[];
  sale_items: SaleItem[];
  debt_payments: DebtPayment[];
  orders: Order[];
  order_items: OrderItem[];
  expenses: Expense[];
}

const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.VERCEL
);

const DATA_DIR = isServerless ? path.join('/tmp', 'pos_data') : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pos_database.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Storage directory initialization notice:', err);
}

function getInitialDB(): DBData {
  return {
    profiles: [
      {
        id: crypto.randomUUID(),
        full_name: 'Administrator',
        role: 'admin',
        pin: '1234',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        full_name: 'Cashier Desk 1',
        role: 'cashier',
        pin: '0000',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ],
    categories: [
      { id: crypto.randomUUID(), name: 'Drinks & Soft Beverages' },
      { id: crypto.randomUUID(), name: 'Water & Juices' },
      { id: crypto.randomUUID(), name: 'Dairy & Breakfast' },
      { id: crypto.randomUUID(), name: 'Canned & Packaged Groceries' },
      { id: crypto.randomUUID(), name: 'Grains, Flours & Pasta' },
      { id: crypto.randomUUID(), name: 'Condiments, Oils & Spices' },
      { id: crypto.randomUUID(), name: 'Snacks & Confectionery' },
      { id: crypto.randomUUID(), name: 'Toiletries & Household' },
    ],
    suppliers: [],
    products: [],
    stock_batches: [],
    customers: [],
    sales: [],
    sale_items: [],
    debt_payments: [],
    orders: [],
    order_items: [],
    expenses: [],
  };
}

class Database {
  private data: DBData;
  private writeLock: boolean = false;

  constructor() {
    this.data = this.load();
  }

  private load(): DBData {
    try {
      // In serverless, if /tmp doesn't have the file yet, check if project has data/pos_database.json to seed from
      if (isServerless && !fs.existsSync(DB_FILE)) {
        const seedPath = path.resolve(process.cwd(), 'data', 'pos_database.json');
        if (fs.existsSync(seedPath)) {
          const raw = fs.readFileSync(seedPath, 'utf-8');
          const parsed = JSON.parse(raw);
          this.saveData(parsed);
          return parsed;
        }
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          profiles: parsed.profiles || [],
          categories: parsed.categories || [],
          suppliers: parsed.suppliers || [],
          products: parsed.products || [],
          stock_batches: parsed.stock_batches || [],
          customers: parsed.customers || [],
          sales: parsed.sales || [],
          sale_items: parsed.sale_items || [],
          debt_payments: parsed.debt_payments || [],
          orders: parsed.orders || [],
          order_items: parsed.order_items || [],
          expenses: parsed.expenses || [],
        };
      }
    } catch (err) {
      console.error('Error loading DB file, resetting to initial state:', err);
    }
    const initial = getInitialDB();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DBData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // --- Profiles & Auth ---
  public getProfiles(): Omit<Profile, 'pin'>[] {
    return this.data.profiles.map(({ pin, ...rest }) => rest);
  }

  public authenticateByPin(pin: string): Profile | null {
    const user = this.data.profiles.find((p) => p.pin === pin && p.is_active);
    return user || null;
  }

  public getProfileById(id: string): Profile | null {
    return this.data.profiles.find((p) => p.id === id) || null;
  }

  public createProfile(data: { full_name: string; role: 'admin' | 'cashier'; pin: string }): Profile {
    if (this.data.profiles.some((p) => p.pin === data.pin)) {
      throw new Error('A staff member with this PIN already exists. Please choose a different PIN.');
    }
    const profile: Profile = {
      id: crypto.randomUUID(),
      full_name: data.full_name,
      role: data.role,
      pin: data.pin,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.data.profiles.push(profile);
    this.persist();
    return profile;
  }

  public updateProfile(id: string, updates: Partial<Profile>): Profile {
    const idx = this.data.profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Staff profile not found');
    if (updates.pin && this.data.profiles.some((p) => p.id !== id && p.pin === updates.pin)) {
      throw new Error('PIN already in use by another staff member');
    }
    this.data.profiles[idx] = { ...this.data.profiles[idx], ...updates };
    this.persist();
    return this.data.profiles[idx];
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return this.data.categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  public createCategory(name: string): Category {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name cannot be empty');
    if (this.data.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Category already exists');
    }
    const category: Category = {
      id: crypto.randomUUID(),
      name: trimmed,
    };
    this.data.categories.push(category);
    this.persist();
    return category;
  }

  public deleteCategory(id: string): boolean {
    const inUse = this.data.products.some((p) => p.category_id === id);
    if (inUse) {
      throw new Error('Cannot delete category: products are assigned to this category.');
    }
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this.persist();
    return true;
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return this.data.suppliers.sort((a, b) => a.name.localeCompare(b.name));
  }

  public createSupplier(data: { name: string; company?: string; phone?: string; email?: string }): Supplier {
    const supplier: Supplier = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      company: data.company?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.data.suppliers.push(supplier);
    this.persist();
    return supplier;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
    const idx = this.data.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    this.data.suppliers[idx] = { ...this.data.suppliers[idx], ...updates };
    this.persist();
    return this.data.suppliers[idx];
  }

  // --- Products ---
  public getProducts(): Product[] {
    return this.data.products.map((p) => {
      const cat = this.data.categories.find((c) => c.id === p.category_id);
      const totalStock = this.data.stock_batches
        .filter((b) => b.product_id === p.id)
        .reduce((sum, b) => sum + (b.qty_remaining || 0), 0);
      return {
        ...p,
        category_name: cat ? cat.name : undefined,
        total_stock: totalStock,
      };
    });
  }

  public getProductById(id: string): Product | null {
    const p = this.data.products.find((prod) => prod.id === id);
    if (!p) return null;
    const cat = this.data.categories.find((c) => c.id === p.category_id);
    const totalStock = this.data.stock_batches
      .filter((b) => b.product_id === p.id)
      .reduce((sum, b) => sum + (b.qty_remaining || 0), 0);
    return {
      ...p,
      category_name: cat ? cat.name : undefined,
      total_stock: totalStock,
    };
  }

  public createProduct(data: Omit<Product, 'id' | 'created_at' | 'total_stock'>): Product {
    if (data.sku && this.data.products.some((p) => p.sku === data.sku)) {
      throw new Error(`A product with SKU "${data.sku}" already exists`);
    }
    const product: Product = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.data.products.push(product);
    this.persist();
    return { ...product, total_stock: 0 };
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    if (updates.sku && this.data.products.some((p) => p.id !== id && p.sku === updates.sku)) {
      throw new Error(`A product with SKU "${updates.sku}" already exists`);
    }
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    this.persist();
    return this.getProductById(id)!;
  }

  public deleteProduct(id: string): boolean {
    const hasSales = this.data.sale_items.some((item) => item.product_id === id);
    if (hasSales) {
      // Soft deactivate instead of hard delete to keep sales history intact
      const idx = this.data.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        this.data.products[idx].is_active = false;
        this.persist();
      }
      return true;
    }
    this.data.products = this.data.products.filter((p) => p.id !== id);
    this.data.stock_batches = this.data.stock_batches.filter((b) => b.product_id !== id);
    this.persist();
    return true;
  }

  // --- Stock Batches (Stock Receiving) ---
  public getStockBatches(productId?: string): StockBatch[] {
    let list = this.data.stock_batches;
    if (productId) {
      list = list.filter((b) => b.product_id === productId);
    }
    return list
      .map((b) => {
        const prod = this.data.products.find((p) => p.id === b.product_id);
        const supp = this.data.suppliers.find((s) => s.id === b.supplier_id);
        const user = this.data.profiles.find((u) => u.id === b.received_by);
        return {
          ...b,
          product_name: prod?.name,
          supplier_name: supp?.name || supp?.company,
          received_by_name: user?.full_name,
        };
      })
      .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
  }

  public createStockBatch(data: {
    product_id: string;
    supplier_id?: string;
    batch_number: string;
    qty_received: number;
    cost_price: number;
    selling_price: number;
    production_date?: string;
    expiry_date?: string;
    received_by?: string;
  }): StockBatch {
    const product = this.data.products.find((p) => p.id === data.product_id);
    if (!product) throw new Error('Product not found');

    const existing = this.data.stock_batches.find(
      (b) => b.product_id === data.product_id && b.batch_number === data.batch_number
    );
    if (existing) {
      throw new Error(`Batch "${data.batch_number}" already exists for this product. Use a unique batch number.`);
    }

    const batch: StockBatch = {
      id: crypto.randomUUID(),
      product_id: data.product_id,
      supplier_id: data.supplier_id,
      batch_number: data.batch_number,
      qty_received: data.qty_received,
      qty_remaining: data.qty_received,
      cost_price: Number(data.cost_price),
      selling_price: Number(data.selling_price),
      production_date: data.production_date,
      expiry_date: data.expiry_date,
      received_at: new Date().toISOString(),
      received_by: data.received_by,
    };

    // Update product cost and selling price to latest batch price if desired
    product.cost_price = Number(data.cost_price);
    product.selling_price = Number(data.selling_price);

    this.data.stock_batches.push(batch);
    this.persist();

    return batch;
  }

  // --- Customers & Debtors ---
  public getCustomers(): Customer[] {
    return this.data.customers
      .map((c) => {
        // Compute total debt for customer
        const customerSales = this.data.sales.filter((s) => s.customer_id === c.id);
        const debtFromSales = customerSales.reduce((sum, s) => {
          if (s.balance > 0) return sum + s.balance;
          return sum;
        }, 0);
        return {
          ...c,
          total_debt: debtFromSales,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public createCustomer(data: { name: string; phone?: string; address?: string }): Customer {
    const customer: Customer = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      phone: data.phone?.trim(),
      address: data.address?.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.data.customers.push(customer);
    this.persist();
    return { ...customer, total_debt: 0 };
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    this.data.customers[idx] = { ...this.data.customers[idx], ...updates };
    this.persist();
    return this.data.customers[idx];
  }

  // --- POS: Atomic Complete Sale RPC (FEFO) ---
  public completeSaleRPC(payload: {
    customer_id?: string;
    cashier_id: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
    discount: number;
    payment_method: 'cash' | 'transfer' | 'pos' | 'credit';
    amount_paid: number;
    due_date?: string;
  }): Sale {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Cart is empty. Cannot complete sale.');
    }

    const cashier = this.data.profiles.find((p) => p.id === payload.cashier_id);
    if (!cashier) throw new Error('Invalid cashier ID.');

    const customer = payload.customer_id
      ? this.data.customers.find((c) => c.id === payload.customer_id)
      : null;

    if (payload.payment_method === 'credit' && !customer) {
      throw new Error('A customer must be selected to record a credit / debt sale.');
    }

    // Step 1: Pre-validation of stock for all items
    for (const item of payload.items) {
      const prod = this.data.products.find((p) => p.id === item.product_id);
      if (!prod) throw new Error(`Product ID ${item.product_id} not found.`);

      const availableBatches = this.data.stock_batches.filter(
        (b) => b.product_id === item.product_id && b.qty_remaining > 0
      );
      const totalAvailable = availableBatches.reduce((acc, b) => acc + b.qty_remaining, 0);

      if (totalAvailable < item.quantity) {
        throw new Error(
          `Insufficient stock for "${prod.name}". Available: ${totalAvailable}, Requested: ${item.quantity}.`
        );
      }
    }

    // Generate unique sequential receipt number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayCount = this.data.sales.filter((s) => s.created_at.startsWith(now.toISOString().slice(0, 10))).length + 1;
    const receiptNo = `SRB-${dateStr}-${String(todayCount).padStart(4, '0')}`;

    const saleId = crypto.randomUUID();
    let subtotal = 0;
    const allocatedSaleItems: SaleItem[] = [];

    // Step 2: FEFO Allocation (First-Expired, First-Out)
    for (const item of payload.items) {
      const prod = this.data.products.find((p) => p.id === item.product_id)!;
      let remainingToDeduct = item.quantity;

      // Find all batches with remaining stock
      // Sort: earliest expiry_date first. Null expiry dates placed last. Then earliest received_at.
      const candidateBatches = this.data.stock_batches
        .filter((b) => b.product_id === item.product_id && b.qty_remaining > 0)
        .sort((a, b) => {
          if (a.expiry_date && b.expiry_date) {
            return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
          }
          if (a.expiry_date && !b.expiry_date) return -1;
          if (!a.expiry_date && b.expiry_date) return 1;
          return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
        });

      for (const batch of candidateBatches) {
        if (remainingToDeduct <= 0) break;

        const deductQty = Math.min(batch.qty_remaining, remainingToDeduct);
        batch.qty_remaining -= deductQty;
        remainingToDeduct -= deductQty;

        const lineTotal = deductQty * item.unit_price;
        subtotal += lineTotal;

        allocatedSaleItems.push({
          id: crypto.randomUUID(),
          sale_id: saleId,
          product_id: item.product_id,
          product_name: prod.name,
          batch_id: batch.id,
          batch_number: batch.batch_number,
          quantity: deductQty,
          unit_price: item.unit_price,
          unit_cost: batch.cost_price,
          line_total: lineTotal,
        });
      }

      if (remainingToDeduct > 0) {
        throw new Error(`FEFO deduction failed for ${prod.name}. Internal error.`);
      }
    }

    const discount = Math.max(0, Number(payload.discount) || 0);
    const total = Math.max(0, subtotal - discount);
    const amountPaid = Math.max(0, Number(payload.amount_paid) || 0);
    const balance = total - amountPaid; // positive = debtor owes, 0 = fully paid, negative = customer change

    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (balance > 0) {
      paymentStatus = amountPaid > 0 ? 'partial' : 'unpaid';
    }

    const saleRecord: Sale = {
      id: saleId,
      receipt_no: receiptNo,
      customer_id: payload.customer_id,
      customer_name: customer?.name || 'Walk-in Customer',
      cashier_id: payload.cashier_id,
      cashier_name: cashier.full_name,
      subtotal,
      discount,
      tax: 0,
      total,
      amount_paid: amountPaid,
      balance,
      payment_method: payload.payment_method,
      payment_status: paymentStatus,
      due_date: balance > 0 ? payload.due_date : undefined,
      created_at: now.toISOString(),
      items: allocatedSaleItems,
    };

    // Commit atomically
    this.data.sales.unshift(saleRecord);
    this.data.sale_items.push(...allocatedSaleItems);
    this.persist();

    return saleRecord;
  }

  // --- Sales History & Receipts ---
  public getSales(limit: number = 200): Sale[] {
    return this.data.sales.slice(0, limit).map((s) => {
      const items = this.data.sale_items.filter((item) => item.sale_id === s.id);
      return {
        ...s,
        items,
      };
    });
  }

  public getSaleById(id: string): Sale | null {
    const sale = this.data.sales.find((s) => s.id === id || s.receipt_no === id);
    if (!sale) return null;
    const items = this.data.sale_items.filter((item) => item.sale_id === sale.id);
    return {
      ...sale,
      items,
    };
  }

  // --- Debt Payments (Debtor settling debt) ---
  public recordDebtPayment(payload: {
    sale_id: string;
    customer_id: string;
    amount: number;
    payment_method: string;
    recorded_by: string;
  }): { payment: DebtPayment; updatedSale: Sale } {
    const sale = this.data.sales.find((s) => s.id === payload.sale_id);
    if (!sale) throw new Error('Sale not found');
    if (sale.balance <= 0) throw new Error('This sale debt is already fully paid.');

    const paymentAmount = Number(payload.amount);
    if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero');
    if (paymentAmount > sale.balance) {
      throw new Error(`Payment amount (₦${paymentAmount}) exceeds remaining balance (₦${sale.balance})`);
    }

    const customer = this.data.customers.find((c) => c.id === payload.customer_id);
    const staff = this.data.profiles.find((p) => p.id === payload.recorded_by);

    sale.amount_paid += paymentAmount;
    sale.balance -= paymentAmount;
    if (sale.balance <= 0) {
      sale.balance = 0;
      sale.payment_status = 'paid';
    } else {
      sale.payment_status = 'partial';
    }

    const paymentRecord: DebtPayment = {
      id: crypto.randomUUID(),
      sale_id: payload.sale_id,
      receipt_no: sale.receipt_no,
      customer_id: payload.customer_id,
      customer_name: customer?.name,
      amount: paymentAmount,
      payment_method: payload.payment_method,
      recorded_by: payload.recorded_by,
      recorded_by_name: staff?.full_name,
      paid_at: new Date().toISOString(),
    };

    this.data.debt_payments.push(paymentRecord);
    this.persist();

    return { payment: paymentRecord, updatedSale: sale };
  }

  public getDebtPayments(customerId?: string): DebtPayment[] {
    let list = this.data.debt_payments;
    if (customerId) {
      list = list.filter((p) => p.customer_id === customerId);
    }
    return list
      .map((p) => {
        const cust = this.data.customers.find((c) => c.id === p.customer_id);
        const staff = this.data.profiles.find((u) => u.id === p.recorded_by);
        const sale = this.data.sales.find((s) => s.id === p.sale_id);
        return {
          ...p,
          customer_name: cust?.name,
          recorded_by_name: staff?.full_name,
          receipt_no: sale?.receipt_no || p.receipt_no,
        };
      })
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  }

  public getDebtors(): {
    customer: Customer;
    total_debt: number;
    sales: Sale[];
    last_payment?: DebtPayment;
  }[] {
    const debtorsMap = new Map<string, { customer: Customer; total_debt: number; sales: Sale[] }>();

    for (const sale of this.data.sales) {
      if (sale.balance > 0 && sale.customer_id) {
        const customer = this.data.customers.find((c) => c.id === sale.customer_id);
        if (!customer) continue;

        if (!debtorsMap.has(sale.customer_id)) {
          debtorsMap.set(sale.customer_id, {
            customer,
            total_debt: 0,
            sales: [],
          });
        }
        const entry = debtorsMap.get(sale.customer_id)!;
        entry.total_debt += sale.balance;
        entry.sales.push(sale);
      }
    }

    return Array.from(debtorsMap.values()).map((entry) => {
      const payments = this.data.debt_payments.filter((p) => p.customer_id === entry.customer.id);
      const lastPayment = payments.sort(
        (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
      )[0];
      return {
        ...entry,
        last_payment: lastPayment,
      };
    });
  }

  // --- Expenses ---
  public getExpenses(): Expense[] {
    return this.data.expenses
      .map((e) => {
        const user = this.data.profiles.find((p) => p.id === e.recorded_by);
        return {
          ...e,
          recorded_by_name: user?.full_name,
        };
      })
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }

  public createExpense(data: {
    expense_date: string;
    category: Expense['category'];
    description?: string;
    amount: number;
    payment_method?: string;
    recorded_by: string;
  }): Expense {
    const expense: Expense = {
      id: crypto.randomUUID(),
      expense_date: data.expense_date,
      category: data.category,
      description: data.description?.trim(),
      amount: Number(data.amount),
      payment_method: data.payment_method,
      recorded_by: data.recorded_by,
      created_at: new Date().toISOString(),
    };
    this.data.expenses.push(expense);
    this.persist();
    return expense;
  }

  public deleteExpense(id: string): boolean {
    this.data.expenses = this.data.expenses.filter((e) => e.id !== id);
    this.persist();
    return true;
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return this.data.orders.map((o) => {
      const items = this.data.order_items.filter((item) => item.order_id === o.id);
      const cust = this.data.customers.find((c) => c.id === o.customer_id);
      return {
        ...o,
        customer_name: cust?.name,
        items,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createOrder(payload: {
    customer_id?: string;
    status?: Order['status'];
    items: { product_id: string; quantity: number; unit_price: number }[];
    amount_paid?: number;
    notes?: string;
  }): Order {
    const now = new Date();
    const orderNo = `ORD-${Date.now().toString().slice(-6)}`;
    const orderId = crypto.randomUUID();

    let total = 0;
    const items: OrderItem[] = [];

    for (const item of payload.items) {
      const prod = this.data.products.find((p) => p.id === item.product_id);
      const lineTotal = item.quantity * item.unit_price;
      total += lineTotal;
      items.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: item.product_id,
        product_name: prod ? prod.name : 'Unknown Product',
        quantity: item.quantity,
        unit_price: item.unit_price,
      });
    }

    const order: Order = {
      id: orderId,
      order_no: orderNo,
      customer_id: payload.customer_id,
      status: payload.status || 'pending',
      total,
      amount_paid: Number(payload.amount_paid) || 0,
      notes: payload.notes,
      created_at: now.toISOString(),
      items,
    };

    this.data.orders.unshift(order);
    this.data.order_items.push(...items);
    this.persist();

    return order;
  }

  public updateOrderStatus(id: string, status: Order['status'], amount_paid?: number): Order {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');
    order.status = status;
    if (amount_paid !== undefined) {
      order.amount_paid = Number(amount_paid);
    }
    this.persist();
    return order;
  }

  // --- Dashboard Metrics & Analytics ---
  public getDashboardMetrics(): DashboardMetrics {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const todaySales = this.data.sales.filter((s) => s.created_at.startsWith(todayStr));
    const todaySalesCount = todaySales.length;
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

    // Cash / Actual Money collected today = cash/transfer/pos collected on today's sales + debt payments received today
    const salesPaidToday = todaySales.reduce((sum, s) => sum + s.amount_paid, 0);
    const debtPaymentsToday = this.data.debt_payments
      .filter((p) => p.paid_at.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);
    const todayCashCollected = salesPaidToday + debtPaymentsToday;

    // Today Profit: sum of line_total - (qty * unit_cost) for items sold today
    const todaySaleIds = new Set(todaySales.map((s) => s.id));
    const todaySaleItems = this.data.sale_items.filter((item) => todaySaleIds.has(item.sale_id));
    const todayCogs = todaySaleItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    const todayProfit = Math.max(0, todayRevenue - todayCogs);

    // Outstanding Debts
    const totalOutstandingDebt = this.data.sales.reduce((sum, s) => (s.balance > 0 ? sum + s.balance : sum), 0);

    // Stock Valuation (Cost & Retail)
    let stockValuationCost = 0;
    let stockValuationRetail = 0;
    for (const batch of this.data.stock_batches) {
      if (batch.qty_remaining > 0) {
        stockValuationCost += batch.qty_remaining * batch.cost_price;
        stockValuationRetail += batch.qty_remaining * batch.selling_price;
      }
    }

    // Low stock items: products where total remaining across batches <= reorder_level
    const lowStockProducts: Product[] = [];
    for (const prod of this.data.products) {
      if (!prod.is_active) continue;
      const totalStock = this.data.stock_batches
        .filter((b) => b.product_id === prod.id)
        .reduce((sum, b) => sum + b.qty_remaining, 0);

      if (totalStock <= prod.reorder_level) {
        lowStockProducts.push({
          ...prod,
          total_stock: totalStock,
        });
      }
    }

    // Expiring batches: batches with qty_remaining > 0 and expiry_date within 60 days or already expired
    const expiringBatches: (StockBatch & { days_left: number })[] = [];
    const oneDay = 24 * 60 * 60 * 1000;
    for (const batch of this.data.stock_batches) {
      if (batch.qty_remaining > 0 && batch.expiry_date) {
        const expDate = new Date(batch.expiry_date);
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / oneDay);
        if (diffDays <= 60) {
          const prod = this.data.products.find((p) => p.id === batch.product_id);
          expiringBatches.push({
            ...batch,
            product_name: prod?.name,
            days_left: diffDays,
          });
        }
      }
    }
    expiringBatches.sort((a, b) => a.days_left - b.days_left);

    return {
      today_sales_count: todaySalesCount,
      today_revenue: todayRevenue,
      today_cash_collected: todayCashCollected,
      today_profit: todayProfit,
      total_outstanding_debt: totalOutstandingDebt,
      stock_valuation_cost: stockValuationCost,
      stock_valuation_retail: stockValuationRetail,
      low_stock_count: lowStockProducts.length,
      expiring_batches_count: expiringBatches.length,
      recent_sales: this.getSales(10),
      low_stock_products: lowStockProducts.slice(0, 10),
      expiring_batches: expiringBatches.slice(0, 10),
    };
  }

  // --- Filtered Reports ---
  public getReports(startDate?: string, endDate?: string) {
    const filterByDate = (dateIso: string) => {
      if (!startDate && !endDate) return true;
      const date = dateIso.slice(0, 10);
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    };

    // Filter sales
    const sales = this.data.sales.filter((s) => filterByDate(s.created_at));
    const saleIds = new Set(sales.map((s) => s.id));
    const saleItems = this.data.sale_items.filter((item) => saleIds.has(item.sale_id));

    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCogs = saleItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    const grossProfit = totalSalesRevenue - totalCogs;

    // Filter expenses
    const expenses = this.data.expenses.filter((e) => filterByDate(e.expense_date));
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    // Debt collections in period
    const debtCollections = this.data.debt_payments.filter((d) => filterByDate(d.paid_at));
    const totalDebtCollected = debtCollections.reduce((sum, d) => sum + d.amount, 0);

    // Breakdown by payment method
    const paymentMethodsBreakdown: Record<string, { count: number; total: number }> = {};
    for (const s of sales) {
      if (!paymentMethodsBreakdown[s.payment_method]) {
        paymentMethodsBreakdown[s.payment_method] = { count: 0, total: 0 };
      }
      paymentMethodsBreakdown[s.payment_method].count += 1;
      paymentMethodsBreakdown[s.payment_method].total += s.total;
    }

    // Top selling products
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number; cost: number }>();
    for (const item of saleItems) {
      if (!productSalesMap.has(item.product_id)) {
        productSalesMap.set(item.product_id, {
          name: item.product_name,
          quantity: 0,
          revenue: 0,
          cost: 0,
        });
      }
      const entry = productSalesMap.get(item.product_id)!;
      entry.quantity += item.quantity;
      entry.revenue += item.line_total;
      entry.cost += item.quantity * item.unit_cost;
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    return {
      period: { startDate, endDate },
      summary: {
        total_sales_count: sales.length,
        total_revenue: totalSalesRevenue,
        total_cogs: totalCogs,
        gross_profit: grossProfit,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        total_debt_collected: totalDebtCollected,
      },
      payment_methods: paymentMethodsBreakdown,
      top_products: topSellingProducts,
      sales: sales.slice(0, 100),
      expenses: expenses.slice(0, 100),
    };
  }
}

export const db = new Database();
