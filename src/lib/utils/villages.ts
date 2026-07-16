const MULTI_SPACE_PATTERN = /\s+/g;
const PUNCTUATION_PATTERN = /[.,'`"’‘“”()[\]{}_-]+/g;
const DEVANAGARI_PATTERN = /[\u0900-\u097F]/;

const STANDARD_VILLAGE_NAMES: Record<string, string> = {
  dantewada: "Dantewada",
};

const VILLAGE_ALIAS_KEYS: Record<string, string> = {
  dantewada: "dantewada",
  dantewara: "dantewada",
  dantevada: "dantewada",
  dantewadaa: "dantewada",
  dantewada1: "dantewada",
  dantewad: "dantewada",
  "dantewada cg": "dantewada",
  "dantewada chhattisgarh": "dantewada",
  dntewada: "dantewada",
  "dantewada village": "dantewada",
  दंतेवाड़ा: "dantewada",
  दंतेवाडा: "dantewada",
  दन्तेवाड़ा: "dantewada",
  दन्तेवाडा: "dantewada",
};

const DEVANAGARI_VOWELS: Record<string, string> = {
  अ: "a",
  आ: "aa",
  इ: "i",
  ई: "ee",
  उ: "u",
  ऊ: "oo",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
  ऋ: "ri",
};

const DEVANAGARI_VOWEL_SIGNS: Record<string, string> = {
  "ा": "a",
  "ि": "i",
  "ी": "ee",
  "ु": "u",
  "ू": "oo",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
  "ृ": "ri",
};

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  क: "k",
  ख: "kh",
  ग: "g",
  घ: "gh",
  ङ: "ng",
  च: "ch",
  छ: "chh",
  ज: "j",
  झ: "jh",
  ञ: "ny",
  ट: "t",
  ठ: "th",
  ड: "d",
  ढ: "dh",
  ण: "n",
  त: "t",
  थ: "th",
  द: "d",
  ध: "dh",
  न: "n",
  प: "p",
  फ: "ph",
  ब: "b",
  भ: "bh",
  म: "m",
  य: "y",
  र: "r",
  ल: "l",
  व: "w",
  श: "sh",
  ष: "sh",
  स: "s",
  ह: "h",
  ळ: "l",
};

const DEVANAGARI_MARKS: Record<string, string> = {
  "ं": "n",
  "ँ": "n",
  "ः": "h",
  "़": "",
};

const VIRAMA = "्";

export function sanitizeVillageName(value: string | null | undefined): string {
  return String(value ?? "").replace(MULTI_SPACE_PATTERN, " ").trim();
}

function normalizePlainKey(value: string | null | undefined): string {
  return sanitizeVillageName(value)
    .normalize("NFKD")
    .replace(PUNCTUATION_PATTERN, " ")
    .replace(MULTI_SPACE_PATTERN, " ")
    .trim()
    .toLocaleLowerCase("en-IN");
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("en-IN") + part.slice(1).toLocaleLowerCase("en-IN"))
    .join(" ");
}

export function transliterateVillageName(value: string | null | undefined): string {
  const input = sanitizeVillageName(value);
  if (!DEVANAGARI_PATTERN.test(input)) return input;

  let output = "";
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    const consonant = DEVANAGARI_CONSONANTS[char];

    if (consonant) {
      if (next && DEVANAGARI_VOWEL_SIGNS[next]) {
        output += consonant + DEVANAGARI_VOWEL_SIGNS[next];
        i += 1;
      } else if (next === VIRAMA) {
        output += consonant;
        i += 1;
      } else {
        output += consonant + "a";
      }
      continue;
    }

    output +=
      DEVANAGARI_VOWELS[char] ??
      DEVANAGARI_MARKS[char] ??
      DEVANAGARI_VOWEL_SIGNS[char] ??
      (char === VIRAMA ? "" : char);
  }

  return sanitizeVillageName(output);
}

export function normalizeVillageKey(value: string | null | undefined): string {
  const directKey = normalizePlainKey(value);
  const transliteratedKey = normalizePlainKey(transliterateVillageName(value));
  const aliasKey =
    VILLAGE_ALIAS_KEYS[directKey] ??
    VILLAGE_ALIAS_KEYS[transliteratedKey] ??
    directKey ??
    transliteratedKey;

  return aliasKey;
}

export function standardizeVillageName(
  value: string | null | undefined,
  options: { logUnmatched?: boolean } = {},
): string {
  const cleaned = sanitizeVillageName(value);
  if (!cleaned) return "";

  const key = normalizeVillageKey(cleaned);
  const standard = STANDARD_VILLAGE_NAMES[key];
  if (standard) return standard;

  const transliterated = transliterateVillageName(cleaned);
  const fallback = toTitleCase(transliterated || cleaned);
  if (options.logUnmatched) {
    console.warn("[Village Standardization] Unmatched village alias", {
      input: cleaned,
      transliterated,
      normalizedKey: key,
      savedAs: fallback,
    });
  }

  return fallback;
}

export function uniqueVillageCount<T>(
  rows: T[],
  getVillageName: (row: T) => string | null | undefined,
): number {
  const keys = rows.map(getVillageName).map(normalizeVillageKey).filter(Boolean);
  return new Set(keys).size;
}

export function groupByVillageKey<T>(
  rows: T[],
  getVillageName: (row: T) => string | null | undefined,
): Map<string, { displayName: string; rows: T[] }> {
  const groups = new Map<string, { displayName: string; rows: T[] }>();

  for (const row of rows) {
    const key = normalizeVillageKey(getVillageName(row));
    if (!key) continue;

    const displayName = standardizeVillageName(getVillageName(row));
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(key, { displayName, rows: [row] });
    }
  }

  return groups;
}
