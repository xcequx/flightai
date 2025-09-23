import i18n from '../i18n';

/**
 * Locale-aware formatting utilities that adapt to the current language
 */

/**
 * Get the appropriate locale based on the current language
 */
export function getCurrentLocale(): string {
  const language = i18n.resolvedLanguage || i18n.language || 'pl';
  return language === 'pl' ? 'pl-PL' : 'en-US';
}

/**
 * Get the appropriate currency based on the current language
 */
export function getCurrentCurrency(): string {
  const language = i18n.resolvedLanguage || i18n.language || 'pl';
  return language === 'pl' ? 'PLN' : 'USD';
}

/**
 * Format currency with locale-aware formatting
 */
export function formatCurrency(amount: number): string {
  const locale = getCurrentLocale();
  const currency = getCurrentCurrency();
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'PLN' ? 0 : 2
  }).format(amount);
}

/**
 * Format number with locale-aware formatting
 */
export function formatNumber(number: number): string {
  const locale = getCurrentLocale();
  
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Format percentage with locale-aware formatting
 */
export function formatPercentage(percentage: number): string {
  const locale = getCurrentLocale();
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(percentage / 100);
}

/**
 * Format date with locale-aware formatting
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const locale = getCurrentLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const locale = getCurrentLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour');
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day');
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return rtf.format(-diffInMonths, 'month');
}

/**
 * Format duration in a locale-aware way (hours and minutes)
 */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const locale = getCurrentLocale();
  const language = i18n.resolvedLanguage || i18n.language || 'pl';
  
  if (language === 'pl') {
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  } else {
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }
}