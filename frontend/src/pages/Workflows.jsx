import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { v4 as uuid } from 'uuid';
import Layout from '../components/Layout';
import { Card, Btn, Badge, Modal, Input, Select, Textarea, Empty, Spinner } from '../components/UI';
import { workflowAPI, ruleAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';

const STEP_TYPES    = ['task', 'approval', 'notification'];
const STEP_HANDLERS = ['log', 'http_request', 'fail_test'];

const emptyStep = () => ({
  stepId: uuid(), name: '', type: 'task', handler: 'log',
  description: '', order: 0, ruleId: '',
  retry: { maxAttempts: 3, backoffMs: 1000 },
});
const emptyForm = () => ({ name: '', description: '', tags: '', steps: [emptyStep()] });

/* ── Rule badge shown on step ────────────────────────────────────────────── */
const RULE_COLORS = {
  allow:     { bg: '#dcfce7', color: '#166534' },
  deny:      { bg: '#fee2e2', color: '#991b1b' },
  skip_step: { bg: '#fef9c3', color: '#854d0e' },
  notify:    { bg: '#dbeafe', color: '#1e40af' },
};

/* ── Step editor row ─────────────────────────────────────────────────────── */
function StepRow({ step, index, onChange, onRemove, rules }) {
  const addRule    = () => onChange(index, 'rules', [...(step.rules || []), { ruleId: '' }]);
  const removeRule = (ri) => onChange(index, 'rules', step.rules.filter((_, i) => i !== ri));
  const setRule    = (ri, val) => {
    const updated = [...(step.rules || [])];
    updated[ri] = { ruleId: val };
    onChange(index, 'rules', updated);
  };

  const attachedRules = (step.rules || [])
    .map(r => rules.find(rl => rl._id === r.ruleId))
    .filter(Boolean);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 10, background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>Step {index + 1}</span>
          {attachedRules.map(r => (
            <span key={r._id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
              background: RULE_COLORS[r.action]?.bg || '#f3f4f6',
              color:      RULE_COLORS[r.action]?.color || '#374151' }}>
              {r.name} → {r.action}
            </span>
          ))}
        </div>
        <button onClick={() => onRemove(index)}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
          Remove
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Input label="Step Name *" value={step.name} placeholder="e.g. Send Email"
          onChange={e => onChange(index, 'name', e.target.value)} />
        <Select label="Type" value={step.type}
          onChange={e => onChange(index, 'type', e.target.value)}>
          {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select label="Handler" value={step.handler}
          onChange={e => onChange(index, 'handler', e.target.value)}>
          {STEP_HANDLERS.map(h => <option key={h} value={h}>{h}</option>)}
        </Select>
        <Input label="Max Retries" type="number" value={step.retry.maxAttempts}
          onChange={e => onChange(index, 'retry.maxAttempts', +e.target.value)} />
      </div>

      {/* Multi-rule section */}
      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
            Rules {step.rules?.length > 0 ? `(${step.rules.length})` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {step.rules?.length > 1 && (
              <select value={step.rulesLogic || 'AND'}
                onChange={e => onChange(index, 'rulesLogic', e.target.value)}
                style={{ fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, padding: '3px 8px', background: '#fff' }}>
                <option value="AND">AND — all must match</option>
                <option value="OR">OR — any must match</option>
              </select>
            )}
            <button onClick={addRule}
              style={{ fontSize: 12, color: '#1d4ed8', background: 'none', border: '1px solid #1d4ed8', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
              + Add Rule
            </button>
          </div>
        </div>

        {(step.rules || []).length === 0 && (
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>No rules — step always runs</p>
        )}

        {(step.rules || []).map((r, ri) => {
          const selectedRule = rules.find(rl => rl._id === r.ruleId);
          return (
            <div key={ri} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              {ri > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', width: 28, textAlign: 'center',
                  background: '#f3f4f6', borderRadius: 4, padding: '2px 4px' }}>
                  {step.rulesLogic || 'AND'}
                </span>
              )}
              <select value={r.ruleId || ''}
                onChange={e => setRule(ri, e.target.value)}
                style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fff' }}>
                <option value="">— Select a rule —</option>
                {rules.map(rl => (
                  <option key={rl._id} value={rl._id}>
                    {rl.name} → {rl.action} (priority {rl.priority})
                  </option>
                ))}
              </select>
              {selectedRule && (
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap',
                  background: RULE_COLORS[selectedRule.action]?.bg || '#f3f4f6',
                  color:      RULE_COLORS[selectedRule.action]?.color || '#374151' }}>
                  {selectedRule.action}
                </span>
              )}
              <button onClick={() => removeRule(ri)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                ×
              </button>
            </div>
          );
        })}

        {attachedRules.length > 0 && (
          <div style={{ fontSize: 12, color: '#6b7280', background: '#f8f9fc', borderRadius: 6, padding: '6px 10px', marginTop: 4 }}>
            {attachedRules.map((r, i) => (
              <span key={r._id}>
                {i > 0 && <strong> {step.rulesLogic || 'AND'} </strong>}
                <code style={{ background: '#e5e7eb', padding: '1px 5px', borderRadius: 3 }}>
                  {r.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(` ${r.conditionLogic} `)}
                </code>
              </span>
            ))}
            {' → '}
            <strong>{
              attachedRules[0]?.action === 'skip_step' ? 'Step SKIPPED' :
              attachedRules[0]?.action === 'deny'      ? 'Execution STOPS' :
              attachedRules[0]?.action === 'notify'    ? 'Notification sent, step continues' :
              'Step runs normally'
            }</strong>
          </div>
        )}
      </div>

      <Input label="Description" value={step.description} placeholder="What does this step do?"
        onChange={e => onChange(index, 'description', e.target.value)} />
    </div>
  );
}

/* ── Workflow form modal ─────────────────────────────────────────────────── */
function WorkflowModal({ open, onClose, initial, onSaved }) {
  const [form, setForm]   = useState(initial || emptyForm());
  const [rules, setRules] = useState([]);
  const [saving, setSave] = useState(false);

  useEffect(() => {
    setForm(initial || emptyForm());
    ruleAPI.list().then(({ data }) => setRules(data.data)).catch(() => {});
  }, [initial, open]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const stepChange = (i, path, val) => {
    const steps = [...form.steps];
    const keys  = path.split('.');
    if (keys.length === 2) steps[i][keys[0]][keys[1]] = val;
    else steps[i][keys[0]] = val;
    setForm(f => ({ ...f, steps }));
  };

  const addStep    = () => setForm(f => ({ ...f, steps: [...f.steps, emptyStep()] }));
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name.trim()) return toast.error('Workflow name is required');
    if (!form.steps.length) return toast.error('Add at least one step');
    if (form.steps.some(s => !s.name.trim())) return toast.error('All steps need a name');
    setSave(true);
    try {
      const payload = {
        ...form,
        tags:  form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        steps: form.steps.map((s, i) => ({
          ...s,
          order:  i,
          rules:      (s.rules || []).filter(r => r.ruleId),
          rulesLogic: s.rulesLogic || 'AND',
        })),
      };
      if (initial?._id) await workflowAPI.update(initial._id, payload);
      else              await workflowAPI.create(payload);
      toast.success(initial?._id ? 'Workflow updated' : 'Workflow created');
      onSaved();
      onClose();
    } finally { setSave(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? 'Edit Workflow' : 'New Workflow'} width={640}>
      <Input label="Workflow Name *" value={form.name} placeholder="e.g. Order Approval"
        onChange={e => setF('name', e.target.value)} />
      <Textarea label="Description" value={form.description}
        onChange={e => setF('description', e.target.value)} />
      <Input label="Tags (comma separated)" value={form.tags} placeholder="finance, approvals"
        onChange={e => setF('tags', e.target.value)} />

      {rules.length === 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#854d0e', marginBottom: 14 }}>
          💡 No rules created yet. Go to <strong>Rules</strong> page to create rules, then come back and attach them to steps.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Steps ({form.steps.length})</span>
        <Btn variant="secondary" size="sm" onClick={addStep}>+ Add Step</Btn>
      </div>

      {form.steps.map((step, i) => (
        <StepRow key={step.stepId} step={step} index={i}
          onChange={stepChange} onRemove={removeStep} rules={rules} />
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} loading={saving}>{initial?._id ? 'Save Changes' : 'Create Workflow'}</Btn>
      </div>
    </Modal>
  );
}

/* ── Trigger modal ───────────────────────────────────────────────────────── */
function TriggerModal({ open, onClose, workflow, onTriggered }) {
  const [ctx, setCtx]   = useState('{}');
  const [err, setErr]   = useState('');
  const [running, setR] = useState(false);

  const run = async () => {
    let context = {};
    try { context = JSON.parse(ctx); } catch { return setErr('Invalid JSON — check your brackets'); }
    setR(true);
    try {
      await workflowAPI.trigger(workflow._id, { context });
      toast.success('Execution started!');
      onTriggered();
      onClose();
    } finally { setR(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Run: ${workflow?.name}`} width={480}>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
        Context data is available to rules during execution. If a rule checks <code>order.amount</code>, pass it here.
      </p>
      <Textarea label="Context (JSON)" value={ctx}
        onChange={e => { setCtx(e.target.value); setErr(''); }}
        style={{ fontFamily: 'monospace', fontSize: 13, minHeight: 120 }} />
      {err && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{err}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="success" onClick={run} loading={running}>▶ Run Now</Btn>
      </div>
    </Modal>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Workflows() {
  const [wfs, setWfs]         = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoad]    = useState(true);
  const [filter, setFilter]   = useState('');
  const [showForm, setShow]   = useState(false);
  const [editWf, setEdit]     = useState(null);
  const [triggerWf, setTrig]  = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoad(true);
    try {
      const { data } = await workflowAPI.list({ status: filter || undefined });
      setWfs(data.data);
      setTotal(data.meta?.total || data.data.length);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const publish = async (wf) => {
    await workflowAPI.publish(wf._id);
    toast.success('Published — workflow is now active');
    load();
  };

  const remove = async (wf) => {
    if (!window.confirm(`Delete "${wf.name}"?`)) return;
    await workflowAPI.delete(wf._id);
    toast.success('Deleted');
    load();
  };

  const openEdit = (wf) => {
    setEdit({ ...wf, tags: (wf.tags || []).join(', ') });
    setShow(true);
  };

  return (
    <Layout title="Workflows">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Workflows</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{total} total</p>
        </div>
        <Btn onClick={() => { setEdit(null); setShow(true); }}>➕ New Workflow</Btn>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {['', 'draft', 'active', 'archived'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: '1px solid', borderColor: filter === s ? '#1d4ed8' : '#e5e7eb',
              background: filter === s ? '#1d4ed8' : '#fff', color: filter === s ? '#fff' : '#374151' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : wfs.length === 0 ? (
        <Card><Empty icon="⚡" text="No workflows yet. Create your first one!" /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {wfs.map(wf => (
            <Card key={wf._id} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{wf.name}</span>
                    <Badge status={wf.status} />
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{wf.steps?.length || 0} steps</span>
                    {wf.steps?.some(s => s.ruleId) && (
                      <span style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                        ◈ Rules attached
                      </span>
                    )}
                  </div>
                  {wf.description && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{wf.description}</p>}

                  {/* Steps flow */}
                  {wf.steps?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                      {[...wf.steps].sort((a,b) => a.order - b.order).map((s, i) => (
                        <span key={s.stepId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {i > 0 && <span style={{ color: '#d1d5db', fontSize: 11 }}>→</span>}
                          <span title={s.ruleId ? 'Has rule attached' : ''}
                            style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                              background: s.type==='task' ? '#dbeafe' : s.type==='approval' ? '#fef3c7' : '#ede9fe',
                              color:      s.type==='task' ? '#1e40af' : s.type==='approval' ? '#92400e' : '#5b21b6',
                              outline: s.ruleId ? '2px solid #a78bfa' : 'none' }}>
                            {s.ruleId ? '◈ ' : ''}{s.name || s.type}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                    Updated {formatDistanceToNow(new Date(wf.updatedAt), { addSuffix: true })}
                    {wf.triggerCount > 0 && ` · Ran ${wf.triggerCount}×`}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  {wf.status === 'draft'  && <Btn variant="success"   size="sm" onClick={() => publish(wf)}>Publish</Btn>}
                  {wf.status === 'active' && <Btn variant="primary"   size="sm" onClick={() => setTrig(wf)}>▶ Run</Btn>}
                  <Btn variant="secondary" size="sm" onClick={() => navigate(`/executions?workflow=${wf._id}`)}>Logs</Btn>
                  <Btn variant="secondary" size="sm" onClick={() => openEdit(wf)}>Edit</Btn>
                  <Btn variant="ghost"     size="sm" onClick={() => remove(wf)}>🗑</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <WorkflowModal open={showForm} onClose={() => setShow(false)} initial={editWf} onSaved={load} />
      {triggerWf && <TriggerModal open={!!triggerWf} onClose={() => setTrig(null)} workflow={triggerWf} onTriggered={load} />}
    </Layout>
  );
}
