/**
 * src/models/CrossingLog.ts
 *
 * Re-exports from the unified Logs.ts barrel.
 * The canonical schema definition lives in Logs.ts.
 * This file is kept for backward import compatibility
 * with existing route handlers that import:
 *   import CrossingLog from '@/src/models/CrossingLog'
 */
export { CrossingLog as default } from './Logs';
