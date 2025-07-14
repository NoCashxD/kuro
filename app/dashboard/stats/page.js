'use client';

import { useEffect, useState } from 'react';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to load stats');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load stats');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-text">Loading statistics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!stats) return <div className="text-red-500">No statistics available.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text mb-4">Statistics</h1>
      <div className="bg-accent rounded shadow-card p-6">
        <h2 className="text-lg font-semibold text-text mb-2">Keys</h2>
        <ul className="text-gray-300">
          <li>Total: {stats.keys.total}</li>
          <li>Active: {stats.keys.active}</li>
          <li>Expired: {stats.keys.expired}</li>
          <li>By Game:
            <ul className="ml-4">
              {stats.keys.byGame.map(g => (
                <li key={g.game}>{g.game}: {g.count}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
      <div className="bg-accent rounded shadow-card p-6">
        <h2 className="text-lg font-semibold text-text mb-2">Users</h2>
        <ul className="text-gray-300">
          <li>Total: {stats.users.total}</li>
          <li>Active: {stats.users.active}</li>
          <li>Owners: {stats.users.byLevel.owners}</li>
          <li>Admins: {stats.users.byLevel.admins}</li>
          <li>Resellers: {stats.users.byLevel.resellers}</li>
        </ul>
      </div>
      <div className="bg-accent rounded shadow-card p-6">
        <h2 className="text-lg font-semibold text-text mb-2">Recent Activity</h2>
        <p className="text-gray-300">Recent actions (last 7 days): {stats.activity.recent}</p>
      </div>
      <div className="bg-accent rounded shadow-card p-6">
        <h2 className="text-lg font-semibold text-text mb-2">System Status</h2>
        <ul className="text-gray-300">
          <li>Status: <span className={stats.system.status === 'on' ? 'text-green-400' : 'text-red-400'}>{stats.system.status === 'on' ? 'Online' : 'Offline'}</span></li>
          <li>Online: {stats.system.functions.online ? 'Enabled' : 'Disabled'}</li>
          <li>Bullet: {stats.system.functions.bullet ? 'Enabled' : 'Disabled'}</li>
          <li>Aimbot: {stats.system.functions.aimbot ? 'Enabled' : 'Disabled'}</li>
          <li>Memory: {stats.system.functions.memory ? 'Enabled' : 'Disabled'}</li>
          <li>Mod Name: {stats.system.modName}</li>
        </ul>
      </div>
    </div>
  );
} 