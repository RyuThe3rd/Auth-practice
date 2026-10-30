import { app } from '../src/app.js';
export async function start() {
 const server = app.listen(0, '127.0.0.1');
 await new Promise(resolve => server.once('listening', resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 return {
  close: () => new Promise(resolve => server.close(resolve)),
  request: (path, token, options = {}) => fetch(base + path, {
   ...options, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` }:{}), ...options.headers }
  }),
 };
}
