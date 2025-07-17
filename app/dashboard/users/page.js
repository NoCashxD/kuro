'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Loader2, User, Shield, CheckCircle, XCircle, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

function EditUserModal({ userData, onClose, onSave }) {
  const [form, setForm] = useState({
    username: userData.username,
    expiration_date: userData.expiration_date ? userData.expiration_date.slice(0, 10) : ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: userData.id, ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[2px] bg-opacity-60 px-2">
      <form onSubmit={handleSubmit} className="bg-accent p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit User</h2>
        <label>Username</label>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-2 !!border-none-none"
        />
        <label>Expiration Date</label>
        <input
          name="expiration_date"
          type="date"
          value={form.expiration_date}
          onChange={handleChange}
          className="w-full mb-2 !!border-none-none"
        />
        <div className="flex gap-2 mt-4 keys justify-center">
          <button type="button" onClick={onClose} className="bg-gray-600 px-4 py-2 rounded text-white w-1/2">Cancel</button>
          <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white w-1/2">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function UsersPage() {
  const { user, hasPermission, isDev } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullname: '', username: '', password: '', level: 3, saldo: 0, expiration_date: '' });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  // Add user status handler
  const handleUserStatus = async (userId, action) => {
    try {
      const res = await fetch('/api/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${action === 'activate' ? 'activated' : 'deactivated'}`);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update user status');
      }
    } catch (e) {
      toast.error('Failed to update user status');
    }
  };

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

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowEdit(true);
  };

  const handleEditSave = async (updatedUser) => {
    try {
      const res = await fetch('/api/users/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User updated');
        setShowEdit(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (e) {
      toast.error('Failed to update user');
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
    if (level === 1) return <span className="px-2 py-0.5 rounded bg-[oklch(0.75_0.2_21.65)] text-xs text-text !text-white">Owner</span>;
    if (level === 2) return <span className="px-2 py-0.5 rounded bg-blue-600 text-xs text-text">Admin</span>;
    return <span className="px-2 py-0.5 rounded bg-green-600 text-xs text-text">Reseller</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between keys">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.3)] p-2 sm:p-0 h-screen">
          <form onSubmit={handleCreate} className="bg-accent p-4 sm:p-8 rounded-lg shadow-lg w-full max-w-md space-y-4  h-[90vh] overflow-y-scroll" style={{scrollbarWidth : "none"}}>
            <h2 className="text-lg font-semibold text-text mb-2">Create New User</h2>
            <div>
              <label className="block text-sm ">Full Name</label>
              <input type="text" className="w-full mt-1 p-2 rounded bg-gray-700 text-text !border-none !border-none-gray-600" required value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm ">Username</label>
              <input type="text" className="w-full mt-1 p-2 rounded bg-gray-700 text-text !border-none !border-none-gray-600" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm ">Password</label>
              <input type="password" className="w-full mt-1 p-2 rounded bg-gray-700 text-text !border-none !border-none-gray-600" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm ">Level</label>
              <select className="w-full mt-1 p-2 rounded bg-gray-700 text-text !border-none !border-none-gray-600" value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}>
                {getAvailableLevels().map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm ">Balance (Saldo)</label>
              <input type="number" className="w-full mt-1 p-2 rounded bg-gray-700 text-text !border-none !border-none-gray-600" value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm ">Expiration Date</label>
              <input type="date" className="w-full mt-1 p-2 rounded bg-gray-700 text-text !border-none !border-none-gray-600" value={form.expiration_date} onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-4 keys">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded bg-gray-600 text-text hover:bg-gray-700">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2 rounded bg-purple-600 text-text hover:bg-purple-700 flex items-center justify-center">
                {creating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg  mt-4  max-[768px]:!text-[12px] text-center" style={{ scrollbarWidth : "none"}}>
        <table className="min-w-full bg-accent text-text w-max text-[13px]">
          <thead>
            <tr>
              <th className="px-4 py-2 ">#</th>
              <th className="px-4 py-2 ">Username</th>
              <th className="px-4 py-2 ">Full Name</th>
              <th className="px-4 py-2 ">Level</th>
              <th className="px-4 py-2 ">Status</th>
              <th className="px-4 py-2 ">Balance</th>
              <th className="px-4 py-2 ">Owner</th>
              <th className="px-4 py-2 ">Created</th>
              {hasPermission(2) && <th className="px-4 py-2 ">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={hasPermission(2) ? 9 : 8} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-text" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={hasPermission(2) ? 9 : 8} className="text-center py-8 text-gray-400">No users found.</td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} className="">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2 ">{u.username}</td>
                  <td className="px-4 py-2">{u.fullname}</td>
                  <td className="px-4 py-2 !text-white">{levelLabel(u.level)}</td>
                  <td className="px-4 py-2">
                    
                    <div className="flex gap-2 justify-center mt-1 keys">
                      <button onClick={() => handleUserStatus(u.username, 'activate')} className="px-3 py-2 rounded bg-green-600 text-text hover:bg-green-700 flex items-center gap-1 max-h-[48px] hover:!shadow-[none]">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleUserStatus(u.username, 'deactivate')} className="px-3 py-2 rounded bg-yellow-600 text-text hover:bg-yellow-700 flex items-center gap-1 max-h-[48px] hover:!shadow-[none]">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2">${u.saldo}</td>
                  <td className="px-4 py-2 ">
                    {u.owner}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {u.expiration_date && new Date(u.expiration_date) < new Date() ? (
                      <span className="!text-white font-bold">{u.expiration_date?.slice(0, 10)} (Expired)</span>
                    ) : (
                      u.expiration_date?.slice(0, 10)
                    )}
                  </td>
                  {hasPermission(2) && (
                    <td className="px-4 py-2 keys flex justify-center gap-2">
                      {canDeleteUser(u) && (
                        <>
                          <button
                            onClick={() => handleEditClick(u)}
                            className="px-3 py-2 rounded bg-green-600 text-text hover:bg-green-700 flex items-center gap-1 max-h-[48px] hover:!shadow-[none]"
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={deleting === u.id}
                            className="px-3 py-2 rounded bg-green-600 text-text hover:bg-green-700 flex items-center gap-1 max-h-[48px] hover:!shadow-[none]"
                            title="Delete user"
                          >
                            {deleting === u.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showEdit && editingUser && (
        <EditUserModal
          userData={editingUser}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
} 