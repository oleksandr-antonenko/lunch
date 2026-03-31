export function MoneyDisplay({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

  return <span className={className}>{formatted}</span>;
}
