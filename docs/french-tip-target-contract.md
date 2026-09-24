# French Tip “Apply To” contract

Future compatible creative tools should present **Apply To** with **Whole Nail**
and **French Tip** choices. They can call `frenchTipTargetRegion(data, surface)`
to query French Tip availability and obtain a frozen, read-only region containing
the canonical nail clip and current French Tip path.

When the function returns `null`, a tool must not silently apply to French Tip.
Its future UI should keep Whole Nail available and may offer `+ Add French Tip`.
The feature must not create French Tip geometry, mutate French Tip settings, or
persist a copy of the region. It should recalculate the handoff from current data
and the active Hero surface whenever either changes.

This package intentionally does not add Apply To controls to Marble, Ombré,
Chrome, Patterns, Aura, Cat Eye, Color Block, or any other creative feature.
