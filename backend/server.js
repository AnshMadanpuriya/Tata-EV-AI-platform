// ============================================================
// COMPLETE BACKEND - server.js
// Run: npm run dev (or node server.js)
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load environment files from deterministic locations. This lets the Node
// fallback use the same Mistral key as the Python RAG service even when the
// backend is started from the repository root.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../rag-service/.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ─── Config ───────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tatamotors-ev';
const JWT_SECRET = process.env.JWT_SECRET || 'tatamotors_ev_secret_2025';
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || process.env.N8N_BOOKING_WEBHOOK_URL || '';
const EV_API_KEY = process.env.EV_API_KEY || '';
const EV_API_BASE = 'https://api.api-ninjas.com/v1';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_CHAT_MODEL = process.env.MISTRAL_CHAT_MODEL || 'mistral-small-latest';
const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

async function triggerMakeWebhook(event, payload) {
  if (!MAKE_WEBHOOK_URL) {
    console.log(`ℹ️ MAKE_WEBHOOK_URL not set — skipping ${event} automation`);
    return;
  }

  try {
    await axios.post(
      MAKE_WEBHOOK_URL,
      { event, ...payload },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    console.log(`✅ Make automation triggered: ${event}`);
  } catch (err) {
    console.error(`⚠️ Make webhook failed for ${event}:`, err.message);
  }
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected:', MONGO_URI))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// ============================================================
// SCHEMAS & MODELS
// ============================================================

// 1. USER
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  phone:     { type: String, default: '' },
  company:   { type: String, default: '' },
  role:      { type: String, enum: ['admin', 'user'], default: 'user' },
  lastLogin: { type: Date },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// 2. ENQUIRY (contact form)
const enquirySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String, default: '' },
  company:   { type: String, default: '' },
  message:   { type: String, required: true },
  source:    { type: String, default: 'contact-form' },
  status:    { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  ipAddress: { type: String, default: '' },
}, { timestamps: true });

const Enquiry = mongoose.model('Enquiry', enquirySchema);

// 3. BOOKING (test ride / demo)
const bookingSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true },
  phone:         { type: String, required: true },
  vehicle:       { type: String, default: '' },
  date:          { type: Date, required: true },
  timeSlot:      { type: String, required: true },
  type:          { type: String, enum: ['test-ride', 'demo', 'service', 'consultation'], default: 'test-ride' },
  location:      { type: String, default: '' },
  notes:         { type: String, default: '' },
  status:        { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  reminderSent:  { type: Boolean, default: false },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

// 4. LEAD (chatbot / booking / form leads)
const leadSchema = new mongoose.Schema({
  name:      { type: String, default: 'Visitor' },
  email:     { type: String, default: '' },
  phone:     { type: String, default: '' },
  source:    { type: String, enum: ['chatbot', 'voice', 'form', 'booking', 'demo-booking'], default: 'chatbot' },
  status:    { type: String, enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], default: 'new' },
  interest:  { type: String, default: 'general' },
  vehicle:   { type: String, default: '' },
  sessionId: { type: String, default: '' },
  notes:     { type: String, default: '' },
}, { timestamps: true });

const Lead = mongoose.model('Lead', leadSchema);

// ============================================================
// INDIAN EV DATABASE (for EV Explorer / Comparator)
// ============================================================
const INDIAN_EV_DATABASE = [
  { make: 'Tata', model: 'Nexon EV Max', year_start: '2022', battery_capacity: '40.5 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '40.5 kWh', charge_power: '7.2 kW AC', charge_power_max: '50 kW DC', charge_speed: '600 km/h', acceleration_0_100_kmh: '9.9 sec', top_speed: '140 km/h', electric_range: '437 km', total_power: '105 kW (143 PS)', total_torque: '250 Nm', drive: 'Front', vehicle_consumption: '147 Wh/km', co2_emissions: '0 g/km', length: '3993 mm', width: '1811 mm', height: '1616 mm', seats: '5 people', cargo_volume: '350 L', car_body: 'SUV', segment: 'B - Compact' },
  { make: 'Tata', model: 'Nexon EV', year_start: '2020', battery_capacity: '30 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '30 kWh', charge_power: '3.3 kW AC', charge_power_max: '25 kW DC', charge_speed: '350 km/h', acceleration_0_100_kmh: '9.9 sec', top_speed: '120 km/h', electric_range: '312 km', total_power: '95 kW (129 PS)', total_torque: '245 Nm', drive: 'Front', vehicle_consumption: '155 Wh/km', co2_emissions: '0 g/km', length: '3993 mm', width: '1811 mm', height: '1616 mm', seats: '5 people', cargo_volume: '350 L', car_body: 'SUV', segment: 'B - Compact' },
  { make: 'Tata', model: 'Punch EV', year_start: '2024', battery_capacity: '35 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '35 kWh', charge_power: '7.2 kW AC', charge_power_max: '50 kW DC', charge_speed: '500 km/h', acceleration_0_100_kmh: '9.5 sec', top_speed: '145 km/h', electric_range: '421 km', total_power: '90 kW (122 PS)', total_torque: '190 Nm', drive: 'Front', vehicle_consumption: '140 Wh/km', co2_emissions: '0 g/km', length: '3827 mm', width: '1742 mm', height: '1615 mm', seats: '5 people', cargo_volume: '366 L', car_body: 'SUV', segment: 'A - Mini' },
  { make: 'Tata', model: 'Tiago EV', year_start: '2022', battery_capacity: '24 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '24 kWh', charge_power: '3.3 kW AC', charge_power_max: '25 kW DC', charge_speed: '350 km/h', acceleration_0_100_kmh: '13.5 sec', top_speed: '120 km/h', electric_range: '315 km', total_power: '55 kW (75 PS)', total_torque: '114 Nm', drive: 'Front', vehicle_consumption: '128 Wh/km', co2_emissions: '0 g/km', length: '3765 mm', width: '1677 mm', height: '1535 mm', seats: '5 people', cargo_volume: '240 L', car_body: 'Hatchback', segment: 'A - Mini' },
  { make: 'Tata', model: 'Tigor EV', year_start: '2021', battery_capacity: '26 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '26 kWh', charge_power: '3.3 kW AC', charge_power_max: '25 kW DC', charge_speed: '350 km/h', acceleration_0_100_kmh: '13.2 sec', top_speed: '120 km/h', electric_range: '306 km', total_power: '55 kW (75 PS)', total_torque: '170 Nm', drive: 'Front', vehicle_consumption: '135 Wh/km', co2_emissions: '0 g/km', length: '3993 mm', width: '1677 mm', height: '1537 mm', seats: '5 people', cargo_volume: '316 L', car_body: 'Sedan', segment: 'B - Compact' },
  { make: 'Tata', model: 'Curvv EV', year_start: '2024', battery_capacity: '45 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '45 kWh', charge_power: '7.2 kW AC', charge_power_max: '70 kW DC', charge_speed: '650 km/h', acceleration_0_100_kmh: '8.6 sec', top_speed: '150 km/h', electric_range: '502 km', total_power: '150 kW (204 PS)', total_torque: '215 Nm', drive: 'Front', vehicle_consumption: '135 Wh/km', co2_emissions: '0 g/km', length: '4308 mm', width: '1810 mm', height: '1637 mm', seats: '5 people', cargo_volume: '500 L', car_body: 'SUV Coupe', segment: 'C - Medium' },
  { make: 'Mahindra', model: 'XUV400 EV', year_start: '2023', battery_capacity: '39.4 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '39.4 kWh', charge_power: '7.2 kW AC', charge_power_max: '50 kW DC', charge_speed: '500 km/h', acceleration_0_100_kmh: '8.3 sec', top_speed: '150 km/h', electric_range: '456 km', total_power: '110 kW (150 PS)', total_torque: '310 Nm', drive: 'Front', vehicle_consumption: '135 Wh/km', co2_emissions: '0 g/km', length: '4200 mm', width: '1821 mm', height: '1634 mm', seats: '5 people', cargo_volume: '378 L', car_body: 'SUV', segment: 'B - Compact' },
  { make: 'Mahindra', model: 'BE 6', year_start: '2025', battery_capacity: '79 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '79 kWh', charge_power: '11 kW AC', charge_power_max: '175 kW DC', charge_speed: '1200 km/h', acceleration_0_100_kmh: '6.7 sec', top_speed: '200 km/h', electric_range: '682 km', total_power: '210 kW (286 PS)', total_torque: '380 Nm', drive: 'Rear', vehicle_consumption: '155 Wh/km', co2_emissions: '0 g/km', length: '4371 mm', width: '1907 mm', height: '1627 mm', seats: '5 people', cargo_volume: '455 L', car_body: 'SUV Coupe', segment: 'C - Medium' },
  { make: 'Mahindra', model: 'XEV 9e', year_start: '2025', battery_capacity: '79 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '79 kWh', charge_power: '11 kW AC', charge_power_max: '175 kW DC', charge_speed: '1200 km/h', acceleration_0_100_kmh: '6.8 sec', top_speed: '200 km/h', electric_range: '656 km', total_power: '210 kW (286 PS)', total_torque: '380 Nm', drive: 'Rear', vehicle_consumption: '160 Wh/km', co2_emissions: '0 g/km', length: '4789 mm', width: '1907 mm', height: '1690 mm', seats: '5 people', cargo_volume: '663 L', car_body: 'SUV', segment: 'D - Large' },
  { make: 'MG', model: 'Comet EV', year_start: '2023', battery_capacity: '17.3 kWh', battery_type: 'Lithium-ion LFP', battery_useable_capacity: '17.3 kWh', charge_power: '3.3 kW AC', charge_power_max: '3.3 kW AC', charge_speed: '150 km/h', acceleration_0_100_kmh: 'N/A', top_speed: '90 km/h', electric_range: '230 km', total_power: '30 kW (41 PS)', total_torque: '110 Nm', drive: 'Rear', vehicle_consumption: '105 Wh/km', co2_emissions: '0 g/km', length: '2974 mm', width: '1505 mm', height: '1640 mm', seats: '4 people', cargo_volume: '65 L', car_body: 'Hatchback', segment: 'A - Mini' },
  { make: 'MG', model: 'ZS EV', year_start: '2022', battery_capacity: '50.3 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '50.3 kWh', charge_power: '7.4 kW AC', charge_power_max: '76 kW DC', charge_speed: '600 km/h', acceleration_0_100_kmh: '8.5 sec', top_speed: '175 km/h', electric_range: '461 km', total_power: '130 kW (177 PS)', total_torque: '280 Nm', drive: 'Front', vehicle_consumption: '155 Wh/km', co2_emissions: '0 g/km', length: '4323 mm', width: '1809 mm', height: '1649 mm', seats: '5 people', cargo_volume: '448 L', car_body: 'SUV', segment: 'B - Compact' },
  { make: 'MG', model: 'Windsor EV', year_start: '2024', battery_capacity: '38 kWh', battery_type: 'Lithium-ion LFP', battery_useable_capacity: '38 kWh', charge_power: '7.4 kW AC', charge_power_max: '50 kW DC', charge_speed: '500 km/h', acceleration_0_100_kmh: '9.6 sec', top_speed: '130 km/h', electric_range: '332 km', total_power: '100 kW (136 PS)', total_torque: '200 Nm', drive: 'Front', vehicle_consumption: '145 Wh/km', co2_emissions: '0 g/km', length: '4295 mm', width: '1850 mm', height: '1677 mm', seats: '5 people', cargo_volume: '604 L', car_body: 'Crossover', segment: 'B - Compact' },
  { make: 'Hyundai', model: 'Creta EV', year_start: '2025', battery_capacity: '51.4 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '51.4 kWh', charge_power: '11 kW AC', charge_power_max: '100 kW DC', charge_speed: '900 km/h', acceleration_0_100_kmh: '7.9 sec', top_speed: '170 km/h', electric_range: '473 km', total_power: '135 kW (184 PS)', total_torque: '250 Nm', drive: 'Front', vehicle_consumption: '145 Wh/km', co2_emissions: '0 g/km', length: '4315 mm', width: '1825 mm', height: '1620 mm', seats: '5 people', cargo_volume: '433 L', car_body: 'SUV', segment: 'B - Compact' },
  { make: 'Ola', model: 'S1 Pro', year_start: '2023', battery_capacity: '4 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '3.97 kWh', charge_power: '750 W AC', charge_power_max: '750 W AC', charge_speed: '75 km/h', acceleration_0_100_kmh: 'N/A', top_speed: '116 km/h', electric_range: '195 km', total_power: '11 kW (15 PS)', total_torque: '58 Nm', drive: 'Rear', vehicle_consumption: '20.5 Wh/km', co2_emissions: '0 g/km', length: '1860 mm', width: '710 mm', height: '1180 mm', seats: '2 people', cargo_volume: '36 L', car_body: 'Scooter', segment: 'Two-wheeler' },
  { make: 'Ola', model: 'S1 Air', year_start: '2023', battery_capacity: '3 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '2.97 kWh', charge_power: '650 W AC', charge_power_max: '650 W AC', charge_speed: '70 km/h', acceleration_0_100_kmh: 'N/A', top_speed: '90 km/h', electric_range: '151 km', total_power: '4.5 kW (6 PS)', total_torque: '32 Nm', drive: 'Rear', vehicle_consumption: '19.8 Wh/km', co2_emissions: '0 g/km', length: '1860 mm', width: '710 mm', height: '1180 mm', seats: '2 people', cargo_volume: '36 L', car_body: 'Scooter', segment: 'Two-wheeler' },
  { make: 'Ather', model: '450X', year_start: '2023', battery_capacity: '3.7 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '3.7 kWh', charge_power: '750 W AC', charge_power_max: '750 W AC', charge_speed: '80 km/h', acceleration_0_100_kmh: 'N/A', top_speed: '90 km/h', electric_range: '150 km', total_power: '6 kW (8 PS)', total_torque: '26 Nm', drive: 'Rear', vehicle_consumption: '24.6 Wh/km', co2_emissions: '0 g/km', length: '1800 mm', width: '650 mm', height: '1150 mm', seats: '2 people', cargo_volume: '22 L', car_body: 'Scooter', segment: 'Two-wheeler' },
  { make: 'Ather', model: 'Rizta', year_start: '2024', battery_capacity: '3.7 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '3.7 kWh', charge_power: '650 W AC', charge_power_max: '650 W AC', charge_speed: '75 km/h', acceleration_0_100_kmh: 'N/A', top_speed: '80 km/h', electric_range: '160 km', total_power: '4.3 kW (6 PS)', total_torque: '22 Nm', drive: 'Rear', vehicle_consumption: '23.1 Wh/km', co2_emissions: '0 g/km', length: '1800 mm', width: '700 mm', height: '1160 mm', seats: '2 people', cargo_volume: '34 L', car_body: 'Scooter', segment: 'Two-wheeler' },
  { make: 'TVS', model: 'iQube', year_start: '2023', battery_capacity: '3.4 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '3.4 kWh', charge_power: '650 W AC', charge_power_max: '650 W AC', charge_speed: '70 km/h', acceleration_0_100_kmh: 'N/A', top_speed: '82 km/h', electric_range: '145 km', total_power: '4.4 kW (6 PS)', total_torque: '33 Nm', drive: 'Rear', vehicle_consumption: '23.4 Wh/km', co2_emissions: '0 g/km', length: '1830 mm', width: '650 mm', height: '1170 mm', seats: '2 people', cargo_volume: '32 L', car_body: 'Scooter', segment: 'Two-wheeler' },
  { make: 'Bajaj', model: 'Chetak', year_start: '2023', battery_capacity: '3 kWh', battery_type: 'Lithium-ion NMC', battery_useable_capacity: '3 kWh', charge_power: '750 W AC', charge_power_max: '750 W AC', charge_speed: '75 km/h', acceleration_0_100_kmh: 'N/A', top_speed: '73 km/h', electric_range: '126 km', total_power: '4 kW (5.4 PS)', total_torque: '16 Nm', drive: 'Rear', vehicle_consumption: '23.8 Wh/km', co2_emissions: '0 g/km', length: '1900 mm', width: '735 mm', height: '1155 mm', seats: '2 people', cargo_volume: '20 L', car_body: 'Scooter', segment: 'Two-wheeler' },
];

const LOCAL_EV_CONTEXT = INDIAN_EV_DATABASE.map((vehicle) => (
  `${vehicle.make} ${vehicle.model}: ${vehicle.electric_range} range, ` +
  `${vehicle.battery_capacity} battery, ${vehicle.charge_power_max} maximum charging, ` +
  `${vehicle.car_body}, ${vehicle.seats}`
)).join('\n');

function sanitizeChatHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-8)
    .filter((item) => item && ['user', 'assistant'].includes(item.role))
    .map((item) => ({
      role: item.role,
      content: String(item.content || '').trim().slice(0, 1000),
    }))
    .filter((item) => item.content);
}

async function askMistral(message, history) {
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }

  const response = await axios.post(
    MISTRAL_CHAT_URL,
    {
      model: MISTRAL_CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: `You are EVA, a practical AI assistant for Indian EV customers.
Reply in the same language as the user, including natural Hinglish. Answer the actual question directly; never repeat a fixed support menu.
Use the local vehicle data below for model names and specifications. Do not invent current prices, subsidies, availability, or specifications. If exact live data is unavailable, clearly say it should be verified.
Keep normal answers concise and use short bullets where useful.

LOCAL EV DATA:
${LOCAL_EV_CONTEXT}`,
        },
        ...sanitizeChatHistory(history),
        { role: 'user', content: String(message).trim().slice(0, 500) },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  const answer = typeof content === 'string'
    ? content.trim()
    : Array.isArray(content)
      ? content.map((item) => item?.text || '').join('').trim()
      : '';

  if (!answer) throw new Error('Mistral returned an empty answer');
  return answer;
}

function getMentionedVehicles(message) {
  const normalized = String(message).toLowerCase();

  return INDIAN_EV_DATABASE.filter((vehicle) => {
    const fullName = `${vehicle.make} ${vehicle.model}`.toLowerCase();
    const modelName = vehicle.model.toLowerCase();
    const shortModelName = modelName
      .replace(/\belectric\b/g, '')
      .replace(/\bev\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized.includes(fullName)
      || normalized.includes(modelName)
      || (shortModelName.length >= 4 && normalized.includes(shortModelName));
  });
}

function formatLocalEVList() {
  const grouped = INDIAN_EV_DATABASE.reduce((brands, vehicle) => {
    if (!brands[vehicle.make]) brands[vehicle.make] = [];
    brands[vehicle.make].push(vehicle.model);
    return brands;
  }, {});

  return [
    '**Available EV models in our local database:**',
    '',
    ...Object.entries(grouped).map(
      ([make, models]) => `- **${make}:** ${models.join(', ')}`,
    ),
    '',
    'Kisi bhi 2 models ka naam bhejiye, main range, battery aur charging compare kar dunga.',
  ].join('\n');
}

function getLocalEVAnswer(message) {
  const normalized = String(message).toLowerCase().trim();
  const mentionedVehicles = getMentionedVehicles(normalized);
  const wantsList = /(list|names?|models?|options?|naam|gaadi|cars?|vehicles?)/i.test(normalized)
    && /(ev|electric|car|vehicle|gaadi|model)/i.test(normalized);

  if (wantsList) return formatLocalEVList();

  if (mentionedVehicles.length >= 2 && /(compare|versus|\bvs\b|difference|better)/i.test(normalized)) {
    return [
      '**EV comparison:**',
      '',
      ...mentionedVehicles.slice(0, 3).map((vehicle) => (
        `- **${vehicle.make} ${vehicle.model}:** ${vehicle.electric_range} range, ` +
        `${vehicle.battery_capacity} battery, ${vehicle.charge_power_max} max charging`
      )),
      '',
      'Real-world range driving style, weather aur AC usage se change ho sakti hai.',
    ].join('\n');
  }

  if (mentionedVehicles.length) {
    const vehicle = mentionedVehicles[0];
    return [
      `**${vehicle.make} ${vehicle.model}**`,
      '',
      `- Range: ${vehicle.electric_range}`,
      `- Battery: ${vehicle.battery_capacity}`,
      `- Maximum charging: ${vehicle.charge_power_max}`,
      `- Power: ${vehicle.total_power}`,
      `- Body/Seats: ${vehicle.car_body}, ${vehicle.seats}`,
      '',
      'Ye local product data hai; current variant, price aur availability dealer se verify karein.',
    ].join('\n');
  }

  if (/(range|distance|kilomet|km)/i.test(normalized)) {
    const longestRange = [...INDIAN_EV_DATABASE]
      .sort((first, second) => parseInt(second.electric_range, 10) - parseInt(first.electric_range, 10))
      .slice(0, 5);

    return [
      '**Longest-range EVs in our local database:**',
      '',
      ...longestRange.map(
        (vehicle) => `- **${vehicle.make} ${vehicle.model}:** ${vehicle.electric_range}`,
      ),
      '',
      'Real-world range weather, speed, traffic aur AC usage par depend karti hai.',
    ].join('\n');
  }

  if (/(charg|battery|home charger)/i.test(normalized)) {
    return 'EV charging mainly 3 types ki hoti hai: slow AC home charging, faster AC charging aur DC fast charging. Apna EV model batayein, main uski battery, supported charging power aur approximate charging guidance bata dunga.';
  }

  if (/(test ride|test drive|book)/i.test(normalized)) {
    return 'Test drive book karne ke liye preferred EV model, city, date aur convenient time share kijiye. Team confirmation ke liye aapka naam aur phone number bhi required hoga.';
  }

  if (/(price|cost|lakh|subsid)/i.test(normalized)) {
    return 'EV prices aur subsidies frequently change hoti hain. Model aur city batayein; main available vehicle details explain karunga, lekin final on-road price authorised dealer se verify karna hoga.';
  }

  if (/^(hi|hello|hey|namaste|hii+)(\s|!|\.|$)/i.test(normalized)) {
    return 'Namaste! 👋 Aap kisi EV ka naam, range, battery, charging ya comparison pooch sakte hain. Example: “Nexon EV aur Curvv EV compare karo.”';
  }

  return `Main aapke question “${String(message).trim().slice(0, 120)}” ko clearly samajh nahi paaya. EV model ka naam ya required detail—range, battery, charging, comparison, price ya test drive—thoda clearly likhiye.`;
}

function searchIndianEVs(make, model) {
  return INDIAN_EV_DATABASE.filter(v => {
    const makeMatch = !make || v.make.toLowerCase().includes(make.toLowerCase());
    const modelMatch = !model || v.model.toLowerCase().includes(model.toLowerCase());
    return makeMatch && modelMatch;
  });
}

async function fetchFromAPINinjas(make, model) {
  try {
    const params = new URLSearchParams();
    if (make) params.append('make', make);
    if (model) params.append('model', model);
    const response = await fetch(`${EV_API_BASE}/electricvehicle?${params}`, {
      headers: { 'X-Api-Key': EV_API_KEY }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ============================================================
// MIDDLEWARE - JWT Auth
// ============================================================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
};

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, company } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, company, role: 'admin' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    console.log(`✅ New user registered: ${email}`);
    res.status(201).json({ success: true, message: 'Account created!', token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`✅ User logged in: ${email}`);
    res.json({ success: true, message: 'Login successful', token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/auth/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users, total: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// ENQUIRY ROUTES (Contact Form)
// ============================================================
app.post('/api/enquiry', async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ success: false, message: 'Name, email and message required' });

    const enquiry = await Enquiry.create({
      name, email, phone: phone || '', company: company || '', message,
      ipAddress: req.ip || '',
    });

    console.log(`📩 New enquiry from: ${name} (${email})`);
    res.status(201).json({
      success: true,
      message: 'Enquiry submitted! We will contact you within 24 hours.',
      enquiry,
    });

    void triggerMakeWebhook('new_enquiry', {
      enquiryId: enquiry._id,
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      company: enquiry.company,
      message: enquiry.message,
      source: enquiry.source,
      createdAt: enquiry.createdAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/enquiry', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const enquiries = await Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Enquiry.countDocuments(filter);
    res.json({ success: true, enquiries, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/enquiry/:id', authMiddleware, async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// BOOKING ROUTES — with Make automation
// ============================================================
function validateBookingData(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 3) errors.push('Name must be at least 3 characters');
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Valid email is required');
  if (!body.phone || !/^[6-9]\d{9}$/.test(body.phone.replace(/\s/g, ''))) errors.push('Valid 10-digit Indian phone number is required');
  if (!body.date) {
    errors.push('Date is required');
  } else {
    const selected = new Date(body.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) errors.push('Date cannot be in the past');
  }
  if (!body.timeSlot) errors.push('Time slot is required');
  return errors;
}

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, phone, vehicle, date, timeSlot, type, location, notes } = req.body;

    const validationErrors = validateBookingData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors[0], errors: validationErrors });
    }

    const booking = await Booking.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      vehicle: vehicle || '',
      date, timeSlot,
      type: type || 'test-ride',
      location: location || '',
      notes: notes || '',
      status: 'pending',
    });

    await Lead.findOneAndUpdate(
      { email: booking.email },
      { name: booking.name, email: booking.email, phone: booking.phone, source: 'demo-booking', interest: booking.type === 'test-ride' ? 'test-ride' : 'general', vehicle: booking.vehicle, status: 'contacted' },
      { upsert: true, new: true }
    );

    console.log(`📅 New booking saved: ${booking.name} — ${booking.vehicle || booking.type} on ${booking.date} (ID: ${booking._id})`);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed! Check your email and WhatsApp shortly.',
      booking,
    });

    void triggerMakeWebhook('new_booking', {
      bookingId: booking._id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      vehicle: booking.vehicle,
      date: booking.date,
      timeSlot: booking.timeSlot,
      type: booking.type,
      location: booking.location,
      notes: booking.notes,
      createdAt: booking.createdAt,
    });
  } catch (err) {
    console.error('Booking creation error:', err.message);
    res.status(500).json({ success: false, message: 'Server error while saving booking. Please try again.' });
  }
});

app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const bookings = await Booking.find(filter).sort({ date: 1 });
    res.json({ success: true, bookings, total: bookings.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// LEADS ROUTES
// ============================================================
app.post('/api/leads', async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/leads', authMiddleware, async (req, res) => {
  try {
    const { status, source, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, leads, total: leads.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/leads/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/leads/:id', authMiddleware, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// ANALYTICS ROUTE
// ============================================================
app.get('/api/analytics/dashboard', authMiddleware, async (req, res) => {
  try {
    const [totalUsers, totalEnquiries, newEnquiries, totalBookings, pendingBookings, totalLeads, convertedLeads] = await Promise.all([
      User.countDocuments(), Enquiry.countDocuments(), Enquiry.countDocuments({ status: 'new' }),
      Booking.countDocuments(), Booking.countDocuments({ status: 'pending' }),
      Lead.countDocuments(), Lead.countDocuments({ status: 'converted' }),
    ]);

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const dailyLeads = await Lead.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const leadsBySource = await Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
    const leadsByStatus = await Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalEnquiries, newEnquiries, totalBookings, pendingBookings,
        totalLeads, convertedLeads, conversionRate: parseFloat(conversionRate),
        dailyLeads, leadsBySource, leadsByStatus,
        totalChats: totalLeads, recentChats: newEnquiries,
        newLeads: await Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// CHAT ROUTE (Mistral AI with grounded local fallback)
// ============================================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, sessionId, visitorName, visitorEmail } = req.body;
    const question = String(message || '').trim();

    if (!question) {
      return res.status(400).json({ success: false, message: 'Message required' });
    }

    if (question.length > 500) {
      return res.status(400).json({ success: false, message: 'Message is too long' });
    }

    if (visitorEmail) {
      await Lead.findOneAndUpdate(
        { email: visitorEmail },
        { name: visitorName || 'Visitor', email: visitorEmail, source: 'chatbot', sessionId },
        { upsert: true, new: true }
      );
    }

    let response;
    let mode = 'local';

    try {
      response = await askMistral(question, history);
      mode = 'mistral';
    } catch (aiError) {
      const providerStatus = aiError.response?.status || aiError.code || aiError.message;
      console.warn(`Mistral unavailable; using local EV knowledge: ${providerStatus}`);
      response = getLocalEVAnswer(question);
    }

    res.json({
      success: true,
      response,
      mode,
      sessionId: sessionId || `s_${Date.now()}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EV EXPLORER / COMPARATOR ROUTES
// ============================================================
app.get('/api/ev/search', async (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make && !model) {
      return res.status(400).json({ success: false, message: 'make or model parameter required' });
    }

    let vehicles = searchIndianEVs(make, model);
    let source = 'indian-database';

    if (vehicles.length === 0) {
      vehicles = await fetchFromAPINinjas(make, model);
      source = 'api-ninjas';
    }

    console.log(`🔍 EV Search: ${make || ''} ${model || ''} → ${vehicles.length} results (${source})`);

    if (vehicles.length === 0) {
      return res.json({
        success: false, vehicles: [],
        message: `No vehicles found for "${make || ''} ${model || ''}". Try Tata, Mahindra, MG, Ola, Ather, TVS, Bajaj (India) or Tesla, Hyundai, Kia, BMW, Audi (Global).`
      });
    }

    res.json({ success: true, vehicles, count: vehicles.length, source });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/ev/compare', async (req, res) => {
  try {
    const { make1, model1, make2, model2 } = req.query;
    if (!make1 || !make2) {
      return res.status(400).json({ success: false, message: 'make1 and make2 required' });
    }

    let v1Results = searchIndianEVs(make1, model1);
    if (v1Results.length === 0) v1Results = await fetchFromAPINinjas(make1, model1);

    let v2Results = searchIndianEVs(make2, model2);
    if (v2Results.length === 0) v2Results = await fetchFromAPINinjas(make2, model2);

    if (v1Results.length === 0 || v2Results.length === 0) {
      const missing = [];
      if (v1Results.length === 0) missing.push(`${make1} ${model1 || ''}`.trim());
      if (v2Results.length === 0) missing.push(`${make2} ${model2 || ''}`.trim());
      return res.status(404).json({
        success: false,
        message: `Could not find: ${missing.join(' and ')}. Try Tata, Mahindra, MG, Ola, Ather (India) or Tesla, Hyundai, Kia, BMW, Audi (Global).`
      });
    }

    console.log(`⚖️ EV Compare: ${make1} ${model1 || ''} vs ${make2} ${model2 || ''}`);
    res.json({ success: true, vehicle1: v1Results[0], vehicle2: v2Results[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/ev/brands', (req, res) => {
  const indianBrands = [...new Set(INDIAN_EV_DATABASE.map(v => v.make))];
  res.json({
    success: true, indian: indianBrands,
    global: ['Tesla', 'Hyundai', 'Kia', 'BMW', 'Audi', 'Nissan', 'Volkswagen', 'Volvo', 'Toyota', 'Ford'],
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ TataEV API running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    assistant: {
      mode: MISTRAL_API_KEY ? 'mistral' : 'local',
      mistralConfigured: Boolean(MISTRAL_API_KEY),
    },
    timestamp: new Date(),
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 TataEV Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   POST /api/auth/register       → Register user`);
  console.log(`   POST /api/auth/login          → Login user`);
  console.log(`   POST /api/enquiry             → Save contact form`);
  console.log(`   POST /api/bookings            → Save test ride booking (+ n8n)`);
  console.log(`   POST /api/chat                → Chatbot messages`);
  console.log(`   GET  /api/ev/search           → Search EVs (Indian + global)`);
  console.log(`   GET  /api/ev/compare          → Compare 2 EVs`);
  console.log(`   GET  /api/analytics/dashboard → Dashboard stats`);
  console.log(`   GET  /api/health              → Health check\n`);
});
