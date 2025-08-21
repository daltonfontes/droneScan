'use client';
import { useEffect, useRef, useState } from 'react';

type ScanPayload = {
  barcode: string;
  shelfId?: number;
  isOpen?: boolean;
  scannedAt?: number;
};

type DashboardState = {
  scannedCount: number;
  shelvesCount: number;
  last?: string;
  scans: ScanPayload[];
  status: 'connecting' | 'open' | 'closed' | 'error';
};

export function useDashboardWS() {
  const [state, setState] = useState<DashboardState>({
    scannedCount: 0,
    shelvesCount: 0,
    last: undefined,
    scans: [],
    status: 'connecting',
  });
  const wsRef = useRef<WebSocket | null>(null);
  const retries = useRef(0);

  useEffect(() => {
    const URL = process.env.NEXT_PUBLIC_WS_URL!;
    let alive = true;

    const connect = () => {
      setState(s => ({ ...s, status: 'connecting' }));
      const ws = new WebSocket(URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!alive) return;
        retries.current = 0;
        setState(s => ({ ...s, status: 'open' }));
        ws.send(JSON.stringify({ type: 'hello', role: 'dashboard' }));
        ws.send(JSON.stringify({ type: 'get_stats' }));
      };

      ws.onmessage = (evt) => {
        if (!alive) return;
        let msg: any;
        try { msg = JSON.parse(evt.data); } catch { return; }

        if (msg.type === 'snapshot') {
          setState(s => ({
            ...s,
            scannedCount: msg.scannedCount ?? s.scannedCount,
            shelvesCount: msg.shelvesCount ?? s.shelvesCount,
          }));
          return;
        }
        if (msg.type === 'stats') {
          setState(s => ({
            ...s,
            scannedCount: typeof msg.scannedCount === 'number' ? msg.scannedCount : s.scannedCount,
            shelvesCount: typeof msg.shelvesCount === 'number' ? msg.shelvesCount : s.shelvesCount,
            last: msg.last ?? s.last,
          }));
          return;
        }
        if (msg.type === 'scan' && msg.payload) {
          const p: ScanPayload = msg.payload;
          setState(s => ({
            ...s,
            last: p.barcode ?? s.last,
            scans: [{ ...p }, ...s.scans].slice(0, 500),
          }));
          return;
        }
      };

      ws.onerror = () => {
        if (!alive) return;
        setState(s => ({ ...s, status: 'error' }));
      };

      ws.onclose = () => {
        if (!alive) return;
        setState(s => ({ ...s, status: 'closed' }));
        const timeout = Math.min(1000 * Math.pow(2, retries.current++), 8000);
        setTimeout(connect, timeout);
      };
    };

    connect();
    return () => { alive = false; wsRef.current?.close(); };
  }, []);

  return state;
}
