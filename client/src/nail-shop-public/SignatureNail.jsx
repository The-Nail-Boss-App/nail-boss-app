import React from 'react';
import { signatureNailStyles as styles } from './signatureNailStyles';

const DEFAULT_TITLE = 'Signature Nail™';
const DEFAULT_SUBTITLE = 'A premium artist identity placeholder for the Nail Shop public shell.';
const DEFAULT_SIZE = 220;

export default function SignatureNail({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  size = DEFAULT_SIZE,
}) {
  const resolvedSize = Number.isFinite(Number(size)) ? Number(size) : DEFAULT_SIZE;

  return (
    <figure aria-label="Signature Nail artist identity" style={styles.frame(resolvedSize)} data-testid="signature-nail" data-size={resolvedSize}>
      <div style={styles.stage(resolvedSize)} aria-hidden="true">
        <div style={styles.aura} />
        <div style={styles.nail(resolvedSize)}>
          <div style={styles.goldEdge} />
          <div style={styles.reflection} />
        </div>
      </div>
      <figcaption style={styles.text}>
        <p style={styles.eyebrow}>Artist Identity</p>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.subtitle}>{subtitle}</p>
      </figcaption>
    </figure>
  );
}
