import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MoneyDisplay } from './money-display';

describe('MoneyDisplay', () => {
  it('formats cents to EUR correctly', () => {
    render(<MoneyDisplay cents={1250} />);
    expect(screen.getByText('12,50 €')).toBeInTheDocument();
  });

  it('formats zero correctly', () => {
    render(<MoneyDisplay cents={0} />);
    expect(screen.getByText('0,00 €')).toBeInTheDocument();
  });

  it('formats large amounts correctly', () => {
    render(<MoneyDisplay cents={100000} />);
    expect(screen.getByText('1.000,00 €')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MoneyDisplay cents={500} className="text-red-500" />);
    expect(container.firstChild).toHaveClass('text-red-500');
  });
});
