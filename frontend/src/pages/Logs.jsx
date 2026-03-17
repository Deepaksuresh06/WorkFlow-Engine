import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, Badge, Btn, Spinner, Empty } from '../components/UI';
import { executionAPI } from '../api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

/* ── Step log card ───────────────────────────────────────────────────────── */
function StepCard({ log }) {
  const [open, setOpen] = useState(false);
  const color = {
    completed: { border: '#bbf7d0', bg: '#f0fdf4', dot: '#16a34a' },
    failed:    { border: '#fecaca', bg: '#fff1f2', dot: '#dc2626' },
    running:   { border: '#c7d2fe', bg: '#eef2ff', dot: '#4f46e5' },
    skipped:   { border: '#e5e7eb', bg: '#f9fafb', dot: '#9ca3af' },
    pending:   { border: '#fde68a', bg: '#fffbeb', dot: '#d97706' },
  }[log.status] || { border: '#e5e7eb', bg: '#fff', dot: '#9ca3af' };

  return (
    <div style={{ border: `1px solid ${color.border}`, background: color.bg, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.dot, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{log.stepName}</span>
          <span style={{ fontSize: 12, padding: '2px 8px', background: 'rgba(0,0,0,0.06)', borderRadius: 4, color: '#374151' }}>{log.stepType}</span>
          <Badge status={log.status} />
          {log.attempt > 1 && <span style={{ fontSize: 12, color: '#d97706' }}>attempt {log.attempt}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {log.durationMs && <span style={{ fontSize: 12, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>{log.durationMs}ms</span>}
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Details */}
      {open && (
        <div style={{ borderTop: `1px solid ${color.border}`, padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {log.startedAt && (
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>STARTED</div>
                <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{format(new Date(log.startedAt), 'HH:mm:ss.SSS')}</div>
              </div>
            )}
            {log.completedAt && (
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>COMPLETED</div>
                <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{format(new Date(log.completedAt), 'HH:mm:ss.SSS')}</div>
              </div>
            )}
          </div>

          {log.output && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>OUTPUT</div>
              <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: 'rgba(0,0,0,0.04)', padding: '10px 12px', borderRadius: 6, overflow: 'auto', maxHeight: 200, margin: 0, color: '#374151' }}>
                {JSON.stringify(log.output, null, 2)}
              </pre>
            </div>
          )}

          {log.error?.message && (
            <div>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>ERROR</div>
              <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: '#fee2e2', padding: '10px 12px', borderRadius: 6, overflow: 'auto', maxHeight: 120, margin: 0, color: '#991b1b' }}>
                {log.error.message}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Execution detail page ───────────────────────────────────────────────── */
export default function LogDetail() {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const [exec, setExec]     = useState(null);
  const [steps, setSteps]   = useState([]);
  const [loading, setLoad]  = useState(true);

  const load = async () => {
    try {
      const [eRes, sRes] = await Promise.all([
        executionAPI.get(id),
        executionAPI.stepLogs(id),
      ]);
      setExec(eRes.data.data);
      setSteps(sRes.data.data);
    } finally { setLoad(false); }
  };

  useEffect(() => {
    load();
    // Auto-refresh if running
    const iv = setInterval(async () => {
      const { data } = await executionAPI.get(id);
      setExec(data.data);
      if (['running','pending'].includes(data.data.status)) {
        const s = await executionAPI.stepLogs(id);
        setSteps(s.data.data);
      } else {
        clearInterval(iv);
        const s = await executionAPI.stepLogs(id);
        setSteps(s.data.data);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [id]);

  const cancel = async () => {
    await executionAPI.cancel(id);
    toast.success('Cancelled');
    load();
  };

  const retry = async () => {
    const { data } = await executionAPI.retry(id);
    toast.success('Retry queued');
    navigate(`/executions/${data.data._id}`);
  };

  if (loading) return <Layout title="Execution Log"><div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spinner /></div></Layout>;
  if (!exec) return <Layout title="Not Found"><Empty text="Execution not found" /></Layout>;

  const completed = exec.status === 'completed';
  const failed    = exec.status === 'failed';
  const running   = ['running','pending'].includes(exec.status);

  return (
    <Layout title="Execution Log">
      {/* Back */}
      <button onClick={() => navigate('/executions')}
        style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Back to Executions
      </button>

      {/* Summary card */}
      <Card style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{exec.workflowName || 'Execution'}</h2>
              <Badge status={exec.status} />
              {running && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4f46e5' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f46e5', animation: 'pulse 1s ease infinite', display: 'inline-block' }} />
                  Live
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
              <span>ID: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>{exec._id}</code></span>
              {exec.startedAt && <span>Started: {format(new Date(exec.startedAt), 'MMM d, HH:mm:ss')}</span>}
              {exec.durationMs && <span>Duration: <strong style={{ color: '#111827' }}>{(exec.durationMs/1000).toFixed(2)}s</strong></span>}
              {exec.createdAt  && <span>{formatDistanceToNow(new Date(exec.createdAt), { addSuffix: true })}</span>}
            </div>

            {/* Progress bar */}
            {steps.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  <span>{steps.filter(s => s.status === 'completed').length} / {steps.length} steps completed</span>
                  <span>{Math.round(steps.filter(s => s.status === 'completed').length / steps.length * 100)}%</span>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${steps.filter(s => s.status === 'completed').length / steps.length * 100}%`,
                    background: failed ? '#ef4444' : completed ? '#16a34a' : '#4f46e5',
                    transition: 'width 0.4s',
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {running && <Btn variant="danger" size="sm" onClick={cancel}>Cancel</Btn>}
            {failed   && <Btn variant="secondary" size="sm" onClick={retry}>🔄 Retry</Btn>}
            <Btn variant="secondary" size="sm" onClick={load}>↻ Refresh</Btn>
          </div>
        </div>

        {/* Context */}
        {exec.context && Object.keys(exec.context).length > 0 && (
          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Context data</summary>
            <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: '#f8f9fc', padding: '10px 12px', borderRadius: 6, marginTop: 6, overflow: 'auto', maxHeight: 150 }}>
              {JSON.stringify(exec.context, null, 2)}
            </pre>
          </details>
        )}
      </Card>

      {/* Step logs */}
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Step Logs ({steps.length})</h3>
        {running && <span style={{ fontSize: 12, color: '#4f46e5' }}>Auto-refreshing every 2s...</span>}
      </div>

      {steps.length === 0
        ? <Card><Empty icon="⏳" text={running ? 'Steps will appear as they run...' : 'No step logs recorded'} /></Card>
        : steps.map((s, i) => <StepCard key={s.stepId || i} log={s} />)
      }

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </Layout>
  );
}
