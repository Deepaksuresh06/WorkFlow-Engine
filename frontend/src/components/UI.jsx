import { forwardRef } from 'react';

/* ── Status badge ─────────────────────────────────────────────────────────── */
const BADGE = {
  draft:     { bg: '#f3f4f6', color: '#6b7280' },
  active:    { bg: '#dcfce7', color: '#166534' },
  archived:  { bg: '#fef9c3', color: '#854d0e' },
  pending:   { bg: '#dbeafe', color: '#1e40af' },
  running:   { bg: '#ede9fe', color: '#5b21b6' },
  completed: { bg: '#dcfce7', color: '#166534' },
  failed:    { bg: '#fee2e2', color: '#991b1b' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280' },
  skipped:   { bg: '#f3f4f6', color: '#9ca3af' },
};
export const Badge = ({ status }) => {
  const c = BADGE[status] || BADGE.draft;
  return (
    <span style={{ background: c.bg, color: c.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize', display: 'inline-block' }}>
      {status}
    </span>
  );
};

/* ── Button ───────────────────────────────────────────────────────────────── */
const BTN = {
  primary:   { background: '#1d4ed8', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
  danger:    { background: '#dc2626', color: '#fff', border: 'none' },
  success:   { background: '#16a34a', color: '#fff', border: 'none' },
  ghost:     { background: 'transparent', color: '#6b7280', border: 'none' },
};
export const Btn = ({ children, variant = 'primary', size = 'md', loading, onClick, type = 'button', style = {}, disabled }) => {
  const sz = size === 'sm' ? { padding: '5px 12px', fontSize: 13 } : { padding: '8px 18px', fontSize: 14 };
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled}
      style={{ ...BTN[variant], ...sz, borderRadius: 8, fontWeight: 500, cursor: (loading || disabled) ? 'not-allowed' : 'pointer', opacity: (loading || disabled) ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', ...style }}>
      {loading && <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />}
      {children}
    </button>
  );
};

/* ── Input ────────────────────────────────────────────────────────────────── */
export const Input = forwardRef(({ label, error, ...props }, ref) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</label>}
    <input ref={ref} {...props}
      style={{ width: '100%', border: `1px solid ${error ? '#f87171' : '#d1d5db'}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', ...props.style }} />
    {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 3 }}>{error}</p>}
  </div>
));
Input.displayName = 'Input';

/* ── Select ───────────────────────────────────────────────────────────────── */
export const Select = forwardRef(({ label, error, children, ...props }, ref) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</label>}
    <select ref={ref} {...props}
      style={{ width: '100%', border: `1px solid ${error ? '#f87171' : '#d1d5db'}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }}>
      {children}
    </select>
    {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 3 }}>{error}</p>}
  </div>
));
Select.displayName = 'Select';

/* ── Textarea ─────────────────────────────────────────────────────────────── */
export const Textarea = forwardRef(({ label, ...props }, ref) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</label>}
    <textarea ref={ref} rows={3} {...props}
      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', ...props.style }} />
  </div>
));
Textarea.displayName = 'Textarea';

/* ── Card ─────────────────────────────────────────────────────────────────── */
export const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, ...style }}>
    {children}
  </div>
);

/* ── Modal ────────────────────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 22px' }}>{children}</div>
      </div>
    </div>
  );
};

/* ── Spinner ──────────────────────────────────────────────────────────────── */
export const Spinner = ({ size = 32 }) => (
  <>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{ width: size, height: size, border: '3px solid #e5e7eb', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </>
);

/* ── Empty ────────────────────────────────────────────────────────────────── */
export const Empty = ({ icon = '📭', text = 'Nothing here yet' }) => (
  <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
    <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 14 }}>{text}</div>
  </div>
);

/* ── Table ────────────────────────────────────────────────────────────────── */
export const Table = ({ cols, rows, onRow }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
          {cols.map((c) => (
            <th key={c.key} style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row._id || i} onClick={() => onRow?.(row)}
            style={{ borderBottom: '1px solid #f3f4f6', cursor: onRow ? 'pointer' : 'default', transition: 'background 0.1s' }}
            onMouseEnter={(e) => onRow && (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
            {cols.map((c) => (
              <td key={c.key} style={{ padding: '12px 16px', color: '#374151', ...c.style }}>
                {c.render ? c.render(row) : row[c.key] ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Stat card ────────────────────────────────────────────────────────────── */
export const Stat = ({ label, value, icon, color = '#1d4ed8' }) => (
  <Card style={{ padding: '20px 24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      </div>
      <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>
    </div>
  </Card>
);
