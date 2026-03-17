import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, Badge, Table, Empty, Spinner, Btn } from '../components/UI';
import { executionAPI } from '../api';
import { format, formatDistanceToNow } from 'date-fns';

export default function AllLogs() {
  const [execs, setExecs]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoad]  = useState(true);
  const [filter, setFilter] = useState('');
  const navigate            = useNavigate();

  const load = async (status = filter) => {
    setLoad(true);
    try {
      const { data } = await executionAPI.listAll({ status: status || undefined, limit: 100 });
      setExecs(data.data);
      setTotal(data.meta?.total || data.data.length);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <Layout title="Logs">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Execution Logs</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{total} total executions</p>
        </div>
        <Btn variant="secondary" size="sm" onClick={() => load()}>↻ Refresh</Btn>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['', 'pending', 'running', 'completed', 'failed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: filter === s ? '#1d4ed8' : '#e5e7eb', background: filter === s ? '#1d4ed8' : '#fff', color: filter === s ? '#fff' : '#374151' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : execs.length === 0 ? (
        <Card><Empty icon="≡" text="No logs yet. Run a workflow to generate logs." /></Card>
      ) : (
        <Card>
          <Table
            onRow={(row) => navigate(`/executions/${row._id}`)}
            cols={[
              { key: 'workflowName', label: 'Workflow',  render: r => <span style={{ fontWeight: 600 }}>{r.workflowName || r.workflowId?.name || '—'}</span> },
              { key: 'status',       label: 'Status',    render: r => <Badge status={r.status} /> },
              { key: '_id',          label: 'Run ID',    render: r => <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280' }}>{r._id.slice(-8)}</code> },
              { key: 'durationMs',   label: 'Duration',  render: r => r.durationMs ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{(r.durationMs/1000).toFixed(2)}s</span> : '—' },
              { key: 'startedAt',    label: 'Started',   render: r => r.startedAt ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{format(new Date(r.startedAt), 'MMM d HH:mm:ss')}</span> : '—' },
              { key: 'createdAt',    label: 'Age',       render: r => formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) },
              { key: 'view',         label: '',          render: r => <span style={{ color: '#1d4ed8', fontSize: 13, fontWeight: 500 }}>View →</span> },
            ]}
            rows={execs}
          />
        </Card>
      )}
    </Layout>
  );
}
