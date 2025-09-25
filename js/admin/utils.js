import { db, ref, get } from '../firebase-config.js';

// Находит ключ по полю id в коллекции Realtime DB (поддерживает массив или объект)
export async function findKeyById(collectionPath, id) {
  const refCol = ref(db, collectionPath);
  const snap = await get(refCol);
  const val = snap.val();
  if (!val) return null;
  if (Array.isArray(val)) {
    const idx = val.findIndex(x => x && x.id === id);
    return idx === -1 ? null : String(idx);
  }
  const key = Object.keys(val).find(k => val[k] && val[k].id === id);
  return key || null;
}
