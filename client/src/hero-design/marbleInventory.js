// Canonical generated inventory shared by the Marble generator and set mapper.
// Keep structural coordination constrained to identities the renderer creates.
export const GENERATED_MARBLE_STREAM_COUNTS = Object.freeze({ diffusion: 2, primary: 2, secondary: 4, hairline: 5 });

export const GENERATED_MARBLE_STREAM_IDS = Object.freeze(Object.fromEntries(
  Object.entries(GENERATED_MARBLE_STREAM_COUNTS).map(([veinClass, count]) => [veinClass, Object.freeze(Array.from({ length: count }, (_, index) => `${veinClass}-${index}`))]),
));

export const RENDERABLE_GENERATED_MARBLE_STREAM_IDS = Object.freeze(Object.values(GENERATED_MARBLE_STREAM_IDS).flat());
