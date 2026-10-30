// YOUR WORKSPACE: implement these three middleware functions only.
// Helpers/data you may import from ./store.js:
// sessions, tokenDigest, users. req.document is loaded before authorizeDocument.
// Read README.md for the complete contract. No solution is included.
import session from './store.js';
import users from 'store.js';

export function authenticate(req, res, next) {
  // TODO: validate Authorization: Bearer <opaque token>, look up the session,
  // validate its lifetime/revocation and current user, then set req.user.
  //const {id} = req.params;
  const bearer = req.headers['Authorization'] ?? req.headers['authorization'];
  const token = bearer.split(' ')[1];

  const SessionInfo = session.get(token);

  if(SessionInfo.revoked == true ){
    return res.status(401).json({ error: 'Invalid Token' });
  }


  if(SessionInfo.userId !== req.body.user.id){
     return res.status(401).json({ error: 'Unauthorized' });
  }

  if(SessionInfo.expiresAt <= Date.now() ){
    req.body.user.active = false;
    return res.status(501).json({ error: 'Expired token' });
  }

  req.user = users.find(u => u.id === SessionInfo.userId);
  next();

}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // TODO: enforce the current user's role; never trust client-supplied roles.
    return res.status(501).json({ error: 'Implement requireRole' });
  };
}

export function authorizeDocument(action) {
  return (req, res, next) => {
    // TODO: enforce tenant isolation, ownership, and read/write policy.
    return res.status(501).json({ error: 'Implement authorizeDocument' });
  };
}
