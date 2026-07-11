import React from 'react';
import { render, screen } from '@testing-library/react';
import SignatureNail from './SignatureNail';

describe('SignatureNail', () => {
  it('renders the Signature Nail artist identity placeholder', () => {
    render(<SignatureNail />);

    expect(screen.getByTestId('signature-nail')).toBeInTheDocument();
    expect(screen.getByText('Signature Nail™')).toBeInTheDocument();
  });

  it('contains custom title and subtitle copy', () => {
    render(<SignatureNail title="Signature Nail™ Atelier" subtitle="Editorial black cherry jewelry for the artist identity." />);

    expect(screen.getByText('Signature Nail™ Atelier')).toBeInTheDocument();
    expect(screen.getByText('Editorial black cherry jewelry for the artist identity.')).toBeInTheDocument();
  });

  it('accepts a size prop', () => {
    render(<SignatureNail size={180} />);

    expect(screen.getByTestId('signature-nail')).toHaveAttribute('data-size', '180');
  });
});
