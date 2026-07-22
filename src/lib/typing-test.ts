export type TypingLanguage =
  | "English"
  | "Bengali"
  | "Arabic"
  | "Hindi"
  | "Spanish"
  | "French"
  | "German"
  | "Chinese"
  | "Portuguese"
  | "Russian"
  | "Japanese";

export interface TypingLanguageOption {
  id: TypingLanguage;
  label: string;
  script: string;
}

export interface TypingTestInsight {
  typingSpeed: number;
  betterThanPercent: number;
  rankingLast24Hours: number;
}

export interface TypingTestResult {
  correctChars: number;
  incorrectChars: number;
  totalTypedChars: number;
  accuracy: number;
  grossWpm: number;
  netWpm: number;
  completion: number;
  elapsedSeconds: number;
  insight: TypingTestInsight;
}

export type TypingTestMode = "time" | "words";

export const TYPING_LANGUAGES: TypingLanguageOption[] = [
  { id: "English", label: "English", script: "Latin" },
  { id: "Bengali", label: "Bengali", script: "Bangla" },
  { id: "Arabic", label: "Arabic", script: "Arabic" },
  { id: "Hindi", label: "Hindi", script: "Devanagari" },
  { id: "Spanish", label: "Spanish", script: "Latin" },
  { id: "French", label: "French", script: "Latin" },
  { id: "German", label: "German", script: "Latin" },
  { id: "Chinese", label: "Chinese", script: "Han" },
  { id: "Portuguese", label: "Portuguese", script: "Latin" },
  { id: "Russian", label: "Russian", script: "Cyrillic" },
  { id: "Japanese", label: "Japanese", script: "Kana + Kanji" },
];

const WORD_TARGET_BY_DURATION: Record<number, number> = {
  15: 28,
  30: 55,
  60: 105,
  120: 195,
};

const FALLBACK_STORY_BANKS: Record<TypingLanguage, string[]> = {
  English: [
    "At the edge of the quiet station, a boy in a blue sweater counted the last warm lights while the evening train disappeared into rain.",
    "A small paper boat drifted beside the bridge, and the river carried it forward as if it knew a secret about tomorrow.",
    "When the bakery opened at dawn, cinnamon air moved through the street and made the tired city feel gentle again.",
    "She found an old notebook under the window, and every unfinished line inside felt like a door waiting to be opened.",
    "The cat slept near the lamp, the kettle hummed softly, and the room held the kind of peace that makes stories arrive.",
    "Beyond the market road, the hills turned silver after sunset and the wind stitched together dust, laughter, and distant music.",
    "He walked home with oranges in his bag and the memory of one brave sentence that finally sounded true when spoken aloud.",
  ],
  Bengali: [
    "স্টেশনের শেষ বেঞ্চে বসে ছেলেটি দেখল বৃষ্টির ভিতর দিয়ে দূরের ট্রেনটা ধীরে ধীরে অন্ধকারে মিশে যাচ্ছে।",
    "নদীর ওপর ছোট কাগজের নৌকাটা ভেসে চলছিল, যেন সে আগেই জানে সামনের বাঁকে কী রকম আলো অপেক্ষা করছে।",
    "ভোরে বেকারির দরজা খুলতেই দারুচিনির গন্ধ রাস্তাজুড়ে ছড়িয়ে পড়ল, আর ক্লান্ত শহরটা হঠাৎ নরম হয়ে গেল।",
    "জানালার পাশে পুরোনো খাতাটা খুলে সে দেখল, অসমাপ্ত বাক্যগুলোও কখনো কখনো নতুন পথের শুরু হতে পারে।",
    "চায়ের কেতলি ধীরে ধীরে গাইছিল, ঘুমন্ত বিড়ালটা বাতির নিচে গোল হয়ে ছিল, আর ঘরভর্তি নীরবতা গল্প ডাকছিল।",
    "হাটের রাস্তা পেরিয়ে পাহাড়গুলো সন্ধ্যার পরে রূপালি হয়ে উঠল, বাতাসে ধুলো, হাসি আর দূরের গানের সুর মিশে রইল।",
    "বাড়ি ফেরার পথে তার ব্যাগে ছিল কয়েকটা কমলা, আর মনে ছিল একটিমাত্র সাহসী বাক্য যা আজ সত্যি মনে হচ্ছিল।",
  ],
  Arabic: [
    "عند آخر مقعد في المحطة كان الفتى يراقب المطر بينما اختفى القطار البعيد بهدوء داخل المساء الطويل.",
    "كان القارب الورقي الصغير يتحرك فوق النهر كأنه يعرف الطريق قبل أن يلمسه ضوء الجسر القادم.",
    "حين فتحت المخبزة أبوابها مع الفجر امتلأ الشارع برائحة القرفة وصار الصباح أكثر دفئا من الأمس.",
    "وجدت دفترا قديما قرب النافذة وكل سطر غير مكتمل فيه بدا كأنه باب ينتظر لمسة شجاعة.",
    "نامت القطة قرب المصباح وهمست الغلاية في الزاوية فصار البيت هادئا بما يكفي لوصول قصة جميلة.",
    "بعد السوق تحولت التلال إلى فضة ناعمة وخلطت الريح بين الغبار والضحكات والموسيقى البعيدة.",
    "عاد إلى البيت وبيده برتقال قليل وفي قلبه جملة واحدة أخيرا بدت صادقة حين نطقها.",
  ],
  Hindi: [
    "स्टेशन की आखिरी बेंच पर बैठा लड़का बारिश को देखता रहा और दूर जाती ट्रेन शाम में धीरे धीरे खो गई।",
    "नदी पर तैरती छोटी कागज की नाव ऐसे बढ़ रही थी जैसे उसे अगले मोड़ की रोशनी पहले से याद हो।",
    "सुबह जैसे ही बेकरी खुली, दालचीनी की खुशबू गली में फैल गई और थका हुआ शहर थोड़ा मुलायम लगने लगा।",
    "खिड़की के पास पुरानी कॉपी मिली और उसके अधूरे वाक्य किसी नए रास्ते की शुरुआत जैसे लगे।",
    "केतली धीमे गुनगुना रही थी, बिल्ली दीपक के पास सो रही थी, और कमरे की शांति कहानी बुला रही थी।",
    "बाजार के बाद पहाड़ चांदी जैसे हो गए और हवा में धूल, हंसी, और दूर का संगीत एक साथ मिल गया।",
    "घर लौटते समय उसके बैग में संतरे थे और मन में एक साहसी वाक्य जो आज पहली बार सच लगा।",
  ],
  Spanish: [
    "En el último banco de la estación, el muchacho miró la lluvia mientras el tren lejano se perdía dentro de la tarde.",
    "La pequeña barca de papel avanzaba por el río como si ya conociera la curva donde empezaba la luz.",
    "Cuando abrió la panadería al amanecer, el aroma de canela suavizó la calle y despertó al barrio con calma.",
    "Junto a la ventana encontró un cuaderno viejo y cada frase incompleta parecía una puerta todavía abierta.",
    "La gata dormía cerca de la lámpara, la tetera murmuraba despacio, y la habitación tenía espacio para una historia nueva.",
    "Después del mercado, las colinas se volvieron plateadas y el viento mezcló polvo, risas, y música lejana.",
    "Volvió a casa con naranjas en la bolsa y una sola frase valiente que por fin sonaba verdadera.",
  ],
  French: [
    "Au dernier banc de la gare, le garçon regardait la pluie pendant que le train lointain disparaissait dans le soir.",
    "Le petit bateau en papier suivait la rivière comme s il connaissait déjà le virage où la lumière commence.",
    "Quand la boulangerie ouvrit à l aube, le parfum de cannelle rendit la rue plus douce et plus vivante.",
    "Près de la fenêtre, elle trouva un vieux carnet et chaque phrase inachevée semblait attendre une nouvelle chance.",
    "Le chat dormait près de la lampe, la bouilloire chantait doucement, et la chambre devenait parfaite pour une histoire.",
    "Après le marché, les collines prirent une couleur d argent et le vent mêla poussière, rires, et musique lointaine.",
    "Il rentra chez lui avec quelques oranges et une phrase courageuse qui semblait enfin honnête en sortant de sa bouche.",
  ],
  German: [
    "Auf der letzten Bank am Bahnhof sah der Junge in den Regen, während der ferne Zug langsam im Abend verschwand.",
    "Das kleine Papierboot trieb auf dem Fluss, als wüsste es schon, wo hinter der nächsten Kurve das Licht beginnt.",
    "Als die Bäckerei im Morgengrauen öffnete, legte sich Zimtduft über die Straße und machte die Stadt stiller.",
    "Am Fenster fand sie ein altes Heft, und jede unvollendete Zeile darin wirkte wie der Anfang eines neuen Weges.",
    "Die Katze schlief neben der Lampe, der Kessel summte leise, und das Zimmer wartete ruhig auf eine Geschichte.",
    "Hinter dem Markt wurden die Hügel silbern, und der Wind trug Staub, Lachen, und ferne Musik zusammen.",
    "Er ging mit ein paar Orangen nach Hause und mit einem mutigen Satz, der endlich ehrlich klang.",
  ],
  Chinese: [
    "黄昏的车站边，一个穿蓝色毛衣的男孩数着最后几盏暖灯，远去的列车慢慢消失在细雨里。",
    "小小的纸船沿着河面轻轻漂走，像是早就知道下一个转弯会出现怎样的光。",
    "清晨面包店开门时，肉桂的香气飘满街道，让疲惫的城市一下子温柔起来。",
    "她在窗边找到一本旧笔记本，里面那些未写完的句子像一扇扇等待打开的门。",
    "猫在灯旁安静地睡着，水壶轻轻作响，房间里的宁静刚好适合一个故事开始。",
    "穿过集市之后，远处的山在傍晚泛起银色，风把尘土、笑声和歌声轻轻缝在一起。",
    "他提着几只橙子回家，心里却一直记着那句终于敢说出口的话。",
  ],
  Portuguese: [
    "Na última plataforma da estação, o garoto de suéter azul contou as luzes acesas enquanto o trem sumia na chuva fina.",
    "O pequeno barco de papel seguia pelo rio como se já soubesse onde a próxima curva encontraria a luz.",
    "Quando a padaria abriu ao amanhecer, o cheiro de canela tomou a rua e deixou a cidade mais leve.",
    "Perto da janela, ela encontrou um caderno antigo, e cada frase inacabada parecia o começo de um novo caminho.",
    "A gata dormia ao lado da lâmpada, a chaleira murmurava baixinho, e o quarto parecia pronto para uma história.",
    "Depois do mercado, as colinas ficaram prateadas, e o vento misturou poeira, risos e música distante.",
    "Ele voltou para casa com algumas laranjas e uma frase corajosa que enfim soava verdadeira.",
  ],
  Russian: [
    "На последней скамейке у станции мальчик в синем свитере считал тёплые огни, пока дальний поезд исчезал в дожде.",
    "Маленький бумажный кораблик плыл по реке так, будто заранее знал, где за поворотом начнётся свет.",
    "Когда пекарня открылась на рассвете, запах корицы наполнил улицу, и уставший город стал мягче.",
    "У окна она нашла старую тетрадь, и каждая незаконченная строка в ней казалась началом новой дороги.",
    "Кошка спала возле лампы, чайник тихо напевал, и в комнате было достаточно тишины для хорошей истории.",
    "За рынком холмы стали серебристыми, а ветер смешал пыль, смех и далёкую музыку.",
    "Он шёл домой с несколькими апельсинами и с одной смелой фразой, которая наконец прозвучала честно.",
  ],
  Japanese: [
    "駅の端の静かなベンチで、青いセーターの少年は最後の明かりを数えながら、遠ざかる列車が雨の中へ消えていくのを見ていた。",
    "小さな紙の舟は、次の曲がり角にどんな光が待っているか知っているように、川を静かに進んでいた。",
    "夜明けにパン屋が開くと、シナモンの香りが通りに広がり、疲れた街を少しやさしくした。",
    "彼女は窓辺で古いノートを見つけ、その中の書きかけの文章はどれも新しい道の始まりのように見えた。",
    "猫はランプのそばで眠り、やかんは小さく歌い、部屋には物語を呼び込むほどの静けさが満ちていた。",
    "市場を抜けると丘は夕方の光で銀色に変わり、風は土ぼこりと笑い声と遠い音楽を混ぜ合わせた。",
    "彼はオレンジをいくつか持って家に帰りながら、やっと本当らしく聞こえた勇気ある一言を思い返していた。",
  ],
};

export const TYPING_DURATIONS = Object.keys(WORD_TARGET_BY_DURATION).map((value) => Number(value));
export const TYPING_WORD_OPTIONS = [25, 50, 75, 100, 150, 200];

const getRandomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const getTypingWordTarget = (durationInput?: string | number | null) => {
  const duration = normalizeDuration(durationInput);
  return WORD_TARGET_BY_DURATION[duration];
};

export const normalizeWordTarget = (value?: string | number | null) => {
  const wordTarget = typeof value === "number" ? value : Number(value);
  return TYPING_WORD_OPTIONS.includes(wordTarget) ? wordTarget : 50;
};

export const isTypingLanguage = (value: string): value is TypingLanguage => {
  return TYPING_LANGUAGES.some((language) => language.id === value);
};

export const normalizeLanguage = (value?: string | null): TypingLanguage => {
  if (value && isTypingLanguage(value)) {
    return value;
  }
  return "English";
};

export const normalizeDuration = (value?: string | number | null): number => {
  const duration = typeof value === "number" ? value : Number(value);
  return WORD_TARGET_BY_DURATION[duration] ? duration : 30;
};

export const generateTypingText = (
  languageInput?: string | null,
  durationInput?: string | number | null,
  wordTargetInput?: string | number | null,
) => {
  const language = normalizeLanguage(languageInput);
  const duration = normalizeDuration(durationInput);
  const targetWords = wordTargetInput ? normalizeWordTarget(wordTargetInput) : getTypingWordTarget(duration);
  const storyPool = [...FALLBACK_STORY_BANKS[language]];
  const selectedPassages: string[] = [];
  let wordCount = 0;

  while (wordCount < targetWords) {
    if (storyPool.length === 0) {
      storyPool.push(...FALLBACK_STORY_BANKS[language]);
    }

    const nextPassage = getRandomItem(storyPool);
    const nextIndex = storyPool.indexOf(nextPassage);
    if (nextIndex >= 0) {
      storyPool.splice(nextIndex, 1);
    }

    selectedPassages.push(nextPassage);
    wordCount += countWords(nextPassage);
  }

  return {
    language,
    duration,
    text: selectedPassages.join(" "),
    wordCount,
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const evaluateTypingTest = ({
  targetText,
  typedText,
  durationSeconds,
  elapsedSeconds,
}: {
  targetText: string;
  typedText: string;
  durationSeconds: number;
  elapsedSeconds: number;
}): TypingTestResult => {
  const safeDuration = Math.max(durationSeconds, 1);
  const safeElapsed = Math.max(Math.min(elapsedSeconds, safeDuration), 1);

  let correctChars = 0;
  for (let index = 0; index < typedText.length; index += 1) {
    if (typedText[index] === targetText[index]) {
      correctChars += 1;
    }
  }

  const incorrectChars = Math.max(typedText.length - correctChars, 0);
  const totalTypedChars = typedText.length;
  const accuracy = totalTypedChars === 0 ? 0 : Number(((correctChars / totalTypedChars) * 100).toFixed(1));
  const grossWpm = Number(((totalTypedChars / 5 / safeElapsed) * 60).toFixed(1));
  const netWpm = Number((Math.max(correctChars - incorrectChars, 0) / 5 / safeElapsed * 60).toFixed(1));
  const completion = targetText.length === 0 ? 0 : Number((Math.min(totalTypedChars, targetText.length) / targetText.length * 100).toFixed(1));
  const typingSpeed = Math.max(0, Math.round(netWpm));
  const betterThanPercent = Number(clamp(netWpm * 2.15 + accuracy * 0.18 - 10, 1, 99.4).toFixed(2));
  const rankingLast24Hours = Math.max(1, Math.round(3200 - betterThanPercent * 29));

  return {
    correctChars,
    incorrectChars,
    totalTypedChars,
    accuracy,
    grossWpm,
    netWpm,
    completion,
    elapsedSeconds: safeElapsed,
    insight: {
      typingSpeed,
      betterThanPercent,
      rankingLast24Hours,
    },
  };
};
