import { test } from 'node:test';
import assert from 'node:assert/strict';
import { start } from './helpers.js';
test('scaffolding: frontend, health, login and rejected credentials', async () => {
 const api = await start();
 try {
  assert.equal((await api.request('/')).status, 200);
  assert.deepEqual(await (await api.request('/api/health')).json(), {ok:true});
  const login = password => api.request('/api/login', null, {method:'POST',body:JSON.stringify({email:'alice@alpha.test',password})});
  const good = await login('Practice-only-123!');assert.equal(good.status,200);assert.match((await good.json()).token,/^[a-f0-9]{64}$/);
  assert.equal((await login('wrong')).status,401);
 } finally { await api.close(); }
});
