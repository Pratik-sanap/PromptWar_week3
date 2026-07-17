/**
 * Constants and configuration values for the FIFA 2026 Smart Stadium Concierge Frontend.
 */

// Available Languages configuration
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

// Available Stadium Zones configuration
export const ZONES = [
  { id: 'zone_a', label: 'Zone A - North Gate / Ramp access' },
  { id: 'zone_b', label: 'Zone B - East Seating' },
  { id: 'zone_c', label: 'Zone C - South Concourse' },
  { id: 'zone_d', label: 'Zone D - West Seating' },
  { id: 'zone_e', label: 'Zone E - Premium Suite' },
  { id: 'zone_f', label: 'Zone F - Press Box & Pitchside' },
];

// API endpoint URL for backend chat interactions
export const CHAT_API_URL = '/api/chat';

// Network request timeout in milliseconds
export const API_TIMEOUT = 20000;

// Delay in milliseconds for simulating network response in mock mode
export const MOCK_DELAY = 1000;
