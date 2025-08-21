'use client';
import { KPICard } from '@/components/KPICard';
import { ScanTable } from '@/components/ScanTable';
import { useDashboardWS } from '@/components/useDashboardWS';
import './globals.css';

export default function Page() {
  const { scannedCount, shelvesCount, last, scans, status } = useDashboardWS();

  return (
    <div style={{ margin: 0, minHeight: '100vh', background: '#0b1220', color: '#e5e7eb' }}>
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <div style={{
          background: '#111827', border: '1px solid #374151', borderRadius: 12, padding: 16,
          boxShadow: '0 10px 25px rgba(0,0,0,.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: status === 'open' ? '#10b981' : status === 'connecting' ? '#f59e0b' : '#ef4444'
            }} />
            <strong>Dashboard de Estoque — Tempo real</strong>
            <span style={{
              marginLeft: 'auto', background: '#1f2937', border: '1px solid #374151',
              borderRadius: 999, padding: '2px 8px', fontSize: 12, color: '#9ca3af'
            }}>
              {status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <KPICard label="Escaneadas" value={scannedCount} />
            <KPICard label="Prateleiras OK" value={shelvesCount} />
            <KPICard label="Último" value={last ?? '—'} />
          </div>

          <ScanTable rows={scans} />
        </div>
      </div>
    </div>
  );
}
