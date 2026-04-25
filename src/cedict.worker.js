// cedict.worker.js
// Runs in a Web Worker: fetches CC-CEDICT, parses it, populates IndexedDB.
// The main thread opens its own read-only connection for queries.

const DB_NAME    = 'wordarin-cedict';
const DB_VERSION = 2;  // bumped to add definition field
const STORE      = 'entries';
const BATCH_SIZE = 1000;

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      // Delete old store so we re-populate with definition field
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE);
      }
      const store = db.createObjectStore(STORE, { autoIncrement: true });
      store.createIndex('pinyin', 'pinyin', { unique: false });
      store.createIndex('hanzi',  'hanzi',  { unique: false });
    };
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = e => reject(e.target.error);
  });
}

function countEntries(db) {
  return new Promise(resolve => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = ()  => resolve(0);
  });
}

function batchInsert(db, entries) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const e of entries) store.add(e);
    tx.oncomplete = resolve;
    tx.onerror    = ev => reject(ev.target.error);
  });
}

// ── CC-CEDICT parser ──────────────────────────────────────────────────────────
// Format: Traditional Simplified [pin1 yin1] /def1/def2/
const LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s*(.*)/;

function parsePinyin(raw) {
  // "ni3 hao3" → "nihao"  |  "lu:4" → "lv"
  return raw
    .split(' ')
    .map(s => s.replace(/u:/g, 'v').replace(/[1-5]/g, '').toLowerCase())
    .join('');
}

function parsePinyinToned(raw) {
  // "ni3 hao3" → "nǐ hǎo" using tone number → diacritic conversion
  return raw.split(' ').map(syllable => {
    const tone = parseInt(syllable.slice(-1), 10);
    const base = syllable.slice(0, -1).replace(/u:/g, 'ü').toLowerCase();
    if (!tone || tone === 5) return base;
    const MAP = {
      a: ['ā','á','ǎ','à'], e: ['ē','é','ě','è'],
      i: ['ī','í','ǐ','ì'], o: ['ō','ó','ǒ','ò'],
      u: ['ū','ú','ǔ','ù'], ü: ['ǖ','ǘ','ǚ','ǜ'],
    };
    // Apply tone to the right vowel (last a/e, or last vowel in ui/iu)
    for (const v of ['a','e','ou','ui','iu','o','i','u','ü']) {
      const idx = base.lastIndexOf(v[0]);
      if (idx >= 0 && MAP[v[0]]) {
        return base.slice(0, idx) + MAP[v[0]][tone - 1] + base.slice(idx + 1);
      }
    }
    return base;
  }).join(' ');
}

function parseDefinition(raw) {
  // raw: "/def1/def2/def3/"  → "def1; def2; def3"
  return raw.replace(/^\/|\/$/g, '').split('/').filter(Boolean).join('; ');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const db    = await openDB();
  const count = await countEntries(db);

  if (count > 50_000) {
    // Already populated from a previous visit
    self.postMessage({ type: 'ready', count });
    db.close();
    return;
  }

  self.postMessage({ type: 'loading', progress: 0, inserted: 0 });

  const resp = await fetch('/cedict_ts.u8');
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching cedict_ts.u8`);

  const text  = await resp.text();
  const lines = text.split('\n');
  const total = lines.length;

  let batch    = [];
  let inserted = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const m = LINE_RE.exec(line);
    if (!m) continue;

    const hanzi      = m[2];                    // simplified
    const pinyin     = parsePinyin(m[3]);       // bare key (for index)
    const pinyinTone = parsePinyinToned(m[3]);  // toned display pinyin
    const definition = parseDefinition(m[4]);   // English definitions

    if (!pinyin || !hanzi) continue;

    batch.push({ pinyin, pinyinTone, hanzi, definition });

    if (batch.length >= BATCH_SIZE) {
      await batchInsert(db, batch);
      inserted += batch.length;
      batch = [];
      self.postMessage({
        type: 'loading',
        progress: Math.round(i / total * 100),
        inserted,
      });
    }
  }

  if (batch.length > 0) {
    await batchInsert(db, batch);
    inserted += batch.length;
  }

  self.postMessage({ type: 'ready', count: inserted });
  db.close();
}

main().catch(err => {
  self.postMessage({ type: 'error', message: err.message });
});
