/**
 * src/models/TreatmentLog.ts
 *
 * Re-exports from the unified Logs.ts barrel.
 * The canonical schema definition (with safeDateParse, tag_id index,
 * start/end date structural validation) lives in Logs.ts.
 * This file is kept for backward import compatibility
 * with existing route handlers that import:
 *   import TreatmentLog from '@/src/models/TreatmentLog'
 */
export { TreatmentLog as default } from './Logs';
