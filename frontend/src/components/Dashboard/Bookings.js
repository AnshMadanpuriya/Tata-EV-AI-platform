import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Car, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:   { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: AlertCircle },
  confirmed: { color: 'text-ev-blue',    bg: 'bg-ev-blue/10 border-ev-blue/20',       icon: CheckCircle },
  completed: { color: 'text-ev-green',   bg: 'bg-ev-green/10 border-ev-green/20',     icon: CheckCircle },
  cancelled: { color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20',       icon: XCircle },
};

const demoBookings = [
  { _id: '1', name: 'Arjun Sharma', email: 'arjun@gmail.com', phone: '+91 98765 43210', type: 'test-ride', vehicle: 'Nexon EV Max', date: new Date(Date.now()+86400000), timeSlot: '10:00 AM', status: 'confirmed', createdAt: new Date() },
  { _id: '2', name: 'Priya Mehta', email: 'priya@outlook.com', phone: '+91 87654 32109', type: 'demo', vehicle: 'Tiago EV', date: new Date(Date.now()+172800000), timeSlot: '2:00 PM', status: 'pending', createdAt: new Date(Date.now()-3600000) },
  { _id: '3', name: 'Rohit Verma', email: 'rohit@company.com', phone: '+91 76543 21098', type: 'test-ride', vehicle: 'Punch EV', date: new Date(Date.now()+259200000), timeSlot: '11:00 AM', status: 'pending', createdAt: new Date(Date.now()-7200000) },
  { _id: '4', name: 'Sneha Patel', email: 'sneha@mail.com', phone: '+91 65432 10987', type: 'service', vehicle: 'Nexon EV', date: new Date(Date.now()-86400000), timeSlot: '3:00 PM', status: 'completed', createdAt: new Date(Date.now()-172800000) },
  { _id: '5', name: 'Kavya Nair', email: 'kavya@tech.com', phone: '+91 43210 98765', type: 'consultation', vehicle: '', date: new Date(Date.now()-172800000), timeSlot: '4:00 PM', status: 'cancelled', createdAt: new Date(Date.now()-259200000) },
];

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    API.get('/bookings' + (filter ? '?status=' + filter : ''))
      .then(r => { setBookings(r.data.bookings); })
      .catch(() => setBookings(filter ? demoBookings.filter(b => b.status === filter) : demoBookings))
      .finally(() => setLoading(false));
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await API.put('/bookings/' + id, { status });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      toast.success('Booking updated');
    } catch { toast.error('Update failed'); }
  };

  const upcoming = bookings.filter(b => new Date(b.date) >= new Date() && b.status !== 'cancelled');
  const past = bookings.filter(b => new Date(b.date) < new Date() || b.status === 'cancelled');

  const BookingCard = ({ booking }) => {
    const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const isUpcoming = new Date(booking.date) >= new Date() && booking.status !== 'cancelled';
    return (
      <div className={`card p-4 ${isUpcoming ? 'border-ev-border' : 'border-ev-border/50 opacity-70'} hover:border-ev-blue/30 transition-colors`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-ev-blue to-ev-cyan rounded-full flex items-center justify-center text-white text-sm font-bold">
              {booking.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-white text-sm">{booking.name}</div>
              <div className="text-xs text-gray-500">{booking.email}</div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${cfg.bg} ${cfg.color}`}>
            <Icon size={11} /> {booking.status}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar size={12} className="text-ev-blue" />
            {new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} className="text-ev-cyan" /> {booking.timeSlot}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Car size={12} className="text-purple-400" /> {booking.vehicle || 'TBD'}
          </div>
          <div className="text-xs">
            <span className="bg-ev-border/50 px-2 py-0.5 rounded-full text-gray-300 capitalize">{booking.type?.replace('-', ' ')}</span>
          </div>
        </div>
        {booking.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t border-ev-border">
            <button onClick={() => updateStatus(booking._id, 'confirmed')} className="flex-1 text-xs py-1.5 rounded-lg bg-ev-blue/15 text-ev-blue border border-ev-blue/20 hover:bg-ev-blue/25 transition-colors font-medium">Confirm</button>
            <button onClick={() => updateStatus(booking._id, 'cancelled')} className="flex-1 text-xs py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors">Cancel</button>
          </div>
        )}
        {booking.status === 'confirmed' && (
          <div className="pt-2 border-t border-ev-border">
            <button onClick={() => updateStatus(booking._id, 'completed')} className="w-full text-xs py-1.5 rounded-lg bg-ev-green/10 text-ev-green border border-ev-green/20 hover:bg-ev-green/20 transition-colors font-medium">Mark Completed</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-0.5">Bookings</h1>
          <p className="text-gray-500 text-sm">{bookings.length} total bookings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${filter === s ? 'bg-ev-blue border-ev-blue text-white' : 'border-ev-border text-gray-400 hover:text-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card p-4 h-40 animate-pulse" />)}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <div className="text-xs font-mono text-ev-cyan uppercase tracking-widest mb-3">Upcoming ({upcoming.length})</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map(b => <BookingCard key={b._id} booking={b} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-3">Past / Cancelled ({past.length})</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {past.map(b => <BookingCard key={b._id} booking={b} />)}
              </div>
            </div>
          )}
          {bookings.length === 0 && (
            <div className="card p-12 text-center text-gray-500">No bookings found</div>
          )}
        </>
      )}
    </div>
  );
}
