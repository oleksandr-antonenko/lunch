import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders status text with underscores replaced', () => {
    render(<StatusBadge status="RECEIPT_UPLOADED" />);
    expect(screen.getByText('RECEIPT UPLOADED')).toBeInTheDocument();
  });

  it('renders OPEN status', () => {
    render(<StatusBadge status="OPEN" />);
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('renders CLOSED status', () => {
    render(<StatusBadge status="CLOSED" />);
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
  });

  it('renders PENDING status', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });
});
