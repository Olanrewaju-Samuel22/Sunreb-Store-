import express, { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

export const apiRouter = express.Router();

// In-memory token store for session verification
const activeSessions = new Map<string, { userId: string; role: 'admin' | 'cashier'; name: string }>();

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: 'admin' | 'cashier'; name: string };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access restricted: Administrator role required' });
  }
  next();
};

// Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', time: new Date().toISOString() });
});

// ----------------- Auth API -----------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
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

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const profile = db.getProfileById(req.user!.userId);
  if (!profile) {
    return res.status(404).json({ error: 'User profile not found' });
  }
  const { pin: _, ...safeUser } = profile;
  return res.json(safeUser);
});

// ----------------- Profiles API (Admin Only) -----------------
apiRouter.get('/profiles', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getProfiles());
});

apiRouter.post('/profiles', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

apiRouter.put('/profiles/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = db.updateProfile(req.params.id, req.body);
    const { pin: _, ...safeUser } = profile;
    return res.json(safeUser);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Categories API -----------------
apiRouter.get('/categories', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getCategories());
});

apiRouter.post('/categories', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const cat = db.createCategory(name);
    return res.status(201).json(cat);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/categories/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteCategory(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Suppliers API -----------------
apiRouter.get('/suppliers', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getSuppliers());
});

apiRouter.post('/suppliers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const supplier = db.createSupplier(req.body);
    return res.status(201).json(supplier);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/suppliers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const supplier = db.updateSupplier(req.params.id, req.body);
    return res.json(supplier);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Products API -----------------
apiRouter.get('/products', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getProducts());
});

apiRouter.post('/products', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = db.createProduct(req.body);
    return res.status(201).json(product);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/products/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = db.updateProduct(req.params.id, req.body);
    return res.json(product);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/products/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteProduct(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Stock Batches API (Stock Receiving) -----------------
apiRouter.get('/batches', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const productId = req.query.productId as string | undefined;
  return res.json(db.getStockBatches(productId));
});

apiRouter.post('/batches', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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
apiRouter.get('/customers', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getCustomers());
});

apiRouter.post('/customers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = db.createCustomer(req.body);
    return res.status(201).json(customer);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/customers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = db.updateCustomer(req.params.id, req.body);
    return res.json(customer);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- POS: Complete Sale RPC (FEFO Transaction) -----------------
apiRouter.post('/sales/complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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

apiRouter.get('/sales', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getSales(250));
});

apiRouter.get('/sales/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const sale = db.getSaleById(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale record not found' });
  return res.json(sale);
});

// ----------------- Debtors & Debt Payments -----------------
apiRouter.get('/debtors', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getDebtors());
});

apiRouter.get('/debt-payments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.query.customerId as string | undefined;
  return res.json(db.getDebtPayments(customerId));
});

apiRouter.post('/debt-payments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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
apiRouter.get('/expenses', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getExpenses());
});

apiRouter.post('/expenses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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

apiRouter.delete('/expenses/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteExpense(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Orders API -----------------
apiRouter.get('/orders', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getOrders());
});

apiRouter.post('/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = db.createOrder(req.body);
    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/orders/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, amount_paid } = req.body;
    const order = db.updateOrderStatus(req.params.id, status, amount_paid);
    return res.json(order);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- Dashboard & Reports API -----------------
apiRouter.get('/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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

apiRouter.get('/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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
