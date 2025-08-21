// websocket/server.js
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const HTTP_PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const stats = {
  scannedCount: 0,
  shelvesWithScan: new Set(),
  last: null,
};
function resetStats() {
  stats.scannedCount = 0;
  stats.shelvesWithScan.clear();
  stats.last = null;
}
app.get('/stats', (_req, res) => {
  res.json({
    scannedCount: stats.scannedCount,
    shelvesCount: stats.shelvesWithScan.size,
    last: stats.last,
    ts: Date.now(),
  });
});

// enviar UM waypoint (HTTP -> WS simulações)
app.post('/waypoint', (req, res) => {
  const { x, y, z } = req.body || {};
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    return res.status(400).json({ ok: false, error: 'x,y,z numéricos são obrigatórios' });
  }
  broadcastTo(clients.sim, { type: 'waypoint', x, y, z });
  return res.json({ ok: true });
});

// enviar VÁRIOS waypoints (batch)
app.post('/waypoints', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.some(p => typeof p.x !== 'number' || typeof p.y !== 'number' || typeof p.z !== 'number')) {
    return res.status(400).json({ ok: false, error: 'items deve ser array de {x,y,z} numéricos' });
  }
  items.forEach(p => broadcastTo(clients.sim, { type: 'waypoint', x: p.x, y: p.y, z: p.z }));
  return res.json({ ok: true, count: items.length });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });
const clients = {
  sim: new Set(),        // simulação(ões)
  dashboard: new Set(),  // dashboards
  controller: new Set(), // emissores de comandos (opcional)
};

function safeSend(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}
function broadcastTo(set, msgObj) {
  set.forEach(ws => safeSend(ws, msgObj));
}

wss.on('connection', (ws) => {
  let role = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'hello' && ['sim', 'dashboard', 'controller'].includes(msg.role)) {
      role = msg.role;
      clients[role].add(ws);
      safeSend(ws, { type: 'hello_ack', role, ok: true });

      if (role === 'dashboard') {
        safeSend(ws, {
          type: 'snapshot',
          scannedCount: stats.scannedCount,
          shelvesCount: stats.shelvesWithScan.size,
          last: stats.last,
        });
      }
      return;
    }

    if (!role) return;

    if (role === 'sim' && msg.type === 'scan' && msg.payload) {
      const p = msg.payload; // { barcode, shelfId, isOpen, scannedAt }

      stats.scannedCount += 1;
      if (p?.shelfId != null) stats.shelvesWithScan.add(p.shelfId);
      if (p?.barcode) stats.last = p.barcode;

      broadcastTo(clients.dashboard, { type: 'scan', payload: p });
      broadcastTo(clients.dashboard, {
        type: 'stats',
        scannedCount: stats.scannedCount,
        shelvesCount: stats.shelvesWithScan.size,
        last: stats.last,
      });
      return;
    }

    if ((role === 'sim' || role === 'controller') && msg.type === 'reset') {
      console.log('[Hub] RESET recebido:', msg.reason || 'no-reason');
      resetStats();
      // avisa dashboards para limparem a UI
      broadcastTo(clients.dashboard, { type: 'reset', ts: Date.now(), reason: msg.reason || null });
      // envia snapshot zerado
      broadcastTo(clients.dashboard, {
        type: 'snapshot',
        scannedCount: stats.scannedCount,
        shelvesCount: stats.shelvesWithScan.size,
        last: stats.last,
      });
      return;
    }
    if (role === 'dashboard' && msg.type === 'get_stats') {
      safeSend(ws, {
        type: 'snapshot',
        scannedCount: stats.scannedCount,
        shelvesCount: stats.shelvesWithScan.size,
        last: stats.last,
      });
    }
  });

  ws.on('close', () => {
    if (role && clients[role]) clients[role].delete(ws);
  });
});

server.listen(HTTP_PORT, () => {
  console.log(`HTTP+WS hub on http://localhost:${HTTP_PORT}`);
  console.log(`- GET  /stats                -> snapshot agregado`);
  console.log(`- POST /waypoint {x,y,z}     -> envia 1 waypoint para as simulações`);
  console.log(`- POST /waypoints {items[]}  -> envia N waypoints para as simulações`);
});
