'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Loader2, Copy, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const { hasPermission } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ level: 3, set_saldo: 100, acc_expiration: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referrals');
      const data = await res.json();
      if (data.success) setReferrals(data.referrals);
    } catch (e) {
      toast.error('Failed to fetch referral codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Referral code created');
        setShowCreate(false);
        setForm({ level: 3, set_saldo: 100, acc_expiration: '' });
        fetchReferrals();
      } else {
        toast.error(data.error || 'Failed to create referral code');
      }
    } catch (e) {
      toast.error('Failed to create referral code');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const levelLabel = (level) => {
    if (level === 1) return <span className="px-2 py-0.5 rounded bg-red-600 text-xs text-white">Owner</span>;
    if (level === 2) return <span className="px-2 py-0.5 rounded bg-blue-600 text-xs text-white">Admin</span>;
    return <span className="px-2 py-0.5 rounded bg-green-600 text-xs text-white">Reseller</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6" /> Referral Codes
        </h1>
        {hasPermission(2) && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" /> Generate Code
          </button>
        )}
      </div>

      {/* Create Referral Code Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <form onSubmit={handleCreate} className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md space-y-4 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">Generate Referral Code</h2>
            <div>
              <label className="block text-sm ">User Level</label>
              <select className="w-full mt-1 p-2 rounded bg-gray-700 text-white border border-gray-600" value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}>
                <option value={2}>Admin</option>
                <option value={3}>Reseller</option>
              </select>
            </div>
            <div>
              <label className="block text-sm ">Initial Balance (Saldo)</label>
              <input type="number" min={0} className="w-full mt-1 p-2 rounded bg-gray-700 text-white border border-gray-600" required value={form.set_saldo} onChange={e => setForm(f => ({ ...f, set_saldo: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm ">Account Expiration</label>
              <input type="date" className="w-full mt-1 p-2 rounded bg-gray-700 text-white border border-gray-600" value={form.acc_expiration} onChange={e => setForm(f => ({ ...f, acc_expiration: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded bg-gray-600 text-white hover:bg-gray-700">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center">
                {creating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Referral Codes Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Level</th>
              <th className="px-4 py-2 text-left">Balance</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Used By</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-purple-500" />
                </td>
              </tr>
            ) : referrals.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">No referral codes found.</td>
              </tr>
            ) : (
              referrals.map((ref, i) => (
                <tr key={ref.id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2 font-mono">{ref.code}</td>
                  <td className="px-4 py-2">{levelLabel(ref.level)}</td>
                  <td className="px-4 py-2">${ref.set_saldo}</td>
                  <td className="px-4 py-2">
                    {ref.used_by ? (
                      <span className="inline-flex items-center gap-1 text-red-400"><XCircle className="h-4 w-4" /> Used</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> Available</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{ref.used_by || '-'}</td>
                  <td className="px-4 py-2 font-mono">{ref.owner}</td>
                  <td className="px-4 py-2 text-xs">{ref.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => copyToClipboard(ref.code)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 