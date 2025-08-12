export const BACKEND_BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE
    : process.env.API_BASE ?? 'http://localhost:3000';
// In production set VITE_API_BASE="/api"

export const FOOTBALL_ENDPOINT = '/api/football';