import { format, Locale } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export class DateUtils {
  private static userTimezone: string = 'UTC';
  private static dateLocale: Locale | undefined;

  static setUserTimezone(timezone: string) {
    this.userTimezone = timezone;
  }

  static setUserLocale(locale: Locale) {
    this.dateLocale = locale;
  }

  static getUserTimezone(): string {
    return this.userTimezone;
  }

  /**
   * Format a date in the user's timezone
   */
  static formatInUserTimezone(
    date: Date | string,
    formatString: string = 'yyyy-MM-dd HH:mm'
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const zonedDate = toZonedTime(dateObj, this.userTimezone);
    
    return format(zonedDate, formatString, {
      locale: this.dateLocale,
    });
  }

  /**
   * Convert a date from user's timezone to UTC for storage
   */
  static toUTC(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return fromZonedTime(dateObj, this.userTimezone);
  }

  /**
   * Convert UTC date to user's timezone for display
   */
  static fromUTC(utcDate: Date | string): Date {
    const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return toZonedTime(dateObj, this.userTimezone);
  }

  /**
   * Format a relative time (like "2 hours ago")
   */
  static formatRelative(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const zonedDate = toZonedTime(dateObj, this.userTimezone);
    const now = toZonedTime(new Date(), this.userTimezone);
    
    const diffInMs = now.getTime() - zonedDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return this.formatInUserTimezone(date, 'MMM d, yyyy');
  }

  /**
   * Get list of common timezones
   */
  static getTimezones() {
    return [
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'Europe/London', label: 'London (GMT)' },
      { value: 'Europe/Paris', label: 'Paris (CET)' },
      { value: 'Europe/Berlin', label: 'Berlin (CET)' },
      { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
      { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
      { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
    ];
  }
}