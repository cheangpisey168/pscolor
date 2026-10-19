/**
 * PS Color — Phase 3: My Color Collections System
 * Robust client-side collection manager with local-first persistence,
 * schema validation, multi-collection support, import/export, and legacy data migration.
 */

export const COLLECTIONS_STORAGE_KEY = 'ps-color-collections';
export const ACTIVE_COLLECTION_STORAGE_KEY = 'ps-color-active-collection';
export const LEGACY_SAVED_KEY = 'ps-color-saved';
export const LEGACY_MY_COLLECTION_KEY = 'myCollection';

const PALETTE_ID_REGEX = /^[a-f0-9]{24}$/i;

/**
 * Escapes HTML characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/**
 * Reads and parses JSON from localStorage safely
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
function readStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Writes JSON to localStorage safely
 * @param {string} key
 * @param {*} value
 */
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write storage for key ${key}:`, err);
  }
}

/**
 * Generates a unique, URL-safe collection identifier
 * @param {string} prefix
 * @returns {string}
 */
function generateCollectionId(prefix = 'col') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

let cachedCollections = null;

/**
 * Initializes collections with safe migration from legacy storage.
 * Preserves all previously saved palettes and groups them into a default "Favorites" collection.
 * @returns {Array<Object>}
 */
export function initCollections() {
  const stored = readStorage(COLLECTIONS_STORAGE_KEY, null);

  if (Array.isArray(stored) && stored.length > 0) {
    // Validate each collection structure
    cachedCollections = stored.map(c => ({
      id: String(c.id || generateCollectionId()),
      name: String(c.name || 'Untitled Collection').trim() || 'Untitled Collection',
      description: String(c.description || ''),
      paletteIds: Array.isArray(c.paletteIds)
        ? [...new Set(c.paletteIds.filter(id => typeof id === 'string' && PALETTE_ID_REGEX.test(id)).map(id => id.toLowerCase()))]
        : [],
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now()
    }));
  } else {
    // Migrate legacy data safely from 'ps-color-saved' and 'myCollection'
    const psSaved = readStorage(LEGACY_SAVED_KEY, []);
    let chSaved = [];
    try {
      const myCol = localStorage.getItem(LEGACY_MY_COLLECTION_KEY) || '';
      chSaved = myCol.split(',').filter(id => PALETTE_ID_REGEX.test(id));
    } catch {}

    const legacyMerged = [...new Set([...(Array.isArray(psSaved) ? psSaved : []), ...chSaved])]
      .filter(id => typeof id === 'string' && PALETTE_ID_REGEX.test(id))
      .map(id => id.toLowerCase());

    cachedCollections = [
      {
        id: 'favorites',
        name: 'Favorites',
        description: 'Your default saved color palettes',
        paletteIds: legacyMerged,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    saveCollections(cachedCollections);
  }

  // Ensure default Favorites collection always exists
  if (!cachedCollections.some(c => c.id === 'favorites')) {
    cachedCollections.unshift({
      id: 'favorites',
      name: 'Favorites',
      description: 'Your default saved color palettes',
      paletteIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    saveCollections(cachedCollections);
  }

  syncLegacyStorage(cachedCollections);
  return getCollections();
}

/**
 * Persists collections to localStorage and keeps legacy storage keys in sync
 * @param {Array<Object>} collections
 */
function saveCollections(collections) {
  cachedCollections = collections;
  writeStorage(COLLECTIONS_STORAGE_KEY, collections);
  syncLegacyStorage(collections);
}

/**
 * Synchronizes legacy 'ps-color-saved' and 'myCollection' keys
 * so that any palette saved in ANY collection reflects as liked across the site.
 * @param {Array<Object>} collections
 */
export function syncLegacyStorage(collections) {
  const allSavedIds = [...new Set((collections || []).flatMap(c => c.paletteIds || []))];
  writeStorage(LEGACY_SAVED_KEY, allSavedIds);
  try {
    localStorage.setItem(LEGACY_MY_COLLECTION_KEY, allSavedIds.join(','));
  } catch {}

  // Dispatch global event for live UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ps-color-collections-change', {
      detail: { collections, allSavedIds }
    }));
  }
}

/**
 * Returns a cloned copy of all collections
 * @returns {Array<Object>}
 */
export function getCollections() {
  if (!cachedCollections) {
    initCollections();
  }
  return JSON.parse(JSON.stringify(cachedCollections));
}

/**
 * Returns a single collection by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getCollection(id) {
  const all = getCollections();
  return all.find(c => c.id === id) || null;
}

/**
 * Gets the current active collection ID
 * @returns {string}
 */
export function getActiveCollectionId() {
  const all = getCollections();
  try {
    const saved = localStorage.getItem(ACTIVE_COLLECTION_STORAGE_KEY);
    if (saved && all.some(c => c.id === saved)) {
      return saved;
    }
  } catch {}
  return all[0]?.id || 'favorites';
}

/**
 * Sets the current active collection ID and stores it
 * @param {string} id
 */
export function setActiveCollectionId(id) {
  const all = getCollections();
  if (all.some(c => c.id === id)) {
    try {
      localStorage.setItem(ACTIVE_COLLECTION_STORAGE_KEY, id);
    } catch {}
  }
}

/**
 * Returns the currently active collection object
 * @returns {Object}
 */
export function getActiveCollection() {
  const activeId = getActiveCollectionId();
  return getCollection(activeId) || getCollections()[0];
}

/**
 * Creates a new named collection
 * @param {string} name
 * @param {string} [description='']
 * @returns {{ success: boolean, collection?: Object, error?: string }}
 */
export function createCollection(name, description = '') {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    return { success: false, error: 'Collection name cannot be empty.' };
  }
  if (trimmedName.length > 50) {
    return { success: false, error: 'Collection name must be 50 characters or less.' };
  }

  const collections = getCollections();
  if (collections.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
    return { success: false, error: `A collection named "${trimmedName}" already exists.` };
  }

  const newCol = {
    id: generateCollectionId('col'),
    name: trimmedName,
    description: String(description || '').trim(),
    paletteIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  collections.push(newCol);
  saveCollections(collections);
  setActiveCollectionId(newCol.id);

  return { success: true, collection: newCol };
}

/**
 * Renames an existing collection
 * @param {string} id
 * @param {string} newName
 * @returns {{ success: boolean, collection?: Object, error?: string }}
 */
export function renameCollection(id, newName) {
  const trimmedName = String(newName || '').trim();
  if (!trimmedName) {
    return { success: false, error: 'Collection name cannot be empty.' };
  }
  if (trimmedName.length > 50) {
    return { success: false, error: 'Collection name must be 50 characters or less.' };
  }

  const collections = getCollections();
  const index = collections.findIndex(c => c.id === id);
  if (index === -1) {
    return { success: false, error: 'Collection not found.' };
  }

  // Prevent duplicate names with OTHER collections
  if (collections.some(c => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
    return { success: false, error: `A collection named "${trimmedName}" already exists.` };
  }

  collections[index].name = trimmedName;
  collections[index].updatedAt = Date.now();
  saveCollections(collections);

  return { success: true, collection: collections[index] };
}

/**
 * Deletes a collection after validation
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export function deleteCollection(id) {
  const collections = getCollections();
  if (collections.length <= 1) {
    return { success: false, error: 'You must have at least one collection.' };
  }

  const index = collections.findIndex(c => c.id === id);
  if (index === -1) {
    return { success: false, error: 'Collection not found.' };
  }

  collections.splice(index, 1);
  saveCollections(collections);

  // If deleted collection was active, fall back to first remaining
  if (getActiveCollectionId() === id) {
    setActiveCollectionId(collections[0].id);
  }

  return { success: true };
}

/**
 * Adds a palette to a specific collection, preventing duplicates
 * @param {string} collectionId
 * @param {string} paletteId
 * @returns {{ success: boolean, duplicate?: boolean, error?: string }}
 */
export function addPaletteToCollection(collectionId, paletteId) {
  const cleanId = String(paletteId || '').toLowerCase().trim();
  if (!PALETTE_ID_REGEX.test(cleanId)) {
    return { success: false, error: 'Invalid palette identifier.' };
  }

  const collections = getCollections();
  const col = collections.find(c => c.id === collectionId);
  if (!col) {
    return { success: false, error: 'Collection not found.' };
  }

  if (col.paletteIds.includes(cleanId)) {
    return { success: false, duplicate: true, error: `Palette is already in "${col.name}".` };
  }

  col.paletteIds.push(cleanId);
  col.updatedAt = Date.now();
  saveCollections(collections);

  return { success: true };
}

/**
 * Removes a palette from a specific collection
 * @param {string} collectionId
 * @param {string} paletteId
 * @returns {{ success: boolean, error?: string }}
 */
export function removePaletteFromCollection(collectionId, paletteId) {
  const cleanId = String(paletteId || '').toLowerCase().trim();
  const collections = getCollections();
  const col = collections.find(c => c.id === collectionId);
  if (!col) {
    return { success: false, error: 'Collection not found.' };
  }

  const prevLen = col.paletteIds.length;
  col.paletteIds = col.paletteIds.filter(id => id !== cleanId);
  if (col.paletteIds.length !== prevLen) {
    col.updatedAt = Date.now();
    saveCollections(collections);
  }

  return { success: true };
}

/**
 * Toggles a palette's membership in a specific collection
 * @param {string} collectionId
 * @param {string} paletteId
 * @returns {{ inCollection: boolean, collectionName: string }}
 */
export function togglePaletteInCollection(collectionId, paletteId) {
  const col = getCollection(collectionId);
  if (!col) return { inCollection: false, collectionName: '' };

  const cleanId = String(paletteId || '').toLowerCase().trim();
  if (col.paletteIds.includes(cleanId)) {
    removePaletteFromCollection(collectionId, cleanId);
    return { inCollection: false, collectionName: col.name };
  } else {
    addPaletteToCollection(collectionId, cleanId);
    return { inCollection: true, collectionName: col.name };
  }
}

/**
 * Checks if a palette belongs to a specific collection
 * @param {string} collectionId
 * @param {string} paletteId
 * @returns {boolean}
 */
export function isPaletteInCollection(collectionId, paletteId) {
  const col = getCollection(collectionId);
  return col ? col.paletteIds.includes(String(paletteId || '').toLowerCase().trim()) : false;
}

/**
 * Returns all collections that contain a given palette
 * @param {string} paletteId
 * @returns {Array<Object>}
 */
export function getCollectionsForPalette(paletteId) {
  const cleanId = String(paletteId || '').toLowerCase().trim();
  return getCollections().filter(c => c.paletteIds.includes(cleanId));
}

/**
 * Checks if a palette is saved in ANY collection
 * @param {string} paletteId
 * @returns {boolean}
 */
export function isPaletteSaved(paletteId) {
  const cleanId = String(paletteId || '').toLowerCase().trim();
  return getCollections().some(c => c.paletteIds.includes(cleanId));
}

/**
 * Default like button handler:
 * - If not saved anywhere: adds to the active collection (or Favorites).
 * - If already saved in active collection: removes from active collection.
 * - If saved elsewhere: adds to active collection as well.
 * @param {string} paletteId
 * @param {string} [preferredCollectionId]
 * @returns {{ saved: boolean, collectionName: string }}
 */
export function toggleQuickSave(paletteId, preferredCollectionId = null) {
  const cleanId = String(paletteId || '').toLowerCase().trim();
  const targetId = preferredCollectionId || getActiveCollectionId();
  const col = getCollection(targetId) || getCollections()[0];

  if (col.paletteIds.includes(cleanId)) {
    removePaletteFromCollection(col.id, cleanId);
    return { saved: isPaletteSaved(cleanId), collectionName: col.name, removed: true };
  } else if (isPaletteSaved(cleanId)) {
    const containingCols = getCollectionsForPalette(cleanId);
    containingCols.forEach(c => removePaletteFromCollection(c.id, cleanId));
    return { saved: false, collectionName: containingCols.map(c => c.name).join(', '), removed: true };
  } else {
    addPaletteToCollection(col.id, cleanId);
    return { saved: true, collectionName: col.name, added: true };
  }
}

/**
 * Generates an export payload for collections
 * @param {string|null} [targetCollectionId=null] - Specific collection or null for all
 * @param {Function} getPaletteFn - Palette lookup helper
 * @returns {Object} Valid export schema
 */
export function buildExportPayload(targetCollectionId = null, getPaletteFn = null) {
  const collections = targetCollectionId
    ? [getCollection(targetCollectionId)].filter(Boolean)
    : getCollections();

  return {
    app: 'PS Color',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    collections: collections.map(col => ({
      id: col.id,
      name: col.name,
      description: col.description || '',
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
      palettes: col.paletteIds.map(id => {
        const p = getPaletteFn ? getPaletteFn(id) : null;
        return {
          id,
          colors: p ? p.colors : id.match(/.{6}/g).map(h => '#' + h.toUpperCase())
        };
      })
    }))
  };
}

/**
 * Validates and parses an imported JSON string with strict sanity checking
 * @param {string} jsonString
 * @returns {{ valid: boolean, error?: string, collections?: Array<Object>, summary?: Object }}
 */
export function validateAndParseImportJson(jsonString) {
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    return { valid: false, error: 'Import file is empty.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { valid: false, error: 'Invalid JSON format. Please upload a valid .json file.' };
  }

  const resultCollections = [];

  // Format 1: PS Color v2 export with { collections: [...] }
  if (parsed && Array.isArray(parsed.collections)) {
    for (const item of parsed.collections) {
      if (!item || typeof item !== 'object') continue;
      const name = String(item.name || '').trim();
      if (!name) continue;

      let paletteIds = [];
      if (Array.isArray(item.palettes)) {
        paletteIds = item.palettes
          .map(p => (typeof p === 'string' ? p : p?.id))
          .filter(id => typeof id === 'string' && PALETTE_ID_REGEX.test(id))
          .map(id => id.toLowerCase());
      } else if (Array.isArray(item.paletteIds)) {
        paletteIds = item.paletteIds
          .filter(id => typeof id === 'string' && PALETTE_ID_REGEX.test(id))
          .map(id => id.toLowerCase());
      }

      resultCollections.push({
        name,
        description: String(item.description || ''),
        paletteIds: [...new Set(paletteIds)],
        customPalettes: Array.isArray(item.palettes) ? item.palettes.filter(p => p && typeof p === 'object' && Array.isArray(p.colors)) : []
      });
    }
  }
  // Format 2: Direct array of collections [ { name: '...', paletteIds: [...] } ]
  else if (Array.isArray(parsed) && parsed.some(item => item && (item.name || item.paletteIds))) {
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const name = String(item.name || 'Imported Collection').trim();
      let paletteIds = [];
      if (Array.isArray(item.paletteIds)) {
        paletteIds = item.paletteIds.filter(id => typeof id === 'string' && PALETTE_ID_REGEX.test(id)).map(id => id.toLowerCase());
      } else if (Array.isArray(item.palettes)) {
        paletteIds = item.palettes.map(p => (typeof p === 'string' ? p : p?.id)).filter(id => typeof id === 'string' && PALETTE_ID_REGEX.test(id)).map(id => id.toLowerCase());
      }
      resultCollections.push({
        name,
        description: String(item.description || ''),
        paletteIds: [...new Set(paletteIds)],
        customPalettes: []
      });
    }
  }
  // Format 3: Legacy format [ { id: '...', colors: [...] } ] or [ "hexid1", "hexid2" ]
  else if (Array.isArray(parsed)) {
    const paletteIds = parsed
      .map(p => (typeof p === 'string' ? p : p?.id))
      .filter(id => typeof id === 'string' && PALETTE_ID_REGEX.test(id))
      .map(id => id.toLowerCase());

    if (paletteIds.length > 0) {
      resultCollections.push({
        name: 'Imported Favorites',
        description: 'Imported from legacy collection backup',
        paletteIds: [...new Set(paletteIds)],
        customPalettes: parsed.filter(p => p && typeof p === 'object' && Array.isArray(p.colors))
      });
    }
  }

  if (resultCollections.length === 0) {
    return {
      valid: false,
      error: 'No valid color collections or palette data found in the imported file.'
    };
  }

  const totalPalettes = resultCollections.reduce((sum, c) => sum + c.paletteIds.length, 0);

  return {
    valid: true,
    collections: resultCollections,
    summary: {
      collectionsCount: resultCollections.length,
      palettesCount: totalPalettes
    }
  };
}

/**
 * Commits validated import data into the database
 * @param {Array<Object>} validatedCollections
 * @returns {{ importedCollections: number, importedPalettes: number }}
 */
export function applyImportedCollections(validatedCollections) {
  const existing = getCollections();
  let newCollectionsAdded = 0;
  let newPalettesAdded = 0;

  for (const incoming of validatedCollections) {
    const existingCol = existing.find(c => c.name.toLowerCase() === incoming.name.toLowerCase());
    if (existingCol) {
      // Merge palette IDs into existing collection without duplicates
      const beforeCount = existingCol.paletteIds.length;
      existingCol.paletteIds = [...new Set([...existingCol.paletteIds, ...incoming.paletteIds])];
      newPalettesAdded += (existingCol.paletteIds.length - beforeCount);
      existingCol.updatedAt = Date.now();
    } else {
      // Add as new collection
      const newCol = {
        id: generateCollectionId('col'),
        name: incoming.name,
        description: incoming.description || '',
        paletteIds: [...new Set(incoming.paletteIds)],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      existing.push(newCol);
      newCollectionsAdded++;
      newPalettesAdded += newCol.paletteIds.length;
    }
  }

  saveCollections(existing);

  // If new collections were added, switch to the first imported one
  if (validatedCollections[0]) {
    const target = existing.find(c => c.name.toLowerCase() === validatedCollections[0].name.toLowerCase());
    if (target) setActiveCollectionId(target.id);
  }

  return {
    importedCollections: newCollectionsAdded,
    importedPalettes: newPalettesAdded
  };
}

/**
 * Opens modal to create a new collection
 * @param {HTMLDialogElement} dialogEl
 * @param {Function} onCreated
 */
export function openCreateCollectionModal(dialogEl, onCreated) {
  if (!dialogEl) return;
  dialogEl.innerHTML = `
    <button class="icon-button dialog-close" data-close aria-label="Close dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="m6 6 12 12M6 18 18 6"/></svg>
    </button>
    <h2>Create New Collection</h2>
    <form id="create-collection-form" class="collection-modal-form" novalidate onsubmit="return false;">
      <label for="new-collection-name" class="collection-form-label">Collection Name</label>
      <input type="text" id="new-collection-name" class="collection-text-input" placeholder="e.g. Modern SaaS, Brand Identity, Dark Theme" maxlength="50" autofocus required />
      <label for="new-collection-desc" class="collection-form-label" style="margin-top: 12px;">Description (Optional)</label>
      <input type="text" id="new-collection-desc" class="collection-text-input" placeholder="e.g. Curated color schemes for our 2026 redesign" maxlength="120" />
      <div id="collection-modal-error" class="collection-modal-error" hidden></div>
      <div class="collection-modal-actions">
        <button type="button" class="button" data-close>Cancel</button>
        <button type="submit" id="btn-submit-create-col" class="button primary">Create Collection</button>
      </div>
    </form>
  `;
  dialogEl.showModal();

  const nameInput = dialogEl.querySelector('#new-collection-name');
  const descInput = dialogEl.querySelector('#new-collection-desc');
  const errorEl = dialogEl.querySelector('#collection-modal-error');
  const form = dialogEl.querySelector('#create-collection-form');

  if (nameInput) nameInput.focus();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const res = createCollection(name, descInput.value.trim());
    if (res.success) {
      dialogEl.close();
      if (onCreated) onCreated(res.collection);
    } else {
      errorEl.textContent = res.error || 'Could not create collection.';
      errorEl.hidden = false;
      nameInput.focus();
    }
  });
}

/**
 * Opens modal to rename an existing collection
 * @param {HTMLDialogElement} dialogEl
 * @param {Object} collection
 * @param {Function} onRenamed
 */
export function openRenameCollectionModal(dialogEl, collection, onRenamed) {
  if (!dialogEl || !collection) return;
  dialogEl.innerHTML = `
    <button class="icon-button dialog-close" data-close aria-label="Close dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="m6 6 12 12M6 18 18 6"/></svg>
    </button>
    <h2>Rename Collection</h2>
    <form id="rename-collection-form" class="collection-modal-form" novalidate onsubmit="return false;">
      <label for="rename-collection-input" class="collection-form-label">Collection Name</label>
      <input type="text" id="rename-collection-input" class="collection-text-input" value="${escapeHtml(collection.name)}" maxlength="50" autofocus required />
      <div id="collection-modal-error" class="collection-modal-error" hidden></div>
      <div class="collection-modal-actions">
        <button type="button" class="button" data-close>Cancel</button>
        <button type="submit" id="btn-submit-rename-col" class="button primary">Save Changes</button>
      </div>
    </form>
  `;
  dialogEl.showModal();

  const input = dialogEl.querySelector('#rename-collection-input');
  const errorEl = dialogEl.querySelector('#collection-modal-error');
  const form = dialogEl.querySelector('#rename-collection-form');

  if (input) {
    input.focus();
    input.select();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const newName = input.value.trim();
    const res = renameCollection(collection.id, newName);
    if (res.success) {
      dialogEl.close();
      if (onRenamed) onRenamed(res.collection);
    } else {
      errorEl.textContent = res.error || 'Could not rename collection.';
      errorEl.hidden = false;
      input.focus();
    }
  });
}

/**
 * Opens confirmation modal to delete a collection
 * @param {HTMLDialogElement} dialogEl
 * @param {Object} collection
 * @param {Function} onDeleted
 */
export function openDeleteCollectionModal(dialogEl, collection, onDeleted) {
  if (!dialogEl || !collection) return;
  dialogEl.innerHTML = `
    <button class="icon-button dialog-close" data-close aria-label="Close dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="m6 6 12 12M6 18 18 6"/></svg>
    </button>
    <h2>Delete Collection</h2>
    <div class="collection-modal-body">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: var(--text-muted);">
        Are you sure you want to delete <strong style="color: var(--text-main);">"${escapeHtml(collection.name)}"</strong>?
        Palettes inside will remain in other collections and will not be permanently deleted.
      </p>
      <div class="collection-modal-actions">
        <button type="button" class="button" data-close>Cancel</button>
        <button type="button" id="btn-confirm-delete-col" class="button danger-btn">Delete Collection</button>
      </div>
    </div>
  `;
  dialogEl.showModal();

  const deleteBtn = dialogEl.querySelector('#btn-confirm-delete-col');
  if (deleteBtn) {
    deleteBtn.focus();
    deleteBtn.addEventListener('click', () => {
      const res = deleteCollection(collection.id);
      dialogEl.close();
      if (res.success && onDeleted) onDeleted();
    });
  }
}

/**
 * Opens modal allowing user to toggle a palette across multiple collections
 * @param {HTMLDialogElement} dialogEl
 * @param {Object} palette
 * @param {Function} onUpdated
 */
export function openAddToCollectionModal(dialogEl, palette, onUpdated) {
  if (!dialogEl || !palette) return;

  function renderModalBody() {
    const collections = getCollections();
    const pid = palette.id.toLowerCase();
    return `
      <button class="icon-button dialog-close" data-close aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="m6 6 12 12M6 18 18 6"/></svg>
      </button>
      <h2>Save to Collection</h2>
      <div class="collection-modal-body">
        <div class="picker-swatches-preview">
          <div class="picker-swatches-bar">
            ${palette.colors.map(c => `<span style="background:${c}"></span>`).join('')}
          </div>
          <span class="picker-palette-title">Palette #${palette.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <p class="collection-form-label" style="margin-bottom: 8px;">Select collections to include this palette:</p>
        <div class="collection-checklist" role="group" aria-label="Collections list">
          ${collections.map(col => {
            const hasPalette = col.paletteIds.includes(pid);
            return `
              <label class="collection-check-item ${hasPalette ? 'selected' : ''}" data-col-item="${col.id}">
                <input type="checkbox" class="collection-checkbox" data-col-toggle="${col.id}" ${hasPalette ? 'checked' : ''} />
                <div class="collection-check-info">
                  <span class="collection-check-name">${escapeHtml(col.name)}</span>
                  <span class="collection-check-count">${col.paletteIds.length} ${col.paletteIds.length === 1 ? 'palette' : 'palettes'}</span>
                </div>
                <span class="collection-status-tag ${hasPalette ? 'tag-saved' : ''}">${hasPalette ? 'Saved' : 'Add'}</span>
              </label>
            `;
          }).join('')}
        </div>
        <div class="inline-new-collection-bar">
          <input type="text" id="inline-collection-name" class="collection-text-input-sm" placeholder="Create new collection..." maxlength="50" />
          <button type="button" id="btn-inline-create-col" class="button button-sm">+ Create &amp; Add</button>
        </div>
        <div id="inline-collection-error" class="collection-modal-error" hidden></div>
        <div class="collection-modal-actions" style="margin-top: 18px;">
          <button type="button" class="button primary full-width" data-close>Done</button>
        </div>
      </div>
    `;
  }

  dialogEl.innerHTML = renderModalBody();
  dialogEl.showModal();

  function attachListeners() {
    dialogEl.querySelectorAll('[data-col-toggle]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const colId = checkbox.getAttribute('data-col-toggle');
        togglePaletteInCollection(colId, palette.id);
        dialogEl.innerHTML = renderModalBody();
        attachListeners();
        if (onUpdated) onUpdated();
      });
    });

    const inlineBtn = dialogEl.querySelector('#btn-inline-create-col');
    const inlineInput = dialogEl.querySelector('#inline-collection-name');
    const inlineError = dialogEl.querySelector('#inline-collection-error');

    if (inlineBtn && inlineInput) {
      const handleCreate = () => {
        const name = inlineInput.value.trim();
        const res = createCollection(name);
        if (res.success) {
          addPaletteToCollection(res.collection.id, palette.id);
          dialogEl.innerHTML = renderModalBody();
          attachListeners();
          if (onUpdated) onUpdated();
        } else {
          inlineError.textContent = res.error || 'Could not create collection.';
          inlineError.hidden = false;
          inlineInput.focus();
        }
      };

      inlineBtn.addEventListener('click', handleCreate);
      inlineInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCreate();
        }
      });
    }
  }

  attachListeners();
}

/**
 * Opens import modal with live JSON validation and drag-and-drop
 * @param {HTMLDialogElement} dialogEl
 * @param {Function} onImported
 */
export function openImportCollectionsModal(dialogEl, onImported) {
  if (!dialogEl) return;
  dialogEl.innerHTML = `
    <button class="icon-button dialog-close" data-close aria-label="Close dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="m6 6 12 12M6 18 18 6"/></svg>
    </button>
    <h2>Import Color Collections</h2>
    <div class="collection-modal-body">
      <p style="margin: 0 0 14px; font-size: 13.5px; color: var(--text-muted); line-height: 1.5;">
        Upload a PS Color JSON backup file or paste collection data. Your existing collections will be safely merged.
      </p>
      <div class="import-dropzone" id="import-dropzone-box" role="button" tabindex="0" aria-label="Upload JSON file">
        <input type="file" id="import-file-elem" accept=".json,application/json" style="display:none;" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="28" height="28" style="color:var(--accent); margin-bottom:6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p style="margin:0 0 2px; font-weight:600; font-size:13.5px; color:var(--text-main);">Click to browse or drag JSON file here</p>
        <span style="font-size:11.5px; color:var(--text-subtle);">Supports PS Color v2 collections &amp; legacy favorites</span>
      </div>
      <details style="margin: 14px 0 0; font-size: 12.5px;">
        <summary style="cursor:pointer; color:var(--text-muted); font-weight:600; padding: 4px 0;">Or paste JSON text directly</summary>
        <textarea id="import-textarea-input" class="import-json-textarea" placeholder="Paste collection JSON content here..." rows="4"></textarea>
      </details>
      <div id="import-status-box" class="import-status-box" hidden></div>
      <div class="collection-modal-actions" style="margin-top: 16px;">
        <button type="button" class="button" data-close>Cancel</button>
        <button type="button" id="btn-execute-import" class="button primary" disabled>Import Collections</button>
      </div>
    </div>
  `;
  dialogEl.showModal();

  const dropzone = dialogEl.querySelector('#import-dropzone-box');
  const fileInput = dialogEl.querySelector('#import-file-elem');
  const textarea = dialogEl.querySelector('#import-textarea-input');
  const statusBox = dialogEl.querySelector('#import-status-box');
  const submitBtn = dialogEl.querySelector('#btn-execute-import');

  let validatedResult = null;

  function evaluateInput(rawText) {
    if (!rawText || !rawText.trim()) {
      statusBox.hidden = true;
      submitBtn.disabled = true;
      validatedResult = null;
      return;
    }

    const check = validateAndParseImportJson(rawText);
    statusBox.hidden = false;
    if (check.valid) {
      validatedResult = check.collections;
      statusBox.className = 'import-status-box status-success';
      statusBox.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Ready to import <strong>${check.summary.collectionsCount}</strong> collection(s) with <strong>${check.summary.palettesCount}</strong> palette(s).</span>
      `;
      submitBtn.disabled = false;
    } else {
      validatedResult = null;
      statusBox.className = 'import-status-box status-error';
      statusBox.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${escapeHtml(check.error)}</span>
      `;
      submitBtn.disabled = true;
    }
  }

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const content = String(e.target?.result || '');
      if (textarea) textarea.value = content;
      evaluateInput(content);
    };
    reader.readAsText(file);
  }

  textarea.addEventListener('input', () => evaluateInput(textarea.value));

  submitBtn.addEventListener('click', () => {
    if (validatedResult && validatedResult.length > 0) {
      const outcome = applyImportedCollections(validatedResult);
      dialogEl.close();
      if (onImported) onImported(outcome);
    }
  });
}

