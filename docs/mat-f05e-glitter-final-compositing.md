# MAT-F05E Glitter final compositing

Glitter remains an exclusive `GlitterMaterial` render route. Its final paint
order is:

1. opaque Glitter base pigment;
2. Cream-family curvature and edge-depth foundation;
3. softly blurred embedded flecks;
4. sharp surface-near flecks;
5. rare specular flecks;
6. restrained Glitter-local reflections and top coat;
7. post-material Hero apex, primary, and edge lighting attenuated by the same
   opaque-polish response function used by Cream, including its Shine input;
8. the existing final Hero edge/form treatment.

Hero lighting remains present, but Glitter now uses
`creamHeroSurfaceResponse(shine)` rather than the raw Solid response. At the
audited raw primary/apex inputs (`.442`/`.399`), Shine 68% resolves to about
`.0327` primary and `.0428` apex. Shine 0% resolves to about `.0177` primary and
`.0319` apex; Shine 100% resolves to about `.0398` and `.0479`. Thus Shine
changes the final composite while its low setting retains dimensional form.

The deterministic reservoir remains 2,000 particles, exposed by density as
0/500/1,000/1,500/2,000. Its 90% micro population now uses radii `.20-.42`
renderer units. Small and medium radii remain proportionally separated at
`.50-.84` and `.90-1.28`. Depth remains approximately 68% embedded, 30.5%
surface-near, and 1.5% specular; embedded opacity and `.24` blur are unchanged.

Coordinates are now sampled inside a conservative normalized nail envelope
before the existing Hero path clip. This reduces particles wasted in the old
rectangular corners without bypassing or changing any authoritative shape mask.
Cream's response function was not recalibrated. Jelly and Matte routing and
responses were not changed.
