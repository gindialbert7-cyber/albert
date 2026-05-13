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
      "The foundational text of the Jewish people, paired with Rashi's indispensable commentary — the first book printed with Hebrew type and still the essential companion for every Torah student.",
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
      "The definitive code of Jewish law — Orach Chaim, Yoreh De'ah, Even HaEzer, and Choshen Mishpat — as it has been studied for five centuries.",
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
      "Maimonides' monumental 14-volume codification of the entire oral law — written in lucid, elegant Hebrew and covering every topic in halacha.",
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
      "The Ramchal's masterwork on character refinement and spiritual ascent — arguably the most influential work of Jewish ethics of the past 300 years.",
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

// ─── ALBERT ORIGINAL BOOKS ──────────────────────────────────────────────────
// Placeholder for Albert's own commissioned and licensed content.
// Populate via scripts/upload-book.ts after receiving rights clearance.

export const ORIGINAL_BOOKS: Book[] = [];

// kept for back-compat during transition — remove after full migration
export const MODERN_BOOKS = ORIGINAL_BOOKS;

// Copyrighted titles removed. Add Albert originals here via upload-book.ts.

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

// ─── PRAYER & LITURGY ───────────────────────────────────────────────────────

export const PRAYER_BOOKS: Book[] = [
  {
    id: 'siddur-complete',
    title: 'Complete Siddur',
    hebrewTitle: 'סידור השלם',
    subtitle: 'Daily Prayer with Hebrew and English',
    authors: [{ name: 'Traditional Liturgy', hebrew: 'נוסח אשכנז' }],
    category: 'machzor',
    layout: 'bilingual',
    ageGroup: 'all',
    language: 'bilingual',
    coverGradient: ['#1A3A8A', '#0D2060'],
    coverAccent: '#E8C547',
    pageCount: 540,
    isClassic: true,
    requiresSub: false,
    description: 'The complete daily, Shabbos, and Yom Tov prayer service — Shacharis, Mincha, and Maariv — with the full Hebrew text alongside a flowing English translation.',
    tags: ['Siddur', 'Prayer', 'Tefilla', 'Shacharis', 'Mincha', 'Maariv'],
    chapters: [
      { id: 'morning', title: 'Morning Prayers', hebrewTitle: 'שחרית', pages: 80 },
      { id: 'shacharis', title: 'Shemoneh Esrei', hebrewTitle: 'שמונה עשרה', pages: 40 },
      { id: 'mincha', title: 'Afternoon Prayers', hebrewTitle: 'מנחה', pages: 30 },
      { id: 'maariv', title: 'Evening Prayers', hebrewTitle: 'מעריב', pages: 30 },
      { id: 'shabbos', title: 'Shabbos Prayers', hebrewTitle: 'תפילות שבת', pages: 100 },
    ],
  },
  {
    id: 'haggadah-pesach',
    title: 'Passover Haggadah',
    hebrewTitle: 'הגדה של פסח',
    subtitle: 'The Complete Seder with Commentary',
    authors: [{ name: 'Traditional Text', hebrew: 'נוסח מסורתי' }],
    category: 'machzor',
    layout: 'bilingual',
    ageGroup: 'all',
    language: 'bilingual',
    coverGradient: ['#6B2FA0', '#3D1A5E'],
    coverAccent: '#F8C471',
    pageCount: 120,
    isClassic: true,
    isNew: false,
    isFeatured: true,
    requiresSub: false,
    description: 'The complete Passover Haggadah with the full Seder night service, Hebrew text, English translation, and illuminating commentary on every passage.',
    tags: ['Pesach', 'Passover', 'Seder', 'Haggadah', 'Freedom'],
    chapters: [
      { id: 'kadesh', title: 'Kadesh — Sanctification', hebrewTitle: 'קדש', pages: 8 },
      { id: 'magid', title: 'Maggid — Telling the Story', hebrewTitle: 'מגיד', pages: 50 },
      { id: 'hallel', title: 'Hallel — Songs of Praise', hebrewTitle: 'הלל', pages: 30 },
      { id: 'nirtzah', title: 'Nirtzah — Conclusion', hebrewTitle: 'נרצה', pages: 20 },
    ],
  },
  {
    id: 'tehillim',
    title: 'Sefer Tehillim',
    hebrewTitle: 'ספר תהלים',
    subtitle: 'The Book of Psalms — Complete Hebrew with Commentary',
    authors: [{ name: 'King David', hebrew: 'דוד המלך' }],
    category: 'torah',
    layout: 'bilingual',
    ageGroup: 'all',
    language: 'bilingual',
    coverGradient: ['#1A4A6A', '#0E2840'],
    coverAccent: '#E8C547',
    pageCount: 380,
    isClassic: true,
    requiresSub: false,
    description: 'The complete Book of Psalms — 150 chapters of prayer, praise, and petition from King David. Read daily for protection, healing, and spiritual elevation.',
    tags: ['Tehillim', 'Psalms', 'Prayer', 'King David', 'Healing'],
    chapters: [
      { id: 'book1', title: 'Book One (1–41)', hebrewTitle: 'ספר ראשון', pages: 60 },
      { id: 'book2', title: 'Book Two (42–72)', hebrewTitle: 'ספר שני', pages: 50 },
      { id: 'book3', title: 'Book Three (73–89)', hebrewTitle: 'ספר שלישי', pages: 40 },
      { id: 'book4', title: 'Book Four (90–106)', hebrewTitle: 'ספר רביעי', pages: 40 },
      { id: 'book5', title: 'Book Five (107–150)', hebrewTitle: 'ספר חמישי', pages: 60 },
    ],
  },
];

// ─── ADDITIONAL CLASSICS ─────────────────────────────────────────────────────

export const ADDITIONAL_CLASSICS: Book[] = [
  {
    id: 'kuzari',
    title: 'The Kuzari',
    hebrewTitle: 'ספר הכוזרי',
    subtitle: 'A Defense of the Despised Faith',
    authors: [{ name: 'Rabbi Yehuda HaLevi', hebrew: 'רבי יהודה הלוי', years: '1075–1141' }],
    category: 'philosophy',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#2A4A1A', '#162810'],
    coverAccent: '#E8C547',
    pageCount: 360,
    isClassic: true,
    requiresSub: true,
    description: 'A masterful philosophical dialogue between a rabbi and the Khazar king — defending Judaism against philosophy, Christianity, and Islam. One of the most important works of medieval Jewish thought.',
    tags: ['Philosophy', 'Kuzari', 'Defense of Judaism', 'HaLevi', 'Medieval'],
    chapters: [
      { id: 'part1', title: 'Part One', hebrewTitle: 'מאמר ראשון', pages: 90 },
      { id: 'part2', title: 'Part Two', hebrewTitle: 'מאמר שני', pages: 80 },
      { id: 'part3', title: 'Part Three', hebrewTitle: 'מאמר שלישי', pages: 80 },
      { id: 'part4', title: 'Part Four', hebrewTitle: 'מאמר רביעי', pages: 60 },
      { id: 'part5', title: 'Part Five', hebrewTitle: 'מאמר חמישי', pages: 50 },
    ],
  },
  {
    id: 'derech-hashem',
    title: 'Derech Hashem',
    hebrewTitle: 'דרך ה\'',
    subtitle: 'The Way of God',
    authors: [{ name: 'Rabbi Moshe Chaim Luzzatto (Ramchal)', hebrew: 'רמח"ל', years: '1707–1746' }],
    category: 'philosophy',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#1A4A3A', '#0E2820'],
    coverAccent: '#C9A84C',
    pageCount: 280,
    isClassic: true,
    requiresSub: true,
    description: 'The Ramchal\'s systematic presentation of the foundations of Jewish belief — Divine providence, the soul, reward and punishment, prophecy, and the purpose of Creation.',
    tags: ['Ramchal', 'Philosophy', 'Theology', 'Soul', 'Providence'],
    chapters: [
      { id: 'part1', title: 'Foundations of Reality', hebrewTitle: 'יסוד המציאות', pages: 70 },
      { id: 'part2', title: 'Divine Providence', hebrewTitle: 'ההשגחה', pages: 80 },
      { id: 'part3', title: 'Prophecy', hebrewTitle: 'הנבואה', pages: 60 },
      { id: 'part4', title: 'Serving God', hebrewTitle: 'עבודת ה\'', pages: 70 },
    ],
  },
  {
    id: 'orchos-tzaddikim',
    title: 'Orchos Tzaddikim',
    hebrewTitle: 'אורחות צדיקים',
    subtitle: 'The Ways of the Righteous',
    authors: [{ name: 'Anonymous', hebrew: 'בעל אנונימי', years: 'c. 15th century' }],
    category: 'mussar',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#3A2A1A', '#201810'],
    coverAccent: '#C9A84C',
    pageCount: 320,
    isClassic: true,
    requiresSub: true,
    description: 'A beloved 15th-century guide to character refinement — analyzing 30 traits including pride, humility, anger, love, jealousy, and generosity through Torah sources.',
    tags: ['Mussar', 'Character', 'Ethics', 'Middos', 'Self-improvement'],
    chapters: [
      { id: 'pride', title: 'The Gate of Pride', hebrewTitle: 'שער הגאוה', pages: 20 },
      { id: 'humility', title: 'The Gate of Humility', hebrewTitle: 'שער הענוה', pages: 20 },
      { id: 'love', title: 'The Gate of Love', hebrewTitle: 'שער האהבה', pages: 18 },
      { id: 'repentance', title: 'The Gate of Repentance', hebrewTitle: 'שער התשובה', pages: 24 },
    ],
  },
  {
    id: 'ramban-commentary',
    title: 'Ramban on the Torah',
    hebrewTitle: 'פירוש הרמב"ן על התורה',
    subtitle: 'Nachmanides\' Classic Commentary',
    authors: [{ name: 'Nachmanides (Ramban)', hebrew: 'הרמב"ן', years: '1194–1270' }],
    category: 'torah',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#1A4A2A', '#0D2818'],
    coverAccent: '#E8C547',
    pageCount: 980,
    isClassic: true,
    requiresSub: true,
    description: 'The Ramban\'s profound commentary on the Five Books of Moses — combining peshat, derash, kabbalistic insights, and Maimonidean philosophy in a deeply personal voice.',
    tags: ['Ramban', 'Nachmanides', 'Torah Commentary', 'Kabbalah', 'Classic'],
    chapters: [
      { id: 'bereishis', title: 'Bereishis', hebrewTitle: 'בְּרֵאשִׁית', pages: 180 },
      { id: 'shemos', title: 'Shemos', hebrewTitle: 'שְׁמוֹת', pages: 200 },
      { id: 'vayikra', title: 'Vayikra', hebrewTitle: 'וַיִּקְרָא', pages: 180 },
    ],
  },
  {
    id: 'chovas-halevavos',
    title: 'Chovos HaLevavos',
    hebrewTitle: 'חובות הלבבות',
    subtitle: 'Duties of the Heart',
    authors: [{ name: 'Rabbeinu Bachya ibn Pakuda', hebrew: 'רבינו בחיי', years: 'c. 1050–1120' }],
    category: 'mussar',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#2A1A4A', '#180D28'],
    coverAccent: '#C9A84C',
    pageCount: 440,
    isClassic: true,
    requiresSub: true,
    description: 'A profound work on inner spirituality — arguing that external observance without inward devotion is incomplete. Ten gates explore unity of God, trust, repentance, and love.',
    tags: ['Mussar', 'Chovos Halevavos', 'Inner Life', 'Trust', 'Spirituality'],
    chapters: [
      { id: 'unity', title: 'Gate of Unity', hebrewTitle: 'שער היחוד', pages: 60 },
      { id: 'examination', title: 'Gate of Reflection', hebrewTitle: 'שער הבחינה', pages: 50 },
      { id: 'trust', title: 'Gate of Trust', hebrewTitle: 'שער הביטחון', pages: 70 },
      { id: 'love', title: 'Gate of Love', hebrewTitle: 'שער אהבת ה\'', pages: 60 },
    ],
  },
  {
    id: 'nefesh-hachaim',
    title: 'Nefesh HaChaim',
    hebrewTitle: 'נפש החיים',
    subtitle: 'The Soul of Life',
    authors: [{ name: 'Rabbi Chaim of Volozhin', hebrew: 'רבי חיים מוולוז\'ין', years: '1749–1821' }],
    category: 'chasidus',
    layout: 'bilingual',
    ageGroup: 'adult',
    language: 'bilingual',
    coverGradient: ['#1A3A5A', '#0D2038'],
    coverAccent: '#E8C547',
    pageCount: 300,
    isClassic: true,
    isFeatured: false,
    requiresSub: true,
    description: 'The foundational work of the Mitnagdim — a profound theological response to Chassidus emphasizing Torah study, Divine immanence, and the human soul\'s cosmic impact.',
    tags: ['Nefesh HaChaim', 'Torah Study', 'Soul', 'Volozhin', 'Theology'],
    chapters: [
      { id: 'part1', title: 'Part One — The Human Soul', hebrewTitle: 'שער א', pages: 80 },
      { id: 'part2', title: 'Part Two — The Worlds', hebrewTitle: 'שער ב', pages: 70 },
      { id: 'part3', title: 'Part Three — Torah Study', hebrewTitle: 'שער ג', pages: 80 },
      { id: 'part4', title: 'Part Four — Yichud', hebrewTitle: 'שער ד', pages: 70 },
    ],
  },
  {
    id: 'igrot-haramban',
    title: 'Iggeres HaRamban',
    hebrewTitle: 'אגרת הרמב"ן',
    subtitle: 'Nachmanides\' Letter to His Son',
    authors: [{ name: 'Nachmanides (Ramban)', hebrew: 'הרמב"ן', years: '1194–1270' }],
    category: 'mussar',
    layout: 'bilingual',
    ageGroup: 'all',
    language: 'bilingual',
    coverGradient: ['#3A2A1A', '#201510'],
    coverAccent: '#E8C547',
    pageCount: 24,
    isClassic: true,
    requiresSub: false,
    description: 'The Ramban\'s brief but immortal letter to his son — a practical guide to humility, speech, Torah study, and character. Read by countless Jewish families every Shabbos.',
    tags: ['Ramban', 'Mussar', 'Letter', 'Humility', 'Character', 'Shabbos'],
    chapters: [
      { id: 'letter', title: 'The Letter', hebrewTitle: 'האגרת', pages: 24 },
    ],
  },
];

// ADDITIONAL_MODERN kept as alias — copyrighted titles removed
export const ADDITIONAL_MODERN: Book[] = [];

// ─── ADDITIONAL CHILDREN ─────────────────────────────────────────────────────

export const ADDITIONAL_CHILDRENS: Book[] = [
  {
    id: 'joseph-and-his-brothers',
    title: 'Joseph and His Brothers',
    subtitle: 'A Story of Forgiveness',
    authors: [{ name: 'Sarah Leah Rosenbaum' }],
    category: 'children',
    layout: 'illustrated',
    ageGroup: 'children',
    language: 'english',
    coverGradient: ['#B7770D', '#7D520A'],
    coverAccent: '#FFD700',
    pageCount: 52,
    isNew: true,
    requiresSub: true,
    description: 'The timeless story of Joseph — sold into slavery by his brothers, rising to become viceroy of Egypt, and ultimately forgiving the brothers who betrayed him.',
    tags: ['Children', 'Joseph', 'Torah', 'Forgiveness', 'Picture Book'],
    chapters: [{ id: 'story', title: 'The Story', pages: 52 }],
  },
  {
    id: 'miracle-of-shabbos',
    title: 'The Miracle of Shabbos',
    subtitle: 'What makes Shabbos so special?',
    authors: [{ name: 'Rivka Freed' }],
    category: 'children',
    layout: 'illustrated',
    ageGroup: 'children',
    language: 'english',
    coverGradient: ['#1A3A7A', '#0D2050'],
    coverAccent: '#E8C547',
    pageCount: 36,
    requiresSub: true,
    description: 'Little Dina wonders what makes Shabbos different from every other day — and discovers the beauty of rest, family, and holiness through her family\'s Friday night.',
    tags: ['Children', 'Shabbos', 'Family', 'Illustrated', 'Holidays'],
    chapters: [{ id: 'story', title: 'The Story', pages: 36 }],
  },
  {
    id: 'queen-esther-story',
    title: 'Queen Esther and the Purim Miracle',
    subtitle: 'A Purim Story for Young Readers',
    authors: [{ name: 'Chaya Weiss' }],
    category: 'children',
    layout: 'illustrated',
    ageGroup: 'children',
    language: 'english',
    coverGradient: ['#7D3C98', '#4A235A'],
    coverAccent: '#F8C471',
    pageCount: 48,
    isNew: true,
    isFeatured: false,
    requiresSub: true,
    description: 'The story of Purim — how brave Esther and wise Mordechai saved the Jewish people — told in vivid illustrations for young readers.',
    tags: ['Children', 'Purim', 'Esther', 'Miracle', 'Picture Book'],
    chapters: [{ id: 'story', title: 'The Story', pages: 48 }],
  },
];

// ─── COMBINED CATALOG ───────────────────────────────────────────────────────

export const ALL_BOOKS: Book[] = [
  ...CLASSIC_SEFARIM,
  ...PRAYER_BOOKS,
  ...ADDITIONAL_CLASSICS,
  ...MODERN_BOOKS,
  ...ADDITIONAL_MODERN,
  ...CHILDRENS_BOOKS,
  ...ADDITIONAL_CHILDRENS,
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
  { key: 'modern',    label: 'Albert Originals',    books: ORIGINAL_BOOKS },
  { key: 'free',      label: 'Free to Read',        books: FREE_BOOKS },
] as const;
