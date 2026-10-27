import { formatWarrantyRemaining } from './warrantyFormatters';

test('formats warranties under one year in days', () => {
  expect(formatWarrantyRemaining(1)).toBe('1d left');
  expect(formatWarrantyRemaining(364)).toBe('364d left');
});

test('formats warranties of one year or more in years', () => {
  expect(formatWarrantyRemaining(365)).toBe('1 year left');
  expect(formatWarrantyRemaining(500)).toBe('1.4 years left');
  expect(formatWarrantyRemaining(30283)).toBe('83 years left');
});

test('handles expired and unavailable warranties', () => {
  expect(formatWarrantyRemaining(0)).toBe('Expired');
  expect(formatWarrantyRemaining(-1)).toBe('Expired');
  expect(formatWarrantyRemaining(null)).toBeNull();
});
