/**
 * Seed fixtures — five songs, each proving something the page must handle.
 *
 * ⚠️ LYRIC AND MEANING TEXT HERE IS ILLUSTRATIVE FIXTURE DATA, not authoritative
 * transcription or scholarship. It exists to exercise code paths. Real lyrics and
 * real explanations arrive through the research pipeline with real sources
 * attached. Never promote this content to production data.
 *
 * One fixture source is deliberately stored in Urdu script: it must be storable
 * and never emittable (constitution Principle III).
 */

export type Mode = 'en' | 'hi' | 'hi-Latn';
export type Script = 'deva' | 'latn';
export type SourceType = 'blog' | 'forum' | 'lyrics' | 'interview' | 'academic' | 'other';

export interface SourceFixture {
  key: string;
  url: string;
  domain: string;
  type: SourceType;
  excerpt: string;
  reachable?: boolean;
}

export interface MeaningFixture {
  /** Source keys backing this meaning. Fewer than four means it is below the bar. */
  sources: string[];
  status?: 'active' | 'stale';
  text: Record<Mode, string>;
}

export interface WordFixture {
  position: number;
  latn: string;
  deva: string;
  meaning?: MeaningFixture;
}

export interface LineFixture {
  latn: string;
  deva: string;
  meaning?: MeaningFixture;
  words?: WordFixture[];
}

export interface SongFixture {
  slug: string;
  title: Record<Script, string>;
  artist: string;
  year: number;
  film?: string;
  proves: string;
  summary?: MeaningFixture;
  lines: LineFixture[];
}

export const SOURCES: SourceFixture[] = [
  {
    key: 'sufi-blog',
    url: 'https://example-sufipoetry.test/kun-faya-kun',
    domain: 'sufipoetry.blog',
    type: 'blog',
    excerpt: 'The phrase enters filmi verse from scripture, where command and creation are one act.',
  },
  {
    key: 'scroll',
    url: 'https://example-scroll.test/rahman-rockstar',
    domain: 'scroll.in',
    type: 'interview',
    excerpt: 'Rahman has described recording the qawwali live at the shrine to keep its breath intact.',
  },
  {
    key: 'reddit-qawwali',
    url: 'https://example-reddit.test/r/qawwali/kfk',
    domain: 'reddit.com',
    type: 'forum',
    excerpt: 'It lands less as theology than as relief — the moment you stop struggling.',
  },
  {
    key: 'lyrics-archive',
    url: 'https://example-lyrics.test/kun-faya-kun',
    domain: 'lyricsarchive.test',
    type: 'lyrics',
    excerpt: 'Transliteration and line breaks as sung, not as printed.',
  },
  {
    key: 'academic-sufi',
    url: 'https://example-journal.test/annihilation-self',
    domain: 'journal.test',
    type: 'academic',
    excerpt: 'Fana denotes the passing away of the self, not its destruction — a distinction the poets keep.',
  },
  {
    key: 'dargah-blog',
    url: 'https://example-dargah.test/haji-ali',
    domain: 'dargahnotes.blog',
    type: 'blog',
    excerpt: 'The shrine sits on a causeway that floods twice a day, which the song uses as its image.',
  },
  {
    key: 'reddit-thin',
    url: 'https://example-reddit.test/r/bollywood/piya',
    domain: 'reddit.com',
    type: 'forum',
    excerpt: 'Someone asked what it means and nobody really answered.',
  },
  {
    key: 'rekhta-urdu',
    url: 'https://example-rekhta.test/nazm/kun-faya-kun',
    domain: 'rekhta.org',
    type: 'lyrics',
    // Stored in its original script for provenance. Must never be rendered.
    excerpt: 'کن فیا کن — امرِ الٰہی کی طرف اشارہ ہے، جہاں حکم اور تخلیق ایک ہی لمحہ ہیں۔',
  },
  {
    key: 'dead-link',
    url: 'https://example-gone.test/old-essay',
    domain: 'oldessays.test',
    type: 'blog',
    excerpt: 'The stored excerpt survives even though the page no longer does.',
    reachable: false,
  },
  {
    key: 'delhi6-notes',
    url: 'https://example-notes.test/delhi6',
    domain: 'filmnotes.test',
    type: 'blog',
    excerpt: 'The qawwali form is used here as petition — addressed upward, asking rather than praising.',
  },
];

const FULL = ['sufi-blog', 'scroll', 'reddit-qawwali', 'lyrics-archive', 'academic-sufi'];
const FULL_WITH_URDU = [...FULL, 'rekhta-urdu'];

export const SONGS: SongFixture[] = [
  {
    slug: 'kun-faya-kun',
    title: { latn: 'Kun Faya Kun', deva: 'कुन फ़या कुन' },
    artist: 'A.R. Rahman',
    year: 2011,
    film: 'Rockstar',
    proves: 'Fully grounded. All three modes, source strips, word meanings, and a source stored in Urdu script that must never be emitted.',
    summary: {
      sources: FULL,
      text: {
        en: 'A song about giving up the struggle to control what happens, and finding that relief rather than loss waits on the other side.',
        hi: 'यह गीत नियंत्रण छोड़ देने के बारे में है — और यह पाने के बारे में कि उस ओर हानि नहीं, राहत प्रतीक्षा कर रही है।',
        'hi-Latn':
          'Yeh gaana control chhod dene ke baare mein hai — aur yeh paane ke baare mein ki us taraf nuksaan nahin, raahat intezaar kar rahi hai.',
      },
    },
    lines: [
      { latn: 'Ya nizaam-ud-din auliya', deva: 'या निज़ाम-उद-दीन औलिया' },
      {
        latn: 'Kun faya kun',
        deva: 'कुन फ़या कुन',
        meaning: {
          sources: FULL_WITH_URDU,
          text: {
            en: 'A phrase carried into filmi verse from scripture: be, and it is. Creation needs no labour — the wish alone is the act.',
            hi: 'धर्मग्रंथ से फ़िल्मी गीत में आया वाक्य: हो जा, तो वह हो जाता है। सृष्टि को श्रम नहीं चाहिए — इच्छा ही कर्म है।',
            'hi-Latn':
              'Dharmgranth se filmi gaane mein aaya vaakya: ho ja, aur woh ho jaata hai. Srishti ko mehnat nahin chahiye — ichha hi karm hai.',
          },
        },
        words: [
          {
            position: 0,
            latn: 'Kun',
            deva: 'कुन',
            meaning: {
              sources: FULL,
              text: {
                en: 'The command itself: "be". Not a request, and not a process — the word and the result are the same moment.',
                hi: 'आदेश स्वयं: "हो जा"। न प्रार्थना, न प्रक्रिया — शब्द और परिणाम एक ही क्षण हैं।',
                'hi-Latn':
                  'Aadesh khud: "ho ja". Na prarthana, na prakriya — shabd aur parinaam ek hi kshan hain.',
              },
            },
          },
        ],
      },
      { latn: 'Maula maula', deva: 'मौला मौला' },
      { latn: 'Tere naam pe', deva: 'तेरे नाम पे' },
    ],
  },

  {
    slug: 'piya-haji-ali',
    title: { latn: 'Piya Haji Ali', deva: 'पिया हाजी अली' },
    artist: 'A.R. Rahman',
    year: 2000,
    film: 'Fiza',
    proves: 'Below the bar — two sources where four are needed. FR-005, FR-036, FR-037.',
    lines: [
      {
        latn: 'Piya haji ali',
        deva: 'पिया हाजी अली',
        // Only two sources: stored, disclosed, but never served as a meaning.
        meaning: {
          sources: ['dargah-blog', 'reddit-thin'],
          text: {
            en: 'Withheld: two sources is not enough to say what this line means.',
            hi: 'रोका गया: दो स्रोत यह कहने के लिए पर्याप्त नहीं हैं कि इस पंक्ति का अर्थ क्या है।',
            'hi-Latn':
              'Roka gaya: do source yeh kehne ke liye kaafi nahin hain ki is line ka matlab kya hai.',
          },
        },
      },
      { latn: 'Ya ali', deva: 'या अली' },
      { latn: 'Dar pe tere aaya', deva: 'दर पे तेरे आया' },
      { latn: 'Maula maula', deva: 'मौला मौला' },
    ],
  },

  {
    slug: 'khwaja-mere-khwaja',
    title: { latn: 'Khwaja Mere Khwaja', deva: 'ख़्वाजा मेरे ख़्वाजा' },
    artist: 'A.R. Rahman',
    year: 2008,
    film: 'Jodhaa Akbar',
    proves: 'The same word carrying two different meanings inside one song. FR-018, FR-019.',
    lines: [
      {
        latn: 'Khwaja mere khwaja',
        deva: 'ख़्वाजा मेरे ख़्वाजा',
        words: [
          {
            position: 0,
            latn: 'Khwaja',
            deva: 'ख़्वाजा',
            meaning: {
              sources: FULL,
              text: {
                en: 'The saint addressed by name — a specific person at a specific shrine.',
                hi: 'नाम से संबोधित संत — एक विशेष दरगाह का एक विशेष व्यक्ति।',
                'hi-Latn': 'Naam se sambodhit sant — ek khaas dargah ka ek khaas vyakti.',
              },
            },
          },
        ],
      },
      {
        latn: 'Khwaja ji bolo',
        deva: 'ख़्वाजा जी बोलो',
        words: [
          {
            position: 0,
            latn: 'Khwaja',
            deva: 'ख़्वाजा',
            // Same spelling, same song, different meaning — the page must say so.
            meaning: {
              sources: FULL,
              text: {
                en: 'Here the word turns from a name into an address — master, the one being spoken to rather than about.',
                hi: 'यहाँ शब्द नाम से संबोधन बन जाता है — स्वामी, जिससे कहा जा रहा है, जिसके बारे में नहीं।',
                'hi-Latn':
                  'Yahan shabd naam se sambodhan ban jaata hai — swami, jisse kaha ja raha hai, jiske baare mein nahin.',
              },
            },
          },
        ],
      },
    ],
  },

  {
    slug: 'tere-bina',
    title: { latn: 'Tere Bina', deva: 'तेरे बिना' },
    artist: 'A.R. Rahman',
    year: 2007,
    film: 'Guru',
    proves: 'A stale meaning that stays readable, and an unreachable source that still counts.',
    lines: [
      {
        latn: 'Tere bina beswaadi beswaadi ratiyan',
        deva: 'तेरे बिना बेस्वादी बेस्वादी रतियाँ',
        meaning: {
          // Marked stale: a contribution arrived. The old text stays readable (FR-007).
          status: 'stale',
          sources: [...FULL.slice(0, 3), 'dead-link'],
          text: {
            en: 'Nights without you have lost their taste — the complaint is sensory rather than romantic.',
            hi: 'तेरे बिना रातों का स्वाद जाता रहा — शिकायत भावनात्मक नहीं, इंद्रियों की है।',
            'hi-Latn':
              'Tere bina raaton ka swaad jaata raha — shikayat emotional nahin, indriyon ki hai.',
          },
        },
      },
      { latn: 'Beswaadi ratiyan', deva: 'बेस्वादी रतियाँ' },
    ],
  },
];

/**
 * `arziyan` is generated rather than hand-written: it needs 26 lines with only
 * four explained, and twenty-two hand-written placeholder lines would add bulk
 * without adding coverage. Four explained of twenty-six is the case the coverage
 * indicator exists for (FR-026).
 */
export function arziyan(): SongFixture {
  const explained = new Set([3, 7, 12, 19]);
  const lines: LineFixture[] = Array.from({ length: 26 }, (_, i) => {
    const n = i + 1;
    const base: LineFixture = {
      latn: `Arziyan saari main chehre pe likh kar laaya hoon — line ${n}`,
      deva: `अर्ज़ियाँ सारी मैं चेहरे पे लिख कर लाया हूँ — पंक्ति ${n}`,
    };
    if (!explained.has(n)) return base;
    return {
      ...base,
      meaning: {
        sources: FULL.slice(0, 4),
        text: {
          en: `Line ${n}: the petition is carried on the face rather than spoken — asking without the dignity of words.`,
          hi: `पंक्ति ${n}: अर्ज़ी चेहरे पर लिखी है, कही नहीं गई — शब्दों के बिना माँगना।`,
          'hi-Latn': `Line ${n}: arzi chehre par likhi hai, kahi nahin gayi — shabdon ke bina maangna.`,
        },
      },
    };
  });

  return {
    slug: 'arziyan',
    title: { latn: 'Arziyan', deva: 'अर्ज़ियाँ' },
    artist: 'A.R. Rahman',
    year: 2009,
    film: 'Delhi-6',
    proves: 'Partly grounded — 4 of 26 lines. FR-023, FR-026, and the coverage indicator.',
    // No summary: a summary built from four lines out of twenty-six would itself
    // be a guess (FR-024).
    lines,
  };
}

export function allSongs(): SongFixture[] {
  return [...SONGS, arziyan()];
}
