import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, S } from "../styles.js";
import NailCanvas from "./NailCanvas.jsx";
import AssetLibrary from "./AssetLibrary.jsx";
import LayersPanel from "./LayersPanel.jsx";
import PropertiesPanel from "./PropertiesPanel.jsx";
import DrawingToolbar from "./DrawingToolbar.jsx";
import { UI } from "./studioStyles.js";
import {
  EFFECTS,
  SHAPES,
  addLayerToBlueprint,
  assetLayer,
  clamp,
  createDefaultBlueprint,
  drawingLayer,
  ensureBlueprint,
  flatDesignFromBlueprint,
  getActiveNail,
  gradientLayer,
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

export default function DesignStudio() {
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designName, setDesignName] = useState("");
  const [blueprint, setBlueprint] = useState(() => createDefaultBlueprint());
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
  const dragStartBlueprintRef = useRef(null);

  const activeNail = getActiveNail(blueprint);
  const selectedLayer = useMemo(() => layerById(activeNail, selectedLayerId), [activeNail, selectedLayerId]);
  const baseLayer = activeNail.layers.find((layer) => layer.type === "base");
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  useEffect(() => { loadDesigns(); }, []);

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

  function commit(nextBlueprint, { selectLayerId = selectedLayerId, noticeMessage = "" } = {}) {
    const normalized = ensureBlueprint(nextBlueprint);
    setHistory((prev) => pushHistory(prev, blueprint));
    setBlueprint(normalized);
    setSelectedLayerId(selectLayerId);
    setDirty(true);
    setStatus({ type: "dirty", message: "Unsaved changes" });
    if (noticeMessage) showNotice(noticeMessage);
  }

  function replaceLoaded(nextBlueprint, design, message = "Blueprint loaded") {
    const normalized = ensureBlueprint(nextBlueprint, design);
    setBlueprint(normalized);
    setDesignName(design?.name || "");
    setSelectedLayerId("base-layer");
    setHistory({ past: [], future: [] });
    setDirty(false);
    setStatus({ type: "idle", message });
  }

  function newDesign() {
    if (dirty && !window.confirm("Replace unsaved work with a new design?")) return;
    setSelectedDesignId("");
    replaceLoaded(createDefaultBlueprint(), { name: "" }, "New design started");
  }

  async function loadDesign(designId) {
    if (!designId) return;
    if (dirty && !window.confirm("Load this saved design and discard unsaved changes?")) return;
    const design = designs.find((item) => item.id === designId);
    setLoading(true);
    try {
      const res = await fetch(`/api/designs/${designId}/blueprint`);
      if (!res.ok) throw new Error("Unable to load this design blueprint.");
      const data = await res.json();
      setSelectedDesignId(designId);
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
    else setBlueprint(ensureBlueprint(next));
  }

  function transformLayer(layerId, transform, final) {
    if (transform) {
      if (!dragStartBlueprintRef.current) dragStartBlueprintRef.current = blueprint;
      patchLayer(layerId, { transform }, false);
    }
    if (final) {
      const preDragBlueprint = dragStartBlueprintRef.current || blueprint;
      dragStartBlueprintRef.current = null;
      setHistory((prev) => pushHistory(prev, preDragBlueprint));
      setDirty(true);
      setStatus({ type: "dirty", message: "Unsaved changes" });
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

  function ensureDrawingLayer() {
    const existing = activeNail.layers.find((layer) => layer.type === "drawing" && !layer.locked);
    if (existing) return existing;
    const layer = drawingLayer(activeNail, brush.tool);
    const next = addLayerToBlueprint(blueprint, layer);
    setBlueprint(ensureBlueprint(next));
    setSelectedLayerId(layer.id);
    setDirty(true);
    return layer;
  }

  function addStroke(stroke) {
    const drawing = selectedLayer?.type === "drawing" && !selectedLayer.locked ? selectedLayer : ensureDrawingLayer();
    const next = updateActiveNail(blueprint, (nail) => ({ ...nail, layers: nail.layers.map((layer) => layer.id === drawing.id ? { ...layer, data: { ...layer.data, tool: brush.tool, strokes: [...(layer.data.strokes || []), stroke] } } : layer) }));
    commit(next, { selectLayerId: drawing.id });
  }

  function eraseStroke(point) {
    const drawing = selectedLayer?.type === "drawing" ? selectedLayer : activeNail.layers.find((layer) => layer.type === "drawing");
    if (!drawing || drawing.locked) return showNotice("Select an unlocked drawing layer to erase strokes.");
    const strokes = drawing.data.strokes || [];
    if (!strokes.length) return;
    let nearest = 0;
    let best = Infinity;
    strokes.forEach((stroke, i) => stroke.points.forEach((p) => {
      const distance = Math.hypot(p.x - point.x, p.y - point.y);
      if (distance < best) { best = distance; nearest = i; }
    }));
    const nextStrokes = strokes.filter((_, i) => i !== nearest);
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

  function undo() {
    if (!canUndo) return;
    const current = JSON.stringify(blueprint);
    const snapshot = history.past[history.past.length - 1];
    setBlueprint(restoreHistorySnapshot(snapshot));
    setHistory({ past: history.past.slice(0, -1), future: [current, ...history.future].slice(0, 50) });
    setDirty(true);
    setStatus({ type: "dirty", message: "Undo applied" });
  }

  function redo() {
    if (!canRedo) return;
    const current = JSON.stringify(blueprint);
    const snapshot = history.future[0];
    setBlueprint(restoreHistorySnapshot(snapshot));
    setHistory({ past: [...history.past, current].slice(-50), future: history.future.slice(1) });
    setDirty(true);
    setStatus({ type: "dirty", message: "Redo applied" });
  }

  async function save() {
    const flat = flatDesignFromBlueprint(blueprint, designName);
    if (!flat.name) return setStatus({ type: "error", message: "Enter a design name before saving." });
    if (!/^#[0-9a-fA-F]{6}$/.test(flat.baseColorHex)) return setStatus({ type: "error", message: "Choose a valid base polish color." });
    setSaving(true);
    try {
      let designId = selectedDesignId;
      let savedDesign = designs.find((design) => design.id === designId);
      if (!designId) {
        const res = await fetch("/api/designs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(flat) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Unable to create design.");
        designId = data.id;
        savedDesign = data;
        setSelectedDesignId(designId);
      }
      const put = await fetch(`/api/designs/${designId}/blueprint`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(blueprint) });
      const savedBlueprint = await put.json().catch(() => ({}));
      if (!put.ok) throw new Error(savedBlueprint.error || "Unable to save blueprint.");
      await loadDesigns();
      setBlueprint(ensureBlueprint(savedBlueprint.document, savedDesign));
      setDirty(false);
      setHistory({ past: [], future: [] });
      setStatus({ type: "saved", message: "Saved editable blueprint" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  const tagsString = (blueprint.metadata?.tags || []).join(", ");
  const statusColor = status.type === "error" ? "#b91c1c" : status.type === "saved" ? COLORS.statusAccepted : status.type === "dirty" ? COLORS.statusChangesRequested : COLORS.textMuted;

  return <div style={UI.shell}>
    <div style={UI.toolbar}>
      <button type="button" onClick={undo} disabled={!canUndo} style={UI.iconButton(false, !canUndo)}>Undo</button>
      <button type="button" onClick={redo} disabled={!canRedo} style={UI.iconButton(false, !canRedo)}>Redo</button>
      <button type="button" onClick={() => setMode("select")} style={UI.iconButton(mode === "select")}>Select</button>
      <button type="button" onClick={() => { setMode("draw"); ensureDrawingLayer(); }} style={UI.iconButton(mode === "draw")}>Draw</button>
      <button type="button" onClick={() => setMode("eraser")} style={UI.iconButton(mode === "eraser")}>Eraser</button>
      <button type="button" onClick={addGradient} style={UI.iconButton(false)}>Add gradient</button>
      <button type="button" onClick={addPattern} style={UI.iconButton(false)}>Add pattern</button>
      <span style={{ marginLeft: "auto", color: statusColor, fontSize: 13, fontWeight: 800 }}>{saving ? "Saving…" : loading ? "Loading…" : dirty ? `● ${status.message}` : status.message}</span>
    </div>

    <div style={UI.layout}>
      <aside style={UI.panel}><div style={UI.panelPad}>
        <Field label="Design name"><input style={S.input} value={designName} onChange={(e) => { setDesignName(e.target.value); setDirty(true); }} placeholder="Milky bow accent" /></Field>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}><button type="button" onClick={newDesign} style={{ ...S.btnSecondary, padding: "10px 12px" }}>New Design</button><button type="button" onClick={save} disabled={saving} style={{ ...S.btnPrimary, padding: "10px 12px", opacity: saving ? .65 : 1 }}>Save</button></div>
        <Field label="Saved Designs"><select style={S.input} value={selectedDesignId} onChange={(e) => loadDesign(e.target.value)}><option value="">Choose saved design…</option>{designs.map((design) => <option key={design.id} value={design.id}>{design.name}</option>)}</select></Field>
        <Field label="Nail shape"><select style={S.input} value={activeNail.shape} onChange={(e) => updateBase({ shape: e.target.value })}>{SHAPES.map((shape) => <option key={shape}>{shape}</option>)}</select></Field>
        <Field label={`Nail length ${Math.round(activeNail.length * 100)}%`}><input type="range" min="0" max="100" value={Math.round(activeNail.length * 100)} onChange={(e) => updateBase({ length: Number(e.target.value) / 100 })} style={{ width: "100%" }}/></Field>
        <Field label={`Nail width ${Math.round(activeNail.width * 100)}%`}><input type="range" min="0" max="100" value={Math.round(activeNail.width * 100)} onChange={(e) => updateBase({ width: Number(e.target.value) / 100 })} style={{ width: "100%" }}/></Field>
        <Field label="Base polish color"><ColorInput value={baseLayer?.data?.colorHex || activeNail.baseColorHex} onChange={(value) => updateBase({ baseColorHex: normalizeHex(value, baseLayer?.data?.colorHex) })}/></Field>
        <Field label="Base effect"><select style={S.input} value={baseLayer?.data?.effect || "Solid"} onChange={(e) => updateBase({ effect: e.target.value })}>{EFFECTS.map((effect) => <option key={effect} value={effect}>{effect}</option>)}</select></Field>
        {(baseLayer?.data?.effect || "Solid") !== "Solid" && <Field label="Effect color"><ColorInput value={baseLayer?.data?.effectColorHex || "#FFFFFF"} onChange={(value) => updateBase({ effectColorHex: normalizeHex(value, "#FFFFFF") })}/></Field>}
        <Field label="Tags"><input style={S.input} value={tagsString} onChange={(e) => updateBase({ tags: e.target.value })} placeholder="bridal, chrome, accent" /></Field>
        <p style={UI.smallText}>Strict-fit mode keeps all editable vectors clipped and clamped inside the active nail surface for realistic product-use planning.</p>
      </div></aside>

      <main style={UI.panel}><NailCanvas nail={activeNail} layers={activeNail.layers} selectedLayerId={selectedLayerId} mode={mode} brush={brush} notice={notice} onSelectLayer={(id) => setSelectedLayerId(id || "")} onTransformLayer={transformLayer} onDrawingStroke={addStroke} onEraseStroke={eraseStroke}/></main>

      <aside style={UI.panel}><div style={UI.panelPad}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}><button type="button" onClick={() => setTab("assets")} style={UI.miniButton(tab === "assets")}>Assets</button><button type="button" onClick={() => setTab("layers")} style={UI.miniButton(tab === "layers")}>Layers</button><button type="button" onClick={() => setTab("properties")} style={UI.miniButton(tab === "properties")}>Properties</button></div>
        {tab === "assets" && <><AssetLibrary onAddAsset={addAsset}/><DrawingToolbar brush={brush} mode={mode} onBrushChange={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}/></>}
        {tab === "layers" && <LayersPanel layers={activeNail.layers} selectedLayerId={selectedLayerId} onSelect={setSelectedLayerId} onToggleVisible={toggleVisible} onToggleLock={toggleLock} onMove={moveLayer} onDelete={deleteLayer}/>} 
        {tab === "properties" && <PropertiesPanel layer={selectedLayer} onPatch={(patch) => selectedLayer && patchLayer(selectedLayer.id, patch)} onDuplicate={() => duplicateLayer()} onDelete={() => deleteLayer()}/>} 
      </div></aside>
    </div>
  </div>;
}
