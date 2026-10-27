export const formatWarrantyRemaining = (daysRemaining) => {
  if (daysRemaining === null || daysRemaining === undefined) return null;
  if (daysRemaining <= 0) return 'Expired';
  if (daysRemaining < 365) return `${daysRemaining}d left`;

  const years = Number((daysRemaining / 365).toFixed(1));
  return `${years} ${years === 1 ? 'year' : 'years'} left`;
};
