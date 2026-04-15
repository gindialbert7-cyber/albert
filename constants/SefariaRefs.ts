/**
 * SefariaRefs — maps Albert book IDs to Sefaria API reference strings.
 *
 * Sefaria API: GET https://www.sefaria.org/api/texts/{ref}
 * Ref format:  "Genesis.1"  "Pirkei_Avot.1"  "Berakhot.2a"
 *
 * Each entry can specify:
 *   ref          — top-level Sefaria book ref (used for TOC / index)
 *   chapterRefs  — ordered array of per-chapter refs matching Albert's chapters[]
 *   type         — 'tanach' | 'mishna' | 'talmud' | 'halacha' | 'machshava' | 'other'
 *   commentary   — true if this book has Rashi/commentary layer to fetch alongside
 */

export interface SefariaBookRef {
  ref:          string;
  chapterRefs?: string[];
  type:         'tanach' | 'mishna' | 'talmud' | 'halacha' | 'machshava' | 'other';
  commentary?:  boolean;
  heTitle?:     string;
}

const CHUMASH_CHAPTERS = (book: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${book}.${i + 1}`);

export const SEFARIA_REFS: Record<string, SefariaBookRef> = {

  // ── Torah ─────────────────────────────────────────────────────────────────

  'chumash-rashi': {
    ref:         'Genesis',
    type:        'tanach',
    commentary:  true,
    chapterRefs: CHUMASH_CHAPTERS('Genesis', 50),
  },

  'ramban-commentary': {
    ref:         'Ramban on Genesis',
    type:        'tanach',
    chapterRefs: CHUMASH_CHAPTERS('Ramban on Genesis', 50),
  },

  // ── Tehillim ─────────────────────────────────────────────────────────────

  'tehillim': {
    ref:         'Psalms',
    type:        'tanach',
    chapterRefs: CHUMASH_CHAPTERS('Psalms', 150),
  },

  // ── Mishnah ──────────────────────────────────────────────────────────────

  'mishnah-complete': {
    ref:  'Mishnah',
    type: 'mishna',
    chapterRefs: [
      'Mishnah Berakhot',
      'Mishnah Peah',
      'Mishnah Demai',
      'Mishnah Kilayim',
      'Mishnah Shabbat',
      'Mishnah Eruvin',
      'Mishnah Pesachim',
      'Mishnah Yoma',
      'Mishnah Sukkah',
      'Mishnah Beitzah',
      'Mishnah Rosh Hashanah',
      'Mishnah Taanit',
      'Mishnah Megillah',
      'Mishnah Yevamot',
      'Mishnah Ketubot',
      'Mishnah Nedarim',
      'Mishnah Gittin',
      'Mishnah Kiddushin',
      'Mishnah Bava Kamma',
      'Mishnah Bava Metzia',
      'Mishnah Bava Batra',
      'Mishnah Sanhedrin',
      'Mishnah Makkot',
      'Mishnah Shevuot',
      'Mishnah Avot',
    ],
  },

  'pirkei-avos': {
    ref:  'Pirkei Avot',
    type: 'mishna',
    chapterRefs: [
      'Pirkei Avot.1',
      'Pirkei Avot.2',
      'Pirkei Avot.3',
      'Pirkei Avot.4',
      'Pirkei Avot.5',
      'Pirkei Avot.6',
    ],
  },

  // ── Talmud ────────────────────────────────────────────────────────────────

  'talmud-bavli-berachos': {
    ref:  'Berakhot',
    type: 'talmud',
    chapterRefs: Array.from({ length: 64 }, (_, i) => {
      const daf = i + 2;
      return [`Berakhot.${daf}a`, `Berakhot.${daf}b`];
    }).flat(),
  },

  // ── Halacha ───────────────────────────────────────────────────────────────

  'rambam-mishneh-torah': {
    ref:  'Mishneh Torah',
    type: 'halacha',
    chapterRefs: [
      'Mishneh Torah, Human Dispositions',
      'Mishneh Torah, Torah Study',
      'Mishneh Torah, Prayer and the Priestly Blessing',
      'Mishneh Torah, Shabbat',
      'Mishneh Torah, Repentance',
      'Mishneh Torah, Gifts to the Poor',
      'Mishneh Torah, Kings and Wars',
    ],
  },

  'shulchan-aruch': {
    ref:  'Shulchan Arukh',
    type: 'halacha',
    chapterRefs: [
      'Shulchan Arukh, Orach Chayim.1',
      'Shulchan Arukh, Orach Chayim.2',
      'Shulchan Arukh, Orach Chayim.3',
      'Shulchan Arukh, Orach Chayim.4',
      'Shulchan Arukh, Orach Chayim.25',
      'Shulchan Arukh, Orach Chayim.271',
      'Shulchan Arukh, Orach Chayim.472',
    ],
  },

  'kitzur-shulchan-aruch': {
    ref:  'Kitzur Shulchan Arukh',
    type: 'halacha',
    chapterRefs: Array.from({ length: 30 }, (_, i) =>
      `Kitzur Shulchan Arukh.${i + 1}`,
    ),
  },

  // ── Machshava / Philosophy ────────────────────────────────────────────────

  'tanya': {
    ref:  'Tanya',
    type: 'machshava',
    chapterRefs: Array.from({ length: 53 }, (_, i) =>
      `Tanya, Likutei Amarim, Chapter ${i + 1}`,
    ),
  },

  'mesilat-yesharim': {
    ref:  'Mesillat Yesharim',
    type: 'machshava',
    chapterRefs: Array.from({ length: 26 }, (_, i) =>
      `Mesillat Yesharim.${i + 1}`,
    ),
  },

  'chovas-halevavos': {
    ref:  'Duties of the Heart',
    type: 'machshava',
    chapterRefs: [
      'Duties of the Heart, Introduction',
      'Duties of the Heart, Gate of Divine Unity.1',
      'Duties of the Heart, Gate of Reflection.1',
      'Duties of the Heart, Gate of Trust.1',
      'Duties of the Heart, Gate of Wholehearted Devotion.1',
      'Duties of the Heart, Gate of Humility.1',
      'Duties of the Heart, Gate of Repentance.1',
      'Duties of the Heart, Gate of Self-Accounting.1',
      'Duties of the Heart, Gate of Abstinence.1',
      'Duties of the Heart, Gate of Love of God.1',
    ],
  },

  'kuzari': {
    ref:  'Kuzari',
    type: 'machshava',
    chapterRefs: [
      'Kuzari.1.1',
      'Kuzari.1.25',
      'Kuzari.2.1',
      'Kuzari.3.1',
      'Kuzari.4.1',
      'Kuzari.5.1',
    ],
  },

  'derech-hashem': {
    ref:  'Derech Hashem',
    type: 'machshava',
    chapterRefs: [
      'Derech Hashem.1.1',
      'Derech Hashem.1.2',
      'Derech Hashem.2.1',
      'Derech Hashem.3.1',
      'Derech Hashem.4.1',
    ],
  },

  'nefesh-hachaim': {
    ref:  'Nefesh HaChaim',
    type: 'machshava',
    chapterRefs: [
      'Nefesh HaChaim, Gate 1.1',
      'Nefesh HaChaim, Gate 2.1',
      'Nefesh HaChaim, Gate 3.1',
      'Nefesh HaChaim, Gate 4.1',
    ],
  },

  'orchos-tzaddikim': {
    ref:  'Orchot Tzaddikim',
    type: 'machshava',
    chapterRefs: Array.from({ length: 10 }, (_, i) =>
      `Orchot Tzaddikim.${i + 1}`,
    ),
  },

  'igrot-haramban': {
    ref:  'Iggeret HaRamban',
    type: 'machshava',
    chapterRefs: ['Iggeret HaRamban'],
  },

  // ── Prayer ────────────────────────────────────────────────────────────────

  'siddur-complete': {
    ref:  'Siddur Ashkenaz',
    type: 'other',
    chapterRefs: [
      'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani',
      'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Morning Blessings',
      'Siddur Ashkenaz, Weekday, Shacharit, Pesukei D\'Zimra, Barukh She\'Amar',
      'Siddur Ashkenaz, Weekday, Shacharit, Amidah',
      'Siddur Ashkenaz, Weekday, Mincha, Amidah',
      'Siddur Ashkenaz, Weekday, Arvit, Shema',
    ],
  },

  'haggadah-pesach': {
    ref:  'Pesach Haggadah',
    type: 'other',
    chapterRefs: [
      'Pesach Haggadah, Kadesh',
      'Pesach Haggadah, Maggid, Ha Lachma Anya',
      'Pesach Haggadah, Maggid, The Four Children',
      'Pesach Haggadah, Maggid, The Ten Plagues',
      'Pesach Haggadah, Maggid, Dayenu',
      'Pesach Haggadah, Hallel, First Half of Hallel',
    ],
  },
};

/**
 * Returns the Sefaria ref config for a given Albert book ID, or null if unmapped.
 */
export function getSefariaRef(bookId: string): SefariaBookRef | null {
  return SEFARIA_REFS[bookId] ?? null;
}

/**
 * Returns the Sefaria chapter ref for a specific Albert chapter index.
 */
export function getSefariaChapterRef(bookId: string, chapterIdx: number): string | null {
  const entry = SEFARIA_REFS[bookId];
  if (!entry) return null;
  if (entry.chapterRefs && chapterIdx < entry.chapterRefs.length) {
    return entry.chapterRefs[chapterIdx];
  }
  // Fallback: append chapter number to base ref
  return `${entry.ref}.${chapterIdx + 1}`;
}
