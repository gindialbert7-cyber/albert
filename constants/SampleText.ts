/**
 * Sample reading content for each book.
 * In production, content is streamed from the CDN / CMS.
 */

export interface TextSection {
  type: 'heading' | 'hebrew' | 'english' | 'commentary' | 'divider' | 'verseHebrew' | 'verseEnglish';
  content: string;
  verseRef?: string;
  /**
   * Optional audio explainer — when set, reader shows a gold speaker icon
   * that plays a short (60-180s) clip mapped via audioManifestService.
   */
  audioId?: string;
}

export const SAMPLE_CONTENT: Record<string, TextSection[]> = {
  'chumash-rashi': [
    {
      type: 'heading',
      content: 'Bereishis — In the Beginning',
      verseRef: 'בְּרֵאשִׁית',
    },
    {
      type: 'hebrew',
      content: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ:',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content: 'In the beginning, God created the heaven and the earth.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content:
        'Rashi: It was not necessary to begin the Torah from here [Bereishis], but rather from "This month shall be to you" (Shemos 12:2), which is the first commandment given to Israel. Why then did it begin with Bereishis? Because of [the verse] "The strength of His works He declared to His people, to give them the heritage of nations." (Psalms 111:6).',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל-פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל-פְּנֵי הַמָּיִם:',
      verseRef: '1:2',
    },
    {
      type: 'english',
      content: 'And the earth was without form and void; and darkness was upon the face of the deep; and the spirit of God moved upon the face of the waters.',
      verseRef: '1:2',
    },
    {
      type: 'commentary',
      content:
        'Rashi: "And the spirit of God hovered" — The Throne of Glory stood in the air, hovering over the waters through the breath of the mouth of the Holy One, Blessed is He, like a dove hovering over its nest.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי-אוֹר:',
      verseRef: '1:3',
    },
    {
      type: 'english',
      content: 'And God said, "Let there be light," and there was light.',
      verseRef: '1:3',
    },
    {
      type: 'commentary',
      content:
        'Rashi: This light [of the first day] — from where was it created? He wrapped Himself in it like a garment, and its radiance shone from one end of the world to the other. When the Holy One, Blessed is He, foresaw the deeds of the wicked, He hid it for the righteous in the World to Come.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וַיַּרְא אֱלֹהִים אֶת-הָאוֹר כִּי-טוֹב וַיַּבְדֵּל אֱלֹהִים בֵּין הָאוֹר וּבֵין הַחֹשֶׁךְ:',
      verseRef: '1:4',
    },
    {
      type: 'english',
      content: 'And God saw the light, that it was good; and God divided the light from the darkness.',
      verseRef: '1:4',
    },
    {
      type: 'commentary',
      content:
        'Rashi: "God saw the light, that it was good" — He saw that it was not fitting for the wicked to use this light, so He set it aside for the righteous in the World to Come. In the plain sense of Scripture, explain it as it is written: He saw it was good, and it was inappropriate for light and darkness to perform their functions intermingled, so He established this for day and this for night.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וַיִּקְרָא אֱלֹהִים לָאוֹר יוֹם וְלַחֹשֶׁךְ קָרָא לָיְלָה וַיְהִי-עֶרֶב וַיְהִי-בֹקֶר יוֹם אֶחָד:',
      verseRef: '1:5',
    },
    {
      type: 'english',
      content: 'And God called the light Day, and the darkness He called Night. And there was evening and there was morning, one day.',
      verseRef: '1:5',
    },
    {
      type: 'commentary',
      content:
        'Rashi: "One day" — It should say "the first day," as it says regarding the others, "second day," "third day"? This teaches that the Holy One, Blessed is He, was alone in His world, for the angels were not created until the second day.',
    },
  ],

  'tanya': [
    {
      type: 'heading',
      content: 'Likkutei Amarim — Chapter One',
      verseRef: 'ליקוטי אמרים – פרק א',
    },
    {
      type: 'hebrew',
      content: 'הַנְּשָׁמוֹת שֶׁבְּגֵן עֵדֶן – הֵן נִשְׁמוֹת הַצַּדִּיקִים, וּמַדְרֵגוֹת רַבּוֹת יֵשׁ בָּהֶן, צַדִּיקִים וַחֲסִידִים וְאַנְשֵׁי מַעֲשֶׂה, וּגְדוֹלִים מֵהֶן נְשִׂיאֵי הַדּוֹרוֹת שֶׁבְּכָל דּוֹר וָדוֹר.',
    },
    {
      type: 'english',
      content: 'The souls in Gan Eden — they are the souls of the tzaddikim, and there are many levels among them: tzaddikim, chassidim, and men of deed; and greater than these are the princes of each generation, in every generation.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'כִּי כָּל אֶחָד וְאֶחָד מִיִּשְׂרָאֵל יֵשׁ לוֹ נֶפֶשׁ רוּחַ וּנְשָׁמָה מִן הַקְּדֻשָּׁה, כְּמוֹ שֶׁכָּתוּב "נִשְׁמַת ה\' אֱלֹהַי" — אֲבָל לְגַבֵּי הָאֱלֹהוּת שֶׁבֶּאֱמֶת לָאֱמֶת, אֵין עֵרֶךְ וּדְמִיוֹן כְּלָל.',
    },
    {
      type: 'english',
      content: 'For every single Jew possesses a nefesh, ruach, and neshamah from the realm of holiness — as it is written, "The breath of Hashem, my God." Yet in relation to the true Divinity, there is no comparison or likeness whatsoever.',
    },
    { type: 'divider', content: '' },
    {
      type: 'heading',
      content: 'Chapter Two — The Divine Soul',
      verseRef: 'פרק ב',
    },
    {
      type: 'hebrew',
      content: 'וְהִנֵּה יֵשׁ בְּכָל אֶחָד וְאֶחָד מִיִּשְׂרָאֵל שְׁתֵּי נְשָׁמוֹת, דִּכְתִיב: "וַיִּפַּח בְּאַפָּיו נִשְׁמַת חַיִּים" — שְׁתַּיִם; נֶפֶשׁ הַבַּהֲמִית הַבָּאָה מִצַּד הַקְּלִיפָּה, וְנֶפֶשׁ הָאֱלֹהִית.',
    },
    {
      type: 'english',
      content: 'Now, there are two souls within every Jew — as it is written, "He breathed into his nostrils a breath of life" (using the plural form "lives"): the animal soul, which derives from the side of kelipah, and the Divine soul.',
    },
    {
      type: 'commentary',
      content: 'The Alter Rebbe teaches that this dual-soul structure is unique to the Jewish people. The animal soul seeks physical pleasure and self-preservation. The Divine soul yearns to cleave to G-d. The entire spiritual life of a Jew is shaped by the tension and ultimate harmony between these two forces.',
    },
  ],

  'pirkei-avos': [
    {
      type: 'heading',
      content: 'Chapter One — The Chain of Tradition',
      verseRef: 'פרק א – קבלת התורה',
    },
    {
      type: 'hebrew',
      content: 'מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי, וּמְסָרָהּ לִיהוֹשֻׁעַ, וִיהוֹשֻׁעַ לִזְקֵנִים, וּזְקֵנִים לִנְבִיאִים, וּנְבִיאִים מְסָרוּהָ לְאַנְשֵׁי כְנֶסֶת הַגְּדוֹלָה.',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content: 'Moses received the Torah from Sinai and transmitted it to Joshua; Joshua to the Elders; the Elders to the Prophets; and the Prophets transmitted it to the Men of the Great Assembly.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content: 'The Mishnah begins with this chain of transmission to teach us that the Torah — both Written and Oral — comes from a single Divine source, and has been faithfully transmitted through an unbroken chain of sages in every generation.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'הֵם אָמְרוּ שְׁלֹשָׁה דְבָרִים: הֱווּ מְתוּנִים בַּדִּין, וְהַעֲמִידוּ תַלְמִידִים הַרְבֵּה, וַעֲשׂוּ סְיָג לַתּוֹרָה.',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content: 'They said three things: Be deliberate in judgment; raise up many students; and make a fence for the Torah.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content: 'Bartenura: "Be deliberate in judgment" — do not rush to render a verdict, for a judge who hastens errs. "Raise up many students" — do not be selective; teach whoever comes to learn. "Make a fence for the Torah" — enact precautionary measures to prevent transgression of the Torah\'s actual laws.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'שִׁמְעוֹן הַצַּדִּיק הָיָה מִשְּׁיָרֵי כְנֶסֶת הַגְּדוֹלָה. הוּא הָיָה אוֹמֵר: עַל שְׁלֹשָׁה דְבָרִים הָעוֹלָם עוֹמֵד — עַל הַתּוֹרָה, וְעַל הָעֲבוֹדָה, וְעַל גְּמִילוּת חֲסָדִים.',
      verseRef: '1:2',
    },
    {
      type: 'english',
      content: 'Shimon the Righteous was among the last survivors of the Great Assembly. He used to say: The world stands on three things — on Torah, on Divine service, and on acts of lovingkindness.',
      verseRef: '1:2',
    },
    {
      type: 'commentary',
      content: 'Rambam: These three things correspond to the three relationships of every person: Torah — one\'s relationship with his Creator through study; Divine service — one\'s personal spiritual work; acts of lovingkindness — one\'s relationship with fellow man. Together they form a complete human being.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'אַנְטִיגְנוֹס אִישׁ שׂוֹכוֹ קִבֵּל מִשִּׁמְעוֹן הַצַּדִּיק. הוּא הָיָה אוֹמֵר: אַל תִּהְיוּ כַּעֲבָדִים הַמְשַׁמְּשִׁין אֶת הָרַב עַל מְנָת לְקַבֵּל פְּרָס, אֶלָּא הֱווּ כַּעֲבָדִים הַמְשַׁמְּשִׁין אֶת הָרַב שֶׁלֹּא עַל מְנָת לְקַבֵּל פְּרָס.',
      verseRef: '1:3',
    },
    {
      type: 'english',
      content: 'Antigonus of Socho received the tradition from Shimon the Righteous. He used to say: Do not be like servants who serve their master for the sake of receiving reward; rather, be like servants who serve their master not for the sake of receiving reward.',
      verseRef: '1:3',
    },
    {
      type: 'commentary',
      content: 'This does not mean reward should be rejected — rather, it should not be the motivation for service. The ideal is to serve out of love and awe alone. The reward will come, but the servant\'s heart must be directed purely toward the Master.',
    },
  ],

  'mesilat-yesharim': [
    {
      type: 'heading',
      content: 'Introduction — The Purpose of Man',
      verseRef: 'הקדמה',
    },
    {
      type: 'hebrew',
      content: 'יְסוֹד הַחֲסִידוּת וְשֹׁרֶשׁ הָעֲבוֹדָה הַתְּמִימָה הוּא שֶׁיִּתְבָּרֵר וְיִתְאַמֵּת אֵצֶל הָאָדָם מַה חוֹבָתוֹ בְּעוֹלָמוֹ, וּלְאַיִן יָשִׂים מַבָּטוֹ וּמִגְמָתוֹ בְּכָל אֲשֶׁר הוּא עָמֵל כָּל יְמֵי חַיָּיו.',
    },
    {
      type: 'english',
      content: 'The foundation of piety and the root of perfect Divine service is for a person to clarify and recognize what his obligation is in his world, and toward what his gaze and aspiration should be directed in all that he labors all the days of his life.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וְהִנֵּה, מַה שֶּׁהוֹרוּנוּ חֲכָמֵינוּ זִכְרוֹנָם לִבְרָכָה הוּא, שֶׁהָאָדָם לֹא נִבְרָא אֶלָּא לְהִתְעַנּוֹת עַל הַקַּב"ה.',
    },
    {
      type: 'english',
      content: 'Now, what our Sages of blessed memory have taught us is that man was created for no other purpose than to delight in the Holy One, Blessed is He.',
    },
    {
      type: 'commentary',
      content: 'The Ramchal begins the entire work with this single, powerful statement: the purpose of human existence is deveikut — cleaving to G-d — and the delight that comes from it. Every chapter of Mesilat Yesharim builds toward this end.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'אֶלָּא שֶׁמִּפְּנֵי זֶה צָרִיךְ שֶׁיַּנִּיחַ אָדָם כָּל עִנְיְנֵי הָעוֹלָם הַזֶּה שֶׁאֵינָם אֶלָּא אֶמְצָעִיִּים אֵלָיו, לֹא שֶׁיִּהְיֶה חֲפֵץ בָּהֶם לְעַצְמָם.',
    },
    {
      type: 'english',
      content: 'For this reason, a person must consider all the matters of this world as merely instrumental means [to his true purpose], not as things he desires for their own sake.',
    },
    {
      type: 'commentary',
      content: 'This is the Ramchal\'s revolutionary reframing of worldly existence: physical reality is not an obstacle to spirituality, nor is it an end in itself — it is a vehicle. Food, sleep, work, family, community — all are raw material for sanctification and Divine service.',
    },
    { type: 'divider', content: '' },
    {
      type: 'heading',
      content: 'On Watchfulness — Zerizut',
      verseRef: 'פרק ז — הזריזות',
    },
    {
      type: 'hebrew',
      content: 'הַזְּרִיזוּת הִיא הַשְׁלָמַת הַנְּקִיּוּת, אַחַר שֶׁנִּתְנַקָּה מֵהָרָע — יִמְהַר לַעֲשׂוֹת הַטּוֹב, כְּמוֹ שֶׁאָמַר הַכָּתוּב: "סוּר מֵרָע וַעֲשֵׂה-טוֹב".',
    },
    {
      type: 'english',
      content: 'Alacrity is the completion of cleanliness: once a person has cleansed himself from evil, he should hasten to do good — as the verse states: "Turn away from evil and do good."',
    },
  ],

  'kitzur-shulchan-aruch': [
    {
      type: 'heading',
      content: 'Morning Conduct — Rising to Serve the Creator',
      verseRef: 'הלכות השכמת הבוקר',
    },
    {
      type: 'hebrew',
      content: 'יִתְגַּבֵּר כַּאֲרִי לַעֲמֹד בַּבֹּקֶר לַעֲבוֹדַת בּוֹרְאוֹ, שֶׁיְּהֵא הוּא מְעוֹרֵר הַשַּׁחַר.',
    },
    {
      type: 'english',
      content: 'A person should be as strong as a lion to rise in the morning to serve his Creator, so that he should be the one to arouse the dawn.',
    },
    {
      type: 'commentary',
      content: 'This opening line, drawn from the Shulchan Aruch of Rav Yosef Karo, sets the tone for the entire code of Jewish law: Jewish life is not reactive but intentional. The Jew does not wait for morning to happen — he shapes it.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'מִיָּד כְּשֶׁיֵּעוֹר מִשְּׁנָתוֹ יַחֲשֹׁב בְּלִבּוֹ לִפְנֵי מִי הוּא שׁוֹכֵב, וְיֹאמַר: מוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ.',
    },
    {
      type: 'english',
      content: 'Immediately upon awakening, one should consider before Whom he lies, and say: "Modeh Ani — I give thanks before You, living and eternal King, for You have returned my soul to me with compassion; great is Your faithfulness."',
    },
    {
      type: 'commentary',
      content: 'Notably, Modeh Ani is recited even before washing hands, because it does not contain any of G-d\'s names — only gratitude. This teaches that thankfulness precedes all ritual requirements. The first thought of the day is gratitude.',
    },
    { type: 'divider', content: '' },
    {
      type: 'heading',
      content: 'Laws of Prayer — Times of Tefillah',
      verseRef: 'הלכות תפילה',
    },
    {
      type: 'hebrew',
      content: 'זְמַן תְּפִלַּת שַׁחֲרִית מִצְוָה לְכַתְּחִלָּה לְהִתְפַּלֵּל עִם הַנֵּץ הַחַמָּה, כְּדֵי שֶׁיִּסְמֹךְ גְּאֻלָּה לִתְפִלָּה וּיִתְפַּלֵּל בַּיּוֹם.',
    },
    {
      type: 'english',
      content: 'The ideal time for Shacharit: it is a mitzvah to pray initially at sunrise (hanetz), in order to juxtapose the blessing of redemption [which concludes Pesukei D\'zimra] immediately with the Amidah, and to pray during the day.',
    },
  ],

  'mishnah-complete': [
    {
      type: 'heading',
      content: 'Tractate Berachos — Blessings and Prayer',
      verseRef: 'מסכת ברכות',
    },
    {
      type: 'hebrew',
      content: 'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בָּעֲרָבִית? מִשָּׁעָה שֶׁהַכֹּהֲנִים נִכְנָסִים לֶאֱכֹל בִּתְרוּמָתָן, עַד סוֹף הָאַשְׁמוּרָה הָרִאשׁוֹנָה — דִּבְרֵי רַבִּי אֱלִיעֶזֶר.',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content: 'From what time may one recite the Shema in the evening? From the time that the priests enter [the Temple] to eat their terumah, until the end of the first watch — these are the words of Rabbi Eliezer.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content: 'The Mishnah opens not with the beginning of the day but with evening — following the Torah\'s model of creation where "it was evening and it was morning." The question of when to recite Shema sets the tone: Jewish law emerges from practical questions, rigorously analyzed.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וַחֲכָמִים אוֹמְרִים: עַד חֲצוֹת. רַבָּן גַּמְלִיאֵל אוֹמֵר: עַד שֶׁיַּעֲלֶה עַמּוּד הַשַּׁחַר.',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content: 'The Sages say: until midnight. Rabban Gamliel says: until the pillar of dawn rises.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content: 'Three opinions are recorded: Rabbi Eliezer (first watch, around 10pm), the Sages (midnight), and Rabban Gamliel (dawn). Halacha follows the Sages. Rabban Gamliel notes that his sons once came home from a celebration after midnight and were permitted to recite Shema — demonstrating the law in action.',
    },
    { type: 'divider', content: '' },
    {
      type: 'heading',
      content: 'Tractate Avos — Ethics of the Fathers',
      verseRef: 'מסכת אבות',
    },
    {
      type: 'hebrew',
      content: 'בֶּן זוֹמָא אוֹמֵר: אֵיזֶהוּ חָכָם? הַלּוֹמֵד מִכָּל אָדָם. אֵיזֶהוּ גִבּוֹר? הַכּוֹבֵשׁ אֶת יִצְרוֹ. אֵיזֶהוּ עָשִׁיר? הַשָּׂמֵחַ בְּחֶלְקוֹ.',
      verseRef: '4:1',
    },
    {
      type: 'english',
      content: 'Ben Zoma says: Who is wise? One who learns from every person. Who is strong? One who subdues his evil inclination. Who is wealthy? One who is satisfied with his portion.',
      verseRef: '4:1',
    },
    {
      type: 'commentary',
      content: 'These four definitions invert worldly values: wisdom is not genius but openness; strength is not physical but moral; wealth is not accumulation but contentment. Ben Zoma teaches that the greatest human qualities are accessible to everyone — they depend only on attitude and will.',
    },
  ],

  'rambam-mishneh-torah': [
    {
      type: 'heading',
      content: 'Sefer HaMadah — Laws of Torah Study',
      verseRef: 'הלכות תלמוד תורה',
    },
    {
      type: 'hebrew',
      content: 'כָּל אִישׁ מִיִּשְׂרָאֵל חַיָּב בְּתַלְמוּד תּוֹרָה, בֵּין עָנִי בֵּין עָשִׁיר, בֵּין שָׁלֵם בְּגוּפוֹ בֵּין בַּעַל יִסּוּרִים, בֵּין בַּחוּר בֵּין שֶׁהָיָה זָקֵן גָּדוֹל שֶׁכָּהֲתָה כֹּחוֹ.',
    },
    {
      type: 'english',
      content: 'Every man in Israel is obligated to study Torah — whether poor or wealthy, whether physically whole or afflicted, whether young or very old whose strength has faded.',
    },
    {
      type: 'commentary',
      content: 'The Rambam places Torah study as the first positive commandment in the section on knowledge — before prayer, before Shabbos, before kashrut. This ordering is deliberate: without knowledge of G-d, all other observance lacks foundation.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'עַד אֵימָתַי חַיָּב אָדָם לִלְמֹד תּוֹרָה? עַד יוֹם מוֹתוֹ. שֶׁנֶּאֱמַר: "וּפֶן יָסוּרוּ מִלְּבָבְךָ כֹּל יְמֵי חַיֶּיךָ".',
    },
    {
      type: 'english',
      content: 'Until when is a person obligated to study Torah? Until the day of his death — as it is stated: "And lest they depart from your heart all the days of your life."',
    },
    { type: 'divider', content: '' },
    {
      type: 'heading',
      content: 'Foundations of the Torah — On the Unity of God',
      verseRef: 'יסודי התורה א',
    },
    {
      type: 'hebrew',
      content: 'יְסוֹד הַיְסוֹדוֹת וְעַמּוּד הַחָכְמוֹת לֵידַע שֶׁיֵּשׁ שָׁם מָצוּי רִאשׁוֹן, וְהוּא מְמַצִּיא כָּל נִמְצָא, וְכָל הַנִּמְצָאִים מִשָּׁמַיִם וָאָרֶץ וּמַה שֶּׁבֵּינֵיהֶם לֹא נִמְצְאוּ אֶלָּא מֵאֱמִתַּת הִמָּצְאוֹ.',
    },
    {
      type: 'english',
      content: 'The foundation of foundations and the pillar of wisdoms is to know that there is a First Being, and that He brings into being all existents, and that all existents from heaven to earth and what is between them exist only through the reality of His existence.',
    },
    {
      type: 'commentary',
      content: 'The Rambam famously begins not with "believe" but with "know" — da\'at. He requires not blind faith but intellectual comprehension. Yet this knowledge begins with an act of will: "to know." The pursuit of Divine wisdom is itself a commandment.',
    },
  ],

  'rav-soloveitchik-lonely-man': [
    {
      type: 'heading',
      content: 'The Two Adams — Majesty and Covenant',
    },
    {
      type: 'english',
      content: 'There are two accounts of the creation of man in the book of Genesis. At first glance these accounts appear to be contradictory — contradictory not only in detail but in fundamental approach and orientation. However, the contradiction dissolves once we realize that the Bible describes two representative human types, or two aspects of one and the same person.',
    },
    { type: 'divider', content: '' },
    {
      type: 'english',
      content: 'Adam the first, the majestic man, is interested in only one thing: to harness and dominate the elemental natural forces and to put them at his disposal. This practical man, who is bent upon translating abstract thought into technical achievement, is, in a sense, a hero. He is engaged in an endless dialectic with nature. He transforms the world of chaos into the world of order.',
    },
    {
      type: 'commentary',
      content: 'The Rav is drawing on the first creation narrative (Genesis 1), where Adam is commanded to "fill the earth and conquer it." This is the technological, scientific, conquering impulse of humanity — noble and necessary, but incomplete.',
    },
    { type: 'divider', content: '' },
    {
      type: 'english',
      content: 'Adam the second, created in Genesis 2, is not alone. He is in need of companionship. He is not interested in domination but in redemption. He is not interested in harnesses but in bonds — in covenantal relationships. He is the lonely man of faith who yearns for community, for belonging, for meaning.',
    },
    {
      type: 'commentary',
      content: 'This is the Rav\'s great insight: both Adams are real and both are necessary. The contradiction is not one to be resolved by choosing sides, but to be lived with — in what he calls the "existential tension" of the human condition. The man of faith must inhabit both worlds simultaneously.',
    },
    { type: 'divider', content: '' },
    {
      type: 'english',
      content: 'The man of faith who has thrown in his lot with God finds himself lonely and in need of God\'s company. He knows that his unique awareness and sensitivity, his intense love of God, may cause him to be misunderstood by people. The gesture of faith is lonely. But it is not without grandeur.',
    },
  ],

  'rabbi-sacks-great-partnership': [
    {
      type: 'heading',
      content: 'The Conflict That Never Was',
    },
    {
      type: 'english',
      content: 'Science and religion are the two most powerful forces in the world for shaping human culture and behavior. When they are at war — as they have been for the past century and a half — something is wrong. The conflict between them has impoverished both. Religion has lost some of its greatest minds, and science has lost something vital: the ability to tell us why, not just how.',
    },
    { type: 'divider', content: '' },
    {
      type: 'english',
      content: 'The conflict between science and religion is, I will argue, a mistake — an unnecessary collision between two fundamentally different ways of engaging with reality. Science is what we know when we analyze; religion is what we know when we feel called to respond. Science explains; religion gives meaning. Science is about the how; religion is about the why.',
    },
    {
      type: 'commentary',
      content: 'Rabbi Sacks draws on Jewish tradition\'s long history of engagement with philosophy, science, and reason — from Saadia Gaon and Maimonides to Rabbi Samson Raphael Hirsch and Rabbi Abraham Isaac Kook — to argue that authentic religion was never afraid of truth, whatever form it takes.',
    },
    { type: 'divider', content: '' },
    {
      type: 'english',
      content: 'The Hebrew word "emet" means truth. And it is made up, uniquely, of the first letter of the alphabet, the middle letter, and the last letter — aleph, mem, tav. Truth, in the Hebrew conception, is not one thing but everything, beginning to end. You cannot hold a piece of it and call it the whole. This is the radical intellectual humility that both science and religion, at their best, must share.',
    },
  ],

  'shulchan-aruch': [
    {
      type: 'heading',
      content: 'Orach Chaim — The Way of Life',
      verseRef: 'אורח חיים',
    },
    {
      type: 'hebrew',
      content: 'יִתְגַּבֵּר כַּאֲרִי לַעֲמֹד בַּבֹּקֶר לַעֲבוֹדַת בּוֹרְאוֹ שֶׁיְּהֵא הוּא מְעוֹרֵר הַשַּׁחַר.',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content: 'A person should be strong as a lion to rise in the morning to the service of his Creator, to the point that he is the one who arouses the dawn.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content: 'The Mechaber (R. Yosef Karo) opens with this dictum from the Tur, emphasizing the proactive nature of Jewish spiritual life. The Rema (R. Moshe Isserles) adds the verse from Psalms: "I have placed God before me always" — the foundation of all that follows.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'הִלְבֵּשׁ עַצְמְךָ בְּיִרְאַת ה\' אֱלֹהֶיךָ, כַּמּוֹ שֶׁכָּתוּב: "שִׁוִּיתִי ה\' לְנֶגְדִּי תָמִיד". כִּי שִׁוְיוֹן זֶה הוּא כְּלָל גָּדוֹל בַּתּוֹרָה.',
    },
    {
      type: 'english',
      content: 'Clothe yourself in fear of Hashem your G-d, as it is written: "I have placed Hashem before me always." For this consciousness is a great principle in the Torah.',
    },
    { type: 'divider', content: '' },
    {
      type: 'heading',
      content: 'Laws of Shabbos — The Sanctity of the Day',
      verseRef: 'הלכות שבת',
    },
    {
      type: 'hebrew',
      content: 'זְכֹר אֶת-יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ. מִצְוַת עֲשֵׂה לִקְדֹּשׁ אֶת הַשַּׁבָּת בִּדְבָרִים, בִּכְנִיסָתוֹ וּבִיצִיאָתוֹ.',
      verseRef: '261:1',
    },
    {
      type: 'english',
      content: '"Remember the Shabbat day to sanctify it." There is a positive commandment to sanctify the Shabbat with words — at its entrance (Kiddush) and at its departure (Havdalah).',
      verseRef: '261:1',
    },
  ],

  'talmud-bavli-berachos': [
    {
      type: 'heading',
      content: 'Daf 2a — When is Shema Recited?',
      verseRef: 'דף ב עמוד א',
    },
    {
      type: 'hebrew',
      content: 'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בָּעֲרָבִית? מִשָּׁעָה שֶׁהַכֹּהֲנִים נִכְנָסִין לֶאֱכֹל בִּתְרוּמָתָן — עַד סוֹף הָאַשְׁמוּרָה הָרִאשׁוֹנָה, דִּבְרֵי רַבִּי אֱלִיעֶזֶר.',
    },
    {
      type: 'english',
      content: 'From when may one recite Shema in the evening? From when the priests enter to eat their terumah — until the end of the first watch, the words of Rabbi Eliezer.',
    },
    {
      type: 'commentary',
      content: 'Rashi: "From when the priests enter" — which is from tzeis hakochavim, when three medium stars appear. The Mishnah chose priests as the marker rather than a set astronomical time, because the legal concept of "night" was defined in terms of when priests became eligible to eat terumah after their immersion.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וְחַכָּמִים אוֹמְרִים: עַד חֲצוֹת. רַבָּן גַּמְלִיאֵל אוֹמֵר: עַד שֶׁיַּעֲלֶה עַמּוּד הַשַּׁחַר. מַעֲשֶׂה שֶׁבָּאוּ בָנָיו מִבֵּית הַמִּשְׁתֶּה. אָמְרוּ לוֹ: לֹא קָרִינוּ אֶת שְׁמַע. אָמַר לָהֶם: אִם לֹא עָלָה עַמּוּד הַשַּׁחַר חַיָּבִין אַתֶּם לִקְרוֹת.',
    },
    {
      type: 'english',
      content: 'The Sages say: until midnight. Rabban Gamliel says: until the rise of dawn. His sons once came home from a banquet and told him: "We have not yet recited Shema." He said to them: "If dawn has not yet risen, you are obligated to recite it."',
    },
    {
      type: 'commentary',
      content: 'Tosafos: The story of Rabban Gamliel\'s sons is brought not merely as a proof-text but to show that the ruling was tested in real life. The son of a Nasi coming home after midnight from a celebration — and the father ruling that he must still recite Shema — demonstrates that the law is not theoretical.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'וְלָמָּה אָמְרוּ חֲכָמִים עַד חֲצוֹת — כְּדֵי לְהַרְחִיק אֶת הָאָדָם מִן הָעֲבֵרָה.',
    },
    {
      type: 'english',
      content: 'And why did the Sages say until midnight? In order to distance man from transgression.',
    },
    {
      type: 'commentary',
      content: 'Even though the actual halacha follows Rabban Gamliel (until dawn), the Sages enacted a "fence" making midnight the practical deadline. This reveals a recurring Talmudic method: rabbinic enactments are not arbitrary but serve to protect the Torah\'s spirit, not just its letter.',
    },
  ],

  'default': [
    {
      type: 'heading',
      content: 'Opening Chapter',
    },
    {
      type: 'english',
      content: 'This beautiful sefer awaits you. The full text will stream from our library when you have an active subscription. The layout you see here — with its careful typography, generous margins, and warm parchment tones — is designed for the way serious Jewish learning actually happens: slowly, deliberately, with attention.',
    },
    { type: 'divider', content: '' },
    {
      type: 'hebrew',
      content: 'תּוֹרַת ה\' תְּמִימָה מְשִׁיבַת נָפֶשׁ, עֵדוּת ה\' נֶאֱמָנָה מַחְכִּימַת פֶּתִי.',
    },
    {
      type: 'english',
      content: '"The Torah of Hashem is perfect, restoring the soul; the testimony of Hashem is trustworthy, making the simple wise." — Psalms 19:8',
    },
  ],
};
