/** Judgment duration options: أسبوع → أسبوعين → ثلاث أسابيع → شهر … 36 شهراً */

function monthLabel(n: number) {
  const named: Record<number, string> = {
    1: 'شهر',
    2: 'شهرين',
    3: 'ثلاثة أشهر',
    4: 'أربعة أشهر',
    5: 'خمسة أشهر',
    6: 'ستة أشهر',
    7: 'سبعة أشهر',
    8: 'ثمانية أشهر',
    9: 'تسعة أشهر',
    10: 'عشرة أشهر',
    11: 'أحد عشر شهراً',
    12: 'اثنا عشر شهراً',
    18: 'ثمانية عشر شهراً',
    24: 'أربعة وعشرون شهراً',
    30: 'ثلاثون شهراً',
    36: 'ستة وثلاثون شهراً',
  };
  return named[n] || `${n} شهراً`;
}

export type SentenceOption = {
  id: string;
  name: string;
  unit: 'week' | 'month';
  value: number;
};

export const SENTENCE_OPTIONS: SentenceOption[] = [
  { id: 'w1', name: 'أسبوع', unit: 'week', value: 1 },
  { id: 'w2', name: 'أسبوعين', unit: 'week', value: 2 },
  { id: 'w3', name: 'ثلاث أسابيع', unit: 'week', value: 3 },
  ...Array.from({ length: 36 }, (_, i) => {
    const months = i + 1;
    return {
      id: `m${months}`,
      name: monthLabel(months),
      unit: 'month' as const,
      value: months,
    };
  }),
];
