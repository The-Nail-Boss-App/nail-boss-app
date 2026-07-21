import React from 'react';
import { signatureNailStyles as styles } from './signatureNailStyles';

const DEFAULT_SIZE = 220;
export const SUPPORTED_NAIL_SHAPES = ['almond', 'coffin', 'square', 'oval', 'round', 'stiletto'];

const defaultDesign = {
  title: 'Signature Nail™',
  subtitle: 'A premium artist identity asset for the Nail Shop public shell.',
  shape: 'almond',
  image: '',
  colors: ['#fff1d0', '#c88a96', '#6e123f', '#24071c', '#8f1b4b', '#f5d38f'],
  accentLabel: 'Soft gold detail',
};

function normalizeShape(shape) {
  return SUPPORTED_NAIL_SHAPES.includes(shape) ? shape : defaultDesign.shape;
}

export default function SignatureNail({
  design = defaultDesign,
  title,
  subtitle,
  size = DEFAULT_SIZE,
}) {
  const resolvedSize = Number.isFinite(Number(size)) ? Number(size) : DEFAULT_SIZE;
  const resolvedDesign = { ...defaultDesign, ...design };
  const resolvedShape = normalizeShape(resolvedDesign.shape);
  const resolvedTitle = title || resolvedDesign.title;
  const resolvedSubtitle = subtitle || resolvedDesign.subtitle;

  return (
    <figure
      aria-label={`${resolvedTitle} ${resolvedShape} signature nail`}
      style={styles.frame(resolvedSize)}
      data-testid="signature-nail"
      data-size={resolvedSize}
      data-shape={resolvedShape}
    >
      <div style={styles.stage(resolvedSize)} aria-label={`${resolvedShape} nail visual on transparent background`}>
        <div style={styles.aura} aria-hidden="true" />
        {resolvedDesign.image ? (
          <img
            src={resolvedDesign.image}
            alt={`${resolvedTitle} approved nail design avatar`}
            loading="eager"
            decoding="async"
            style={styles.approvedImage(resolvedSize)}
            data-testid={`signature-nail-shape-${resolvedShape}`}
          />
        ) : (
          <div style={styles.nail(resolvedSize, resolvedShape, resolvedDesign.colors)} data-testid={`signature-nail-shape-${resolvedShape}`}>
            <div style={styles.goldEdge} aria-hidden="true" />
            <div style={styles.reflection} aria-hidden="true" />
          </div>
        )}
      </div>
      <figcaption style={styles.text}>
        <p style={styles.eyebrow}>Signature Nail™</p>
        <h2 style={styles.title}>{resolvedTitle}</h2>
        <p style={styles.subtitle}>{resolvedSubtitle}</p>
        <p style={styles.shapeLabel}>{resolvedShape} shape · {resolvedDesign.accentLabel}</p>
      </figcaption>
    </figure>
  );
}
