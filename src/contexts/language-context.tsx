const AR: Record<string, string> = {
  'signContract.profileSignature': 'توقيعك',
  'signContract.profileSeal': 'الختم',
  'signContract.chooseFavoriteColor': 'اختر اللون المفضل',
  'signContract.placeSignature': 'ضع التوقيع على الملف',
  'signContract.placeSeal': 'ضع الختم على الملف',
  'signContract.bold': 'عريض',
  'signContract.italic': 'مائل',
  'signContract.underline': 'تسطير',
  'signContract.alignLeft': 'محاذاة لليسار',
  'signContract.alignCenter': 'توسيط',
  'signContract.alignRight': 'محاذاة لليمين',
  'signContract.decreaseFont': 'تصغير الخط',
  'signContract.increaseFont': 'تكبير الخط',
  'signContract.textFontSize': 'حجم الخط',
  'signContract.textColor': 'لون النص',
  'signContract.richTextPlaceholder': 'اكتب أو الصق نصاً منسقاً',
};

type Translate = {
  (key: string, fallback?: string): string;
  withVars: (key: string, vars: Record<string, unknown>, fallback?: string) => string;
};

export function useLanguage() {
  const t = ((key: string, fallback?: string) => AR[key] || fallback || key) as Translate;
  t.withVars = (_key, _vars, fallback) => fallback || _key;
  return { t };
}
