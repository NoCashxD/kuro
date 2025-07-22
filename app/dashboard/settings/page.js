'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Loader2, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';



export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (e) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFunction = (key, value) => {
    setSettings(prev => ({
      ...prev,
      functions: {
        ...prev.functions,
        [key]: value
      }
    }));
  };

  const updatePrice = (key, value) => {
    setSettings(prev => ({
      ...prev,
      functions: {
        ...prev.functions,
        prices: {
          ...prev.functions.prices,
          [key]: value
        }
      }
    }));
  };

  if (!hasPermission(1)) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">Only owners can access system settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-text" />
      </div>
    );
  }

  return (
    <div className="space-y-6 setting">
      <div className="max-[768px]:flex-col max-[768px]:gap-[20px] flex min-[768px]:items-center justify-between keys">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 ">
          <Settings className="h-6 w-6" /> System Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* System Status */}
        <div className="bg-accent rounded-lg p-6 !border-none !border-none-none">
          <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm  mb-2">System Status</label>
              <select
                value={settings.system.status}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  system: { ...prev.system, status: e.target.value }
                }))}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              >
                <option value="on">Online</option>
                <option value="off">Offline (Maintenance)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm  mb-2">Maintenance Message</label>
              <input
                type="text"
                value={settings.system.maintenanceMessage}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  system: { ...prev.system, maintenanceMessage: e.target.value }
                }))}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
                placeholder="System is under maintenance..."
              />
            </div>
          </div>
        </div>

        {/* Function Toggles */}
        <div className="bg-accent rounded-lg p-6 !border-none !border-none-none toggle">
          <h2 className="text-lg font-semibold text-white mb-4">Function Toggles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-[var(--label)] rounded">
              <span className="text-white">Online Mode</span>
              <a
                
                onClick={() => updateFunction('online', !settings.functions.online)}
                className={`p-2 rounded !bg-transparent ${settings.functions.online ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {settings.functions.online ? <ToggleRight className="h-10 w-10 text-white" /> : <ToggleLeft className="h-10 w-10 text-white" />}
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--label)] rounded">
              <span className="text-white">Bullet</span>
              <a
                type="button"
                onClick={() => updateFunction('bullet', !settings.functions.bullet)}
                className={`p-2 rounded !bg-transparent ${settings.functions.bullet ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {settings.functions.bullet ? <ToggleRight className="h-10 w-10 text-white" /> : <ToggleLeft className="h-10 w-10 text-white" />}
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--label)] rounded">
              <span className="text-white">Aimbot</span>
              <a
                type="button"
                onClick={() => updateFunction('aimbot', !settings.functions.aimbot)}
                className={`p-2 rounded !bg-transparent ${settings.functions.aimbot ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {settings.functions.aimbot ? <ToggleRight className="h-10 w-10 text-white" /> : <ToggleLeft className="h-10 w-10 text-white" />}
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--label)] rounded">
              <span className="text-white">Memory</span>
              <a
                type="button"
                onClick={() => updateFunction('memory', !settings.functions.memory)}
                className={`p-2 rounded !bg-transparent ${settings.functions.memory ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {settings.functions.memory ? <ToggleRight className="h-10 w-10 text-white" /> : <ToggleLeft className="h-10 w-10 text-white" />}
              </a>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-accent rounded-lg p-6 !border-none !border-none-none">
          <h2 className="text-lg font-semibold text-white mb-4">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm  mb-2">Mod Name</label>
              <input
                type="text"
                value={settings.modName}
                onChange={(e) => setSettings(prev => ({ ...prev, modName: e.target.value }))}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">Currency</label>
              <input
                type="text"
                value={settings.functions.currency}
                onChange={(e) => updateFunction('currency', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-accent rounded-lg p-6 !border-none !border-none-none">
          <h2 className="text-lg font-semibold text-white mb-4">Pricing</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm  mb-2">1 Hour</label>
              <input
                type="number"
                value={settings.functions.prices.hr1}
                onChange={(e) => updatePrice('hr1', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">2 Hour</label>
              <input
                type="number"
                value={settings.functions.prices.hr1}
                onChange={(e) => updatePrice('hr2', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">5 Hour</label>
              <input
                type="number"
                value={settings.functions.prices.hr1}
                onChange={(e) => updatePrice('hr1', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">1 Day</label>
              <input
                type="number"
                value={settings.functions.prices.days1}
                onChange={(e) => updatePrice('days1', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">3 Days</label>
              <input
                type="number"
                value={settings.functions.prices.days3}
                onChange={(e) => updatePrice('days3', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">7 Days</label>
              <input
                type="number"
                value={settings.functions.prices.days7}
                onChange={(e) => updatePrice('days7', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">30 Days</label>
              <input
                type="number"
                value={settings.functions.prices.days30}
                onChange={(e) => updatePrice('days30', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm  mb-2">60 Days</label>
              <input
                type="number"
                value={settings.functions.prices.days60}
                onChange={(e) => updatePrice('days60', e.target.value)}
                className="w-full p-2 rounded bg-[var(--label)] text-white !border-none !border-none-gray-600"
              />
            </div>
          </div>
        </div>
      </form>
      
    </div>
  );
} 