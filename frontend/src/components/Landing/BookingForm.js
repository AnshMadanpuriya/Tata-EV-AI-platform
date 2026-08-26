import { useState } from 'react';
import BookingForm from '../components/Landing/BookingForm';

function Hero() {
  const [showBooking, setShowBooking] = useState(false);
  return (
    <>
      <button onClick={() => setShowBooking(true)}>Book a Demo</button>
      {showBooking && <BookingForm onClose={() => setShowBooking(false)} />}
    </>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============================================================
// VALIDATION RULES
// ============================================================
function validateForm(form) {
  const errors = {};

  if (!form.name.trim()) errors.name = 'Full name is required';
  else if (form.name.trim().length < 3) errors.name = 'Name must be at least 3 characters';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address';

  const phoneDigits = form.phone.replace(/\D/g, '').replace(/^91(?=[6-9]\d{9}$)/, '');
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!/^[6-9]\d{9}$/.test(phoneDigits)) errors.phone = 'Enter a valid Indian phone number';

  if (!form.vehicle) errors.vehicle = 'Please select a vehicle model';

  if (!form.date) errors.date = 'Please select a preferred date';
  else {
    const selected = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) errors.date = 'Date cannot be in the past';
  }

  if (!form.timeSlot) errors.timeSlot = 'Please select a time slot';

  return errors;
}

const VEHICLES = ['Nexon EV Max', 'Nexon EV', 'Punch EV', 'Tiago EV', 'Tigor EV', 'Curvv EV'];
const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

// ============================================================
// BOOKING FORM COMPONENT
// ============================================================
export default function BookingForm({ onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', vehicle: '', date: '', timeSlot: '',
    type: 'test-ride', location: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(null);

  const set = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    // Clear that field's error as soon as user starts fixing it
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
  };

  // ── STEP 1-2: React validates input, then Axios sends POST ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Client-side validation
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // stop — don't call the API with bad data
    }

    setLoading(true);
    try {
      // ── STEP 3: Axios sends POST request to Express backend ──
      const response = await axios.post(`${API_URL}/bookings`, form, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      if (response.data.success) {
        setSuccess(response.data);
        setForm({ name: '', email: '', phone: '', vehicle: '', date: '', timeSlot: '', type: 'test-ride', location: '', notes: '' });
      } else {
        setSubmitError(response.data.message || 'Booking failed. Please try again.');
      }
    } catch (err) {
      if (err.response) {
        // Backend responded with an error (validation failed server-side, etc.)
        setSubmitError(err.response.data?.message || 'Server rejected the booking. Check your details.');
      } else if (err.request) {
        // Request made, no response — backend down
        setSubmitError('Cannot reach server. Make sure backend is running on port 5000.');
      } else {
        setSubmitError('Something went wrong: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%', background: 'rgba(0,0,0,0.4)',
    border: `1px solid ${hasError ? '#F87171' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 9, padding: '11px 14px', color: 'white', fontSize: 13,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose?.()}>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        style={{
          background: '#0D1422', border: '1px solid #1A2540', borderRadius: 20,
          width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #1A2540',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#0D1422', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Book a Test Ride</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Confirmed within 2 hours</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, width: 32, height: 32, color: '#9CA3AF', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            // ── SUCCESS STATE ──
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '40px 24px', textAlign: 'center' }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} style={{ fontSize: 56, marginBottom: 16 }}>✅</motion.div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>Test-drive request received</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20, lineHeight: 1.6 }}>
                Your request is saved. The dealership will confirm the exact slot shortly.
              </div>

              {/* Automation status */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                {[
                  { icon: '💾', label: 'Saved to database', done: true },
                  { icon: '🗓️', label: 'Awaiting dealership slot confirmation', done: true },
                  {
                    icon: '⚙️',
                    label: success.automation?.status === 'delivered'
                      ? 'n8n automation accepted the request'
                      : success.automation?.status === 'failed'
                        ? 'Automation needs staff attention'
                        : 'Automation webhook is not configured yet',
                    done: success.automation?.status === 'delivered',
                  },
                ].map(({ icon, label, done }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <span>{icon}</span>
                    <span style={{ flex: 1, fontSize: 12, color: '#D1D5DB' }}>{label}</span>
                    <span style={{ color: done ? '#00FF88' : '#FBBF24', fontSize: 13 }}>{done ? '✓' : '!'}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(0,102,255,0.06)', border: '1px solid rgba(0,102,255,0.15)', borderRadius: 10, padding: 12, fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
                Booking code: <span style={{ color: '#00D4FF', fontFamily: 'monospace' }}>{success.booking?.bookingCode || success.booking?._id?.slice(-8) || 'N/A'}</span>
              </div>

              <button onClick={onClose} style={{
                background: '#0066FF', color: 'white', border: 'none', borderRadius: 10,
                padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Done</button>
            </motion.div>
          ) : (
            // ── FORM STATE ──
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              style={{ padding: 24 }}
            >
              {/* Name + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Full Name *</label>
                  <input value={form.name} onChange={set('name')} placeholder="Arjun Rathi" style={inputStyle(errors.name)} />
                  {errors.name && <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Phone Number *</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="9876543210" style={inputStyle(errors.phone)} />
                  {errors.phone && <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{errors.phone}</div>}
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Email Address *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="arjun@gmail.com" style={inputStyle(errors.email)} />
                {errors.email && <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{errors.email}</div>}
              </div>

              {/* Vehicle + Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Vehicle Model *</label>
                  <select value={form.vehicle} onChange={set('vehicle')} style={inputStyle(errors.vehicle)}>
                    <option value="">Select model</option>
                    {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {errors.vehicle && <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{errors.vehicle}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Booking Type</label>
                  <select value={form.type} onChange={set('type')} style={inputStyle(false)}>
                    <option value="test-ride">Test Ride</option>
                    <option value="demo">Product Demo</option>
                    <option value="service">Service</option>
                    <option value="consultation">Consultation</option>
                  </select>
                </div>
              </div>

              {/* Date + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Preferred Date *</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={form.date} onChange={set('date')} style={inputStyle(errors.date)} />
                  {errors.date && <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{errors.date}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Time Slot *</label>
                  <select value={form.timeSlot} onChange={set('timeSlot')} style={inputStyle(errors.timeSlot)}>
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.timeSlot && <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{errors.timeSlot}</div>}
                </div>
              </div>

              {/* Location */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Preferred Location</label>
                <input value={form.location} onChange={set('location')} placeholder="e.g. Mumbai Showroom" style={inputStyle(false)} />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Additional Notes</label>
                <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Any special requirements..." style={{ ...inputStyle(false), resize: 'none' }} />
              </div>

              {/* Submit error */}
              {submitError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#F87171' }}>
                  ⚠️ {submitError}
                </div>
              )}

              {/* Submit button */}
              <button type="submit" disabled={loading} style={{
                width: '100%', background: loading ? '#1A2540' : 'linear-gradient(135deg,#0066FF,#0044CC)',
                color: 'white', border: 'none', borderRadius: 10, padding: '14px',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 0 24px rgba(0,102,255,0.3)',
              }}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Booking...</>
                ) : '📅 Confirm Booking'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#374151', marginTop: 12 }}>
                🔒 You'll receive Email + WhatsApp confirmation instantly
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
