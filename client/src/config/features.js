import { SHAPES } from '../design-studio/blueprint';

/** Release switches for capabilities that remain supported by the design engines. */
export const features = Object.freeze({
  materials: Object.freeze({
    hybridJellyRenderer: Object.freeze({ enabled: true }),
  }),
  shapes: Object.freeze({
    duck: Object.freeze({ enabled: false }),
  }),
});

export const USER_FACING_NAIL_SHAPES = Object.freeze(
  SHAPES.filter((shape) => shape !== 'Duck' || features.shapes.duck.enabled),
);
