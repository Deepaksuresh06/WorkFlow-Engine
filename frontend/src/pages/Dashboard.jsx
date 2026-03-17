import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Stat, Card, Badge, Spinner, Table } from '../components/UI';
import { workflowAPI, executionAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [execs, setExecs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      workflowAPI.list({ limit: 100 }),
      executionAPI.listAll({ limit: 8 }),
    ]).then(([wRes, eRes]) => {
      const wfs = wRes.data.data;
      setStats({
        total:     wfs.length,
        active:    wfs.filter(w => w.status === 'active').length,
        draft:     wfs.filter(w => w.status === 'draft').length,
        executions: eRes.data.meta?.total || 0,
      });
      setExecs(eRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spinner />
      </div>
    </Layout>
  );

  return (
    <Layout title="Dashboard">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <Stat label="Total Workflows" value={stats.total}      icon="⚡" color="#1d4ed8" />
        <Stat label="Active"          value={stats.active}     icon="✅" color="#16a34a" />
        <Stat label="Drafts"          value={stats.draft}      icon="📝" color="#d97706" />
        <Stat label="Total Executions" value={stats.executions} icon="▶" color="#7c3aed" />
      </div>

      {/* Recent executions */}
      <Card>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Recent Executions</span>
          <button onClick={() => navigate('/executions')} style={{ background: 'none', border: 'none', color: '#1d4ed8', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>View all →</button>
        </div>
        {execs.length === 0
          ? <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No executions yet — run a workflow to see activity here</div>
          : <Table
              onRow={(row) => navigate(`/executions/${row._id}`)}
              cols={[
                { key: 'workflowName', label: 'Workflow', render: r => <span style={{ fontWeight: 500 }}>{r.workflowName || r.workflowId?.name || '—'}</span> },
                { key: 'status',       label: 'Status',   render: r => <Badge status={r.status} /> },
                { key: 'durationMs',   label: 'Duration', render: r => r.durationMs ? `${(r.durationMs/1000).toFixed(1)}s` : '—' },
                { key: 'createdAt',    label: 'When',     render: r => formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) },
              ]}
              rows={execs}
            />
        }
      </Card>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 24 }}>
        {[
          { icon: '➕', label: 'New Workflow', desc: 'Create an automation', path: '/workflows' },
          { icon: '📋', label: 'New Rule',     desc: 'Define conditions',   path: '/rules'     },
          { icon: '≡',  label: 'View Logs',    desc: 'Inspect all logs',    path: '/logs'      },
        ].map(({ icon, label, desc, path }) => (
          <Card key={label} style={{ padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onClick={() => navigate(path)}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{desc}</div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
