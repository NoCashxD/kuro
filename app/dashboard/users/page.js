'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Loader2, User, Shield, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user, hasPermission, isDev } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullname: '', username: '', password: '', level: 3, saldo: 0, expiration_date: '' });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User created');
        setShowCreate(false);
        setForm({ fullname: '', username: '', password: '', level: 3, saldo: 0, expiration_date: '' });
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (e) {
      toast.error('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }
    
    setDeleting(userId);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (e) {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const canDeleteUser = (targetUser) => {
    if (isDev()) return true; // Dev can delete anyone
    if (user.level === 1) {
      // Owner can delete admins/resellers they created, but not other owners or devs
      return targetUser.level > 1 && (targetUser.owner === user.username || targetUser.uplink === user.username);
    }
    if (user.level === 2) {
      // Admin can only delete resellers under their owner
      return targetUser.level === 3 && targetUser.owner === user.owner;
    }
    return false; // Resellers can't delete users
  };

  const getAvailableLevels = () => {
    if (isDev()) return [
      { value: 1, label: 'Owner' },
      { value: 2, label: 'Admin' },
      { value: 3, label: 'Reseller' }
    ];
    if (user.level === 1) return [
      { value: 2, label: 'Admin' },
      { value: 3, label: 'Reseller' }
    ];
    if (user.level === 2) return [
      { value: 3, label: 'Reseller' }
    ];
    return [];
  };

  const levelLabel = (level) => {
    if (level === 0) return <span className="px-2 py-0.5 rounded bg-purple-600 text-xs text-text">Dev</span>;
    if (level === 1) return <span className="px-2 py-0.5 rounded bg-red-600 text-xs text-text">Owner</span>;
    if (level === 2) return <span className="px-2 py-0.5 rounded bg-blue-600 text-xs text-text">Admin</span>;
    return <span className="px-2 py-0.5 rounded bg-green-600 text-xs text-text">Reseller</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Users className="h-6 w-6" /> Users
        </h1>
        {hasPermission(2) && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-text rounded hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" /> Add User
          </button>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-0">
          <form onSubmit={handleCreate} className="bg-accent p-4 sm:p-8 rounded-lg shadow-lg w-full max-w-md space-y-4 border border-gray-700">
            <h2 className="text-lg font-semibold text-text mb-2">Create New User</h2>
            <div>
              <label className="block text-sm text-gray-300">Full Name</label>
              <input type="text" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Username</label>
              <input type="text" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Password</label>
              <input type="password" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Level</label>
              <select className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}>
                {getAvailableLevels().map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300">Balance (Saldo)</label>
              <input type="number" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Expiration Date</label>
              <input type="date" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" value={form.expiration_date} onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded bg-gray-600 text-text hover:bg-gray-700">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2 rounded bg-purple-600 text-text hover:bg-purple-700 flex items-center justify-center">
                {creating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700 mt-4">
        <table className="min-w-full bg-accent text-text">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Full Name</th>
              <th className="px-4 py-2 text-left">Level</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Balance</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Created</th>
              {hasPermission(2) && <th className="px-4 py-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={hasPermission(2) ? 9 : 8} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-purple-500" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={hasPermission(2) ? 9 : 8} className="text-center py-8 text-gray-400">No users found.</td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2 font-mono">{u.username}</td>
                  <td className="px-4 py-2">{u.fullname}</td>
                  <td className="px-4 py-2">{levelLabel(u.level)}</td>
                  <td className="px-4 py-2">
                    {u.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400"><XCircle className="h-4 w-4" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2">${u.saldo}</td>
                  <td className="px-4 py-2 font-mono">{u.owner}</td>
                  <td className="px-4 py-2 text-xs">{u.created_at?.slice(0, 10)}</td>
                  {hasPermission(2) && (
                    <td className="px-4 py-2">
                      {canDeleteUser(u) && (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={deleting === u.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                          title="Delete user"
                        >
                          {deleting === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 