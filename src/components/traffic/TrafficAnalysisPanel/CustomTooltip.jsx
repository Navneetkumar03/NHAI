

export const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'white',
                padding: '6px 8px',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                fontSize: '10px'
            }}>
                <p style={{ fontWeight: '600', color: '#374151', marginBottom: '3px' }}>
                    {label}
                </p>
                {payload.map((entry, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        color: entry.color
                    }}>
                        <span>{entry.name}:</span>
                        <span style={{ fontWeight: '600' }}>
                            {entry.value.toFixed(2)}
                            {entry.value > 1 && ' 🔴'}
                        </span>
                    </div>
                ))}
                <div style={{ fontSize: '8px', color: '#9ca3af', marginTop: '3px', borderTop: '1px solid #e5e7eb', paddingTop: '3px' }}>
                    Ratio &gt; 1 = Traffic
                </div>
            </div>
        );
    }
    return null;
};
