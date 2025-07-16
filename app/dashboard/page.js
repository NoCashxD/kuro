'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Key, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to fetch stats');
        }
      } else {
        setError('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-text rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Keys',
      value: stats?.keys?.total || 0,
      icon: Key,
      color: 'bg-blue-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Keys',
      value: stats?.keys?.active || 0,
      icon: CheckCircle,
      color: 'bg-green-600',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'bg-purple-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Recent Activity',
      value: stats?.activity?.recent || 0,
      icon: Activity,
      color: 'bg-orange-600',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  const getRoleText = () => {
    if (user.level === 0) return 'Dev';
    if (user.level === 1) return 'Owner';
    if (user.level === 2) return 'Admin';
    return 'Reseller';
  };

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="">
          Welcome back, {user.fullname}. Here's what's happening with your account.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 svgblack">
        {statCards.map((card, index) => (
          <div key={index} className="bg-accent rounded shadow-card p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded ${card.color}`}>
                <card.icon className="h-6 w-6 text-text" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium ">{card.title}</p>
                <p className="text-2xl font-bold text-text">{card.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 !text-green-500" />
              <span className="ml-1 text-sm !text-green-500">{card.change}</span>
              <span className="ml-2 text-sm spbl">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* User Info Card */}
      <div className="bg-accent rounded shadow-card p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <Users className="h-5 w-5  mr-3" />
            <div>
              <p className="text-sm ">Role</p>
              <p className="text-text font-medium">{getRoleText()}</p>
            </div>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-5 w-5  mr-3" />
            <div>
              <p className="text-sm ">Balance</p>
              <p className="text-text font-medium">${user.saldo}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-3" />
            <div>
              <p className="text-sm">Account Expiry</p>
              {user.expiration_date ? (
                <p className={`font-medium ${new Date(user.expiration_date) < new Date() ? 'text-red-400' : 'text-green-500'}`}>
                  {user.expiration_date.slice(0, 10)}
                  {new Date(user.expiration_date) < new Date() ? ' (Expired)' : ''}
                </p>
              ) : (
                <p className="text-gray-400">No expiry set</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      {stats?.system && (
        <div className="bg-accent rounded shadow-card p-6">
          <h2 className="text-lg font-semibold text-text mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${stats.system.status === 'on' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="text-sm ">System</p>
                <p className={`font-medium ${stats.system.status === 'on' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.system.status === 'on' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${stats.system.functions.online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div>
                <p className="text-sm ">Online Mode</p>
                <p className={`font-medium ${stats.system.functions.online ? 'text-green-500' : 'text-gray-500'}`}>
                  {stats.system.functions.online ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${stats.system.functions.aimbot ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div>
                <p className="text-sm ">Aimbot</p>
                <p className={`font-medium ${stats.system.functions.aimbot ? 'text-green-500' : 'text-gray-500'}`}>
                  {stats.system.functions.aimbot ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${stats.system.functions.memory ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <div>
                <p className="text-sm ">Memory</p>
                <p className={`font-medium ${stats.system.functions.memory ? 'text-green-500' : 'text-gray-500'}`}>
                  {stats.system.functions.memory ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-accent rounded shadow-card p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 !text-white">
          <a href="/dashboard/keys" className="flex items-center justify-center px-4 py-2 bg-purple-600 text-text rounded hover:bg-purple-700 transition-colors">
            <Key className="h-5 w-5 mr-2" />
            Generate Keys
          </a>
          <a href="/dashboard/users" className="flex items-center justify-center px-4 py-2 bg-blue-600 text-text rounded hover:bg-blue-700 transition-colors">
            <Users className="h-5 w-5 mr-2" />
            Add User
          </a>
          <a href="/dashboard/history" className="flex items-center justify-center px-4 py-2 bg-green-600 text-text rounded hover:bg-green-700 transition-colors">
            <Activity className="h-5 w-5 mr-2" />
            View Reports
          </a>
        </div>
      </div>
    </div>
  );
} 