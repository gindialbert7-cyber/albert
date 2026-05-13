/**
 * Daily learning content — rotates by day of year.
 * Pirkei Avos mishnahs, daily quotes, parasha highlights.
 */

export interface DailyMishna {
  hebrew:   string;
  english:  string;
  sage:     string;
  sagHeb:   string;
  ref:      string;        // e.g. "Avos 1:2"
  lesson:   string;        // short English teaching
}

export interface DailyQuote {
  hebrew:   string;
  english:  string;
  source:   string;
  sourceHeb?: string;
}

export const PIRKEI_AVOS_ROTATION: DailyMishna[] = [
  // ── Chapter 1 ────────────────────────────────────────────────────────────
  {
    sage: 'Moshe', sagHeb: 'משה רבינו',
    ref: 'Avos 1:1',
    hebrew: 'מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי, וּמְסָרָהּ לִיהוֹשֻׁעַ, וִיהוֹשֻׁעַ לִזְקֵנִים, וּזְקֵנִים לִנְבִיאִים, וּנְבִיאִים מְסָרוּהָ לְאַנְשֵׁי כְנֶסֶת הַגְּדוֹלָה.',
    english: 'Moshe received the Torah from Sinai and transmitted it to Yehoshua; Yehoshua to the Elders; the Elders to the Prophets; and the Prophets transmitted it to the Men of the Great Assembly.',
    lesson: 'The Torah is a living transmission — not a text frozen in time but a chain of teachers and students reaching from Sinai to today. You are part of that chain.',
  },
  {
    sage: 'Shimon HaTzaddik', sagHeb: 'שמעון הצדיק',
    ref: 'Avos 1:2',
    hebrew: 'עַל שְׁלֹשָׁה דְבָרִים הָעוֹלָם עוֹמֵד — עַל הַתּוֹרָה, וְעַל הָעֲבוֹדָה, וְעַל גְּמִילוּת חֲסָדִים.',
    english: 'The world stands on three things: Torah, Divine service, and acts of loving-kindness.',
    lesson: 'These three pillars reflect our relationship with G-d through mind (Torah), heart (prayer), and hand (deeds).',
  },
  {
    sage: 'Antigonus of Socho', sagHeb: 'אנטיגנוס איש שוכו',
    ref: 'Avos 1:3',
    hebrew: 'אַל תִּהְיוּ כַּעֲבָדִים הַמְשַׁמְּשִׁין אֶת הָרַב עַל מְנָת לְקַבֵּל פְּרָס, אֶלָּא הֱווּ כַּעֲבָדִים הַמְשַׁמְּשִׁין שֶׁלֹּא עַל מְנָת לְקַבֵּל פְּרָס.',
    english: 'Do not be like servants who serve their master for the sake of reward; rather, be like servants who serve without thought of reward.',
    lesson: 'Serve G-d out of love, not calculation. The highest form of service is when the relationship itself is the reward.',
  },
  {
    sage: 'Yosei ben Yoezer', sagHeb: 'יוסי בן יועזר',
    ref: 'Avos 1:4',
    hebrew: 'יְהִי בֵיתְךָ בֵּית וַעַד לַחֲכָמִים, וֶהֱוֵי מִתְאַבֵּק בַּעֲפַר רַגְלֵיהֶם, וֶהֱוֵי שׁוֹתֶה בְצָמָא אֶת דִּבְרֵיהֶם.',
    english: 'Let your house be a meeting place for the wise; sit in the dust of their feet; and drink in their words thirstily.',
    lesson: 'Learning requires proximity — not just reading books but being near those who embody wisdom. Thirst, not mere curiosity, is the right posture.',
  },
  {
    sage: 'Yehoshua ben Perachyah', sagHeb: 'יהושע בן פרחיה',
    ref: 'Avos 1:6',
    hebrew: 'עֲשֵׂה לְךָ רַב, וּקְנֵה לְךָ חָבֵר, וֶהֱוֵי דָן אֶת כָּל הָאָדָם לְכַף זְכוּת.',
    english: 'Make for yourself a teacher; acquire for yourself a friend; and judge every person favorably.',
    lesson: 'Three relationships: a teacher to receive from, a friend to grow with, and every stranger to extend benefit of the doubt.',
  },
  {
    sage: 'Hillel', sagHeb: 'הלל',
    ref: 'Avos 1:12',
    hebrew: 'הֱוֵי מִתַּלְמִידָיו שֶׁל אַהֲרֹן — אוֹהֵב שָׁלוֹם וְרוֹדֵף שָׁלוֹם, אוֹהֵב אֶת הַבְּרִיּוֹת וּמְקָרְבָן לַתּוֹרָה.',
    english: 'Be among the students of Aaron — love peace and pursue peace, love all people and bring them close to Torah.',
    lesson: 'Aaron is the model: he didn\'t wait for peace to arrive — he pursued it. And he loved people as they were, drawing them toward Torah rather than pushing them away.',
  },
  {
    sage: 'Hillel', sagHeb: 'הלל',
    ref: 'Avos 1:14',
    hebrew: 'אִם אֵין אֲנִי לִי, מִי לִי? וּכְשֶׁאֲנִי לְעַצְמִי, מָה אֲנִי? וְאִם לֹא עַכְשָׁיו, אֵימָתַי?',
    english: 'If I am not for myself, who will be for me? And when I am for myself alone, what am I? And if not now, when?',
    lesson: 'Three urgent questions: self-responsibility, the danger of selfishness, and the imperative of now. Together they define a complete ethical posture.',
  },
  {
    sage: 'Shammai', sagHeb: 'שמאי',
    ref: 'Avos 1:15',
    hebrew: 'עֲשֵׂה תוֹרָתְךָ קֶבַע, אֱמֹר מְעַט וַעֲשֵׂה הַרְבֵּה, וֶהֱוֵי מְקַבֵּל אֶת כָּל הָאָדָם בְּסֵבֶר פָּנִים יָפוֹת.',
    english: 'Make your Torah study permanent; say little and do much; and receive every person with a pleasant countenance.',
    lesson: 'Shammai, known for strictness, here teaches warmth — receive every person with a cheerful face. Three words for a complete person: study, deeds, and presence.',
  },
  {
    sage: 'Rabban Shimon ben Gamliel', sagHeb: 'רבן שמעון בן גמליאל',
    ref: 'Avos 1:17',
    hebrew: 'לֹא מָצָאתִי לַגּוּף טוֹב אֶלָּא שְׁתִיקָה. וְלֹא הַמִּדְרָשׁ עִקָּר אֶלָּא הַמַּעֲשֶׂה.',
    english: 'I have found nothing better for the body than silence. And not study is the main thing but action.',
    lesson: 'Two lessons: silence guards against sin more than anything else; and Jewish learning is not an intellectual exercise but a preparation for doing.',
  },
  {
    sage: 'Ben Zoma', sagHeb: 'בן זומא',
    ref: 'Avos 4:1',
    hebrew: 'אֵיזֶהוּ חָכָם? הַלּוֹמֵד מִכָּל אָדָם. אֵיזֶהוּ גִבּוֹר? הַכּוֹבֵשׁ אֶת יִצְרוֹ. אֵיזֶהוּ עָשִׁיר? הַשָּׂמֵחַ בְּחֶלְקוֹ.',
    english: 'Who is wise? One who learns from everyone. Who is mighty? One who conquers his inclination. Who is rich? One who is satisfied with his lot.',
    lesson: 'Four redefinitions of status — wisdom, strength, wealth, and honor — all turned inward. These are qualities available to anyone, regardless of circumstance.',
  },
  {
    sage: 'Rabbi Tarfon', sagHeb: 'רבי טרפון',
    ref: 'Avos 2:15',
    hebrew: 'הַיּוֹם קָצֵר, וְהַמְּלָאכָה מְרֻבָּה, וְהַפּוֹעֲלִים עֲצֵלִים, וְהַשָּׂכָר הַרְבֵּה, וּבַעַל הַבַּיִת דּוֹחֵק.',
    english: 'The day is short, the work is much, the workers are lazy, the reward is great, and the Master is pressing.',
    lesson: 'Life is urgent. Not because of anxiety but because of the greatness of the task and the abundance of the reward. Every day matters.',
  },
  {
    sage: 'Rabbi Akiva', sagHeb: 'רבי עקיבא',
    ref: 'Avos 3:14',
    hebrew: 'חָבִיב אָדָם שֶׁנִּבְרָא בְצֶלֶם. חִבָּה יְתֵרָה נוֹדַעַת לוֹ שֶׁנִּבְרָא בְצֶלֶם, שֶׁנֶּאֱמַר: כִּי בְּצֶלֶם אֱלֹהִים עָשָׂה אֶת-הָאָדָם.',
    english: 'Beloved is man, for he was created in God\'s image. A special love — that he was told he was created in God\'s image, as the verse says: "For in God\'s image He made man."',
    lesson: 'Human dignity is not earned — it is inherent, created in G-d\'s image. And the added gift is that we are told this. Self-knowledge of one\'s own value is itself a form of love.',
  },
  {
    sage: 'Ben Bag Bag', sagHeb: 'בן בג בג',
    ref: 'Avos 5:22',
    hebrew: 'הֲפֹךְ בָּהּ וַהֲפֹךְ בָּהּ, דְּכֹלָּא בָהּ, וּבָהּ תֶּחֱזֵי, וְסִיב וּבְלֵה בָהּ, וּמִינַּהּ לָא תָּזוּעַ.',
    english: 'Turn it and turn it again, for everything is in it; and in it look; and grow old and wear out in it, and from it do not move.',
    lesson: 'The Torah is inexhaustible. Return to it repeatedly, at every stage of life — the same text will reveal new depths to a different you.',
  },
];

export const DAILY_QUOTES: DailyQuote[] = [
  {
    source: 'Psalms 19:8',
    sourceHeb: 'תהלים יט:ח',
    hebrew: 'תּוֹרַת ה\' תְּמִימָה מְשִׁיבַת נָפֶשׁ.',
    english: 'The Torah of Hashem is perfect, restoring the soul.',
  },
  {
    source: 'Proverbs 3:17',
    sourceHeb: 'משלי ג:יז',
    hebrew: 'דְּרָכֶיהָ דַרְכֵי-נֹעַם, וְכָל-נְתִיבוֹתֶיהָ שָׁלוֹם.',
    english: 'Its ways are ways of pleasantness, and all its paths are peace.',
  },
  {
    source: 'Tanya, Ch. 41',
    hebrew: 'אַהֲבַת ה\' — זוֹ הִיא נְשָׁמַת כָּל הַמִּצְווֹת.',
    english: 'Love of G-d — this is the soul of all the commandments.',
  },
  {
    source: 'Mesilat Yesharim, Ch. 1',
    hebrew: 'מַה שֶּׁהָאָדָם לֹא נִבְרָא אֶלָּא לְהִתְעַנּוֹת עַל הַקַּב"ה.',
    english: 'Man was created for no other purpose than to delight in the Holy One, Blessed is He.',
  },
  {
    source: 'Rabbi Sacks, Dignity of Difference',
    hebrew: 'הַשּׁוֹנוּת שֶׁלָּנוּ הִיא עֹשֶׁר, לֹא אִיּוּם.',
    english: 'Our differences are a source of wealth, not threat.',
  },
  {
    source: 'Psalms 27:4',
    sourceHeb: 'תהלים כז:ד',
    hebrew: 'אַחַת שָׁאַלְתִּי מֵאֵת ה\' אוֹתָהּ אֲבַקֵּשׁ, שִׁבְתִּי בְּבֵית-ה\' כָּל-יְמֵי חַיַּי.',
    english: 'One thing I ask of Hashem, that alone I seek: to dwell in the house of Hashem all the days of my life.',
  },
  {
    source: 'Rambam, Mishneh Torah, Teshuvah 7:3',
    hebrew: 'וְאַל יְדַמֶּה אָדָם בְּדַעְתּוֹ שֶׁהוּא רָחוֹק מִן הַתְּשׁוּבָה.',
    english: 'A person should not imagine that he is far from repentance.',
  },
  {
    source: 'Rabbi Soloveitchik, The Lonely Man of Faith',
    hebrew: 'הָאָדָם הַמּוּעָד הַדָּתִי יָשֵׁב בּוֹדֵד וְזָקוּק לַחֲבֵרוּת הָאֱלֹהִית.',
    english: 'The lonely man of faith sits alone and in need of God\'s company.',
  },
];

/**
 * Returns the daily Pirkei Avos mishna, rotating by day of year.
 */
export function getDailyMishna(): DailyMishna {
  const now    = new Date();
  const start  = new Date(now.getFullYear(), 0, 0);
  const diff   = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return PIRKEI_AVOS_ROTATION[dayOfYear % PIRKEI_AVOS_ROTATION.length];
}

/**
 * Returns a daily quote, rotating by day of year.
 */
export function getDailyQuote(): DailyQuote {
  const now    = new Date();
  const start  = new Date(now.getFullYear(), 0, 0);
  const diff   = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

/**
 * Hebrew day names and parasha for the week.
 */
export const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbos'];

export const WEEKLY_PARASHA = [
  { name: 'Bereishis',    heb: 'בְּרֵאשִׁית' },
  { name: 'Noach',        heb: 'נֹחַ' },
  { name: 'Lech Lecha',   heb: 'לֶךְ לְךָ' },
  { name: 'Vayeira',      heb: 'וַיֵּרָא' },
  { name: 'Chayei Sarah', heb: 'חַיֵּי שָׂרָה' },
  { name: 'Toldos',       heb: 'תּוֹלְדֹת' },
  { name: 'Vayeitzei',    heb: 'וַיֵּצֵא' },
  { name: 'Vayishlach',   heb: 'וַיִּשְׁלַח' },
  { name: 'Vayeishev',    heb: 'וַיֵּשֶׁב' },
  { name: 'Mikeitz',      heb: 'מִקֵּץ' },
  { name: 'Vayigash',     heb: 'וַיִּגַּשׁ' },
  { name: 'Vayechi',      heb: 'וַיְחִי' },
  { name: 'Shemos',       heb: 'שְׁמוֹת' },
  { name: 'Vaeira',       heb: 'וָאֵרָא' },
  { name: 'Bo',           heb: 'בֹּא' },
  { name: 'Beshalach',    heb: 'בְּשַׁלַּח' },
  { name: 'Yisro',        heb: 'יִתְרוֹ' },
  { name: 'Mishpatim',    heb: 'מִשְׁפָּטִים' },
  { name: 'Terumah',      heb: 'תְּרוּמָה' },
  { name: 'Tetzaveh',     heb: 'תְּצַוֶּה' },
  { name: 'Ki Sisa',      heb: 'כִּי תִשָּׂא' },
  { name: 'Vayakhel',     heb: 'וַיַּקְהֵל' },
  { name: 'Pekudei',      heb: 'פְקוּדֵי' },
  { name: 'Vayikra',      heb: 'וַיִּקְרָא' },
  { name: 'Tzav',         heb: 'צַו' },
  { name: 'Shemini',      heb: 'שְׁמִינִי' },
  { name: 'Tazria',       heb: 'תַזְרִיעַ' },
  { name: 'Metzora',      heb: 'מְצֹרָע' },
  { name: 'Acharei',      heb: 'אַחֲרֵי מוֹת' },
  { name: 'Kedoshim',     heb: 'קְדֹשִׁים' },
  { name: 'Emor',         heb: 'אֱמֹר' },
  { name: 'Behar',        heb: 'בְּהַר' },
  { name: 'Bechukosai',   heb: 'בְּחֻקֹּתַי' },
  { name: 'Bamidbar',     heb: 'בְּמִדְבַּר' },
  { name: 'Nasso',        heb: 'נָשֹׂא' },
  { name: 'Beha\'aloscha', heb: 'בְּהַעֲלֹתְךָ' },
  { name: 'Shelach',      heb: 'שְׁלַח' },
  { name: 'Korach',       heb: 'קֹרַח' },
  { name: 'Chukas',       heb: 'חֻקַּת' },
  { name: 'Balak',        heb: 'בָּלָק' },
  { name: 'Pinchas',      heb: 'פִּינְחָס' },
  { name: 'Matos',        heb: 'מַטּוֹת' },
  { name: 'Masei',        heb: 'מַסְעֵי' },
  { name: 'Devarim',      heb: 'דְּבָרִים' },
  { name: 'Vaeschanan',   heb: 'וָאֶתְחַנַּן' },
  { name: 'Eikev',        heb: 'עֵקֶב' },
  { name: 'Re\'eh',       heb: 'רְאֵה' },
  { name: 'Shoftim',      heb: 'שֹׁפְטִים' },
  { name: 'Ki Seitzei',   heb: 'כִּי תֵצֵא' },
  { name: 'Ki Savo',      heb: 'כִּי תָבוֹא' },
  { name: 'Nitzavim',     heb: 'נִצָּבִים' },
  { name: 'Vayeilech',    heb: 'וַיֵּלֶךְ' },
  { name: 'Haazinu',      heb: 'הַאֲזִינוּ' },
  { name: 'Vezos HaBeracha', heb: 'וְזֹאת הַבְּרָכָה' },
];

export function getWeeklyParasha(): { name: string; heb: string } {
  const now    = new Date();
  const weekOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_PARASHA[weekOfYear % WEEKLY_PARASHA.length];
}

// ── Parasha Detail ────────────────────────────────────────────────────────────

export interface ParashaDetail {
  name:       string;
  heb:        string;
  book:       'Bereishis' | 'Shemos' | 'Vayikra' | 'Bamidbar' | 'Devarim';
  summary:    string;
  aliyot:     string[];   // 7 entries, verse ranges
  haftarah:   string;
  sefariaRef: string;
}

export const PARASHA_DETAIL: Record<string, ParashaDetail> = {
  'Bereishis': {
    name: 'Bereishis', heb: 'בְּרֵאשִׁית', book: 'Bereishis',
    summary: 'G-d creates the world in six days and rests on the seventh, then forms Adam and Chava in Gan Eden. After their sin they are expelled, Kayin slays Hevel, and the generations from Adam to Noach are recorded.',
    aliyot: ['1:1–2:3', '2:4–2:19', '2:20–3:21', '3:22–4:18', '4:19–4:22', '4:23–5:24', '5:25–6:8'],
    haftarah: 'Yeshaya 42:5–43:10',
    sefariaRef: 'Genesis.1.1',
  },
  'Noach': {
    name: 'Noach', heb: 'נֹחַ', book: 'Bereishis',
    summary: 'Noach builds an ark, surviving the flood that destroys a corrupt world; after the waters recede he offers sacrifices and receives the seven Noachide laws. The parasha closes with the Tower of Bavel and the genealogy leading to Avram.',
    aliyot: ['6:9–6:22', '7:1–7:16', '7:17–8:14', '8:15–9:7', '9:8–9:17', '9:18–10:32', '11:1–11:32'],
    haftarah: 'Yeshaya 54:1–55:5',
    sefariaRef: 'Genesis.6.9',
  },
  'Lech Lecha': {
    name: 'Lech Lecha', heb: 'לֶךְ לְךָ', book: 'Bereishis',
    summary: 'G-d commands Avram to leave his homeland, promising him the Land of Canaan and great nationhood; Avram travels to Egypt, returns wealthy, separates from Lot, and defeats the four kings. G-d makes a covenant with Avram, Hagar bears Yishmael, and Avram receives the covenant of circumcision along with the names Avraham and Sarah.',
    aliyot: ['12:1–12:13', '12:14–13:4', '13:5–13:18', '14:1–14:20', '14:21–15:6', '15:7–17:6', '17:7–17:27'],
    haftarah: 'Yeshaya 40:27–41:16',
    sefariaRef: 'Genesis.12.1',
  },
  'Vayeira': {
    name: 'Vayeira', heb: 'וַיֵּרָא', book: 'Bereishis',
    summary: 'Three angels visit Avraham, annunciating the birth of Yitzchak and the destruction of Sodom; Lot escapes while the cities are overturned. The parasha culminates in the Akeidah — Avraham\'s binding of Yitzchak — and ends with the genealogy of Nachor.',
    aliyot: ['18:1–18:14', '18:15–18:33', '19:1–19:20', '19:21–21:4', '21:5–21:21', '21:22–21:34', '22:1–22:24'],
    haftarah: 'Melachim II 4:1–37',
    sefariaRef: 'Genesis.18.1',
  },
  'Chayei Sarah': {
    name: 'Chayei Sarah', heb: 'חַיֵּי שָׂרָה', book: 'Bereishis',
    summary: 'Avraham purchases the Mearas HaMachpelah to bury Sarah, then sends his servant Eliezer to find a wife for Yitzchak from his family in Aram Naharaim. Rivka is chosen, she marries Yitzchak who is comforted after his mother\'s death, and Avraham\'s final years and death are recorded.',
    aliyot: ['23:1–23:16', '23:17–24:9', '24:10–24:26', '24:27–24:52', '24:53–24:67', '25:1–25:11', '25:12–25:18'],
    haftarah: 'Melachim I 1:1–31',
    sefariaRef: 'Genesis.23.1',
  },
  'Toldos': {
    name: 'Toldos', heb: 'תּוֹלְדֹת', book: 'Bereishis',
    summary: 'Rivka conceives twins after Yitzchak\'s prayer; Eisav is born first and Yaakov follows grasping his heel. Yaakov buys the firstborn rights from a hungry Eisav, and later deceives the blind Yitzchak to receive the firstborn blessing, prompting Eisav\'s murderous rage.',
    aliyot: ['25:19–26:5', '26:6–26:12', '26:13–26:22', '26:23–26:29', '26:30–27:27', '27:28–28:4', '28:5–28:9'],
    haftarah: 'Malachi 1:1–2:7',
    sefariaRef: 'Genesis.25.19',
  },
  'Vayeitzei': {
    name: 'Vayeitzei', heb: 'וַיֵּצֵא', book: 'Bereishis',
    summary: 'Yaakov flees to Lavan in Charan, dreams of a ladder ascending to heaven, and works fourteen years for Rachel and Leah. His twelve sons and one daughter are born, he amasses flocks through a divine stratagem, and then escapes with his family toward Canaan.',
    aliyot: ['28:10–28:22', '29:1–29:17', '29:18–30:13', '30:14–30:27', '30:28–31:16', '31:17–31:42', '31:43–32:3'],
    haftarah: 'Hoshea 12:13–14:10',
    sefariaRef: 'Genesis.28.10',
  },
  'Vayishlach': {
    name: 'Vayishlach', heb: 'וַיִּשְׁלַח', book: 'Bereishis',
    summary: 'Yaakov sends messengers to Eisav, wrestles with an angel and receives the name Yisrael, and reconciles with his brother. Dinah\'s abduction leads to the destruction of Shechem; Rochel dies giving birth to Binyamin, and the parasha closes with the genealogy of Eisav.',
    aliyot: ['32:4–32:13', '32:14–32:30', '32:31–33:5', '33:6–33:20', '34:1–35:11', '35:12–36:19', '36:20–36:43'],
    haftarah: 'Ovadiah 1:1–21',
    sefariaRef: 'Genesis.32.4',
  },
  'Vayeishev': {
    name: 'Vayeishev', heb: 'וַיֵּשֶׁב', book: 'Bereishis',
    summary: 'Yosef\'s multicolored coat and prophetic dreams arouse his brothers\' jealousy; they sell him to Yishmaelite merchants and he is taken to Egypt. The episode of Yehuda and Tamar is interspersed, and in Egypt Yosef resists Potiphar\'s wife but is imprisoned.',
    aliyot: ['37:1–37:11', '37:12–37:22', '37:23–37:36', '38:1–38:30', '39:1–39:6', '39:7–40:23', '41:1–41:14'],
    haftarah: 'Amos 2:6–3:8',
    sefariaRef: 'Genesis.37.1',
  },
  'Mikeitz': {
    name: 'Mikeitz', heb: 'מִקֵּץ', book: 'Bereishis',
    summary: 'Pharaoh dreams of seven fat and seven lean cows; Yosef interprets the dreams, is released from prison, and is appointed viceroy of Egypt. During the famine Yosef\'s brothers come to Egypt to buy grain, and he tests them by accusing them of espionage.',
    aliyot: ['41:1–41:14', '41:15–41:38', '41:39–41:52', '41:53–42:18', '42:19–43:15', '43:16–43:29', '43:30–44:17'],
    haftarah: 'Melachim I 3:15–4:1',
    sefariaRef: 'Genesis.41.1',
  },
  'Vayigash': {
    name: 'Vayigash', heb: 'וַיִּגַּשׁ', book: 'Bereishis',
    summary: 'Yehuda delivers a passionate plea on behalf of Binyamin; Yosef can no longer restrain himself and reveals his identity to his brothers. Yaakov and the entire family — seventy souls — descend to Egypt where Pharaoh grants them the land of Goshen.',
    aliyot: ['44:18–44:30', '44:31–45:7', '45:8–45:18', '45:19–45:27', '45:28–46:27', '46:28–47:10', '47:11–47:27'],
    haftarah: 'Yechezkel 37:15–28',
    sefariaRef: 'Genesis.44.18',
  },
  'Vayechi': {
    name: 'Vayechi', heb: 'וַיְחִי', book: 'Bereishis',
    summary: 'Yaakov blesses Ephraim and Menashe, crossing his hands to give the younger the greater blessing, then delivers prophetic blessings to each of his twelve sons. He dies in Egypt after 147 years, is embalmed, and is carried to be buried in the Mearas HaMachpelah; the parasha closes with Yosef\'s death.',
    aliyot: ['47:28–48:9', '48:10–48:16', '48:17–48:22', '49:1–49:18', '49:19–49:26', '49:27–50:20', '50:21–50:26'],
    haftarah: 'Melachim I 2:1–12',
    sefariaRef: 'Genesis.47.28',
  },
  // ── Shemos ────────────────────────────────────────────────────────────────
  'Shemos': {
    name: 'Shemos', heb: 'שְׁמוֹת', book: 'Shemos',
    summary: 'The Israelites multiply in Egypt; a new Pharaoh enslaves them and orders the death of newborn males. Moshe is born, saved by Pharaoh\'s daughter, flees after killing an Egyptian taskmaster, and at the Burning Bush receives his mission to redeem Israel.',
    aliyot: ['1:1–1:17', '1:18–2:10', '2:11–2:25', '3:1–3:15', '3:16–4:17', '4:18–4:31', '5:1–6:1'],
    haftarah: 'Yeshaya 27:6–28:13; 29:22–23',
    sefariaRef: 'Exodus.1.1',
  },
  'Vaeira': {
    name: 'Vaeira', heb: 'וָאֵרָא', book: 'Shemos',
    summary: 'G-d reveals the name YKVK and promises redemption through four expressions of deliverance; Moshe and Aharon confront Pharaoh with signs and the first seven plagues. Pharaoh\'s heart is hardened and he refuses to let Israel go.',
    aliyot: ['6:2–6:13', '6:14–6:28', '6:29–7:7', '7:8–8:6', '8:7–8:18', '8:19–9:16', '9:17–9:35'],
    haftarah: 'Yechezkel 28:25–29:21',
    sefariaRef: 'Exodus.6.2',
  },
  'Bo': {
    name: 'Bo', heb: 'בֹּא', book: 'Shemos',
    summary: 'The last three plagues — locusts, darkness, and the death of the firstborn — break Pharaoh\'s resistance and he drives Israel out of Egypt. The commandments of Pesach, the firstborn, tefillin, and recounting the Exodus are given before and during the departure.',
    aliyot: ['10:1–10:11', '10:12–10:23', '10:24–11:3', '11:4–12:20', '12:21–12:28', '12:29–12:51', '13:1–13:16'],
    haftarah: 'Yirmiyahu 46:13–28',
    sefariaRef: 'Exodus.10.1',
  },
  'Beshalach': {
    name: 'Beshalach', heb: 'בְּשַׁלַּח', book: 'Shemos',
    summary: 'Israel leaves Egypt, Pharaoh pursues them, and the sea splits miraculously; Moshe and the nation sing the Song of the Sea. In the wilderness they receive manna and water from a rock, and Amalek attacks and is defeated.',
    aliyot: ['13:17–14:8', '14:9–14:14', '14:15–14:25', '14:26–15:26', '15:27–16:10', '16:11–16:36', '17:1–17:16'],
    haftarah: 'Shoftim 4:4–5:31',
    sefariaRef: 'Exodus.13.17',
  },
  'Yisro': {
    name: 'Yisro', heb: 'יִתְרוֹ', book: 'Shemos',
    summary: 'Moshe\'s father-in-law Yisro arrives with advice to establish a judicial system, which Moshe implements. The nation stands at Sinai and receives the Ten Commandments amid thunder and lightning.',
    aliyot: ['18:1–18:12', '18:13–18:23', '18:24–18:27', '19:1–19:6', '19:7–19:19', '19:20–20:14', '20:15–20:23'],
    haftarah: 'Yeshaya 6:1–7:6; 9:5–6',
    sefariaRef: 'Exodus.18.1',
  },
  'Mishpatim': {
    name: 'Mishpatim', heb: 'מִשְׁפָּטִים', book: 'Shemos',
    summary: 'A comprehensive civil and criminal code is given: laws of servants, personal injury, property, the three pilgrimage festivals, and social ethics. The covenant is ratified with blood, Moshe ascends the mountain and receives the Torah for forty days.',
    aliyot: ['21:1–21:19', '21:20–22:3', '22:4–22:26', '22:27–23:5', '23:6–23:19', '23:20–23:25', '23:26–24:18'],
    haftarah: 'Yirmiyahu 34:8–22; 33:25–26',
    sefariaRef: 'Exodus.21.1',
  },
  'Terumah': {
    name: 'Terumah', heb: 'תְּרוּמָה', book: 'Shemos',
    summary: 'G-d commands Israel to bring voluntary offerings of precious materials for the Mishkan; detailed instructions are given for the Ark, Table, and Menorah. The structure of the Tabernacle — its boards, curtains, and partitions — is meticulously described.',
    aliyot: ['25:1–25:16', '25:17–25:30', '25:31–26:14', '26:15–26:30', '26:31–26:37', '27:1–27:8', '27:9–27:19'],
    haftarah: 'Melachim I 5:26–6:13',
    sefariaRef: 'Exodus.25.1',
  },
  'Tetzaveh': {
    name: 'Tetzaveh', heb: 'תְּצַוֶּה', book: 'Shemos',
    summary: 'Aharon and his sons are appointed as Kohanim; their eight priestly garments — including the Ephod, Choshen, and Tzitz — are described in detail. The seven-day inauguration ceremony for the Mishkan and its Altar are prescribed.',
    aliyot: ['27:20–28:12', '28:13–28:30', '28:31–28:43', '29:1–29:18', '29:19–29:37', '29:38–29:46', '30:1–30:10'],
    haftarah: 'Yechezkel 43:10–27',
    sefariaRef: 'Exodus.27.20',
  },
  'Ki Sisa': {
    name: 'Ki Sisa', heb: 'כִּי תִשָּׂא', book: 'Shemos',
    summary: 'A census is taken by half-shekel contribution; instructions for the copper laver, incense, and anointing oil are given. While Moshe is on the mountain the nation sins with the Golden Calf; Moshe intercedes, the Tablets are broken and then recut, and G-d reveals His thirteen attributes of mercy.',
    aliyot: ['30:11–30:31', '30:32–31:17', '31:18–33:11', '33:12–33:16', '33:17–33:23', '34:1–34:9', '34:10–34:35'],
    haftarah: 'Melachim I 18:1–39',
    sefariaRef: 'Exodus.30.11',
  },
  'Vayakhel': {
    name: 'Vayakhel', heb: 'וַיַּקְהֵל', book: 'Shemos',
    summary: 'Moshe assembles the nation and reiterates the Shabbos prohibition before beginning construction; the master craftsmen Betzalel and Oholiav oversee the work. The people donate so generously that Moshe must command them to stop, and the Tabernacle components are completed.',
    aliyot: ['35:1–35:20', '35:21–35:29', '35:30–36:7', '36:8–36:19', '36:20–37:16', '37:17–37:29', '38:1–38:20'],
    haftarah: 'Melachim I 7:40–50',
    sefariaRef: 'Exodus.35.1',
  },
  'Pekudei': {
    name: 'Pekudei', heb: 'פְקוּדֵי', book: 'Shemos',
    summary: 'A detailed accounting of all the materials donated for the Mishkan is presented; the priestly garments are made and Aharon is dressed in them. The Mishkan is erected on Rosh Chodesh Nissan and the Divine cloud descends to fill it.',
    aliyot: ['38:21–39:1', '39:2–39:21', '39:22–39:32', '39:33–39:43', '40:1–40:16', '40:17–40:27', '40:28–40:38'],
    haftarah: 'Melachim I 7:51–8:21',
    sefariaRef: 'Exodus.38.21',
  },
  // ── Vayikra ───────────────────────────────────────────────────────────────
  'Vayikra': {
    name: 'Vayikra', heb: 'וַיִּקְרָא', book: 'Vayikra',
    summary: 'G-d calls to Moshe and teaches the laws of the five major offerings: the burnt offering, meal offering, peace offering, sin offering, and guilt offering. Each sacrifice is described for different classes of offerers — the ordinary Israelite, the Kohen, the leader, and the community.',
    aliyot: ['1:1–1:13', '1:14–2:6', '2:7–2:16', '3:1–3:17', '4:1–4:26', '4:27–5:10', '5:11–5:26'],
    haftarah: 'Yeshaya 43:21–44:23',
    sefariaRef: 'Leviticus.1.1',
  },
  'Tzav': {
    name: 'Tzav', heb: 'צַו', book: 'Vayikra',
    summary: 'The Kohanim receive specific instructions for each type of sacrifice including the removal of ashes, the eternal fire, and the portions due to them. Aharon and his sons are inaugurated into the priesthood through a seven-day ceremony at the Mishkan entrance.',
    aliyot: ['6:1–6:11', '6:12–7:10', '7:11–7:38', '8:1–8:13', '8:14–8:21', '8:22–8:29', '8:30–8:36'],
    haftarah: 'Yirmiyahu 7:21–8:3; 9:22–23',
    sefariaRef: 'Leviticus.6.1',
  },
  'Shemini': {
    name: 'Shemini', heb: 'שְׁמִינִי', book: 'Vayikra',
    summary: 'On the eighth day of inauguration Aharon and his sons offer sacrifices and the Divine fire descends; but then Aharon\'s sons Nadav and Avihu bring unauthorized fire and are killed. The laws of kosher animals, fish, birds, and insects are enumerated.',
    aliyot: ['9:1–9:16', '9:17–9:23', '9:24–10:11', '10:12–10:15', '10:16–10:20', '11:1–11:32', '11:33–11:47'],
    haftarah: 'Shmuel II 6:1–7:17',
    sefariaRef: 'Leviticus.9.1',
  },
  'Tazria': {
    name: 'Tazria', heb: 'תַזְרִיעַ', book: 'Vayikra',
    summary: 'Laws of ritual impurity following childbirth are given, followed by an extensive treatment of tzaraas — a spiritual skin condition requiring diagnosis by a Kohen. The Kohen examines symptoms, declares the person pure or impure, and prescribes isolation when necessary.',
    aliyot: ['12:1–12:8', '13:1–13:17', '13:18–13:23', '13:24–13:28', '13:29–13:37', '13:38–13:54', '13:55–13:59'],
    haftarah: 'Melachim II 4:42–5:19',
    sefariaRef: 'Leviticus.12.1',
  },
  'Metzora': {
    name: 'Metzora', heb: 'מְצֹרָע', book: 'Vayikra',
    summary: 'The purification process for someone healed of tzaraas involves two birds, cedar, hyssop, crimson thread, and immersion. The parasha continues with tzaraas of houses and the laws of male and female bodily discharges.',
    aliyot: ['14:1–14:12', '14:13–14:20', '14:21–14:32', '14:33–14:53', '14:54–15:15', '15:16–15:28', '15:29–15:33'],
    haftarah: 'Melachim II 7:3–20',
    sefariaRef: 'Leviticus.14.1',
  },
  'Acharei': {
    name: 'Acharei', heb: 'אַחֲרֵי מוֹת', book: 'Vayikra',
    summary: 'Following the deaths of Nadav and Avihu, the Yom Kippur service is described — the Kohen Gadol\'s unique entry into the Holy of Holies and the sending of the goat to Azazel. Prohibitions against eating blood and the sexual immorality of Egypt and Canaan are then enumerated.',
    aliyot: ['16:1–16:17', '16:18–16:24', '16:25–16:34', '17:1–17:7', '17:8–18:5', '18:6–18:21', '18:22–18:30'],
    haftarah: 'Yechezkel 22:1–19',
    sefariaRef: 'Leviticus.16.1',
  },
  'Kedoshim': {
    name: 'Kedoshim', heb: 'קְדֹשִׁים', book: 'Vayikra',
    summary: '"You shall be holy, for I the L-rd your G-d am holy" — this parasha contains a dense collection of moral and ritual commandments spanning honoring parents, Shabbos, idolatry, gleanings for the poor, honest weights, and love for the neighbor and stranger. It represents the ethical core of the Torah.',
    aliyot: ['19:1–19:14', '19:15–19:22', '19:23–19:32', '19:33–19:37', '20:1–20:7', '20:8–20:22', '20:23–20:27'],
    haftarah: 'Amos 9:7–15',
    sefariaRef: 'Leviticus.19.1',
  },
  'Emor': {
    name: 'Emor', heb: 'אֱמֹר', book: 'Vayikra',
    summary: 'Special holiness laws for Kohanim — whom they may marry, physical disqualifications for service — are followed by the laws of the Jewish calendar: Shabbos, Pesach, Shavuos, Rosh Hashana, Yom Kippur, and Sukkos. The parasha closes with the blasphemer\'s punishment and the lex talionis.',
    aliyot: ['21:1–21:15', '21:16–22:16', '22:17–22:33', '23:1–23:22', '23:23–23:32', '23:33–23:44', '24:1–24:23'],
    haftarah: 'Yechezkel 44:15–31',
    sefariaRef: 'Leviticus.21.1',
  },
  'Behar': {
    name: 'Behar', heb: 'בְּהַר', book: 'Vayikra',
    summary: 'The laws of Shemittah — the sabbatical year when the land lies fallow — and Yovel — the Jubilee year when ancestral lands return — are given. Social laws follow: prohibitions on oppression, the redemption of sold land and persons, and fair treatment of servants.',
    aliyot: ['25:1–25:13', '25:14–25:18', '25:19–25:24', '25:25–25:28', '25:29–25:38', '25:39–25:46', '25:47–26:2'],
    haftarah: 'Yirmiyahu 32:6–27',
    sefariaRef: 'Leviticus.25.1',
  },
  'Bechukosai': {
    name: 'Bechukosai', heb: 'בְּחֻקֹּתַי', book: 'Vayikra',
    summary: 'G-d promises abundant blessings if Israel follows the Torah, then delivers the Tochachah — a devastating rebuke listing the curses that will befall the nation if they abandon His covenant. The parasha closes with laws of valuations and dedications to the Temple.',
    aliyot: ['26:3–26:5', '26:6–26:9', '26:10–26:46', '27:1–27:15', '27:16–27:21', '27:22–27:28', '27:29–27:34'],
    haftarah: 'Yirmiyahu 16:19–17:14',
    sefariaRef: 'Leviticus.26.3',
  },
  // ── Bamidbar ──────────────────────────────────────────────────────────────
  'Bamidbar': {
    name: 'Bamidbar', heb: 'בְּמִדְבַּר', book: 'Bamidbar',
    summary: 'A census of all fighting-age Israelite men is conducted by tribe, totaling 603,550; the Levites are counted separately and assigned to transport and guard the Mishkan. The arrangement of the tribes around the Tabernacle in camp and on the march is specified.',
    aliyot: ['1:1–1:19', '1:20–1:54', '2:1–2:34', '3:1–3:13', '3:14–3:39', '3:40–3:51', '4:1–4:20'],
    haftarah: 'Hoshea 2:1–22',
    sefariaRef: 'Numbers.1.1',
  },
  'Nasso': {
    name: 'Nasso', heb: 'נָשֹׂא', book: 'Bamidbar',
    summary: 'The longest parasha in the Torah: the Levite families of Gershon and Merari are assigned their transport duties; laws of the Sotah, Nazir, and the Priestly Blessing are given. The lengthy conclusion records the identical offerings brought by each of the twelve tribal leaders at the Mishkan\'s inauguration.',
    aliyot: ['4:21–4:37', '4:38–4:49', '5:1–5:10', '5:11–6:27', '7:1–7:41', '7:42–7:71', '7:72–8:4'],
    haftarah: 'Shoftim 13:2–25',
    sefariaRef: 'Numbers.4.21',
  },
  "Beha'aloscha": {
    name: "Beha'aloscha", heb: 'בְּהַעֲלֹתְךָ', book: 'Bamidbar',
    summary: 'Aharon is commanded regarding the kindling of the Menorah; the Levites are inaugurated and their service years defined. The nation complains repeatedly — about hardships, then about the manna — Moshe\'s burden is shared by seventy elders, and Miriam and Aharon speak against Moshe.',
    aliyot: ['8:1–8:14', '8:15–8:26', '9:1–9:14', '9:15–10:10', '10:11–10:34', '10:35–11:29', '11:30–12:16'],
    haftarah: 'Zechariah 2:14–4:7',
    sefariaRef: 'Numbers.8.1',
  },
  'Shelach': {
    name: 'Shelach', heb: 'שְׁלַח', book: 'Bamidbar',
    summary: 'Twelve spies are sent to scout Canaan; ten return with a discouraging report that triggers a national crisis of faith and G-d\'s decree of forty years wandering. The laws of challah, libations, tzitzis, and the punishment of the Shabbos wood-gatherer are then given.',
    aliyot: ['13:1–13:20', '13:21–14:7', '14:8–14:25', '14:26–15:7', '15:8–15:16', '15:17–15:26', '15:27–15:41'],
    haftarah: 'Yehoshua 2:1–24',
    sefariaRef: 'Numbers.13.1',
  },
  'Korach': {
    name: 'Korach', heb: 'קֹרַח', book: 'Bamidbar',
    summary: 'Korach leads a rebellion of 250 prominent men against Moshe and Aharon\'s leadership; the earth opens and swallows Korach\'s faction while fire consumes the 250 men. A miraculous plague strikes the nation, stopped by Aharon\'s incense, and Aharon\'s staff blossoms to confirm the Kohanim\'s legitimacy.',
    aliyot: ['16:1–16:13', '16:14–16:19', '16:20–17:8', '17:9–17:15', '17:16–17:24', '17:25–18:20', '18:21–18:32'],
    haftarah: 'Shmuel I 11:14–12:22',
    sefariaRef: 'Numbers.16.1',
  },
  'Chukas': {
    name: 'Chukas', heb: 'חֻקַּת', book: 'Bamidbar',
    summary: 'The paradoxical law of the Red Heifer — which purifies the impure while rendering the pure impure — is given. Miriam and Aharon die; Moshe strikes the rock instead of speaking to it and is barred from entering the Land; the brass serpent heals snakebite and the nation journeys through Transjordan.',
    aliyot: ['19:1–19:17', '19:18–20:6', '20:7–20:13', '20:14–20:21', '20:22–21:9', '21:10–21:20', '21:21–22:1'],
    haftarah: 'Shoftim 11:1–33',
    sefariaRef: 'Numbers.19.1',
  },
  'Balak': {
    name: 'Balak', heb: 'בָּלָק', book: 'Bamidbar',
    summary: 'Balak, king of Moab, hires the prophet Bilaam to curse Israel; instead, G-d turns every curse into a blessing, including the famous "How goodly are your tents, O Yaakov." The parasha ends with Israel sinning with Moabite women and Pinchas stopping a plague by his zealous act.',
    aliyot: ['22:2–22:12', '22:13–22:20', '22:21–22:38', '22:39–23:12', '23:13–23:26', '23:27–24:13', '24:14–25:9'],
    haftarah: 'Michah 5:6–6:8',
    sefariaRef: 'Numbers.22.2',
  },
  'Pinchas': {
    name: 'Pinchas', heb: 'פִּינְחָס', book: 'Bamidbar',
    summary: 'Pinchas is rewarded with a covenant of peace for his zealotry; a second census of all men from age twenty is conducted. The daughters of Tzelofchad petition for inheritance rights and win, Yehoshua is appointed as Moshe\'s successor, and the Musaf offerings for all festivals are detailed.',
    aliyot: ['25:10–26:4', '26:5–26:51', '26:52–27:5', '27:6–27:23', '28:1–28:15', '28:16–29:11', '29:12–30:1'],
    haftarah: 'Melachim I 18:46–19:21',
    sefariaRef: 'Numbers.25.10',
  },
  'Matos': {
    name: 'Matos', heb: 'מַטּוֹת', book: 'Bamidbar',
    summary: 'Laws of vows and their annulment are given, followed by the war against Midian as divine retribution for the Baal Peor incident. The tribes of Reuven and Gad negotiate to settle east of the Jordan on condition they fight in the vanguard of the conquest.',
    aliyot: ['30:2–30:17', '31:1–31:12', '31:13–31:24', '31:25–31:41', '31:42–31:54', '32:1–32:19', '32:20–32:42'],
    haftarah: 'Yirmiyahu 1:1–2:3',
    sefariaRef: 'Numbers.30.2',
  },
  'Masei': {
    name: 'Masei', heb: 'מַסְעֵי', book: 'Bamidbar',
    summary: 'All forty-two journeys of Israel through the desert are enumerated from Egypt to the Plains of Moav. The borders of the Land are delineated, cities of refuge for accidental killers are established, and the daughters of Tzelofchad are required to marry within their tribe.',
    aliyot: ['33:1–33:10', '33:11–33:49', '33:50–34:15', '34:16–34:29', '35:1–35:8', '35:9–35:34', '36:1–36:13'],
    haftarah: 'Yirmiyahu 2:4–28; 3:4',
    sefariaRef: 'Numbers.33.1',
  },
  // ── Devarim ───────────────────────────────────────────────────────────────
  'Devarim': {
    name: 'Devarim', heb: 'דְּבָרִים', book: 'Devarim',
    summary: 'Moshe begins his farewell address to Israel on the banks of the Jordan, reviewing the forty years of wandering, the sin of the spies, and the conquest of Transjordan. He reappoints judges and gives an overview of the nation\'s journey as a prelude to entering the Land.',
    aliyot: ['1:1–1:10', '1:11–1:21', '1:22–1:38', '1:39–2:1', '2:2–2:30', '2:31–3:14', '3:15–3:22'],
    haftarah: 'Yeshaya 1:1–27',
    sefariaRef: 'Deuteronomy.1.1',
  },
  'Vaeschanan': {
    name: 'Vaeschanan', heb: 'וָאֶתְחַנַּן', book: 'Devarim',
    summary: 'Moshe pleads to enter the Land but is refused; he exhorts Israel to observe the Torah, warning against idolatry and foretelling exile and return. This parasha contains the Shema, the repetition of the Ten Commandments, and the first paragraph of Ve\'ahavta.',
    aliyot: ['3:23–4:4', '4:5–4:40', '4:41–4:49', '5:1–5:18', '5:19–6:3', '6:4–6:25', '7:1–7:11'],
    haftarah: 'Yeshaya 40:1–26',
    sefariaRef: 'Deuteronomy.3.23',
  },
  'Eikev': {
    name: 'Eikev', heb: 'עֵקֶב', book: 'Devarim',
    summary: 'Moshe promises prosperity and conquest if Israel observes the commandments, and warns against pride by reminding them how G-d sustained them with manna in the desert. He recounts the sin of the Golden Calf and his subsequent intercession, then introduces the second paragraph of the Shema.',
    aliyot: ['7:12–7:21', '7:22–8:10', '8:11–9:3', '9:4–9:29', '10:1–10:11', '10:12–11:9', '11:10–11:21'],
    haftarah: 'Yeshaya 49:14–51:3',
    sefariaRef: 'Deuteronomy.7.12',
  },
  "Re'eh": {
    name: "Re'eh", heb: 'רְאֵה', book: 'Devarim',
    summary: 'Moshe sets before the nation blessing and curse, contingent on obedience; the centralization of worship in the chosen place and the prohibitions of idolatry are stressed. Laws of the false prophet, forbidden foods, tithes, the sabbatical year, the Hebrew servant, and the three pilgrimage festivals are given.',
    aliyot: ['11:26–12:10', '12:11–12:28', '12:29–13:19', '14:1–14:21', '14:22–14:29', '15:1–15:18', '15:19–16:17'],
    haftarah: 'Yeshaya 54:11–55:5',
    sefariaRef: 'Deuteronomy.11.26',
  },
  'Shoftim': {
    name: 'Shoftim', heb: 'שֹׁפְטִים', book: 'Devarim',
    summary: 'Laws establishing courts, the king, the Kohanim, and the prophets provide a constitutional framework for the nation in the Land. Rules of war — including the permission to withdraw, the treatment of captured cities, and the unsolved murder ritual — are also presented.',
    aliyot: ['16:18–17:13', '17:14–17:20', '18:1–18:5', '18:6–18:13', '18:14–19:13', '19:14–20:9', '20:10–21:9'],
    haftarah: 'Yeshaya 51:12–52:12',
    sefariaRef: 'Deuteronomy.16.18',
  },
  'Ki Seitzei': {
    name: 'Ki Seitzei', heb: 'כִּי תֵצֵא', book: 'Devarim',
    summary: 'With 74 mitzvos — more than any other parasha — this portion covers laws of war captives, inheritance, rebellious sons, returning lost objects, honest weights, the laws of Shabbos, and prohibitions against cross-dressing, mixing wool and linen, and wronging the convert and widow. It concludes with the commandment to blot out Amalek\'s memory.',
    aliyot: ['21:10–21:21', '21:22–22:7', '22:8–22:19', '22:20–23:7', '23:8–23:24', '23:25–24:13', '24:14–25:19'],
    haftarah: 'Yeshaya 54:1–10',
    sefariaRef: 'Deuteronomy.21.10',
  },
  'Ki Savo': {
    name: 'Ki Savo', heb: 'כִּי תָבוֹא', book: 'Devarim',
    summary: 'The Bikkurim declaration, the tithes confession, and the ceremony of blessings and curses from Mounts Gerizim and Eval frame a section on entering the Land. The lengthy Tochachah — ninety-eight curses for disobedience — is followed by Moshe\'s charge to remember the miraculous desert years.',
    aliyot: ['26:1–26:11', '26:12–26:15', '26:16–27:10', '27:11–28:6', '28:7–28:69', '29:1–29:8', '29:9–29:28'],
    haftarah: 'Yeshaya 60:1–22',
    sefariaRef: 'Deuteronomy.26.1',
  },
  'Nitzavim': {
    name: 'Nitzavim', heb: 'נִצָּבִים', book: 'Devarim',
    summary: 'Moshe gathers the entire nation — from leaders to woodchoppers — to enter a covenant with G-d before his death. The parasha promises that even after exile and punishment, the nation will return to G-d and He will restore their fortunes; the Torah is declared "not in heaven" but near to every person.',
    aliyot: ['29:9–29:11', '29:12–29:14', '29:15–29:28', '30:1–30:6', '30:7–30:10', '30:11–30:14', '30:15–30:20'],
    haftarah: 'Yeshaya 61:10–63:9',
    sefariaRef: 'Deuteronomy.29.9',
  },
  'Vayeilech': {
    name: 'Vayeilech', heb: 'וַיֵּלֶךְ', book: 'Devarim',
    summary: 'Moshe, 120 years old, announces that he cannot cross the Jordan and formally appoints Yehoshua as his successor. He writes the Torah and commands that it be read publicly every seven years at Hakhel; G-d tells Moshe to write the song of Ha\'azinu as a witness against future apostasy.',
    aliyot: ['31:1–31:3', '31:4–31:6', '31:7–31:9', '31:10–31:13', '31:14–31:19', '31:20–31:24', '31:25–31:30'],
    haftarah: 'Hoshea 14:2–10; Yoel 2:15–27; Michah 7:18–20',
    sefariaRef: 'Deuteronomy.31.1',
  },
  'Haazinu': {
    name: 'Haazinu', heb: 'הַאֲזִינוּ', book: 'Devarim',
    summary: 'Moshe recites the song of Ha\'azinu — a poetic prophecy that calls heaven and earth as witnesses, recounts Israel\'s history of ingratitude and punishment, and promises ultimate divine redemption. G-d then commands Moshe to ascend Mount Nebo to see the Land before his death.',
    aliyot: ['32:1–32:6', '32:7–32:12', '32:13–32:18', '32:19–32:28', '32:29–32:39', '32:40–32:43', '32:44–32:52'],
    haftarah: 'Shmuel II 22:1–51',
    sefariaRef: 'Deuteronomy.32.1',
  },
  'Vezos HaBeracha': {
    name: 'Vezos HaBeracha', heb: 'וְזֹאת הַבְּרָכָה', book: 'Devarim',
    summary: 'Moshe blesses each of the twelve tribes individually, evoking their unique characters and future destinies. He then ascends Mount Nebo, views the Promised Land from afar, dies at age 120, and is buried by G-d in an unknown location; the Torah closes with an unmatched eulogy of Moshe as the greatest prophet who ever lived.',
    aliyot: ['33:1–33:7', '33:8–33:12', '33:13–33:17', '33:18–33:21', '33:22–33:26', '33:27–33:29', '34:1–34:12'],
    haftarah: 'Yehoshua 1:1–18',
    sefariaRef: 'Deuteronomy.33.1',
  },
};

export function getWeeklyParashaDetail(): ParashaDetail | null {
  const { name } = getWeeklyParasha();
  return PARASHA_DETAIL[name] ?? null;
}

// ── Daf Yomi ─────────────────────────────────────────────────────────────────

export interface DafYomiResult {
  tractate:    string;
  tractateHeb: string;
  daf:         number;
  dafDisplay:  string; // e.g. "47a"
  sedarName:   string; // e.g. "Moed"
  cycleDay:    number; // 1-2711
}

const DAF_YOMI_TRACTATES: { name: string; heb: string; seder: string; daf: number }[] = [
  { name: 'Berachos',     heb: 'ברכות',      seder: 'Zeraim',    daf: 63  },
  { name: 'Shabbos',      heb: 'שבת',        seder: 'Moed',      daf: 156 },
  { name: 'Eruvin',       heb: 'עירובין',     seder: 'Moed',      daf: 104 },
  { name: 'Pesachim',     heb: 'פסחים',      seder: 'Moed',      daf: 120 },
  { name: 'Shekalim',     heb: 'שקלים',      seder: 'Moed',      daf: 21  },
  { name: 'Yoma',         heb: 'יומא',       seder: 'Moed',      daf: 87  },
  { name: 'Sukkah',       heb: 'סוכה',       seder: 'Moed',      daf: 55  },
  { name: 'Beitzah',      heb: 'ביצה',       seder: 'Moed',      daf: 39  },
  { name: 'Rosh Hashana', heb: 'ראש השנה',   seder: 'Moed',      daf: 34  },
  { name: "Ta'anis",      heb: 'תענית',      seder: 'Moed',      daf: 30  },
  { name: 'Megillah',     heb: 'מגילה',      seder: 'Moed',      daf: 31  },
  { name: 'Moed Katan',   heb: 'מועד קטן',   seder: 'Moed',      daf: 28  },
  { name: 'Chagigah',     heb: 'חגיגה',      seder: 'Moed',      daf: 26  },
  { name: 'Yevamos',      heb: 'יבמות',      seder: 'Nashim',    daf: 121 },
  { name: 'Kesubos',      heb: 'כתובות',     seder: 'Nashim',    daf: 111 },
  { name: 'Nedarim',      heb: 'נדרים',      seder: 'Nashim',    daf: 90  },
  { name: 'Nazir',        heb: 'נזיר',       seder: 'Nashim',    daf: 65  },
  { name: 'Sotah',        heb: 'סוטה',       seder: 'Nashim',    daf: 48  },
  { name: 'Gitin',        heb: 'גיטין',      seder: 'Nashim',    daf: 89  },
  { name: 'Kidushin',     heb: 'קידושין',    seder: 'Nashim',    daf: 81  },
  { name: 'Bava Kama',    heb: 'בבא קמא',    seder: 'Nezikin',   daf: 118 },
  { name: 'Bava Metzia',  heb: 'בבא מציעא',  seder: 'Nezikin',   daf: 118 },
  { name: 'Bava Basra',   heb: 'בבא בתרא',   seder: 'Nezikin',   daf: 175 },
  { name: 'Sanhedrin',    heb: 'סנהדרין',    seder: 'Nezikin',   daf: 112 },
  { name: 'Makkos',       heb: 'מכות',       seder: 'Nezikin',   daf: 23  },
  { name: 'Shevuos',      heb: 'שבועות',     seder: 'Nezikin',   daf: 48  },
  { name: 'Avoda Zara',   heb: 'עבודה זרה',  seder: 'Nezikin',   daf: 75  },
  { name: 'Horayos',      heb: 'הוריות',     seder: 'Nezikin',   daf: 13  },
  { name: 'Zevachim',     heb: 'זבחים',      seder: 'Kodashim',  daf: 119 },
  { name: 'Menachos',     heb: 'מנחות',      seder: 'Kodashim',  daf: 109 },
  { name: 'Chulin',       heb: 'חולין',      seder: 'Kodashim',  daf: 141 },
  { name: 'Bechoros',     heb: 'בכורות',     seder: 'Kodashim',  daf: 60  },
  { name: 'Erchin',       heb: 'ערכין',      seder: 'Kodashim',  daf: 33  },
  { name: 'Temurah',      heb: 'תמורה',      seder: 'Kodashim',  daf: 33  },
  { name: 'Kerisus',      heb: 'כריתות',     seder: 'Kodashim',  daf: 27  },
  { name: 'Meilah',       heb: 'מעילה',      seder: 'Kodashim',  daf: 22  },
  { name: 'Nidah',        heb: 'נדה',        seder: 'Taharos',   daf: 72  },
];

// Cycle 14 started January 5, 2020
const DAF_YOMI_CYCLE_14_START = new Date('2020-01-05T00:00:00Z').getTime();
const TOTAL_DAF = DAF_YOMI_TRACTATES.reduce((s, t) => s + t.daf, 0); // 2709

export function getDafYomi(): DafYomiResult {
  const now      = new Date();
  // Use UTC midnight so it advances at midnight UTC
  const today    = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayInCycle = Math.floor((today - DAF_YOMI_CYCLE_14_START) / (24 * 60 * 60 * 1000)) % TOTAL_DAF;
  const cycleDay  = ((dayInCycle % TOTAL_DAF) + TOTAL_DAF) % TOTAL_DAF;

  let remaining = cycleDay;
  for (const tract of DAF_YOMI_TRACTATES) {
    if (remaining < tract.daf) {
      const dafNum = remaining + 2; // daf starts at 2
      return {
        tractate:    tract.name,
        tractateHeb: tract.heb,
        daf:         dafNum,
        dafDisplay:  `${dafNum}`,
        sedarName:   tract.seder,
        cycleDay:    cycleDay + 1,
      };
    }
    remaining -= tract.daf;
  }
  // Fallback (should not reach here)
  return {
    tractate:    DAF_YOMI_TRACTATES[0].name,
    tractateHeb: DAF_YOMI_TRACTATES[0].heb,
    daf:         2,
    dafDisplay:  '2',
    sedarName:   DAF_YOMI_TRACTATES[0].seder,
    cycleDay:    1,
  };
}

// ── Shabbat status ────────────────────────────────────────────────────────────

export type ShabbatStatus =
  | 'erev'      // Friday — Shabbos starts tonight
  | 'shabbat'   // Saturday — Shabbat Shalom
  | 'motzei'    // Saturday after ~8pm (rough estimate)
  | 'weekday';  // Sun–Thu — days until next Shabbos

export interface ShabbatInfo {
  status:       ShabbatStatus;
  daysUntil:    number; // 0 on Fri/Sat, otherwise Fri = 0, Sat = 0
  displayText:  string;
  hebrewText:   string;
}

export function getShabbatInfo(): ShabbatInfo {
  const now     = new Date();
  const day     = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const hour    = now.getHours();

  if (day === 5) {
    return { status: 'erev', daysUntil: 0, displayText: 'Erev Shabbos', hebrewText: 'ערב שבת' };
  }
  if (day === 6) {
    if (hour >= 20) {
      return { status: 'motzei', daysUntil: 0, displayText: 'Shavua Tov', hebrewText: 'שבוע טוב' };
    }
    return { status: 'shabbat', daysUntil: 0, displayText: 'Shabbat Shalom', hebrewText: 'שבת שלום' };
  }
  // Sun=0 → 6 days to Fri; Mon=1 → 5; Tue=2 → 4; Wed=3 → 3; Thu=4 → 2
  const daysUntil = day === 0 ? 6 : 5 - (day - 1);
  return {
    status:      'weekday',
    daysUntil,
    displayText: `Shabbos in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    hebrewText:  'שבת קודש',
  };
}

