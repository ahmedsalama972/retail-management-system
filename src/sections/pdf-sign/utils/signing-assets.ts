import { getStoredUser } from 'src/utils/user-role';
import { fileUrl } from 'src/sections/legal-cases/utils';

const LEGACY_SIGNATURE_KEY = 'rlcms_e_signature';
const LEGACY_SEAL_KEY = 'rlcms_seal';

function currentUserId() {
  const id = getStoredUser()?.id;
  return typeof id === 'number' && id > 0 ? String(id) : null;
}

/** Make signature/seal URLs usable by <img> / pdf-lib (absolute API host for /storage paths). */
export function resolveSigningAssetUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return fileUrl(url) || null;
}

function signatureKey(userId?: string | null) {
  const id = userId ?? currentUserId();
  return id ? `rlcms_e_signature_u${id}` : LEGACY_SIGNATURE_KEY;
}

function sealKey(userId?: string | null) {
  const id = userId ?? currentUserId();
  return id ? `rlcms_seal_u${id}` : LEGACY_SEAL_KEY;
}

export function getStoredSignature() {
  const id = currentUserId();
  if (!id) return null;
  return localStorage.getItem(signatureKey(id));
}

export function setStoredSignature(dataUrl: string | null) {
  const id = currentUserId();
  if (!id) return;
  const key = signatureKey(id);
  if (!dataUrl) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, dataUrl);
}

export function getStoredSeal() {
  const id = currentUserId();
  if (!id) return null;
  return localStorage.getItem(sealKey(id));
}

export function setStoredSeal(dataUrl: string | null) {
  const id = currentUserId();
  if (!id) return;
  const key = sealKey(id);
  if (!dataUrl) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, dataUrl);
}

/** Sync browser cache from API for the logged-in user only */
export function syncStoredSigningAssets(assets?: {
  signature_url?: string | null;
  seal_url?: string | null;
  has_signature?: boolean;
  has_seal?: boolean;
} | null) {
  const id = currentUserId();
  if (!id) return;

  if (assets?.signature_url) {
    setStoredSignature(resolveSigningAssetUrl(assets.signature_url));
  } else if (!assets?.has_signature) {
    setStoredSignature(null);
  }

  if (assets?.seal_url) {
    setStoredSeal(resolveSigningAssetUrl(assets.seal_url));
  } else if (!assets?.has_seal) {
    setStoredSeal(null);
  }
}

/** Remove legacy shared keys + current user's cached assets (call on logout) */
export function clearStoredSigningAssets() {
  localStorage.removeItem(LEGACY_SIGNATURE_KEY);
  localStorage.removeItem(LEGACY_SEAL_KEY);

  const id = currentUserId();
  if (id) {
    localStorage.removeItem(signatureKey(id));
    localStorage.removeItem(sealKey(id));
  }

  // Also wipe any other per-user signature keys left from prior sessions
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('rlcms_e_signature') || key.startsWith('rlcms_seal'))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => localStorage.removeItem(key));
}

export function isESignaturePlacement(item: { kind?: string | null }) {
  return item.kind !== 'seal';
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}
