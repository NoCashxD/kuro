'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Key, Plus, Loader2, CheckCircle, XCircle, Trash2, RefreshCw, Clock, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GAME_OPTIONS = [
  { label: 'PUBG Mobile', value: 'PUBG Mobile' },
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
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ game: '', quantity: 1, duration: 1, max_devices: 1 });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [extendHours, setExtendHours] = useState(1);

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
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Keys generated');
        setShowCreate(false);
        setForm({ game: '', quantity: 1, duration: 1, max_devices: 1 });
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

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Key className="h-6 w-6" /> Keys
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-text rounded hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" /> Generate Keys
        </button>
      </div>

      {/* Create Keys Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <form onSubmit={handleCreate} className="bg-accent p-8 rounded-lg shadow-lg w-full max-w-md space-y-4 border border-gray-700">
            <h2 className="text-lg font-semibold text-text mb-2">Generate Keys</h2>
            <div>
              <label className="block text-sm text-gray-300">Game</label>
              <select className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))}>
                <option value="">Select Game</option>
                {GAME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300">Quantity</label>
              <input type="number" min={1} max={100} className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Duration</label>
              <select className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300">Max Devices</label>
              <input type="number" min={1} max={10} className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.max_devices} onChange={e => setForm(f => ({ ...f, max_devices: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded bg-gray-600 text-text hover:bg-gray-700">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2 rounded bg-purple-600 text-text hover:bg-purple-700 flex items-center justify-center">
                {creating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Actions */}
      {user.level < 3 && (
        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={() => handleBulk('activate')} disabled={bulkLoading} className="px-3 py-2 rounded bg-green-600 text-text hover:bg-green-700 flex items-center gap-1 max-h-[48px]"><CheckCircle className="h-4 w-4" /> Activate</button>
          <button onClick={() => handleBulk('deactivate')} disabled={bulkLoading} className="px-3 py-2 rounded bg-yellow-600 text-text hover:bg-yellow-700 flex items-center gap-1 max-h-[48px]"><XCircle className="h-4 w-4" /> Deactivate</button>
          <button onClick={() => handleBulk('delete')} disabled={bulkLoading} className="px-3 py-2 rounded bg-red-600 text-text hover:bg-red-700 flex items-center gap-1 max-h-[48px]"><Trash2 className="h-4 w-4" /> Delete</button>
          <form onSubmit={e => { e.preventDefault(); handleBulk('extend'); }} className="flex items-center gap-1 max-h-[48px]">
            <input type="number" min={1} max={720} value={extendHours} onChange={e => setExtendHours(Number(e.target.value))} className="w-[126px] px-4 py-1 !mb-0 rounded bg-gray-700 text-text border border-gray-600 max-h-[48px]" />
            <button type="submit" disabled={bulkLoading} className="px-3 py-2 rounded bg-blue-600 text-text hover:bg-blue-700 flex items-center gap-1"><RefreshCw className="h-4 w-4" /> Extend (hrs)</button>
          </form>
        </div>
      )}

      {/* Keys Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full bg-accent text-text">
          <thead>
            <tr>
              {user.level < 3 && <th className="px-4 py-2"><input type="checkbox" checked={selected.length === keys.length && keys.length > 0} onChange={e => setSelected(e.target.checked ? keys.map(k => k.id) : [])} /></th>}
              <th className="px-4 py-2 text-left">Key</th>
              <th className="px-4 py-2 text-left">Game</th>
              <th className="px-4 py-2 text-left">Duration</th>
              <th className="px-4 py-2 text-left">Max Devices</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={user.level < 3 ? 9 : 8} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-purple-500" />
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={user.level < 3 ? 9 : 8} className="text-center py-8 text-gray-400">No keys found.</td>
              </tr>
            ) : (
              keys.map((k, i) => (
                <tr key={k.id} className="border-t border-gray-700">
                  {user.level < 3 && <td className="px-4 py-2"><input type="checkbox" checked={selected.includes(k.id)} onChange={() => toggleSelect(k.id)} /></td>}
                  <td className="px-4 py-2 font-mono text-xs">{k.user_key}</td>
                  <td className="px-4 py-2">{k.game}</td>
                  <td className="px-4 py-2">{k.duration}h</td>
                  <td className="px-4 py-2">{k.max_devices}</td>
                  <td className="px-4 py-2">
                    {k.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400"><XCircle className="h-4 w-4" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono">{k.owner}</td>
                  <td className="px-4 py-2 text-xs">{k.created_at?.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 