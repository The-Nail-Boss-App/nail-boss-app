import { HeroDesignDocument, HeroLayer, HeroLightingConfiguration, HeroNailConfiguration, HeroRenderResult } from './contracts';

export interface HeroRenderState { status: 'idle' | 'requested' | 'completed' | 'failed'; requestId?: string; result?: HeroRenderResult }
export interface HeroDesignState { document: HeroDesignDocument | null; selectedLayerIds: string[]; render: HeroRenderState; dirty: boolean; saved: boolean }

export const initialHeroDesignState: HeroDesignState = {
  document: null, selectedLayerIds: [], render: { status: 'idle' }, dirty: false, saved: false,
};

export type HeroDesignAction =
  | { type: 'createDesign'; document: HeroDesignDocument }
  | { type: 'loadDesign'; document: HeroDesignDocument }
  | { type: 'updateNail'; patch: Partial<HeroNailConfiguration> }
  | { type: 'addLayer'; layer: HeroLayer; index?: number }
  | { type: 'updateLayer'; layerId: string; patch: Partial<HeroLayer> }
  | { type: 'removeLayer'; layerId: string }
  | { type: 'reorderLayer'; layerId: string; toIndex: number }
  | { type: 'selectLayers'; layerIds: string[] }
  | { type: 'updateLighting'; patch: Partial<HeroLightingConfiguration> }
  | { type: 'updateRenderState'; render: HeroRenderState }
  | { type: 'markDirty' }
  | { type: 'markSaved' }
  | { type: 'reset' };

const changed = (state: HeroDesignState, document: HeroDesignDocument): HeroDesignState => ({
  ...state,
  document: { ...document, metadata: { ...document.metadata, updatedAt: new Date().toISOString() }, revision: document.revision + 1 },
  dirty: true,
  saved: false,
});

export function heroDesignReducer(state: HeroDesignState, action: HeroDesignAction): HeroDesignState {
  switch (action.type) {
    case 'createDesign': return { ...initialHeroDesignState, document: action.document, dirty: true };
    case 'loadDesign': return { ...initialHeroDesignState, document: action.document, saved: true };
    case 'updateNail': return state.document ? changed(state, { ...state.document, nail: { ...state.document.nail, ...action.patch } }) : state;
    case 'addLayer': {
      if (!state.document) return state;
      const layers = [...state.document.layers];
      layers.splice(action.index ?? layers.length, 0, action.layer);
      return changed(state, { ...state.document, layers });
    }
    case 'updateLayer': return state.document && state.document.layers.some(({ id }) => id === action.layerId)
      ? changed(state, { ...state.document, layers: state.document.layers.map((layer) => layer.id === action.layerId ? { ...layer, ...action.patch } : layer) }) : state;
    case 'removeLayer': return state.document && state.document.layers.some(({ id }) => id === action.layerId)
      ? { ...changed(state, { ...state.document, layers: state.document.layers.filter(({ id }) => id !== action.layerId) }), selectedLayerIds: state.selectedLayerIds.filter((id) => id !== action.layerId) } : state;
    case 'reorderLayer': {
      if (!state.document) return state;
      const from = state.document.layers.findIndex(({ id }) => id === action.layerId);
      if (from < 0) return state;
      const layers = [...state.document.layers];
      const [layer] = layers.splice(from, 1);
      layers.splice(Math.max(0, Math.min(action.toIndex, layers.length)), 0, layer);
      return changed(state, { ...state.document, layers });
    }
    case 'selectLayers': return { ...state, selectedLayerIds: Array.from(new Set(action.layerIds)).filter((id) => state.document?.layers.some((layer) => layer.id === id)) };
    case 'updateLighting': return state.document ? changed(state, { ...state.document, lighting: { ...state.document.lighting, ...action.patch } }) : state;
    case 'updateRenderState': return { ...state, render: action.render };
    case 'markDirty': return { ...state, dirty: true, saved: false };
    case 'markSaved': return { ...state, dirty: false, saved: true };
    case 'reset': return initialHeroDesignState;
    default: return state;
  }
}

export const selectHeroDocument = (state: HeroDesignState) => state.document;
export const selectHeroLayers = (state: HeroDesignState) => state.document?.layers ?? [];
export const selectSelectedHeroLayers = (state: HeroDesignState) => selectHeroLayers(state).filter(({ id }) => state.selectedLayerIds.includes(id));
export const selectHeroNail = (state: HeroDesignState) => state.document?.nail ?? null;
export const selectHeroLighting = (state: HeroDesignState) => state.document?.lighting ?? null;
export const selectHeroRenderState = (state: HeroDesignState) => state.render;
export const selectHeroIsDirty = (state: HeroDesignState) => state.dirty;
