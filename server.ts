import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory token store for session verification
const activeSessions = new Map<string, { userId: string; role: 'admin' | 'cashier'; name: string }>();

// Auth Middleware
interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: 'admin' | 'cashier'; name: string };
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session. Please enter your PIN again.' });
  }

  req.user = session;
  next();
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access restricted: Administrator role required' });
  }
  next();
};

// ----------------- Auth API -----------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    const user = db.authenticateByPin(String(pin).trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid PIN or inactive staff profile' });
    }

    // Generate session token
    const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    activeSessions.set(token, {
      userId: user.id,
      role: user.role,
      name: user.full_name,
    });

    const { pin: _, ...safeUser } = user;
    return res.json({
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Authentication error' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const profile = db.getProfileById(req.user!.userId);
  if (!profile) {
    return res.status(404).json({ error: 'User profile not found' });
  }
  const { pin: _, ...safeUser } = profile;
  return res.json(safeUser);
});

// ----------------- Profiles API (Admin Only) -----------------
app.get('/api/profiles', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getProfiles());
});

app.post('/api/profiles', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { full_name, role, pin } = req.body;
    if (!full_name || !role || !pin) {
      return res.status(400).json({ error: 'full_name, role, and pin are required' });
    }
    const profile = db.createProfile({ full_name, role, pin });
    const { pin: _, ...safeUser } = profile;
    return res.status(201).json(safeUser);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/profiles/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = db.updateProfile(req.params.id, req.body);
    const { pin: _, ...safeUser } = profile;
    return res.json(safeUser);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Categories API -----------------
app.get('/api/categories', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getCategories());
});

app.post('/api/categories', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const cat = db.createCategory(name);
    return res.status(201).json(cat);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteCategory(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Suppliers API -----------------
app.get('/api/suppliers', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getSuppliers());
});

app.post('/api/suppliers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const supplier = db.createSupplier(req.body);
    return res.status(201).json(supplier);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const supplier = db.updateSupplier(req.params.id, req.body);
    return res.json(supplier);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Products API -----------------
app.get('/api/products', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getProducts());
});

app.post('/api/products', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = db.createProduct(req.body);
    return res.status(201).json(product);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = db.updateProduct(req.params.id, req.body);
    return res.json(product);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteProduct(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Stock Batches API (Stock Receiving) -----------------
app.get('/api/batches', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const productId = req.query.productId as string | undefined;
  return res.json(db.getStockBatches(productId));
});

app.post('/api/batches', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = {
      ...req.body,
      received_by: req.user!.userId,
    };
    const batch = db.createStockBatch(payload);
    return res.status(201).json(batch);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Customers API -----------------
app.get('/api/customers', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getCustomers());
});

app.post('/api/customers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = db.createCustomer(req.body);
    return res.status(201).json(customer);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/customers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = db.updateCustomer(req.params.id, req.body);
    return res.json(customer);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- POS: Complete Sale RPC (FEFO Transaction) -----------------
app.post('/api/sales/complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = {
      ...req.body,
      cashier_id: req.user!.userId,
    };
    const sale = db.completeSaleRPC(payload);
    return res.status(201).json(sale);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/sales', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getSales(250));
});

app.get('/api/sales/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const sale = db.getSaleById(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale record not found' });
  return res.json(sale);
});

// ----------------- Debtors & Debt Payments -----------------
app.get('/api/debtors', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getDebtors());
});

app.get('/api/debt-payments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.query.customerId as string | undefined;
  return res.json(db.getDebtPayments(customerId));
});

app.post('/api/debt-payments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = {
      ...req.body,
      recorded_by: req.user!.userId,
    };
    const result = db.recordDebtPayment(payload);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Expenses API -----------------
app.get('/api/expenses', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getExpenses());
});

app.post('/api/expenses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = {
      ...req.body,
      recorded_by: req.user!.userId,
    };
    const expense = db.createExpense(payload);
    return res.status(201).json(expense);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteExpense(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Orders API -----------------
app.get('/api/orders', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getOrders());
});

app.post('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = db.createOrder(req.body);
    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, amount_paid } = req.body;
    const order = db.updateOrderStatus(req.params.id, status, amount_paid);
    return res.json(order);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Dashboard & Reports API -----------------
app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = db.getDashboardMetrics();
    // Hide profit and cost valuation from Cashier role for security
    if (req.user!.role !== 'admin') {
      return res.json({
        ...metrics,
        today_profit: 0,
        stock_valuation_cost: 0,
      });
    }
    return res.json(metrics);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const reports = db.getReports(startDate as string, endDate as string);

    // If Cashier, strip gross/net profit and COGS
    if (req.user!.role !== 'admin') {
      return res.json({
        ...reports,
        summary: {
          ...reports.summary,
          total_cogs: 0,
          gross_profit: 0,
          net_profit: 0,
        },
        top_products: reports.top_products.map(({ cost, ...rest }) => rest),
      });
    }
    return res.json(reports);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------- Vite Integration / Static Frontend -----------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SUNREB POS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
