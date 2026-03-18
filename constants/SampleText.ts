/**
 * Sample reading content for each book.
 * In production, content is streamed from the CDN / CMS.
 */

export interface TextSection {
  type: 'heading' | 'hebrew' | 'english' | 'commentary' | 'divider' | 'verseHebrew' | 'verseEnglish';
  content: string;
  verseRef?: string;
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
      content:
        'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ:',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content:
        'In the beginning, God created the heaven and the earth.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content:
        'Rashi: It was not necessary to begin the Torah from here [Bereishis], but rather from "This month shall be to you" (Shemos 12:2), which is the first commandment given to Israel. Why then did it begin with Bereishis? Because of [the verse] "The strength of His works He declared to His people, to give them the heritage of nations." (Psalms 111:6).',
    },
    {
      type: 'divider',
      content: '',
    },
    {
      type: 'hebrew',
      content:
        'וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל-פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל-פְּנֵי הַמָּיִם:',
      verseRef: '1:2',
    },
    {
      type: 'english',
      content:
        'And the earth was without form and void; and darkness was upon the face of the deep; and the spirit of God moved upon the face of the waters.',
      verseRef: '1:2',
    },
    {
      type: 'commentary',
      content:
        'Rashi: "And the spirit of God hovered" — The Throne of Glory stood in the air, hovering over the waters through the breath of the mouth of the Holy One, Blessed is He, like a dove hovering over its nest.',
    },
    {
      type: 'divider',
      content: '',
    },
    {
      type: 'hebrew',
      content:
        'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי-אוֹר:',
      verseRef: '1:3',
    },
    {
      type: 'english',
      content:
        'And God said, "Let there be light," and there was light.',
      verseRef: '1:3',
    },
    {
      type: 'commentary',
      content:
        'Rashi: This light [of the first day] — from where was it created? He wrapped Himself in it like a garment, and its radiance shone from one end of the world to the other. When the Holy One, Blessed is He, foresaw the deeds of the wicked, He hid it for the righteous in the World to Come.',
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
      content:
        'הַנְּשָׁמוֹת שֶׁבְּגֵן עֵדֶן – הֵן נִשְׁמוֹת הַצַּדִּיקִים, וּמַדְרֵגוֹת רַבּוֹת יֵשׁ בָּהֶן, צַדִּיקִים וַחֲסִידִים וְאַנְשֵׁי מַעֲשֶׂה, וּגְדוֹלִים מֵהֶן נְשִׂיאֵי הַדּוֹרוֹת שֶׁבְּכָל דּוֹר וָדוֹר.',
    },
    {
      type: 'english',
      content:
        'The souls in Gan Eden — they are the souls of the tzaddikim, and there are many levels among them: tzaddikim, chassidim, and men of deed; and greater than these are the princes of each generation, in every generation.',
    },
    {
      type: 'divider',
      content: '',
    },
    {
      type: 'hebrew',
      content:
        'כִּי כָּל אֶחָד וְאֶחָד מִיִּשְׂרָאֵל יֵשׁ לוֹ נֶפֶשׁ רוּחַ וּנְשָׁמָה מִן הַקְּדֻשָּׁה, כְּמוֹ שֶׁכָּתוּב "נִשְׁמַת ה\' אֱלֹהַי" — אֲבָל לְגַבֵּי הָאֱלֹהוּת שֶׁבֶּאֱמֶת לָאֱמֶת, אֵין עֵרֶךְ וּדְמִיוֹן כְּלָל.',
    },
    {
      type: 'english',
      content:
        'For every single Jew possesses a nefesh, ruach, and neshamah from the realm of holiness — as it is written, "The breath of Hashem, my God." Yet in relation to the true Divinity, there is no comparison or likeness whatsoever.',
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
      content:
        'מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי, וּמְסָרָהּ לִיהוֹשֻׁעַ, וִיהוֹשֻׁעַ לִזְקֵנִים, וּזְקֵנִים לִנְבִיאִים, וּנְבִיאִים מְסָרוּהָ לְאַנְשֵׁי כְנֶסֶת הַגְּדוֹלָה.',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content:
        'Moses received the Torah from Sinai and transmitted it to Joshua; Joshua to the Elders; the Elders to the Prophets; and the Prophets transmitted it to the Men of the Great Assembly.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content:
        'The Mishnah begins with this chain of transmission to teach us that the Torah — both Written and Oral — comes from a single Divine source, and has been faithfully transmitted through an unbroken chain of sages in every generation.',
    },
    {
      type: 'divider',
      content: '',
    },
    {
      type: 'hebrew',
      content:
        'הֵם אָמְרוּ שְׁלֹשָׁה דְבָרִים: הֱווּ מְתוּנִים בַּדִּין, וְהַעֲמִידוּ תַלְמִידִים הַרְבֵּה, וַעֲשׂוּ סְיָג לַתּוֹרָה.',
      verseRef: '1:1',
    },
    {
      type: 'english',
      content:
        'They said three things: Be deliberate in judgment; raise up many students; and make a fence for the Torah.',
      verseRef: '1:1',
    },
    {
      type: 'commentary',
      content:
        'Bartenura: "Be deliberate in judgment" — do not rush to render a verdict, for a judge who hastens errs. "Raise up many students" — do not be selective; teach whoever comes to learn. "Make a fence for the Torah" — enact precautionary measures to prevent transgression of the Torah\'s actual laws.',
    },
  ],

  'default': [
    {
      type: 'heading',
      content: 'Opening Chapter',
    },
    {
      type: 'english',
      content:
        'This beautiful sefer awaits you. The full text will stream from our library when you have an active subscription. The layout you see here — with its careful typography, generous margins, and warm parchment tones — is designed for the way serious Jewish learning actually happens: slowly, deliberately, with attention.',
    },
    {
      type: 'divider',
      content: '',
    },
    {
      type: 'hebrew',
      content:
        'תּוֹרַת ה\' תְּמִימָה מְשִׁיבַת נָפֶשׁ, עֵדוּת ה\' נֶאֱמָנָה מַחְכִּימַת פֶּתִי.',
    },
    {
      type: 'english',
      content:
        '"The Torah of Hashem is perfect, restoring the soul; the testimony of Hashem is trustworthy, making the simple wise." — Psalms 19:8',
    },
  ],
};
