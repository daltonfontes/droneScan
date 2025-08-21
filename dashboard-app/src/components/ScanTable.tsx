'use client';

type Row = { barcode: string; shelfId?: number; scannedAt?: number };

export function ScanTable({ rows }: { rows: Row[] }) {
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
            <thead>
                <tr style={{ background: '#111827', color: '#9ca3af' }}>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #374151' }}>Barcode</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #374151' }}>Prateleira</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #374151' }}>Hora</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        <td style={{ padding: 8, borderBottom: '1px solid #374151', color: '#e5e7eb' }}>{r.barcode}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #374151', color: '#e5e7eb' }}>
                            {r.shelfId != null ? `#${r.shelfId}` : '—'}
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                            {new Date(r.scannedAt ?? Date.now()).toLocaleTimeString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
