const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanText, validateBooking, validateLead } = require('../utils/validation');

test('lead validation requires at least one usable contact method', () => {
  const result = validateLead({ name: 'Ravi Kumar', interest: 'purchase' });
  assert.ok(result.errors.includes('Email or phone is required'));
});

test('lead validation normalizes contact data and consent', () => {
  const result = validateLead({
    name: ' Ravi Kumar ',
    email: 'RAVI@EXAMPLE.COM',
    phone: '+91 98765 43210',
    source: 'whatsapp',
    consent: { whatsapp: true }
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.value.email, 'ravi@example.com');
  assert.equal(result.value.phone, '9876543210');
  assert.equal(result.value.consent.whatsapp, true);
});

test('booking validation rejects past dates', () => {
  const result = validateBooking({
    name: 'Ravi Kumar', email: 'ravi@example.com', phone: '9876543210',
    date: '2020-01-01', timeSlot: '10:00 AM', type: 'test-ride'
  });
  assert.ok(result.errors.includes('Date cannot be in the past'));
});

test('booking validation accepts a future test-drive request', () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const result = validateBooking({
    name: 'Ravi Kumar', email: 'ravi@example.com', phone: '+91 98765 43210',
    date: future, timeSlot: '11:00 AM', type: 'test-ride'
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.value.phone, '9876543210');
});

test('cleanText removes angle brackets and caps length', () => {
  const cleaned = cleanText('<script>alert</script>', 12);
  assert.equal(cleaned.length, 12);
  assert.equal(/[<>]/.test(cleaned), false);
});
