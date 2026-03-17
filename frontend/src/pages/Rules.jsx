import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { Card, Btn, Modal, Input, Select, Empty, Spinner } from '../components/UI';
import { ruleAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';

const OPERATORS = ['eq','neq','gt','gte','lt','lte','contains','exists'];
const ACTIONS   = ['allow','deny','skip_step','notify'];
const ACTION_COLORS = { allow:'#dcfce7', deny:'#fee2e2', skip_step:'#fef9c3', notify:'#dbeafe' };
const ACTION_TEXT   = { allow:'#166534', deny:'#991b1b', skip_step:'#854d0e', notify:'#1e40af' };

const emptyRule = () => ({
  name: '', description: '', priority: 0, conditionLogic: 'AND',
  conditions: [{ field: '', operator: 'eq', value: '' }],
  action: 'allow', isActive: true,
});

function RuleModal({ open, onClose, initial, onSaved }) {
  const [form, setForm]   = useState(initial || emptyRule());
  const [saving, setSave] = useState(false);

  useEffect(() => { setForm(initial || emptyRule()); }, [initial, open]);

  const setF  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setC  = (i, k, v) => setForm(f => {
    const c = [...f.conditions];
    c[i] = { ...c[i], [k]: v };
    return { ...f, conditions: c };
  });
  const addC    = () => setForm(f => ({ ...f, conditions: [...f.conditions, { field: '', operator: 'eq', value: '' }] }));
  const removeC = (i) => setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name.trim()) return toast.error('Rule name is required');
    if (form.conditions.some(c => !c.field.trim())) return toast.error('All conditions need a field');
    setSave(true);
    try {
      if (initial?._id) await ruleAPI.update(initial._id, form);
      else              await ruleAPI.create(form);
      toast.success(initial?._id ? 'Rule updated' : 'Rule created');
      onSaved();
      onClose();
    } finally { setSave(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? 'Edit Rule' : 'New Rule'} width={600}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Input label="Rule Name *" value={form.name} placeholder="High value order"
          onChange={e => setF('name', e.target.value)} />
        <Input label="Priority (higher = first)" type="number" value={form.priority}
          onChange={e => setF('priority', +e.target.value)} />
      </div>
      <Input label="Description" value={form.description} placeholder="When this fires..."
        onChange={e => setF('description', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Select label="Logic" value={form.conditionLogic} onChange={e => setF('conditionLogic', e.target.value)}>
          <option value="AND">AND — all must match</option>
          <option value="OR">OR — any must match</option>
        </Select>
        <Select label="Action" value={form.action} onChange={e => setF('action', e.target.value)}>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </Select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Conditions</span>
        <Btn variant="secondary" size="sm" onClick={addC}>+ Add</Btn>
      </div>

      {form.conditions.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
          <div style={{ flex: 2 }}>
            <Input label={i === 0 ? 'Field' : ''} value={c.field} placeholder="order.amount"
              onChange={e => setC(i, 'field', e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <Select label={i === 0 ? 'Operator' : ''} value={c.operator} onChange={e => setC(i, 'operator', e.target.value)}>
              {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div style={{ flex: 2 }}>
            <Input label={i === 0 ? 'Value' : ''} value={c.value} placeholder="1000"
              onChange={e => setC(i, 'value', e.target.value)} />
          </div>
          {form.conditions.length > 1 && (
            <button onClick={() => removeC(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, paddingBottom: 14 }}>×</button>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} loading={saving}>{initial?._id ? 'Save' : 'Create Rule'}</Btn>
      </div>
    </Modal>
  );
}

export default function Rules() {
  const [rules, setRules]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [showForm, setShow] = useState(false);
  const [editRule, setEdit] = useState(null);

  const load = async () => {
    setLoad(true);
    try { const { data } = await ruleAPI.list(); setRules(data.data); }
    finally { setLoad(false); }
  };

  useEffect(() => { load(); }, []);

  const remove = async (r) => {
    if (!window.confirm(`Delete rule "${r.name}"?`)) return;
    await ruleAPI.delete(r._id);
    toast.success('Deleted');
    load();
  };

  return (
    <Layout title="Rules">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Rules</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{rules.length} total</p>
        </div>
        <Btn onClick={() => { setEdit(null); setShow(true); }}>➕ New Rule</Btn>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : rules.length === 0 ? (
        <Card><Empty icon="◈" text="No rules yet. Rules control step execution based on conditions." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rules.map(r => (
            <Card key={r._id} style={{ padding: '16px 20px', opacity: r.isActive ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</span>
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: ACTION_COLORS[r.action] || '#f3f4f6', color: ACTION_TEXT[r.action] || '#374151' }}>{r.action}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Priority {r.priority}</span>
                    {!r.isActive && <span style={{ fontSize: 12, color: '#9ca3af' }}>Inactive</span>}
                  </div>
                  {r.description && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{r.description}</p>}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {r.conditions.map((c, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        {i > 0 && <span style={{ color: '#9ca3af', fontWeight: 600 }}>{r.conditionLogic}</span>}
                        <code style={{ fontFamily: "'JetBrains Mono', monospace", background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, color: '#374151' }}>
                          {c.field} {c.operator} {c.value}
                        </code>
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="secondary" size="sm" onClick={() => { setEdit(r); setShow(true); }}>Edit</Btn>
                  <Btn variant="ghost"     size="sm" onClick={() => remove(r)}>🗑</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RuleModal open={showForm} onClose={() => setShow(false)} initial={editRule} onSaved={load} />
    </Layout>
  );
}
