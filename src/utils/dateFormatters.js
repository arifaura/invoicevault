const parseDateValue = (value) => {
  if (!value) return null;

  const dateOnly = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    if (
      date.getUTCFullYear() !== Number(year)
      || date.getUTCMonth() !== Number(month) - 1
      || date.getUTCDate() !== Number(day)
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateWithWeekday = (value, locale = 'en-IN') => {
  const date = parseDateValue(value);
  if (!date) return 'N/A';

  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export const getDateTimestamp = (value) => {
  const date = parseDateValue(value);
  return date ? date.getTime() : null;
};
