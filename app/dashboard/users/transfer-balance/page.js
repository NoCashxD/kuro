'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransferBalancePage() {
  const [toUsername, setToUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/transfer-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_username: toUsername, amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Balance transferred successfully');
        setToUsername('');
        setAmount('');
      } else {
        toast.error(data.error || 'Failed to transfer balance');
      }
    } catch (e) {
      toast.error('Failed to transfer balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-accent p-8 rounded-lg shadow-lg border border-gray-700 transfer">
      <h1 className="text-2xl font-bold text-text mb-6">Transfer Balance</h1>
      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm ">Recipient Username</label>
          <input type="text" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={toUsername} onChange={e => setToUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm ">Amount</label>
          <input type="number" className="w-full mt-1 p-2 rounded bg-gray-700 text-text border border-gray-600" required value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 rounded bg-purple-600 text-text hover:bg-purple-700 flex items-center justify-center">
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Transfer'}
        </button>
      </form>
    </div>
  );
} 