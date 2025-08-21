'use client';

export function KPICard({ label, value }: { label: string; value: string | number }) {
    return (
        <div style={{
            flex: 1, background: '#1f2937', borderRadius: 10, padding: 12, textAlign: 'center',
            border: '1px solid #374151'
        }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
        </div>
    );
}
