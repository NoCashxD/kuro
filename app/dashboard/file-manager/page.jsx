"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

function formatSize(size) {
  if (size > 1024 * 1024)
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  if (size > 1024)
    return (size / 1024).toFixed(2) + ' KB';
  return size + ' B';
}

function formatDate(date) {
  return new Date(date).toLocaleString();
}

export default function FileManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [jsonEdit, setJsonEdit] = useState({ open: false, filename: '', content: '' });
  const [jsonSaving, setJsonSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (user) fetchFiles();
    // eslint-disable-next-line
  }, [user, loading]);

  function showNotification(msg, type = 'success') {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  async function fetchFiles() {
    const res = await fetch('/api/file-manager/list');
    const data = await res.json();
    if (data.files) setFiles(data.files);
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/file-manager/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.success) {
      showNotification('File uploaded!');
      fetchFiles();
      fileInputRef.current.value = '';
    } else {
      showNotification(data.error || 'Upload failed', 'error');
    }
  }

  async function handleDelete(filename) {
    if (!window.confirm('Delete this file?')) return;
    const res = await fetch('/api/file-manager/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    const data = await res.json();
    if (data.success) {
      showNotification('File deleted!');
      fetchFiles();
    } else {
      showNotification(data.error || 'Delete failed', 'error');
    }
  }

  function handleCopyLink(filename) {
    const url = `https://nocash.cc/uploads/${user.username}/${filename}`;
    navigator.clipboard.writeText(url);
    showNotification('Link copied!');
  }

  async function openJsonEditor(filename) {
    const res = await fetch(`/api/file-manager/json?filename=${encodeURIComponent(filename)}`);
    const data = await res.json();
    if (data.content !== undefined) {
      setJsonEdit({ open: true, filename, content: data.content });
    } else {
      showNotification(data.error || 'Failed to load JSON', 'error');
    }
  }

  async function saveJsonEdit() {
    setJsonSaving(true);
    const res = await fetch('/api/file-manager/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: jsonEdit.filename, content: jsonEdit.content })
    });
    const data = await res.json();
    setJsonSaving(false);
    if (data.success) {
      showNotification('JSON saved!');
      setJsonEdit({ open: false, filename: '', content: '' });
      fetchFiles();
    } else {
      showNotification(data.error || 'Save failed', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen min-w-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text)]"></div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="py-8 px-4 md:px-8 w-full mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text)] font-sans">File Manager</h1>
      {notification && (
        <div className={`mb-4 px-4 py-2 rounded text-white font-medium ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>{notification.msg}</div>
      )}
      <form onSubmit={handleUpload} className="flex  md:flex-row gap-4 items-center mb-8 keys items-center">
        <input ref={fileInputRef} type="file" accept=".zip,.json,.so,.apk" className="text-label file-input-bordered file-input-sm w-full max-w-xs !border-none !mb-0" />
        <button type="submit" disabled={uploading} className="bg-primary text-white px-4 py-2 rounded font-semibold  transition disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      <div className="overflow-x-auto mt-4 max-[768px]:!text-[12px] text-center w-full" style={{scrollbarWidth : "none"}}>
        <table className="min-w-max w-full  rounded text-[13px] bg-accent" >
          <thead>
            <tr className=" border-b border-[var(--border-table)]">
              <th className="py-2 px-3">File Name</th>
              <th className="py-2 px-3">Size</th>
              <th className="py-2 px-3">Uploaded</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No files uploaded yet.</td></tr>
            )}
            {files.map(file => (
              <tr key={file.name} className="border-b border-[var(--border-table)]">
                <td className="py-2 px-3 break-all">{file.name}</td>
                <td className="py-2 px-3">{formatSize(file.size)}</td>
                <td className="py-2 px-3">{formatDate(file.mtime)}</td>
                <td className="py-2 px-3 flex gap-2 keys justify-center">
                  {file.name.endsWith('.json') && (
                    <button onClick={() => openJsonEditor(file.name)} className="text-blue-600 !text-[12px]  p-4 py-2 !shadow-none">Edit</button>
                  )}
                  <button onClick={() => handleCopyLink(file.name)} className="text-green-600 !text-[12px] p-4 py-2 !shadow-none ">Copy Link</button>
                  <button onClick={() => handleDelete(file.name)} className="text-red-600 p-4 !text-[12px] py-2 !shadow-none">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* JSON Editor Modal */}
      {jsonEdit.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-accent rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button onClick={() => setJsonEdit({ open: false, filename: '', content: '' })} className="absolute top-2 right-2 text-xl">×</button>
            <h2 className="text-xl font-bold mb-4">Edit {jsonEdit.filename}</h2>
            <textarea
              className="w-full h-60 p-2 border rounded font-mono text-sm bg-background text-[var(--text)]"
              value={jsonEdit.content}
              onChange={e => setJsonEdit({ ...jsonEdit, content: e.target.value })}
              spellCheck={false}
            />
            <div className="flex gap-2 mt-4 keys">
              <button onClick={saveJsonEdit} disabled={jsonSaving} className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary/90 transition disabled:opacity-50">
                {jsonSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setJsonEdit({ open: false, filename: '', content: '' })} className="bg-muted-foreground text-white px-4 py-2 rounded font-semibold hover:bg-muted-foreground/80 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 