export function formatCurrency(amount, currency = 'FCFA') {
  const n = parseFloat(amount) || 0;
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

export function formatDate(date, options = {}) {
  return new Date(date).toLocaleDateString('fr-FR', options);
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('fr-FR');
}

export function formatPercent(value) {
  const n = parseFloat(value) || 0;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}
