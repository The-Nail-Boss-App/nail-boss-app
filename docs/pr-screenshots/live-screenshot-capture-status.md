# Live Screenshot Capture Status

Live screenshots from the rendered React application were requested for visual QA. I did **not** add replacement mockups.

## What was verified

- The AnitaSet app can be started locally when `ANITASET_TEST_DB_FILE` is provided.
- The local server responded successfully at `http://localhost:4000`.
- No browser binary is available in this container for screenshot capture.
- Installing a browser or browser automation package is blocked by the environment/proxy policy.

## Screenshot status

Real screenshots could **not** be captured in this environment. This PR is ready for manual visual review by running the app locally and capturing the requested screens from a real browser.

## Manual visual QA targets

- [ ] Design Studio - Single Nail Mode
- [ ] Design Studio - Full Set Mode
- [ ] Design Studio - Focus Mode
- [ ] Design Layers Panel
- [ ] Template Toolbar
- [ ] Polish Studio
- [ ] Nail Shop™
- [ ] Storefront Editor / Nail Shop™ editor
- [ ] Signature Nail™ profile system

## Manual review checklist

- [ ] Design Template occupies ~60% of workspace.
- [ ] Full Set Mode uses the hero canvas instead of thumbnail cards.
- [ ] Marble workspace matches the approved North Star.
- [ ] Layers panel is a true layer stack.
- [ ] Sticker Studio terminology is used everywhere.
- [ ] Signature Nail™ replaces selfies/logos.
- [ ] Nail Shop™ terminology replaces Storefront.
