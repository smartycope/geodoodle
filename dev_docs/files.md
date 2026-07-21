# Storage and files

All local/cloud storage, serialization, import, export, and image generation belongs in `src/utils/files.jsx`. Code outside that module should not access `localStorage` or storage services directly.

## Current workspace state

Actions listed in `saveSettingActions` in `src/options.jsx` preserve the current document and preferences to `localStorageSettingsName` (`GeoDoodleState`). On startup, `Paper.jsx` loads that state and merges it through the reducer.

`serializeState` keeps only fields in `preservable`. Durable artwork lives in ordered `layers`; each serialized layer includes the concrete class name in its `type` discriminator. `deserializeState` and `src/utils/layers.js:layerFromJSON` revive `DrawingLayer`, `TrellisLayer`, and their nested geometry instances.

## Named patterns and cloud saves

Named local patterns are stored under `localStorageName` (`GeoDoodleSaves`) as an object mapping names to SVG strings. Cloud rows store the same serialized editable state used by preservation.

`serializePattern` embeds editable metadata in an SVG comment and renders visible artwork as SVG elements. `deserializePattern` prefers that metadata, while still accepting older comment-free SVG files containing a `#lines` group.

The `saveable` list is intentionally smaller than `preservable`: it contains document content and view transforms, not every application preference.

## Visual export

SVG, PNG, JPEG, and image-copy output include visible layers only. `DrawingLayer` geometry renders directly; `TrellisLayer` instances are expanded finitely over the requested export rectangle using the same safety budgets as on-screen rendering. Hidden layers remain in editable metadata even though they are absent from the visual output.

## Schema migration

Document schema 3 stores polymorphic `layers` plus `activeLayerId`. Schema-1 flat geometry migrates into `DrawingLayer 1`; schema-2 hybrid layers split into separate concrete layers. Legacy Trellis flags, global controls, or hybrid layers are accepted only as migration input and should normalize into a separate `TrellisLayer`; new saves must not emit a `DrawingLayer` with an optional Trellis.

## Storage helpers

- `preserveState` / `loadPreservedState` — current JSON workspace state.
- `getSaves`, `saveLocally`, `loadLocally`, `deleteLocally`, `clearSaves` — named browser saves.
- `saveCloud`, `loadCloud`, `getCloudSaves`, `deleteCloud` — cloud persistence.
- `serializeState` / `deserializeState` — JSON state encoding and class revival.
- `serializePattern` / `deserializePattern` — editable SVG encoding and import.
- `resolveExportRect`, `image`, and `download` — visual export.
