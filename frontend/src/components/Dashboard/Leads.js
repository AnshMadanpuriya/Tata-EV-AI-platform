import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  new: 'bg-ev-blue/15 text-ev-blue border-ev-blue/20',
  contacted: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20',
  qualified: 'bg-purple-400/15 text-purple-400 border-purple-400/20',
  converted: 'bg-ev-green/15 text-ev-green border-ev-green/20',
  lost: 'bg-red-400/15 text-red-400 border-red-400/20',
};
const INTEREST_ICONS = { 'test-ride': '🚗', purchase: '💰', service: '🔧', charging: '🔋', general: '💬' };
const demoLeads = [
  { _id: '1', name: 'Arjun Sharma', email: 'arjun@gmail.com', phone: '+91 98765 43210', source: 'chatbot', status: 'new', interest: 'test-ride', vehicle: 'Nexon EV Max', createdAt: new Date(Date.now()-3600000) },
  { _id: '2', name: 'Priya Mehta', email: 'priya@outlook.com', phone: '+91 87654 32109', source: 'voice', status: 'contacted', interest: 'purchase', vehicle: 'Tiago EV', createdAt: new Date(Date.now()-7200000) },
  { _id: '3', name: 'Rohit Verma', email: 'rohit@company.com', phone: '+91 76543 21098', source: 'form', status: 'qualified', interest: 'charging', vehicle: 'Punch EV', createdAt: new Date(Date.now()-86400000) },
  { _id: '4', name: 'Sneha Patel', email: 'sneha@mail.com', phone: '+91 65432 10987', source: 'chatbot', status: 'converted', interest: 'purchase', vehicle: 'Nexon EV', createdAt: new Date(Date.now()-172800000) },
  { _id: '5', name: 'Vikram Singh', email: 'vikram@biz.com', phone: '+91 54321 09876', source: 'demo-booking', status: 'lost', interest: 'general', vehicle: '', createdAt: new Date(Date.now()-259200000) },
  { _id: '6', name: 'Kavya Nair', email: 'kavya@tech.com', phone: '+91 43210 98765', source: 'chatbot', status: 'new', interest: 'service', vehicle: 'Tigor EV', createdAt: new Date(Date.now()-345600000) },
];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await API.get('/leads?' + params);
      setLeads(data.leads); setTotal(data.total);
    } catch { setLeads(demoLeads); setTotal(demoLeads.length); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [page, statusFilter]);
  useEffect(() => { const t = setTimeout(fetchLeads, 400); return () => clearTimeout(t); }, [search]);

  const updateStatus = async (id, status) => {
    try { await API.put('/leads/' + id, { status }); setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l)); toast.success('Updated'); }
    catch { toast.error('Failed'); }
  };
  const deleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try { await API.delete('/leads/' + id); setLeads(prev => prev.filter(l => l._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display font-bold text-2xl text-white mb-0.5">Leads</h1><p className="text-gray-500 text-sm">{total} total leads captured</p></div>
        <button className="btn-primary flex items-center gap-2 text-sm px-4 py-2"><Plus size={15} /> Add Lead</button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="input-field pl-9 text-sm py-2.5" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field text-sm py-2.5 w-40">
          <option value="">All Status</option>
          {['new','contacted','qualified','converted','lost'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-ev-border">
              {['Name','Contact','Source','Interest','Vehicle','Status','Date','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? [...Array(5)].map((_,i) => (
                <tr key={i} className="border-b border-ev-border/50">{[...Array(8)].map((_,j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-ev-border rounded animate-pulse" /></td>
                ))}</tr>
              )) : leads.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-500">No leads found</td></tr>
              ) : leads.map(lead => (
                <tr key={lead._id} className="border-b border-ev-border/50 hover:bg-ev-border/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-ev-blue to-ev-cyan rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{lead.name?.charAt(0).toUpperCase()}</div>
                      <span className="text-sm font-medium text-white whitespace-nowrap">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="text-xs text-gray-400">{lead.email}</div><div className="text-xs text-gray-500">{lead.phone}</div></td>
                  <td className="px-4 py-3"><span className="text-xs bg-ev-border/60 px-2 py-0.5 rounded-full text-gray-300 capitalize">{lead.source}</span></td>
                  <td className="px-4 py-3 text-sm">{INTEREST_ICONS[lead.interest] || '💬'} <span className="text-gray-400 text-xs capitalize">{lead.interest?.replace('-',' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{lead.vehicle || '—'}</td>
                  <td className="px-4 py-3">
                    <select value={lead.status} onChange={e => updateStatus(lead._id, e.target.value)} className={`text-xs border rounded-full px-2.5 py-1 cursor-pointer focus:outline-none capitalize ${STATUS_COLORS[lead.status]} bg-transparent`}>
                      {['new','contacted','qualified','converted','lost'].map(s => <option key={s} value={s} className="bg-ev-card">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-ev-blue"><Edit2 size={12} /></button>
                      <button onClick={() => deleteLead(lead._id)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 15 && (
          <div className="px-4 py-3 border-t border-ev-border flex items-center justify-between">
            <span className="text-xs text-gray-500">Showing {((page-1)*15)+1}–{Math.min(page*15,total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="text-xs px-3 py-1.5 border border-ev-border rounded-lg text-gray-400 hover:text-white disabled:opacity-40">Prev</button>
              <button disabled={page*15>=total} onClick={() => setPage(p=>p+1)} className="text-xs px-3 py-1.5 border border-ev-border rounded-lg text-gray-400 hover:text-white disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
