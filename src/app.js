import express from 'express';
import { fileURLToPath } from 'node:url';
import { users, documents, issueSession, revokeSession, verifyPassword } from './store.js';
import { authenticate, requireRole, authorizeDocument } from './security.js';
export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.post('/api/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const validPassword = verifyPassword(password);
  const user = users.find(u => u.email === email);
  if (!validPassword || !user?.active) return res.status(401).json({ error: 'Invalid credentials' });
  res.set('Cache-Control', 'no-store').json({ token: issueSession(user.id) });
});
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.get('/api/me', authenticate, (req, res) => res.json(req.user));
app.post('/api/logout', authenticate, (req, res) => {
  revokeSession(req.headers.authorization.trim().split(/\s+/)[1]);
  res.sendStatus(204);
});
app.get('/api/admin/users', authenticate, requireRole('admin'), (req, res) => {
  res.json(users.filter(u => u.tenantId === req.user.tenantId));
});
const loadDocument = (req, res, next) => {
  req.document = documents.find(d => d.id === req.params.id);
  if (!req.document) return res.status(404).json({ error: 'Not found' });
  next();
};
app.get('/api/documents/:id', authenticate, loadDocument, authorizeDocument('read'), (req, res) => res.json(req.document));
app.patch('/api/documents/:id', authenticate, loadDocument, authorizeDocument('write'), (req, res) => {
  const body = req.body;
  if (!body || Object.keys(body).length !== 1 || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120) {
    return res.status(400).json({ error: 'Only title (1–120 characters) may be changed' });
  }
  req.document.title = body.title.trim();
  res.json(req.document);
});
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => res.status(err.status === 400 ? 400 : 500).json({ error: err.status === 400 ? 'Invalid JSON' : 'Internal error' }));
