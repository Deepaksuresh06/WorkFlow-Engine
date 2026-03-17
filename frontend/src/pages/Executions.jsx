import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, Badge, Table, Empty, Spinner, Btn } from '../components/UI';
import { executionAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function Executions() {
  const [execs, setExecs]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoad]  = useState(true);
  const [filter, setFilter] = useState('');
  const [params]            = useSearchParams();
  const navigate            = useNavigate();

  const load = async (status = filter) => {
    setLoad(true);
    try {
      const { data } = await executionAPI.listAll({ status: status || undefined, limit: 50 });
      setExecs(data.data);
      setTotal(data.meta?.total || data.data.length);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const cancel = async (e, id) => {
    e.stopPropagation();
    await executionAPI.cancel(id);
    toast.success('Cancelled');
    load();
  };

  const retry = async (e, id) => {
    e.stopPropagation();
    await executionAPI.retry(id);
    toast.success('Retry queued');
    load();
  };

  return (
    <Layout title="Executions">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Executions</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{total} total</p>
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
        <Card><Empty icon="▶" text="No executions found. Run a workflow to see results here." /></Card>
      ) : (
        <Card>
          <Table
            onRow={(row) => navigate(`/executions/${row._id}`)}
            cols={[
              { key: 'workflowName', label: 'Workflow',  render: r => <span style={{ fontWeight: 500 }}>{r.workflowName || r.workflowId?.name || '—'}</span> },
              { key: 'status',       label: 'Status',    render: r => <Badge status={r.status} /> },
              { key: 'durationMs',   label: 'Duration',  render: r => r.durationMs ? `${(r.durationMs/1000).toFixed(2)}s` : '—' },
              { key: 'createdAt',    label: 'Started',   render: r => formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) },
              { key: 'actions',      label: '',          render: r => (
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  {['pending','running'].includes(r.status) && (
                    <Btn variant="danger" size="sm" onClick={(e) => cancel(e, r._id)}>Cancel</Btn>
                  )}
                  {r.status === 'failed' && (
                    <Btn variant="secondary" size="sm" onClick={(e) => retry(e, r._id)}>Retry</Btn>
                  )}
                </div>
              )},
            ]}
            rows={execs}
          />
        </Card>
      )}
    </Layout>
  );
}
