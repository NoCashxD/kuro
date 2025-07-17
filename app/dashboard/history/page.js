'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Loader2, Search, Filter, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchHistory();
  }, [pagination.page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setHistory(data.history);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        toast.error('Failed to fetch history');
      }
    } catch (e) {
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.info.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_do.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = filterUser === '' || item.user_do === filterUser;
    return matchesSearch && matchesUser;
  });

  const uniqueUsers = [...new Set(history.map(item => item.user_do))];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6 flex flex-col justify-between h-[calc(100vh-128px)]">
      <div>

      <div className="flex items-center justify-between mb-3 keys">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6" /> Activity History
        </h1>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-3 keys">
        <div className="flex-1 relative">
          <Search className="absolute left-3 translate-y-[-50%] top-1/2 h-4 w-4 text-text"  style={{transform : "translateY(-50%)"}}/>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full !pl-[40px] !border-none pr-4 py-2 bg-accent text-text rounded  focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text" style={{transform : "translateY(-50%)"}} />
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="!pl-[40px] !border-none pr-8 py-2 bg-accent text-text rounded  focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto rounded-lg ">
        <table className="min-w-full bg-accent text-text text-[13px]">
          <thead>
            <tr className="bg-[var(--label)] ">
              <th className="px-4 py-3 text-center font-medium">#</th>
              <th className="px-4 py-3 text-center font-medium">User</th>
              <th className="px-4 py-3 text-center font-medium">Action</th>
              <th className="px-4 py-3 text-center font-medium">Key ID</th>
              <th className="px-4 py-3 text-center font-medium">Owner</th>
              <th className="px-4 py-3 text-center font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-text" />
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-white/60">
                  {searchTerm || filterUser ? 'No matching activities found.' : 'No activity history found.'}
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, i) => (
                <tr key={item.id} className="text-center w-max transition-colors">
                  <td className="px-4 py-3">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                  <td className="px-4 py-3  text-text">{item.user_do}</td>
                  <td className="px-4 py-3">{item.info}</td>
                  <td className="px-4 py-3  text-xs text-text">{item.keys_id || '-'}</td>
                  <td className="px-4 py-3  text-text">{item.owner}</td>
                  <td className="px-4 py-3 text-xs text-text">{formatDate(item.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-[var(--label)] rounded-lg p-4 text-[12px]">
          <div className="text-sm text-white/60">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1 bg-black text-white rounded hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="px-3 py-1 text-white">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 px-3 py-1 bg-black text-white rounded hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Summary */}
      <div className="bg-accent rounded-lg p-4 ">
        <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white/60">Total Activities:</span>
            <span className="ml-2 text-white font-medium">{pagination.total}</span>
          </div>
          <div>
            <span className="text-white/60">Filtered Results:</span>
            <span className="ml-2 text-white font-medium">{filteredHistory.length}</span>
          </div>
          <div>
            <span className="text-white/60">Unique Users:</span>
            <span className="ml-2 text-white font-medium">{uniqueUsers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 