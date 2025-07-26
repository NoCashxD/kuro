'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth, useRole } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../../roles';
import { Key, Plus, Loader2, CheckCircle, XCircle, Trash2, RefreshCw, Clock, Edit2, Copy, Download, Delete, Trash } from 'lucide-react';
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

function EditKeyModal({ keyData, onClose, onSave }) {
  const [form, setForm] = useState({ ...keyData });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex min-[768px]:items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[2px] bg-opacity-60 px-2 overflow-x-hidden" >
      <form onSubmit={handleSubmit} className="bg-accent p-6 rounded shadow-lg w-full max-w-md min-[768px]:h-[95vh] h-max overflow-y-scroll" style={{scrollbarWidth : "none"}}>
        <h2 className="text-lg font-semibold mb-4">Edit Key</h2>
        <label>Key</label>
        <input name="user_key" value={form.user_key} onChange={handleChange} className="w-full mb-2 !border-[none]" style={{ border : "none"}} />
        <label>Game</label>
        <input name="game" value={form.game} onChange={handleChange} className="w-full mb-2 !border-[none]" style={{ border : "none"}} />
        <label>Duration (hours)</label>
        <input name="duration" type="number" value={form.duration} onChange={handleChange} className="w-full mb-2 !border-[none]" style={{ border : "none"}} />
        <label>Expiry Date</label>
        <input name="expired_date" value={form.expired_date ? form.expired_date : ""} onChange={handleChange} className="w-full mb-2 !border-[none]" style={{ border : "none"}} />
        <label>Max Devices</label>
        <input name="max_devices" type="number" value={form.max_devices} onChange={handleChange} className="w-full mb-2 !border-[none]" style={{ border : "none"}} />
        <label>Owner</label>
        <input name="owner" disabled value={form.owner} onChange={handleChange} className="w-full mb-2 !border-[none]" style={{ border : "none"}} />
        
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="bg-gray-600 px-4 py-2 rounded text-white w-full">Cancel</button>
          <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white w-full">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function KeysPage() {
  const { hasPermission, user } = useAuth();
  const { role, isMain, isOwner, isAdmin, isReseller, isUser, roleLabel } = useRole();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ game: '', quantity: 1, duration: 1, max_devices: 1, prefix: 'VIP', trial: false });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [extendHours, setExtendHours] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [durationUnit, setDurationUnit] = useState('hours'); // 'hours' or 'days'
  const [extendUnit, setExtendUnit] = useState('hours'); // 'hours' or 'days'
  const [useOnlyPrefix, setUseOnlyPrefix] = useState(false);
  const [search, setSearch] = useState('');
  const searchTimeout = useRef();
  const [editingKey, setEditingKey] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [prices, setPrices] = useState({});
  const [currency, setCurrency] = useState('$');

  // Fetch prices and currency from settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success) {
          setPrices(data.settings.functions.prices || {});
          setCurrency(data.settings.functions.currency || '$');
        }
      } catch (e) {
        // ignore
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchKeys(search);
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchKeys = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/api/keys?q=${encodeURIComponent(q)}` : '/api/keys';
      const res = await fetch(url);
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

  const handleKeyOperations = async (operation,id) => {
   
    
    setBulkLoading(true);
    try {
      const body = { operation, keyIds: [id] };
      if (operation === 'extend') body.extendHours = extendHours;
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${operation} successful`);
       
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
  const selectAll = (checked) => {
    if (checked) {
      // Select all
      const allIds = keys.map(item => item.id);
      setSelected(allIds);
    } else {
      // Deselect all
      setSelected([]);
    }
  };
  

  const handleEditClick = (key) => {
    setEditingKey(key);
    setShowEdit(true);
  };

  const handleEditSave = async (updatedKey) => {
    try {
      const res = await fetch(`/api/keys/${updatedKey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedKey),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Key updated');
        setShowEdit(false);
        setEditingKey(null);
        fetchKeys();
      } else {
        toast.error(data.error || 'Failed to update key');
      }
    } catch (e) {
      toast.error('Failed to update key');
    }
  };

  return (
    <div className="space-y-6 keys">
      
      <div className="flex max-[768px]:justify-center flex-col sm:flex-row items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Key className="h-6 w-6" /> Keys
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
        <div className="fixed inset-0 z-50 flex min-[768px]:items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[2px] bg-opacity-60 px-2 sm:px-0 h-screen max-[768px]:top-0" >
          <form onSubmit={handleCreate} className="bg-accent p-6 rounded-lg shadow-lg w-full max-w-md   max-h-[95vh] overflow-y-scroll" style={{scrollbarWidth : "none"}}>
            <h2 className="text-lg font-semibold text-text mb-2">Generate Keys</h2>
            <div>
              <label className="block text-sm ">Game</label>
              <select className="w-full mt-1 p-2 rounded bg-gray-700 text-text border !border-none" required value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))}>
                <option value="">Select Game</option>
                {GAME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            
            <label className="block text-sm ">Quantity</label>
            <select
              className="w-full mt-1 p-2 rounded bg-gray-700 text-text border !border-none"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
              required
            >
              {[1, 3, 5, 10, 50, 100, 999].map(q => (
                <option key={q} value={q}>{q === 999 ? '999' : q}</option>
              ))}
            </select>
            <div>
              <label className="block text-sm ">Duration</label>
              <div className="flex justify-center gap-2 items-center mb-2">
                <select className="w-full p-2 rounded bg-gray-700 text-text border !border-none" required value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} / {currency}{prices[durationLabelToPriceKey(opt.label)] || '?'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Total price summary */}
           
            
            <div>
              <label className="block text-sm ">Max Devices</label>
              <input type="number" min={1} max={10} className="w-full mt-1 p-2 rounded bg-label !border-none text-text" required value={form.max_devices} onChange={e => setForm(f => ({ ...f, max_devices: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm ">Custom Prefix</label>
              <input type="text" className="w-full mt-1 p-2 rounded bg-label !border-none text-text" value={form.prefix} onChange={e => setForm(f => ({ ...f, prefix: e.target.value }))} maxLength={16} />
              {/* <span className="text-xs text-gray-400">Keys will be generated as {form.prefix}-XYZ123</span> */}
            </div>
            <div className="text-right font-semibold text-[14px] mb-2 dark:text-[whitesmoke] font-mono text-[#333]">
              {(() => {
                const priceKey = durationLabelToPriceKey(DURATION_OPTIONS.find(opt => opt.value === form.duration)?.label || '1 Hour');
                const pricePerKey = Number(prices[priceKey]) || 1;
                const total = form.quantity * pricePerKey;
                return <input readOnly className="w-full mt-1 p-2 rounded bg-label !border-none text-text" placeholder={`${currency}${total}`} />;
              })()}
            </div>
            <div className='flex items-center !mt-2 !my-4 '>
              <label className="inline-flex items-center gap-2 text-sm ">
                <input type="checkbox" checked={useOnlyPrefix} onChange={e => setUseOnlyPrefix(e.target.checked)} className="accent-gray-600 dark:accent-purple-600 !mb-0" />
                Use only prefix as key (no random suffix)
              </label>
              </div>
              
           
            <div className="flex justify-center flex-col sm:flex-row gap-2 max-[768px]:mt-8 min-[768px]:max-h-[48] max-h-[120px] mb-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-3 rounded bg-gray-600 text-text hover:bg-gray-700">Cancel</button>
              <button type="submit" disabled={creating} className="px-4 py-2 rounded bg-purple-600 text-text hover:bg-purple-700 flex items-center justify-center">
                {creating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate'}
              </button>
              <button type="button" disabled={creating} onClick={handleTrial} className="px-4 py-2 rounded bg-blue-600 text-text hover:bg-blue-700 flex items-center justify-center ">1 Hr - Trial Key</button>
            </div>
          </form>
        </div>
      )}

      {/* Show Copy/Download after generation */}
      

      {/* Bulk Actions */}
      {user.level < 3 && (
        <div className="flex justify-between max-[768px]:w-[calc(100vw-32px)] min-[768px]:flex-wrap min-[768px]:gap-3 mb-2 overflow-x-scroll max-[768px]:p-[.65rem_0] bulky  rounded max-[768px]:!text-[13px] " style={{ scrollbarWidth : "none"}}>
          
          <form onSubmit={e => { e.preventDefault(); handleBulk('extend'); }} className="flex justify-between w-full items-center min-[768px]:gap-3 max-h-[48px] max-[768px]:gap-[12px] ">
           <span className='flex min-[768px]:gap-3 max-h-[48px] max-[768px]:gap-[12px]'>

            <input type="text" placeholder='1,2,3 Hours' max={720} value={extendHours} onChange={e => setExtendHours(Number(e.target.value))} className=" inp w-[126px] text-center px-4 py-1 !mb-0 rounded bg-gray-700 text-text max-h-[48px] max-[768px]:w-[120px] max-[768px]:h-[34px]" />
           
            <button type="submit" disabled={bulkLoading} className="px-3 py-2 rounded bg-blue-600 text-text hover:bg-blue-700 flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline spbl">Extend</span>
            </button>
                <button onClick={()=>handleBulk("delete")} className="flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-text rounded hover:bg-green-700">
                  <Trash className="h-4 w-4" />
                  <span className="hidden sm:inline spbl">Delete Keys</span>
                </button>
           </span>
          
          </form>
         <span className={`flex min-[768px]:gap-[16px] ${!generatedKeys.length > 0 && "!gap-3"} `}>
            
            
            {generatedKeys.length > 0 && (
              <>
                <button onClick={handleCopyKeys} className="flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-text rounded hover:bg-green-700">
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline spbl">Copy Keys</span>
                </button>
                <button onClick={handleDownloadKeys} className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-text rounded hover:bg-blue-700">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline spbl">Download Keys</span>
                </button>
              </>
            )}
          </span>
        </div>
      )}
 {/* Search Input */}
 <div className="flex justify-end mt-2 w-full">
        <input
          type="text"
          className="w-full p-2 rounded bg-[var(--label)] text-text !border-none  !mt-[10px] mx-0 shadow-sm"
          placeholder="Search keys......"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* Keys Table */}
      <div className="overflow-x-auto rounded-lg shadow-sm" style={{ scrollbarWidth : "none"}}>
        <table className="min-w-full bg-accent text-text text-xs sm:text-sm w-max"  >
          <thead>
            <tr>
              {user.level < 3 && <th className="px-2 sm:px-4 py-2"> <input
      type="checkbox"
      checked={selected.length === keys.length && keys.length > 0}
      onChange={(e) => selectAll(e.target.checked)}
      className="accent-gray-600 dark:accent-purple-600 !mb-0"
    /></th>}
              <th className="px-2 sm:px-4 py-2 ">Key</th>
              <th className="px-2 sm:px-4 py-2 ">Game</th>
              <th className="px-2 sm:px-4 py-2 ">Duration</th>
              <th className="px-2 sm:px-4 py-2 ">Expiry Date</th>
              <th className="px-2 sm:px-4 py-2 ">Max Devices</th>
              <th className="px-2 sm:px-4 py-2 ">Status</th>
              <th className="px-2 sm:px-4 py-2 ">Owner</th>
              <th className="px-2 sm:px-4 py-2 ">Created</th>
              <th className="px-2 sm:px-4 py-2 ">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-text" />
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">No keys found.</td>
              </tr>
            ) : (
              keys.map((k, i) => (
                <tr key={k.id} className="text-center w-max" style={{borderBottom : ".1px solid var(--border-table)"}}>
                  {user.level < 3 && <td className="px-2 sm:px-4 py-2"><input type="checkbox" checked={selected.includes(k.id)} onChange={() => toggleSelect(k.id)} className="accent-gray-600 dark:accent-purple-600 !mb-0 " /></td>}
                  <td className="px-2 sm:px-4 py-2  text-xs break-all max-w-[120px] sm:max-w-none">{k.user_key}</td>
                  <td className="px-2 sm:px-4 py-2">{k.game}</td>
                  <td className="px-2 sm:px-4 py-2">{k.duration}h</td>
                  <td className="px-2 sm:px-4 py-2 text-xs">{k.expired_date ? (new Date(k.expired_date).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })) : '-'}</td>
                  <td className="px-2 sm:px-4 py-2">{k.max_devices}</td>
                  <td className="px-2 sm:px-4 py-2 flex gap-3">
                    {k.status === 0 ? (
                      <button onClick={() => { handleKeyOperations('activate', k.id); }} disabled={bulkLoading} className="px-3 py-2 rounded bg-green-600 text-text hover:bg-green-700 flex items-center gap-1 max-h-[48px]">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => { handleKeyOperations('deactivate', k.id); }} disabled={bulkLoading} className="px-3 py-2 rounded bg-yellow-600 text-text hover:bg-yellow-700 flex items-center gap-1 max-h-[48px]">
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-2 ">{k.owner}</td>
                 
                  <td className="px-2 sm:px-4 py-2 text-xs">{k.created_at?.slice(0, 10)}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs flex">
                    <button onClick={() => handleKeyOperations('delete',k.id)} disabled={bulkLoading} className="px-3 py-2 rounded bg-red-600 text-text hover:bg-red-700 flex items-center gap-1 max-h-[48px]">
              <Trash2 className="h-4 w-4" />
             
            </button>
                   <button onClick={() => handleEditClick(k)} className="px-3 py-2 rounded bg-blue-600 text-text hover:bg-blue-700 flex items-center gap-1 max-h-[48px] ml-2">
                     <Edit2 className="h-4 w-4" />
                   
                   </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showEdit && editingKey && (
        <EditKeyModal
          keyData={editingKey}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
} 

// Helper function to map duration label to price key
function durationLabelToPriceKey(label) {
  switch (label) {
    case '1 Hour': return 'hr1';
    case '2 Hours': return 'hr2';
    case '5 Hours': return 'hr5';
    case '1 Day': return 'days1';
    case '7 Days': return 'days7';
    case '30 Days': return 'days30';
    case '60 Days': return 'days60';
    default: return '';
  }
} 