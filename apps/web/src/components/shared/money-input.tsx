'use client';

import { useState, useCallback } from 'react';
import { Input } from '@web/components/ui/input';

export function MoneyInput({
  value,
  onChange,
  className,
  placeholder = '0.00',
}: {
  value: number;
  onChange: (cents: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState(() =>
    value ? (value / 100).toFixed(2) : '',
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;
      // Allow comma as decimal separator
      raw = raw.replace(',', '.');
      // Remove non-numeric except dot
      raw = raw.replace(/[^0-9.]/g, '');
      // Only one dot
      const parts = raw.split('.');
      if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
      // Max 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        raw = parts[0] + '.' + parts[1].slice(0, 2);
      }

      setDisplay(raw);
      const cents = Math.round(parseFloat(raw || '0') * 100);
      if (!isNaN(cents)) onChange(cents);
    },
    [onChange],
  );

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        €
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-7 ${className ?? ''}`}
      />
    </div>
  );
}
