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
