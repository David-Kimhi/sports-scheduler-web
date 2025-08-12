export const BACKEND_BASE =
import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'; // dev fallback
// In production set VITE_API_BASE="/api"
export const FOOTBALL_ENDPOINT = '/api/football';