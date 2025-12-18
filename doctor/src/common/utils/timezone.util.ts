/**
 * Timezone Utility
 * Provides consistent date/time formatting for Vietnam timezone (UTC+7)
 * 
 * Context:
 * - TypeORM stores Date objects in MySQL as datetime (without timezone)
 * - When reading from DB, TypeORM returns Date objects in UTC
 * - We need to convert UTC back to Vietnam time (UTC+7) for API responses
 */

const VIETNAM_TIMEZONE_OFFSET = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

/**
 * Convert UTC Date to Vietnam timezone Date
 * @param date - UTC Date object
 * @returns Date object adjusted to Vietnam timezone (UTC+7)
 */
export function toVietnamTime(date: Date): Date {
  return new Date(date.getTime() + VIETNAM_TIMEZONE_OFFSET);
}

/**
 * Format Date to Vietnam timezone string: YYYY-MM-DD HH:mm:ss
 * @param date - UTC Date object from database
 * @returns Formatted string in Vietnam timezone
 * 
 * @example
 * // DB has: 2025-12-01 01:00:00 (stored as UTC)
 * // Returns: "2025-12-01 08:00:00" (Vietnam time)
 */
export function formatToVietnamDateTime(date: Date): string {
  const vnDate = toVietnamTime(date);
  return vnDate.toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
}

/**
 * Format Date to Vietnam timezone date only: YYYY-MM-DD
 * @param date - UTC Date object from database
 * @returns Formatted date string in Vietnam timezone
 */
export function formatToVietnamDate(date: Date): string {
  const vnDate = toVietnamTime(date);
  return vnDate.toISOString().split('T')[0];
}

/**
 * Format Date to Vietnam timezone time only: HH:mm:ss
 * @param date - UTC Date object from database
 * @returns Formatted time string in Vietnam timezone
 */
export function formatToVietnamTime(date: Date): string {
  const vnDate = toVietnamTime(date);
  return vnDate.toISOString().split('T')[1].split('.')[0];
}

/**
 * Create a Date object for Vietnam timezone
 * Useful for seeding data or creating appointments
 * 
 * @param dateString - Date string in format: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
 * @returns Date object that represents the Vietnam local time
 * 
 * @example
 * createVietnamDate('2025-12-01 08:00:00')
 * // Creates a Date that will be stored in DB as 08:00:00 Vietnam time
 */
export function createVietnamDate(dateString: string): Date {
  const parts = dateString.replace(/[T\-:]/g, ' ').split(' ').map(Number);
  const [year, month, day, hour = 0, minute = 0, second = 0] = parts;
  
  // Create date in local timezone
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Check if a date is in the past (Vietnam timezone)
 * @param date - Date to check
 * @returns true if date is in the past
 */
export function isPastVietnamTime(date: Date): boolean {
  const now = new Date();
  const vnNow = toVietnamTime(now);
  const vnDate = toVietnamTime(date);
  return vnDate < vnNow;
}

/**
 * Format Date to ISO string with Vietnam timezone offset
 * @param date - UTC Date object from database
 * @returns ISO string with +07:00 timezone
 * 
 * @example
 * // Returns: "2025-12-01T08:00:00+07:00"
 */
export function toVietnamISO(date: Date): string {
  const vnDate = toVietnamTime(date);
  const isoString = vnDate.toISOString();
  // Replace Z with +07:00
  return isoString.replace('Z', '+07:00');
}