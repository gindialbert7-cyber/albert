/**
 * Book catalog – seed data
 *
 * In production these records come from the backend CMS.
 * Category, layout type, and language flags drive the reader layout engine.
 */

export type BookCategory =
  | 'torah'
  | 'parasha'
  | 'talmud'
  | 'halacha'
  | 'machzor'
  | 'mussar'
  | 'chasidus'
  | 'children'
  | 'modern'
  | 'biography'
  | 'philosophy';

export type LayoutMode =
  | 'bilingual'     // Hebrew right + English left, side by side
  | 'hebrew-only'   // Full-page Hebrew RTL
  | 'english-only'  // Full-page English LTR
  | 'illustrated'   // Image-heavy children's layout
  | 'talmud';       // Daf Yomi style with Rashi/Tosafos columns

export type AgeGroup = 'adult' | 'teen' | 'children' | 'all';

export interface BookAuthor {
  name:    string;
  hebrew?: string;
  years?:  string;   // e.g. "1135–1204"
}

export interface BookChapter {
  id:     string;
  title:  string;
  hebrewTitle?: string;
  pages:  number;
  sample?: string; // preview text snippet
}

export interface Book {
  id:            string;
  title:         string;
  hebrewTitle?:  string;
  subtitle?:     string;
  authors:       BookAuthor[];
  category:      BookCategory;
  subcategory?:  string;
  layout:        LayoutMode;
  ageGroup:      AgeGroup;
  language:      'hebrew' | 'english' | 'bilingual';
  coverGradient: [string, string];   // fallback gradient for cover art
  coverAccent:   string;
  pageCount:     number;
  chapters:      BookChapter[];
  description:   string;
  tags:          string[];
  isFeatured?:   boolean;
  isNew?:        boolean;
  isClassic?:    boolean;
  requiresSub:   boolean;
  publishYear?:  number;
  isbn?:         string;
}

// ─── SEFARIM – CLASSICS ────────────────────────────────────────────────────

export const CLASSIC_SEFARIM: Book[] = [
  {
    id: 'chumash-rashi',
    title: 'Chumash with Rashi',
    hebrewTitle: 'חומש עם פירוש רש"י',
    subtitle: 'The Five Books of Moses with the classic commentary of Rashi',
    authors: [
      { name: 'Moses', hebrew: 'משה רבינו' },
      { name: 'Rashi', hebrew: 'רש"י', years: '1040–1105' },
    ],
    category: 'torah',
    layout: 'bilingual',
    ageGroup: 'all',
    language: 'bilingual',
    coverGradient: ['#1A4A8A', '#0F2A5C'],
    coverAccent: '#C9A84C',
    pageCount: 840,
    isFeatured: true,
    isClassic: true,
    requiresSub: false,
    description:
      'The foundational text of the Jewish people, paired with Rashi's indispensable commentary — the first book printed with Hebrew type and still the essential companion for every Torah student.',
    tags: ['Torah', 'Chumash', 'Rashi', 'Commentary', 'Weekly Parasha'],
    chapters: [
      { id: 'bereishis', title: 'Bereishis', hebrewTitle: 'בְּרֵאשִׁית', pages: 52 },
      { id: 'noach', title: 'Noach', hebrewTitle: 'נֹחַ', pages: 40 },
      { id: 'lech-lecha', title: 'Lech Lecha', hebrewTitle: 'לֶךְ לְךָ', pages: 38 },
      { id: 'vayeira', title: 'Vayeira', hebrewTitle: 'וַיֵּרָא', pages: 44 },
      { id: 'chayei-sarah', title: 'Chayei Sarah', hebrewTitle: 'חַיֵּי שָׂרָה', pages: 32 },
    ],
  },

  {
    id: 'mishnah-complete',
    title: 'Complete Mishnah',
    hebrewTitle: 'ששה סדרי משנה',
    subtitle: 'The Six Orders of the Mishnah with classic commentaries',
    authors: [
      { name: 'Rabbi Yehudah HaNasi', hebrew: 'רבי יהודה הנשיא', years: 'c. 135–217 CE' },
    ],
    category: 'talmud',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#4A1A6A', '#2A0A40'],
    coverAccent: '#C9A84C',
    pageCount: 1240,
    isClassic: true,
    requiresSub: true,
    description:
      'The oral Torah set down in writing — six orders covering every aspect of Jewish life, law, and thought.',
    tags: ['Mishnah', 'Oral Torah', 'Halacha', 'Study'],
    chapters: [
      { id: 'zeraim', title: 'Seder Zeraim', hebrewTitle: 'סדר זרעים', pages: 180 },
      { id: 'moed', title: 'Seder Moed', hebrewTitle: 'סדר מועד', pages: 220 },
      { id: 'nashim', title: 'Seder Nashim', hebrewTitle: 'סדר נשים', pages: 200 },
      { id: 'nezikin', title: 'Seder Nezikin', hebrewTitle: 'סדר נזיקין', pages: 240 },
      { id: 'kodashim', title: 'Seder Kodashim', hebrewTitle: 'סדר קדשים', pages: 200 },
      { id: 'taharos', title: 'Seder Taharos', hebrewTitle: 'סדר טהרות', pages: 200 },
    ],
  },

  {
    id: 'talmud-bavli-berachos',
    title: 'Talmud Bavli – Berachos',
    hebrewTitle: 'גמרא ברכות',
    subtitle: 'With Rashi, Tosafos, and English translation',
    authors: [
      { name: 'Talmudic Sages', hebrew: 'חכמי התלמוד', years: 'c. 200–500 CE' },
    ],
    category: 'talmud',
    layout: 'talmud',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#3A0A4A', '#1E0530'],
    coverAccent: '#E8C547',
    pageCount: 128,
    isClassic: true,
    isFeatured: true,
    requiresSub: true,
    description:
      'The first tractate of the Talmud, covering prayer, blessings, and the Shema — rendered in the classic Vilna folio layout with full Rashi and Tosafos.',
    tags: ['Talmud', 'Gemara', 'Daf Yomi', 'Berachos', 'Prayer'],
    chapters: [
      { id: 'daf-2', title: 'Daf 2a–2b', hebrewTitle: 'דף ב', pages: 2 },
      { id: 'daf-3', title: 'Daf 3a–3b', hebrewTitle: 'דף ג', pages: 2 },
      { id: 'daf-4', title: 'Daf 4a–4b', hebrewTitle: 'דף ד', pages: 2 },
    ],
  },

  {
    id: 'shulchan-aruch',
    title: 'Shulchan Aruch',
    hebrewTitle: 'שולחן ערוך',
    subtitle: 'Code of Jewish Law – Complete Four Parts',
    authors: [
      { name: 'Rabbi Yosef Karo', hebrew: 'רבי יוסף קארו', years: '1488–1575' },
    ],
    category: 'halacha',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#1A3A6A', '#0F2050'],
    coverAccent: '#C9A84C',
    pageCount: 1600,
    isClassic: true,
    requiresSub: true,
    description:
      'The definitive code of Jewish law — Orach Chaim, Yoreh De'ah, Even HaEzer, and Choshen Mishpat — as it has been studied for five centuries.',
    tags: ['Halacha', 'Jewish Law', 'Shulchan Aruch', 'Code'],
    chapters: [
      { id: 'orach-chaim', title: 'Orach Chaim', hebrewTitle: 'אורח חיים', pages: 400 },
      { id: 'yoreh-deah', title: 'Yoreh De\'ah', hebrewTitle: 'יורה דעה', pages: 440 },
      { id: 'even-haezer', title: 'Even HaEzer', hebrewTitle: 'אבן העזר', pages: 340 },
      { id: 'choshen-mishpat', title: 'Choshen Mishpat', hebrewTitle: 'חושן משפט', pages: 420 },
    ],
  },

  {
    id: 'rambam-mishneh-torah',
    title: 'Mishneh Torah',
    hebrewTitle: 'משנה תורה – הרמב"ם',
    subtitle: 'The Complete Code of Maimonides',
    authors: [
      { name: 'Maimonides (Rambam)', hebrew: 'הרמב"ם', years: '1135–1204' },
    ],
    category: 'halacha',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#1A4030', '#0F2520'],
    coverAccent: '#C9A84C',
    pageCount: 1900,
    isClassic: true,
    isFeatured: true,
    requiresSub: true,
    description:
      'Maimonides' monumental 14-volume codification of the entire oral law — written in lucid, elegant Hebrew and covering every topic in halacha.',
    tags: ['Rambam', 'Mishneh Torah', 'Halacha', 'Maimonides', 'Classic'],
    chapters: [
      { id: 'sefer-hamadah', title: 'Sefer HaMadah', hebrewTitle: 'ספר המדע', pages: 120 },
      { id: 'sefer-ahavah', title: 'Sefer Ahavah', hebrewTitle: 'ספר אהבה', pages: 110 },
      { id: 'sefer-zmanim', title: 'Sefer Zmanim', hebrewTitle: 'ספר זמנים', pages: 130 },
    ],
  },

  {
    id: 'pirkei-avos',
    title: 'Pirkei Avos',
    hebrewTitle: 'פרקי אבות',
    subtitle: 'Ethics of the Fathers – with Commentary',
    authors: [
      { name: 'Talmudic Sages', hebrew: 'חכמי התלמוד' },
    ],
    category: 'mussar',
    layout: 'bilingual',
    ageGroup: 'all',
    language: 'bilingual',
    coverGradient: ['#2D5016', '#1A3010'],
    coverAccent: '#E8C547',
    pageCount: 180,
    isClassic: true,
    requiresSub: false,
    description:
      'The beloved tractate of wisdom and ethics — timeless aphorisms from the great sages studied in every Jewish home on Shabbos afternoon.',
    tags: ['Mussar', 'Ethics', 'Avos', 'Wisdom', 'Shabbos'],
    chapters: [
      { id: 'perek-1', title: 'Chapter 1', hebrewTitle: 'פרק א', pages: 28 },
      { id: 'perek-2', title: 'Chapter 2', hebrewTitle: 'פרק ב', pages: 26 },
      { id: 'perek-3', title: 'Chapter 3', hebrewTitle: 'פרק ג', pages: 28 },
      { id: 'perek-4', title: 'Chapter 4', hebrewTitle: 'פרק ד', pages: 30 },
      { id: 'perek-5', title: 'Chapter 5', hebrewTitle: 'פרק ה', pages: 32 },
      { id: 'perek-6', title: 'Chapter 6', hebrewTitle: 'פרק ו', pages: 36 },
    ],
  },

  {
    id: 'tanya',
    title: 'Tanya',
    hebrewTitle: 'תניא – ליקוטי אמרים',
    subtitle: 'Likkutei Amarim — The Foundational Work of Chabad Chassidus',
    authors: [
      { name: 'Rabbi Schneur Zalman of Liadi', hebrew: 'אדמו"ר הזקן', years: '1745–1812' },
    ],
    category: 'chasidus',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#4A1840', '#2A0A28'],
    coverAccent: '#E8C547',
    pageCount: 320,
    isClassic: true,
    isFeatured: true,
    requiresSub: true,
    description:
      'The founding text of Chabad philosophy — a profound guide to the Jewish soul, divine service, and the relationship between G-d and man.',
    tags: ['Chasidus', 'Chabad', 'Tanya', 'Kabbalah', 'Soul'],
    chapters: [
      { id: 'likkutei-amarim', title: 'Likkutei Amarim', hebrewTitle: 'ליקוטי אמרים', pages: 180 },
      { id: 'shaar-hayichud', title: 'Shaar HaYichud VeHaEmunah', hebrewTitle: 'שער היחוד והאמונה', pages: 60 },
      { id: 'iggeret-hateshuva', title: 'Iggeret HaTeshuvah', hebrewTitle: 'אגרת התשובה', pages: 40 },
      { id: 'iggeret-hakodesh', title: 'Iggeret HaKodesh', hebrewTitle: 'אגרת הקדש', pages: 40 },
    ],
  },

  {
    id: 'mesilat-yesharim',
    title: 'Mesilat Yesharim',
    hebrewTitle: 'מסילת ישרים',
    subtitle: 'The Path of the Just',
    authors: [
      { name: 'Rabbi Moshe Chaim Luzzatto (Ramchal)', hebrew: 'רמח"ל', years: '1707–1746' },
    ],
    category: 'mussar',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#1A4A2A', '#0F2818'],
    coverAccent: '#C9A84C',
    pageCount: 240,
    isClassic: true,
    requiresSub: true,
    description:
      'The Ramchal's masterwork on character refinement and spiritual ascent — arguably the most influential work of Jewish ethics of the past 300 years.',
    tags: ['Mussar', 'Ramchal', 'Ethics', 'Character', 'Spirituality'],
    chapters: [
      { id: 'intro', title: 'Introduction', hebrewTitle: 'הקדמה', pages: 12 },
      { id: 'zerizus', title: 'Alacrity', hebrewTitle: 'זריזות', pages: 20 },
      { id: 'nekius', title: 'Cleanliness', hebrewTitle: 'נקיות', pages: 20 },
      { id: 'perishus', title: 'Separation', hebrewTitle: 'פרישות', pages: 20 },
      { id: 'tahara', title: 'Purity', hebrewTitle: 'טהרה', pages: 20 },
    ],
  },

  {
    id: 'kitzur-shulchan-aruch',
    title: 'Kitzur Shulchan Aruch',
    hebrewTitle: 'קיצור שולחן ערוך',
    subtitle: 'The Concise Code of Jewish Law',
    authors: [
      { name: 'Rabbi Shlomo Ganzfried', hebrew: 'רב שלמה גנצפריד', years: '1804–1886' },
    ],
    category: 'halacha',
    layout: 'bilingual',
    ageGroup: 'all',
    language: 'bilingual',
    coverGradient: ['#1A2A5A', '#0F1838'],
    coverAccent: '#C9A84C',
    pageCount: 480,
    isClassic: true,
    requiresSub: true,
    description:
      'The beloved condensed guide to daily Jewish law — clear, practical, and accessible to every Jew.',
    tags: ['Halacha', 'Jewish Law', 'Daily Practice', 'Kitzur'],
    chapters: [
      { id: 'morning', title: 'Morning Conduct', hebrewTitle: 'הנהגת הבוקר', pages: 30 },
      { id: 'tefilla', title: 'Prayer', hebrewTitle: 'תפילה', pages: 50 },
      { id: 'shabbos', title: 'Shabbos', hebrewTitle: 'שבת', pages: 80 },
      { id: 'yom-tov', title: 'Yom Tov', hebrewTitle: 'יום טוב', pages: 60 },
    ],
  },
];

// ─── MODERN JEWISH BOOKS ────────────────────────────────────────────────────

export const MODERN_BOOKS: Book[] = [
  {
    id: 'rabbi-sacks-great-partnership',
    title: 'The Great Partnership',
    subtitle: 'Science, Religion, and the Search for Meaning',
    authors: [{ name: 'Rabbi Lord Jonathan Sacks', years: '1948–2020' }],
    category: 'philosophy',
    layout: 'english-only',
    ageGroup: 'adult',
    language: 'english',
    coverGradient: ['#1A3A6A', '#0F2050'],
    coverAccent: '#C9A84C',
    pageCount: 320,
    isNew: false,
    isFeatured: true,
    requiresSub: true,
    description:
      'Rabbi Sacks's profound exploration of how science and religion are not enemies but partners in humanity's search for meaning.',
    tags: ['Rabbi Sacks', 'Philosophy', 'Science', 'Religion', 'Meaning'],
    chapters: [
      { id: 'ch1', title: 'The Conflict That Never Was', pages: 30 },
      { id: 'ch2', title: 'The Two Modes of the Mind', pages: 28 },
    ],
  },

  {
    id: 'rabbi-sacks-dignity-of-difference',
    title: 'The Dignity of Difference',
    subtitle: 'How to Avoid the Clash of Civilizations',
    authors: [{ name: 'Rabbi Lord Jonathan Sacks', years: '1948–2020' }],
    category: 'modern',
    layout: 'english-only',
    ageGroup: 'adult',
    language: 'english',
    coverGradient: ['#2A1A6A', '#180F40'],
    coverAccent: '#E8C547',
    pageCount: 240,
    requiresSub: true,
    description:
      'A visionary call for a new global ethic of coexistence, rooted in the profound Jewish insight that difference itself is sacred.',
    tags: ['Rabbi Sacks', 'Ethics', 'Society', 'Difference', 'Peace'],
    chapters: [
      { id: 'ch1', title: 'The Universality of Difference', pages: 32 },
    ],
  },

  {
    id: 'rav-soloveitchik-lonely-man',
    title: 'The Lonely Man of Faith',
    authors: [{ name: 'Rabbi Joseph B. Soloveitchik', years: '1903–1993' }],
    category: 'philosophy',
    layout: 'english-only',
    ageGroup: 'adult',
    language: 'english',
    coverGradient: ['#0A1E2A', '#050F15'],
    coverAccent: '#C9A84C',
    pageCount: 128,
    isClassic: true,
    isFeatured: true,
    requiresSub: true,
    description:
      'The Rav's iconic meditation on the dual nature of man as reflected in the two creation narratives — one of the great works of 20th-century Jewish thought.',
    tags: ['Soloveitchik', 'Philosophy', 'Modern Orthodox', 'Faith'],
    chapters: [
      { id: 'adam1', title: 'Adam the First', pages: 32 },
      { id: 'adam2', title: 'Adam the Second', pages: 36 },
      { id: 'confrontation', title: 'The Confrontation', pages: 28 },
    ],
  },

  {
    id: 'night-wiesel',
    title: 'Night',
    authors: [{ name: 'Elie Wiesel', years: '1928–2016' }],
    category: 'biography',
    layout: 'english-only',
    ageGroup: 'teen',
    language: 'english',
    coverGradient: ['#0A0A0A', '#1A1A1A'],
    coverAccent: '#E8C547',
    pageCount: 120,
    isFeatured: true,
    requiresSub: true,
    description:
      'Elie Wiesel's devastating and transcendent memoir of his experience as a teenager in the Nazi concentration camps.',
    tags: ['Holocaust', 'Memoir', 'Wiesel', 'History'],
    chapters: [
      { id: 'ch1', title: 'Part One', pages: 24 },
      { id: 'ch2', title: 'Part Two', pages: 22 },
      { id: 'ch3', title: 'Part Three', pages: 22 },
    ],
  },
];

// ─── CHILDREN'S BOOKS ───────────────────────────────────────────────────────

export const CHILDRENS_BOOKS: Book[] = [
  {
    id: 'aleph-beis-adventure',
    title: 'The Aleph-Beis Adventure',
    subtitle: 'A journey through every letter of the Hebrew alphabet',
    authors: [{ name: 'Devorah Leah Kessler' }],
    category: 'children',
    layout: 'illustrated',
    ageGroup: 'children',
    language: 'bilingual',
    coverGradient: ['#C0392B', '#922B21'],
    coverAccent: '#F4D03F',
    pageCount: 64,
    isNew: true,
    requiresSub: true,
    description:
      'A magical illustrated journey through the Hebrew alphabet, bringing each letter to life with vivid art and joyful rhymes.',
    tags: ['Children', 'Aleph Beis', 'Hebrew', 'Learning', 'Illustrated'],
    chapters: [
      { id: 'aleph', title: 'Aleph', hebrewTitle: 'אלף', pages: 2 },
      { id: 'beis', title: 'Beis', hebrewTitle: 'בית', pages: 2 },
      { id: 'gimmel', title: 'Gimmel', hebrewTitle: 'גימל', pages: 2 },
    ],
  },

  {
    id: 'shabbos-candles',
    title: 'The Shabbos Candles',
    subtitle: 'When Mama lights the candles, the whole world glows',
    authors: [{ name: 'Miriam Goldstein' }],
    category: 'children',
    layout: 'illustrated',
    ageGroup: 'children',
    language: 'english',
    coverGradient: ['#F39C12', '#D68910'],
    coverAccent: '#FDFAF4',
    pageCount: 40,
    isNew: true,
    isFeatured: true,
    requiresSub: true,
    description:
      'A warm and luminous picture book about the magic of Shabbos candles and the love between a mother and child.',
    tags: ['Children', 'Shabbos', 'Family', 'Picture Book'],
    chapters: [
      { id: 'story', title: 'The Story', pages: 40 },
    ],
  },

  {
    id: 'brave-little-maccabee',
    title: 'The Brave Little Maccabee',
    subtitle: 'A Chanukah Story',
    authors: [{ name: 'Yosef Lewin' }],
    category: 'children',
    layout: 'illustrated',
    ageGroup: 'children',
    language: 'english',
    coverGradient: ['#1A5F8A', '#0F3A58'],
    coverAccent: '#E8C547',
    pageCount: 48,
    isNew: false,
    requiresSub: true,
    description:
      'Join young Elazar on a brave adventure to light the menorah and bring miracles to the whole village.',
    tags: ['Children', 'Chanukah', 'Adventure', 'Picture Book'],
    chapters: [
      { id: 'story', title: 'The Story', pages: 48 },
    ],
  },

  {
    id: 'passover-seder-night',
    title: 'The Night of the Seder',
    subtitle: 'A Passover Story for Young Readers',
    authors: [{ name: 'Chaya Weiss' }],
    category: 'children',
    layout: 'illustrated',
    ageGroup: 'children',
    language: 'english',
    coverGradient: ['#8E44AD', '#5B2C6F'],
    coverAccent: '#F8C471',
    pageCount: 56,
    isNew: true,
    isFeatured: true,
    requiresSub: true,
    description:
      'Young Rivka asks the Four Questions and discovers the meaning of freedom in this gorgeous Passover story.',
    tags: ['Children', 'Passover', 'Pesach', 'Seder', 'Freedom'],
    chapters: [
      { id: 'story', title: 'The Story', pages: 56 },
    ],
  },
];

// ─── COMBINED CATALOG ───────────────────────────────────────────────────────

export const ALL_BOOKS: Book[] = [
  ...CLASSIC_SEFARIM,
  ...MODERN_BOOKS,
  ...CHILDRENS_BOOKS,
];

export const FEATURED_BOOKS = ALL_BOOKS.filter(b => b.isFeatured);

export const NEW_BOOKS = ALL_BOOKS.filter(b => b.isNew);

export const FREE_BOOKS = ALL_BOOKS.filter(b => !b.requiresSub);

export const CATEGORY_LABELS: Record<BookCategory, string> = {
  torah:       'Torah',
  parasha:     'Parasha',
  talmud:      'Talmud',
  halacha:     'Halacha',
  machzor:     'Machzor',
  mussar:      'Mussar',
  chasidus:    'Chassidus',
  children:    "Children's Books",
  modern:      'Modern Jewish',
  biography:   'Biography',
  philosophy:  'Jewish Thought',
};

export const CATEGORY_HEBREW: Partial<Record<BookCategory, string>> = {
  torah:    'תורה',
  parasha:  'פרשה',
  talmud:   'גמרא',
  halacha:  'הלכה',
  mussar:   'מוסר',
  chasidus: 'חסידות',
};

export const SECTIONS = [
  { key: 'featured',  label: 'Featured',          books: FEATURED_BOOKS },
  { key: 'classics',  label: 'Classic Sefarim',    books: CLASSIC_SEFARIM },
  { key: 'children',  label: "Children's Books",   books: CHILDRENS_BOOKS },
  { key: 'modern',    label: 'Modern Jewish Books', books: MODERN_BOOKS },
  { key: 'free',      label: 'Free to Read',        books: FREE_BOOKS },
] as const;
