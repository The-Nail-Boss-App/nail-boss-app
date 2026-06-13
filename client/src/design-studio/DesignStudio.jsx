import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { COLORS, S } from "../styles.js";
import NailCanvas from "./NailCanvas.jsx";
import AssetLibrary from "./AssetLibrary.jsx";
import LayersPanel from "./LayersPanel.jsx";
import PropertiesPanel from "./PropertiesPanel.jsx";
import DrawingToolbar from "./DrawingToolbar.jsx";
import FullSetPreview from "./FullSetPreview.jsx";
import BulkActionsPanel from "./BulkActionsPanel.jsx";
import { UI } from "./studioStyles.js";
import {
  DEFAULT_ACTIVE_SLOT,
  EFFECTS,
  FULL_SET_SLOTS,
  LEFT_HAND_SLOTS,
  RIGHT_HAND_SLOTS,
  SHAPES,
  STYLE_CATEGORIES,
  addLayerToBlueprint,
  addStrokeToDrawingLayer,
  summarizeFullSetAssets,
  setActiveNailBySlot,
  resetNailDesign,
  mirrorHandDesign,
  ensureFullSetBlueprint,
  createFullSetBlueprint,
  copyNailToSlots,
  cloneNailDesign,
  applyBaseToSlots,
  assetLayer,
  clamp,

  flatDesignFromBlueprint,
  getActiveNail,
  gradientLayer,
  isReusableDrawingLayer,
  normalizeHex,
  normalizeTags,
  patternLayer,
  pushHistory,
  renumberLayers,
  restoreHistorySnapshot,
  safeTransform,
  revalidateLayersAfterNailResize,
  synchronizeBase,
  uid,
  updateActiveNail,
} from "./blueprint.js";

function Field({ label, children }) {
  return <div style={UI.field}><label style={S.label}>{label}</label>{children}</div>;
}

function ColorInput({ value, onChange }) {
  return <div style={{ display: "flex", gap: 8 }}><input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 44, height: 42, border: `1px solid ${COLORS.border}`, borderRadius: 10, background: "transparent" }}/><input style={{ ...S.input, fontFamily: "monospace" }} value={value} maxLength={7} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value.toUpperCase())}/></div>;
}

function layerById(nail, id) {
  return nail?.layers?.find((layer) => layer.id === id) || null;
}

const MAX_BLUEPRINT_JSON_BYTES = 100 * 1024;
const BLUEPRINT_WARNING_BYTES = Math.floor(MAX_BLUEPRINT_JSON_BYTES * 0.85);

function utf8ByteLength(value) {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return unescape(encodeURIComponent(value)).length;
}

function serializedBlueprintSize(blueprint) {
  return utf8ByteLength(JSON.stringify(blueprint));
}

function blueprintSizeMessage(bytes) {
  const kb = Math.round(bytes / 1024);
  const maxKb = Math.round(MAX_BLUEPRINT_JSON_BYTES / 1024);
  return `Blueprint is ${kb}KB; AnitaSet supports up to ${maxKb}KB per editable design.`;
}

function DesignStudio(_, ref) {
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designName, setDesignName] = useState("");
  const [blueprint, setBlueprint] = useState(() => createFullSetBlueprint());
  const [selectedLayerId, setSelectedLayerId] = useState("base-layer");
  const [mode, setMode] = useState("select");
  const [brush, setBrush] = useState({ tool: "solid", colorHex: "#FFFFFF", size: 5, opacity: 1 });
  const [history, setHistory] = useState({ past: [], future: [] });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "Ready" });
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("assets");
  const [clipboardNail, setClipboardNail] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [saveStatus, setSaveStatus] = useState("Ready");
  const autosaveTimerRef = useRef(null);
  const savingRef = useRef(false);
  const queuedAutosaveRef = useRef(false);
  const saveSequenceRef = useRef(0);
  const editGenerationRef = useRef(0);
  const activeSavePromiseRef = useRef(null);
  const generatedNameCounterRef = useRef(1);
  const generatedDraftNameRef = useRef("");
  const dirtyRef = useRef(false);
  const blueprintRef = useRef(null);
  const selectedDesignIdRef = useRef("");
  const designNameRef = useRef("");
  const dragStartBlueprintRef = useRef(null);

  const activeNail = getActiveNail(blueprint);
  const selectedLayer = useMemo(() => layerById(activeNail, selectedLayerId), [activeNail, selectedLayerId]);
  const baseLayer = activeNail.layers.find((layer) => layer.type === "base");
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const activeSlot = activeNail.slot || DEFAULT_ACTIVE_SLOT;
  const productSummary = useMemo(() => summarizeFullSetAssets(blueprint), [blueprint]);

  useEffect(() => { loadDesigns(); }, []);
  useEffect(() => { dirtyRef.current = dirty; blueprintRef.current = blueprint; selectedDesignIdRef.current = selectedDesignId; designNameRef.current = designName; }, [dirty, blueprint, selectedDesignId, designName]);
  useEffect(() => () => { if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current); }, []);
  useEffect(() => {
    function onVisibilityChange() { if (document.visibilityState === "hidden" && dirtyRef.current) void save({ autosave: true, immediate: true }); }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    function onBeforeUnload(event) {
      if (!dirtyRef.current) return undefined;
      event.preventDefault();
      event.returnValue = "";
      return "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useImperativeHandle(ref, () => ({
    hasDirtyWork: () => dirtyRef.current,
    async prepareToLeave() {
      return guardReplacement();
    },
  }));

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3600);
  }

  async function loadDesigns() {
    setLoading(true);
    try {
      const res = await fetch("/api/designs");
      if (!res.ok) throw new Error("Unable to load saved designs.");
      const data = await res.json();
      setDesigns(Array.isArray(data) ? data : []);
      setStatus({ type: "idle", message: "Saved designs loaded" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function markEdited() {
    editGenerationRef.current += 1;
  }

  function commit(nextBlueprint, { selectLayerId = selectedLayerId, noticeMessage = "" } = {}) {
    markEdited();
    const normalized = ensureFullSetBlueprint(nextBlueprint);
    setHistory((prev) => pushHistory(prev, blueprint));
    blueprintRef.current = normalized;
    dirtyRef.current = true;
    setBlueprint(normalized);
    setSelectedLayerId(selectLayerId);
    setDirty(true);
    setStatus({ type: "dirty", message: "Unsaved changes" });
    setSaveStatus("Unsaved changes");
    scheduleAutosave();
    if (noticeMessage) showNotice(noticeMessage);
  }

  function replaceLoaded(nextBlueprint, design, message = "Blueprint loaded") {
    generatedDraftNameRef.current = "";
    const normalized = ensureFullSetBlueprint(nextBlueprint, design);
    blueprintRef.current = normalized;
    dirtyRef.current = false;
    setBlueprint(normalized);
    setDesignName(design?.name || "");
    setSelectedLayerId("base-layer");
    setHistory({ past: [], future: [] });
    setDirty(false);
    setStatus({ type: "idle", message });
    setSaveStatus("Ready");
  }

  function mergeSavedDesign(savedDesign) {
    if (!savedDesign?.id) return;
    setDesigns((prev) => {
      const withoutSaved = prev.filter((design) => design.id !== savedDesign.id);
      return [savedDesign, ...withoutSaved].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    });
  }

  async function confirmDiscardAfterFailedSave() {
    showNotice("Your changes could not be saved. Keep editing or discard changes and continue?");
    return window.confirm("Your changes could not be saved. Keep editing or discard changes and continue?");
  }

  async function guardReplacement() {
    if (!dirtyRef.current) return true;
    const result = await save({ autosave: true, immediate: true });
    if (result?.ok && editGenerationRef.current === result.savedRevision) return true;
    return confirmDiscardAfterFailedSave();
  }

  async function newDesign() {
    if (!(await guardReplacement())) return;
    setSelectedDesignId("");
    selectedDesignIdRef.current = "";
    replaceLoaded(createFullSetBlueprint(), { name: "" }, "New full-set design started");
  }

  async function loadDesign(designId) {
    if (!designId) return;
    if (!(await guardReplacement())) return;
    const design = designs.find((item) => item.id === designId);
    setLoading(true);
    try {
      const res = await fetch(`/api/designs/${designId}/blueprint`);
      if (!res.ok) throw new Error("Unable to load this design blueprint.");
      const data = await res.json();
      setSelectedDesignId(designId);
      selectedDesignIdRef.current = designId;
      replaceLoaded(data.document, design, `Loaded ${design?.name || "saved design"}`);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function updateBase(patch) {
    let next = synchronizeBase(blueprint, patch);
    if (patch.shape !== undefined || patch.length !== undefined || patch.width !== undefined) next = revalidateLayersAfterNailResize(next);
    if (patch.tags !== undefined) next = { ...next, metadata: { ...next.metadata, tags: normalizeTags(patch.tags) } };
    const before = JSON.stringify(getActiveNail(blueprint).layers.map((layer) => layer.transform));
    const after = JSON.stringify(getActiveNail(next).layers.map((layer) => layer.transform));
    commit(next, { noticeMessage: before !== after ? "Artwork was kept inside the updated nail boundary." : "" });
  }

  function patchLayer(layerId, patch, record = true) {
    const next = updateActiveNail(blueprint, (nail) => ({
      ...nail,
      layers: nail.layers.map((layer) => {
        if (layer.id !== layerId) return layer;
        const merged = { ...layer, ...patch, data: patch.data ? patch.data : layer.data };
        if (patch.transform) merged.transform = safeTransform(patch.transform, nail, layer.type);
        if (layer.type === "base") {
          merged.locked = true;
          merged.visible = true;
          merged.data = { ...layer.data, ...(patch.data || {}) };
        }
        return merged;
      }),
    }));
    if (record) commit(next, { selectLayerId: layerId });
    else {
      const normalized = ensureFullSetBlueprint(next);
      blueprintRef.current = normalized;
      setBlueprint(normalized);
    }
  }

  function transformLayer(layerId, transform, final, options = {}) {
    if (options.cancel) {
      dragStartBlueprintRef.current = null;
      if (transform) patchLayer(layerId, { transform }, false);
      return;
    }
    if (transform) {
      if (!dragStartBlueprintRef.current) dragStartBlueprintRef.current = blueprint;
      patchLayer(layerId, { transform }, false);
    }
    if (final) {
      const preDragBlueprint = dragStartBlueprintRef.current || blueprint;
      dragStartBlueprintRef.current = null;
      setHistory((prev) => pushHistory(prev, preDragBlueprint));
      markEdited();
      dirtyRef.current = true;
      setDirty(true);
      setStatus({ type: "dirty", message: "Unsaved changes" });
      setSaveStatus("Unsaved changes");
      scheduleAutosave();
    }
  }

  function addAsset(asset) {
    const layer = assetLayer(asset, activeNail);
    commit(addLayerToBlueprint(blueprint, layer), { selectLayerId: layer.id });
    setTab("properties");
  }

  function addGradient() {
    const layer = gradientLayer(activeNail);
    commit(addLayerToBlueprint(blueprint, layer), { selectLayerId: layer.id });
    setTab("properties");
  }

  function addPattern() {
    const layer = patternLayer(activeNail, "dots");
    commit(addLayerToBlueprint(blueprint, layer), { selectLayerId: layer.id });
    setTab("properties");
  }

  function addStroke(stroke) {
    const preferredLayerId = isReusableDrawingLayer(selectedLayer) ? selectedLayer.id : selectedLayerId;
    const result = addStrokeToDrawingLayer(blueprint, stroke, brush.tool, preferredLayerId);
    commit(result.blueprint, { selectLayerId: result.layerId });
  }

  function stageEraseStroke(point) {
    const drawing = isReusableDrawingLayer(selectedLayer) ? selectedLayer : activeNail.layers.find(isReusableDrawingLayer);
    if (!drawing) {
      showNotice("Select a visible unlocked drawing layer to erase strokes.");
      return null;
    }
    const strokes = drawing.data.strokes || [];
    if (!strokes.length) {
      showNotice("No visible strokes to erase on this layer.");
      return null;
    }
    let nearest = 0;
    let best = Infinity;
    strokes.forEach((stroke, i) => stroke.points.forEach((p) => {
      const distance = Math.hypot(p.x - point.x, p.y - point.y);
      if (distance < best) { best = distance; nearest = i; }
    }));
    return { layerId: drawing.id, strokeId: strokes[nearest]?.id || "", strokeIndex: nearest };
  }

  function eraseStroke(target) {
    if (!target?.layerId) return;
    const drawing = activeNail.layers.find((layer) => layer.id === target.layerId && isReusableDrawingLayer(layer));
    if (!drawing) return;
    const strokes = drawing.data.strokes || [];
    const strokeIndex = strokes.findIndex((stroke, index) => (target.strokeId ? stroke.id === target.strokeId : index === target.strokeIndex));
    if (strokeIndex < 0) return;
    const nextStrokes = strokes.filter((_, index) => index !== strokeIndex);
    patchLayer(drawing.id, { data: { ...drawing.data, strokes: nextStrokes } });
  }

  function deleteLayer(layerId = selectedLayerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base" || layer.locked) return;
    const next = updateActiveNail(blueprint, (nail) => ({ ...nail, layers: renumberLayers(nail.layers.filter((item) => item.id !== layerId)) }));
    commit(next, { selectLayerId: "base-layer" });
  }

  function duplicateLayer(layerId = selectedLayerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base" || layer.locked) return;
    const copy = { ...layer, id: uid(layer.type), name: `${layer.name} copy`, locked: false, transform: safeTransform({ ...layer.transform, x: layer.transform.x + 0.06, y: layer.transform.y + 0.06 }, activeNail, layer.type), data: { ...layer.data }, order: activeNail.layers.length };
    commit(addLayerToBlueprint(blueprint, copy), { selectLayerId: copy.id });
  }

  function moveLayer(layerId, direction) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base") return;
    const next = updateActiveNail(blueprint, (nail) => {
      const layers = [...nail.layers].sort((a, b) => a.order - b.order);
      const index = layers.findIndex((item) => item.id === layerId);
      const target = clamp(index + direction, 1, layers.length - 1);
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return { ...nail, layers: renumberLayers(layers) };
    });
    commit(next, { selectLayerId: layerId });
  }

  function toggleVisible(layerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base") return;
    patchLayer(layerId, { visible: !layer.visible });
  }

  function toggleLock(layerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base") return;
    patchLayer(layerId, { locked: !layer.locked });
  }

  function markHistoryMutation(message) {
    markEdited();
    dirtyRef.current = true;
    setDirty(true);
    setStatus({ type: "dirty", message });
    setSaveStatus("Unsaved changes");
    scheduleAutosave();
  }

  function undo() {
    if (!canUndo) return;
    const current = JSON.stringify(blueprint);
    const snapshot = history.past[history.past.length - 1];
    const restored = restoreHistorySnapshot(snapshot);
    blueprintRef.current = restored;
    dirtyRef.current = true;
    setBlueprint(restored);
    setHistory({ past: history.past.slice(0, -1), future: [current, ...history.future].slice(0, 50) });
    markHistoryMutation("Undo applied");
  }

  function redo() {
    if (!canRedo) return;
    const current = JSON.stringify(blueprint);
    const snapshot = history.future[0];
    const restored = restoreHistorySnapshot(snapshot);
    blueprintRef.current = restored;
    dirtyRef.current = true;
    setBlueprint(restored);
    setHistory({ past: [...history.past, current].slice(-50), future: history.future.slice(1) });
    markHistoryMutation("Redo applied");
  }

  function scheduleAutosave() {
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => { void save({ autosave: true }); }, 20000);
  }

  function generatedUntitledName() {
    if (generatedDraftNameRef.current) return generatedDraftNameRef.current;
    const existing = new Set(designs.map((design) => design.name));
    let name = `Untitled Set ${generatedNameCounterRef.current}`;
    while (existing.has(name)) name = `Untitled Set ${++generatedNameCounterRef.current}`;
    generatedDraftNameRef.current = name;
    return name;
  }

  async function save(options = {}) {
    if (savingRef.current) {
      queuedAutosaveRef.current = queuedAutosaveRef.current || Boolean(options.autosave || dirtyRef.current);
      setSaveStatus("Saving…");
      return activeSavePromiseRef.current || { ok: false, reason: "save-in-flight" };
    }

    const submittedRevision = editGenerationRef.current;
    const workingBlueprint = ensureFullSetBlueprint(blueprintRef.current || blueprint);
    const existingDesignId = selectedDesignIdRef.current;
    const workingName = designNameRef.current || (options.autosave ? generatedUntitledName() : designName);
    const flat = flatDesignFromBlueprint(workingBlueprint, workingName);
    if (!flat.name) {
      setStatus({ type: "error", message: "Enter a design name before saving." });
      setSaveStatus("Unsaved changes");
      return { ok: false, reason: "validation" };
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(flat.baseColorHex)) {
      setStatus({ type: "error", message: "Choose a valid base polish color." });
      setSaveStatus("Unsaved changes");
      return { ok: false, reason: "validation" };
    }

    const blueprintBytes = serializedBlueprintSize(workingBlueprint);
    if (blueprintBytes > MAX_BLUEPRINT_JSON_BYTES) {
      setStatus({ type: "error", message: `${blueprintSizeMessage(blueprintBytes)} Remove a few strokes or layers before saving.` });
      setSaveStatus("Unsaved changes");
      return { ok: false, reason: "validation" };
    }
    if (blueprintBytes >= BLUEPRINT_WARNING_BYTES) {
      setStatus({ type: "dirty", message: `${blueprintSizeMessage(blueprintBytes)} Saving, but consider simplifying before adding more details.` });
    }

    savingRef.current = true;
    const sequence = ++saveSequenceRef.current;
    setSaving(true);
    setSaveStatus("Saving…");

    const savePromise = (async () => {
      try {
        let designId = existingDesignId;
        let savedDesign = designs.find((design) => design.id === designId);
        let savedBlueprint;
        if (!designId) {
          const res = await fetch("/api/designs/with-blueprint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ design: flat, blueprint: workingBlueprint }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Unable to create design with blueprint.");
          designId = data.design?.id;
          savedDesign = data.design;
          savedBlueprint = data.blueprint;
          if (!designId || !savedBlueprint?.document) throw new Error("Saved design response was incomplete.");
          setSelectedDesignId(designId);
          selectedDesignIdRef.current = designId;
          if (savedDesign?.name && !designNameRef.current) {
            generatedDraftNameRef.current = savedDesign.name;
            designNameRef.current = savedDesign.name;
            setDesignName(savedDesign.name);
          } else if (savedDesign?.name) {
            generatedDraftNameRef.current = savedDesign.name;
          }
        } else {
          const put = await fetch(`/api/designs/${designId}/with-blueprint`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ design: flat, blueprint: workingBlueprint }) });
          const data = await put.json().catch(() => ({}));
          if (!put.ok) throw new Error(data.error || "Unable to save design and blueprint.");
          savedDesign = data.design;
          savedBlueprint = data.blueprint;
          if (!savedDesign?.id || !savedBlueprint?.document) throw new Error("Saved design response was incomplete.");
        }
        if (sequence !== saveSequenceRef.current) return { ok: false, reason: "superseded" };
        mergeSavedDesign(savedDesign);
        const unchangedSinceSubmit = editGenerationRef.current === submittedRevision;
        if (unchangedSinceSubmit) {
          const normalizedSaved = ensureFullSetBlueprint(savedBlueprint.document, savedDesign);
          blueprintRef.current = normalizedSaved;
          designNameRef.current = savedDesign?.name || flat.name;
          generatedDraftNameRef.current = "";
          setDesignName(savedDesign?.name || flat.name);
          setBlueprint(normalizedSaved);
          dirtyRef.current = false;
          setDirty(false);
          setSaveStatus(options.autosave ? "Autosaved" : "Saved");
          setStatus({
            type: "saved",
            message: blueprintBytes >= BLUEPRINT_WARNING_BYTES
              ? `${blueprintSizeMessage(blueprintBytes)} Saved, but consider simplifying before adding more details.`
              : "Saved editable blueprint",
          });
        } else {
          queuedAutosaveRef.current = true;
          dirtyRef.current = true;
          setDirty(true);
          setSaveStatus("Unsaved changes");
          setStatus({ type: "dirty", message: "Newer edits kept locally; another autosave is queued." });
        }
        return { ok: true, designId, savedRevision: submittedRevision };
      } catch (error) {
        setSaveStatus("Save failed — changes kept locally");
        setStatus({ type: "error", message: error.message || "Save failed. Your unsaved editor work is still open." });
        return { ok: false, reason: error.message || "save-failed" };
      } finally {
        setSaving(false);
        savingRef.current = false;
        activeSavePromiseRef.current = null;
        if (queuedAutosaveRef.current || (dirtyRef.current && options.autosave)) { queuedAutosaveRef.current = false; scheduleAutosave(); }
      }
    })();
    activeSavePromiseRef.current = savePromise;
    return savePromise;
  }

  function selectSlot(slot) {
    if (dirtyRef.current) void save({ autosave: true, immediate: true });
    const next = ensureFullSetBlueprint(setActiveNailBySlot(blueprintRef.current || blueprint, slot));
    markEdited();
    blueprintRef.current = next;
    dirtyRef.current = true;
    setBlueprint(next);
    setDirty(true);
    setSelectedLayerId("base-layer");
    setSaveStatus("Unsaved changes");
    setStatus({ type: "dirty", message: `Editing ${slot}; active nail selection will be saved.` });
    scheduleAutosave();
  }

  function slotsFor(scope) {
    if (scope === "all") return FULL_SET_SLOTS;
    const handSlots = activeSlot.startsWith("left") ? LEFT_HAND_SLOTS : RIGHT_HAND_SLOTS;
    if (scope === "hand") return handSlots;
    if (scope === "opposite") { const source = activeSlot.startsWith("left") ? LEFT_HAND_SLOTS : RIGHT_HAND_SLOTS; const dest = activeSlot.startsWith("left") ? RIGHT_HAND_SLOTS : LEFT_HAND_SLOTS; return [dest[source.indexOf(activeSlot)]].filter(Boolean); }
    return selectedSlots;
  }

  function confirmBulk(message) { return window.confirm(message); }
  function copyActiveNail() { setClipboardNail(JSON.parse(JSON.stringify(activeNail))); showNotice("Active nail copied."); }
  function pasteToSelected() { if (!clipboardNail || !selectedSlots.length || !confirmBulk("Overwrite selected nail designs?")) return; commit({ ...blueprint, nails: blueprint.nails.map((nail) => selectedSlots.includes(nail.slot) ? cloneNailDesign(clipboardNail, nail) : nail) }, { noticeMessage: "Copied artwork was re-fit where needed." }); }
  function duplicateActive(scope) { const targets = slotsFor(scope); if (!targets.length || !confirmBulk("Overwrite destination nail designs?")) return; commit(copyNailToSlots(blueprint, activeSlot, targets), { noticeMessage: "Copied artwork was re-fit where needed." }); }
  function mirrorHand(hand) { if (!confirmBulk("Mirror this hand to the opposite hand?")) return; commit(mirrorHandDesign(blueprint, hand), { noticeMessage: "Mirrored nails were re-fit where needed." }); }
  function applyBase(scope) { const targets = slotsFor(scope); if (!confirmBulk("Apply active base color to these nails?")) return; commit(applyBaseToSlots(blueprint, { baseColorHex: activeNail.baseColorHex }, targets)); }
  function applyShape(scope) { const targets = slotsFor(scope); if (!confirmBulk("Apply active shape, width, and length to these nails?")) return; commit(applyBaseToSlots(blueprint, { shape: activeNail.shape, width: activeNail.width, length: activeNail.length }, targets), { noticeMessage: "Artwork was revalidated after shape changes." }); }
  function resetActive() { if (!confirmBulk("Reset this nail to its base layer only?")) return; commit(resetNailDesign(blueprint, activeSlot), { selectLayerId: "base-layer" }); }

  const tagsString = (blueprint.metadata?.tags || []).join(", ");
  const statusColor = status.type === "error" ? "#b91c1c" : status.type === "saved" ? COLORS.statusAccepted : status.type === "dirty" ? COLORS.statusChangesRequested : COLORS.textMuted;

  return <div style={UI.shell}>
    <div style={UI.toolbar}>
      <button type="button" onClick={undo} disabled={!canUndo} style={UI.iconButton(false, !canUndo)}>Undo</button>
      <button type="button" onClick={redo} disabled={!canRedo} style={UI.iconButton(false, !canRedo)}>Redo</button>
      <button type="button" onClick={() => setMode("select")} style={UI.iconButton(mode === "select")}>Select</button>
      <button type="button" onClick={() => setMode("draw")} style={UI.iconButton(mode === "draw")}>Draw</button>
      <button type="button" onClick={() => setMode("eraser")} style={UI.iconButton(mode === "eraser")}>Eraser</button>
      <button type="button" onClick={addGradient} style={UI.iconButton(false)}>Add gradient</button>
      <button type="button" onClick={addPattern} style={UI.iconButton(false)}>Add pattern</button>
      <span style={{ marginLeft: "auto", color: statusColor, fontSize: 13, fontWeight: 800 }}>{saving ? "Saving…" : loading ? "Loading…" : dirty ? `● ${saveStatus}` : saveStatus || status.message}</span>
    </div>

    <div style={UI.layout}>
      <aside style={UI.panel}><div style={UI.panelPad}>
        <Field label="Design name"><input style={S.input} value={designName} onChange={(e) => { markEdited(); generatedDraftNameRef.current = ""; designNameRef.current = e.target.value; dirtyRef.current = true; setDesignName(e.target.value); setDirty(true); setSaveStatus("Unsaved changes"); scheduleAutosave(); }} placeholder="Milky bow accent" /></Field>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}><button type="button" onClick={newDesign} style={{ ...S.btnSecondary, padding: "10px 12px" }}>New Design</button><button type="button" onClick={save} disabled={saving} style={{ ...S.btnPrimary, padding: "10px 12px", opacity: saving ? .65 : 1 }}>Save</button></div>
        <Field label="Saved Designs"><select style={S.input} value={selectedDesignId} onChange={(e) => loadDesign(e.target.value)}><option value="">Choose saved design…</option>{designs.map((design) => <option key={design.id} value={design.id}>{design.name}</option>)}</select></Field>
        <Field label="Nail shape"><select style={S.input} value={activeNail.shape} onChange={(e) => updateBase({ shape: e.target.value })}>{SHAPES.map((shape) => <option key={shape}>{shape}</option>)}</select></Field>
        <Field label={`Nail length ${Math.round(activeNail.length * 100)}%`}><input type="range" min="0" max="100" value={Math.round(activeNail.length * 100)} onChange={(e) => updateBase({ length: Number(e.target.value) / 100 })} style={{ width: "100%" }}/></Field>
        <Field label={`Nail width ${Math.round(activeNail.width * 100)}%`}><input type="range" min="0" max="100" value={Math.round(activeNail.width * 100)} onChange={(e) => updateBase({ width: Number(e.target.value) / 100 })} style={{ width: "100%" }}/></Field>
        <Field label="Base polish color"><ColorInput value={baseLayer?.data?.colorHex || activeNail.baseColorHex} onChange={(value) => updateBase({ baseColorHex: normalizeHex(value, baseLayer?.data?.colorHex) })}/></Field>
        <Field label="Base effect"><select style={S.input} value={baseLayer?.data?.effect || "Solid"} onChange={(e) => updateBase({ effect: e.target.value })}>{EFFECTS.map((effect) => <option key={effect} value={effect}>{effect}</option>)}</select></Field>
        {(baseLayer?.data?.effect || "Solid") !== "Solid" && <Field label="Effect color"><ColorInput value={baseLayer?.data?.effectColorHex || "#FFFFFF"} onChange={(value) => updateBase({ effectColorHex: normalizeHex(value, "#FFFFFF") })}/></Field>}
        <Field label="Tags"><input style={S.input} value={tagsString} onChange={(e) => updateBase({ tags: e.target.value })} placeholder="bridal, chrome, accent" /></Field>
        <Field label="Style category"><select style={S.input} value={blueprint.metadata?.styleCategory || "Custom"} onChange={(e) => commit({ ...blueprint, metadata: { ...blueprint.metadata, styleCategory: e.target.value } })}>{STYLE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
        <Field label="Internal notes"><textarea style={{ ...S.input, minHeight: 70 }} value={blueprint.metadata?.internalNotes || ""} onChange={(e) => commit({ ...blueprint, metadata: { ...blueprint.metadata, internalNotes: e.target.value } })} placeholder="Optional artist-only notes" /></Field>
        <Field label="Estimated service price"><input style={S.input} value={blueprint.metadata?.estimatedServicePrice || ""} onChange={(e) => commit({ ...blueprint, metadata: { ...blueprint.metadata, estimatedServicePrice: e.target.value } })} placeholder="Placeholder for later pricing" /></Field>
        <BulkActionsPanel activeSlot={activeSlot} clipboard={clipboardNail} selectedSlots={selectedSlots} onToggleSlot={(slot) => setSelectedSlots((prev) => prev.includes(slot) ? prev.filter((item) => item !== slot) : [...prev, slot])} onCopy={copyActiveNail} onPaste={pasteToSelected} onDuplicate={duplicateActive} onMirror={mirrorHand} onApplyBase={applyBase} onApplyShape={applyShape} onReset={resetActive}/>
        <p style={UI.smallText}>Strict-fit mode keeps all editable vectors clipped and clamped inside the active nail surface for realistic product-use planning.</p>
      </div></aside>

      <main style={{ ...UI.panel, display: "flex", flexDirection: "column" }}><NailCanvas nail={activeNail} layers={activeNail.layers} selectedLayerId={selectedLayerId} mode={mode} brush={brush} notice={notice} onSelectLayer={(id) => setSelectedLayerId(id || "")} onTransformLayer={transformLayer} onDrawingStroke={addStroke} onStageEraseStroke={stageEraseStroke} onEraseStroke={eraseStroke}/><FullSetPreview blueprint={blueprint} activeNailId={activeNail.id} onSelectSlot={selectSlot} onViewChange={() => dirtyRef.current && void save({ autosave: true, immediate: true })}/></main>

      <aside style={UI.panel}><div style={UI.panelPad}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}><button type="button" aria-pressed={tab === "assets"} aria-label="Show asset library" onClick={() => setTab("assets")} style={UI.miniButton(tab === "assets")}>Assets</button><button type="button" aria-pressed={tab === "layers"} aria-label="Show layers panel" onClick={() => setTab("layers")} style={UI.miniButton(tab === "layers")}>Layers</button><button type="button" aria-pressed={tab === "properties"} aria-label="Show properties panel" onClick={() => setTab("properties")} style={UI.miniButton(tab === "properties")}>Properties</button></div>
        {tab === "assets" && <><AssetLibrary onAddAsset={addAsset}/><DrawingToolbar brush={brush} mode={mode} onBrushChange={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}/></>}
        {tab === "layers" && <LayersPanel layers={activeNail.layers} selectedLayerId={selectedLayerId} onSelect={setSelectedLayerId} onToggleVisible={toggleVisible} onToggleLock={toggleLock} onMove={moveLayer} onDelete={deleteLayer}/>} 
        {tab === "properties" && <PropertiesPanel layer={selectedLayer} onPatch={(patch) => selectedLayer && patchLayer(selectedLayer.id, patch)} onDuplicate={() => duplicateLayer()} onDelete={() => deleteLayer()}/>} 
      <div style={{ marginTop: 12, ...UI.smallText }}>Product-use hook: {productSummary.nailCount} nails, {productSummary.visibleDrawingLayerCount} drawing layers, {productSummary.visibleGradientLayerCount} gradients, {productSummary.visiblePatternLayerCount} patterns.</div></div></aside>
    </div>
  </div>;
}


export default forwardRef(DesignStudio);
