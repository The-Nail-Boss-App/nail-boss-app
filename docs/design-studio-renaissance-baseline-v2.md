# Design Studio Renaissance Baseline v2.0

## Founder review scope

DSR-001 freezes the synchronized Design Studio as the Founder Review baseline. It does not introduce a redesign, restyle the workspace, or change the saved blueprint format.

The repository audit found that the active application already mounts the latest modular implementation from `client/src/design-studio/DesignStudio.jsx`. The root `client/src/DesignStudio.jsx` is an intentional compatibility export rather than a duplicate implementation. The older `FullSetRenderer` and `NailPreview` remain in use outside the editor and are therefore preserved.

## Synchronized implementation

- The Studio Shell continues to use the current three-column workspace, Artist Command Bar, Nail Design Template, studio drawer, Nail Stack, and Studio Dock.
- Single Nail, Left Hand, Right Hand, Full Set, and Focus Perspective continue to share the current blueprint and active-nail state.
- Shape, length, width, polish color, HEX, polish type, techniques, brush drawing, assets, top coat choices, and layers remain connected to the current editor state.
- Sticker Studio now exposes the existing working decal assets instead of obsolete placeholder shelves. Charm Studio continues to expose the shared charm, jewel, and decal library.
- The empty Vendor Collections block and two explicitly placeholder top-coat choices were removed. No working control or persisted data was removed.
- Save Version, autosave, Saved Designs, the Collection-based Product Templates contract, Signature Looks, and proposal design selection remain on their existing paths.

## Preserved integration paths

- **Save Design:** Design Studio continues to create and update `/api/designs` records and editable blueprint documents.
- **Product Templates:** the existing Collection assignment remains the studio's Product Templates classification contract.
- **Proposal integration:** Proposals continue to select saved designs by `designId` and build proposal snapshots from the selected design.
- **Compatibility:** legacy flat design fields and the root Design Studio export remain intact for existing callers.

## Known issues retained for Founder review

- Chrome, Cat Eye, Marble, and Texture technique launchers still display the existing reserved-controls message; implementing them would be new workflow work rather than repository synchronization.
- Several Top Coat labels retain the existing shared polish-type behavior instead of distinct persisted finish data.
- Workspace memory for zoom, selected polish, drawer state, perspective, and selected nail is documented in source but is not yet persisted across sessions.
- Rotate Template remains reserved for a future template-transform pass.

These items are intentionally recorded rather than redesigned or expanded in DSR-001.
