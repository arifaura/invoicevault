import { formatDateWithWeekday, getDateTimestamp } from './dateFormatters';

test('formats date-only values with the correct weekday across years', () => {
  expect(formatDateWithWeekday('2024-01-01', 'en-US')).toContain('Mon');
  expect(formatDateWithWeekday('2025-01-01', 'en-US')).toContain('Wed');
});

test('formats leap-day dates and rejects invalid calendar dates', () => {
  expect(formatDateWithWeekday('2024-02-29', 'en-US')).toContain('Thu');
  expect(formatDateWithWeekday('2023-02-29', 'en-US')).toBe('N/A');
});

test('parses date-only values without local timezone shifts', () => {
  expect(getDateTimestamp('2024-01-01')).toBe(Date.UTC(2024, 0, 1));
  expect(getDateTimestamp('not-a-date')).toBeNull();
});
