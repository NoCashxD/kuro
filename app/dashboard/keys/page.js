'use client';

import { useEffect, useState } from 'react';
import { useAuth, useRole } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../../roles';
import { Key, Plus, Loader2, CheckCircle, XCircle, Trash2, RefreshCw, Clock, Edit2, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const GAME_OPTIONS = [
  { label: 'PUBG', value: 'PUBG' },
  { label: 'PUBGM PREMIUM', value: 'PUBGM PREMIUM' },
  { label: 'PUBGM FREE', value: 'PUBGM FREE' },
];
const DURATION_OPTIONS = [
  { label: '1 Hour', value: 1 },
  { label: '2 Hours', value: 2 },
  { label: '5 Hours', value: 5 },
  { label: '1 Day', value: 24 },
  { label: '7 Days', value: 168 },
  { label: '30 Days', value: 720 },
  { label: '60 Days', value: 1440 },
];

export default function KeysPage() {
  const { hasPermission, user } = useAuth();
  const { role, isMain, isOwner, isAdmin, isReseller, isUser, roleLabel } = useRole();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ game: '', quantity: 1, duration: 1, max_devices: 1, prefix: 'NOCASH', trial: false });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [durationUnit, setDurationUnit] = useState('hours'); // 'hours' or 'days'
  const [extendUnit, setExtendUnit] = useState('hours'); // 'hours' or 'days'
  const [useOnlyPrefix, setUseOnlyPrefix] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) setKeys(data.keys);
    } catch (e) {
      toast.error('Failed to fetch keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form, useOnlyPrefix };
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Keys generated');
        setShowCreate(false);
        setForm({ game: '', quantity: 1, duration: 1, max_devices: 1, prefix: 'NOCASH', trial: false });
        setUseOnlyPrefix(false);
        setGeneratedKeys(data.keys || []);
        fetchKeys();
      } else {
        toast.error(data.error || 'Failed to generate keys');
      }
    } catch (e) {
      toast.error('Failed to generate keys');
    } finally {
      setCreating(false);
    }
  };

  const handleTrial = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, trial: true, quantity: 1, duration: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Trial key generated');
        setShowCreate(false);
        setGeneratedKeys(data.keys || []);
        fetchKeys();
      } else {
        toast.error(data.error || 'Failed to generate trial key');
      }
    } catch (e) {
      toast.error('Failed to generate trial key');
    } finally {
      setCreating(false);
    }
  };

  const handleBulk = async (operation) => {
    if (selected.length === 0) return toast.error('Select at least one key');
    setBulkLoading(true);
    try {
      const body = { operation, keyIds: selected };
      if (operation === 'extend') body.extendHours = extendHours;
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Bulk operation successful');
        setSelected([]);
        fetchKeys();
      } else {
        toast.error(data.error || 'Bulk operation failed');
      }
    } catch (e) {
      toast.error('Bulk operation failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCopyKeys = () => {
    if (generatedKeys.length > 0) {
      navigator.clipboard.writeText(generatedKeys.join('\n'));
      toast.success('Keys copied to clipboard');
    }
  };

  const handleDownloadKeys = () => {
    if (generatedKeys.length > 0) {
      const blob = new Blob([generatedKeys.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'keys.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 keys">
      <div className="flex justify-center flex-col sm:flex-row items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Key className="h-6 w-6" /> Keys
          <span className="ml-2 px-2 py-1 rounded bg-gray-700 text-xs font-semibold">{roleLabel}</span>
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex justify-center items-center gap-2 px-4 py-2 bg-purple-600 text-text rounded hover:bg-purple-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Generate Keys
        </button>
      </div>

      {/* Key Generation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[2px] bg-opacity-60 px-2 sm:px-0">
          <form onSubmit={handleCreate} className="bg-accent p-4 sm:p-8 rounded-lg shadow-lg w-full max-w-md space-y-4 border border-gray-700 max-h-[85vh] overflow-scroll">
            <h2 className="text-lg font-semibold text-text mb-2">Generate Keys</h2>
            <div>
              <label className="block text-sm ">Game</label>
              <select className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))}>
                <option value="">Select Game</option>
                {GAME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm ">Custom Prefix</label>
              <input type="text" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" value={form.prefix} onChange={e => setForm(f => ({ ...f, prefix: e.target.value }))} maxLength={16} />
              <span className="text-xs text-gray-400">Keys will be generated as {form.prefix}-XYZ123</span>
            </div>
            <div>
              <label className="block text-sm ">Quantity</label>
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                {[3, 5, 10, 50, 100].map(q => (
                  <button type="button" key={q} className={`px-2 py-1 rounded ${form.quantity === q ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-200'}`} onClick={() => setForm(f => ({ ...f, quantity: q }))}>{q}</button>
                ))}
                <button type="button" className={`px-2 py-1 rounded ${form.quantity === 999 ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-200'}`} onClick={() => setForm(f => ({ ...f, quantity: 999 }))}>Unlimited</button>
              </div>
              <input type="number" min={1} max={999} className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm ">Duration</label>
              <div className="flex justify-center gap-2 items-center mb-2">
                <select className="w-full p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                  {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select className="p-2 rounded bg-gray-700 text-text border border-gray-600" value={durationUnit} onChange={e => setDurationUnit(e.target.value)}>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm ">Max Devices</label>
              <input type="number" min={1} max={10} className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.max_devices} onChange={e => setForm(f => ({ ...f, max_devices: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="inline-flex items-center gap-2 text-sm ">
                <input type="checkbox" checked={useOnlyPrefix} onChange={e => setUseOnlyPrefix(e.target.checked)} />
                Use only prefix as key (no random suffix)
              </label>
              <span className="block text-xs text-gray-400">If checked, keys will be exactly the prefix (e.g., RAMU, SHAM, DHAM)</span>
            </div>
            <div className="flex justify-center flex-col sm:flex-row gap-2 mt-4 max-h-[48px]">
              <button type="button" onClick={() => setShowCreate(false)} className="flex justify-center-1 py-2 rounded bg-gray-600 text-text hover:bg-gray-700">Cancel</button>
              <button type="submit" disabled={creating} className="flex justify-center-1 py-2 rounded bg-purple-600 text-text hover:bg-purple-700 flex items-center justify-center">
                {creating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate'}
              </button>
              <button type="button" disabled={creating} onClick={handleTrial} className="flex justify-center-1 !px-2 py-2 rounded bg-blue-600 text-text hover:bg-blue-700 flex items-center justify-center">1hr Trial</button>
            </div>
          </form>
        </div>
      )}

      {/* Show Copy/Download after generation */}
      {generatedKeys.length > 0 && (
        <div className="flex justify-center flex-col sm:flex-row gap-2 items-center justify-center">
          <button onClick={handleCopyKeys} className="flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-text rounded hover:bg-green-700"><Copy className="h-4 w-4" /> Copy Keys</button>
          <button onClick={handleDownloadKeys} className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-text rounded hover:bg-blue-700"><Download className="h-4 w-4" /> Download Keys</button>
        </div>
      )}

      {/* Bulk Actions */}
      {user.level < 3 && (
        <div className="flex justify-center flex-wrap gap-4 mb-2">
          <button onClick={() => handleBulk('activate')} disabled={bulkLoading} className="px-3 py-2 rounded bg-green-600 text-text hover:bg-green-700 flex items-center gap-1 max-h-[48px]"><CheckCircle className="h-4 w-4" /> Activate</button>
          <button onClick={() => handleBulk('deactivate')} disabled={bulkLoading} className="px-3 py-2 rounded bg-yellow-600 text-text hover:bg-yellow-700 flex items-center gap-1 max-h-[48px]"><XCircle className="h-4 w-4" /> Deactivate</button>
          <button onClick={() => handleBulk('delete')} disabled={bulkLoading} className="px-3 py-2 rounded bg-red-600 text-text hover:bg-red-700 flex items-center gap-1 max-h-[48px]"><Trash2 className="h-4 w-4" /> Delete</button>
          <form onSubmit={e => { e.preventDefault(); handleBulk('extend'); }} className="flex justify-center items-center gap-4 max-h-[48px]">
            <input type="number" min={1} max={720} value={extendHours} onChange={e => setExtendHours(Number(e.target.value))} className="w-[126px] px-4 py-1 !mb-0 rounded bg-gray-700 text-text border border-gray-600 max-h-[48px]" />
            <select className="p-2 rounded bg-gray-700 text-text border border-gray-600 !mb-0" value={extendUnit} onChange={e => setExtendUnit(e.target.value)}>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
            <button type="submit" disabled={bulkLoading} className="px-3 py-2 rounded bg-blue-600 text-text hover:bg-blue-700 flex items-center gap-1"><RefreshCw className="h-4 w-4" /> Extend</button>
          </form>
        </div>
      )}

      {/* Keys Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full bg-accent text-text text-xs sm:text-sm">
          <thead>
            <tr>
              {user.level < 3 && <th className="px-2 sm:px-4 py-2">Select</th>}
              <th className="px-2 sm:px-4 py-2 text-left">Key</th>
              <th className="px-2 sm:px-4 py-2 text-left">Game</th>
              <th className="px-2 sm:px-4 py-2 text-left">Duration</th>
              <th className="px-2 sm:px-4 py-2 text-left">Max Devices</th>
              <th className="px-2 sm:px-4 py-2 text-left">Status</th>
              <th className="px-2 sm:px-4 py-2 text-left">Owner</th>
              <th className="px-2 sm:px-4 py-2 text-left">Role</th>
              <th className="px-2 sm:px-4 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-purple-500" />
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">No keys found.</td>
              </tr>
            ) : (
              keys.map((k, i) => (
                <tr key={k.id} className="border-t border-gray-700">
                  {user.level < 3 && <td className="px-2 sm:px-4 py-2"><input type="checkbox" checked={selected.includes(k.id)} onChange={() => toggleSelect(k.id)} /></td>}
                  <td className="px-2 sm:px-4 py-2 font-mono text-xs break-all max-w-[120px] sm:max-w-none">{k.user_key}</td>
                  <td className="px-2 sm:px-4 py-2">{k.game}</td>
                  <td className="px-2 sm:px-4 py-2">{k.duration}h</td>
                  <td className="px-2 sm:px-4 py-2">{k.max_devices}</td>
                  <td className="px-2 sm:px-4 py-2">
                    {k.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400"><XCircle className="h-4 w-4" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-mono">{k.owner}</td>
                  <td className="px-2 sm:px-4 py-2">{ROLE_LABELS[k.role] || 'User'}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs">{k.created_at?.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 