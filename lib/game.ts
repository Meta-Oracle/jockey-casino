export type BreedId =
  | "thoroughbred"
  | "arabian"
  | "mustang"
  | "appaloosa"
  | "frisian";

export type ManeStyle = "flowing" | "braided" | "cropped" | "wild";

export type StatKey = "speed" | "stamina" | "luck" | "grit";

export interface Breed {
  id: BreedId;
  name: string;
  tagline: string;
  base: Record<StatKey, number>;
  coatOptions: string[];
}

export interface HorseConfig {
  name: string;
  breedId: BreedId;
  coat: string;
  silkPrimary: string;
  silkSecondary: string;
  mane: ManeStyle;
  upgrades: Record<StatKey, number>;
}

export interface RaceResult {
  placed: number;
  payout: number;
  won: boolean;
  message: string;
}

export const BREEDS: Breed[] = [
  {
    id: "thoroughbred",
    name: "Thoroughbred",
    tagline: "Track royalty — pure sprint bloodline.",
    base: { speed: 8, stamina: 6, luck: 5, grit: 6 },
    coatOptions: ["#3b2414", "#8b5a2b", "#1a120c", "#c9a66b"],
  },
  {
    id: "arabian",
    name: "Arabian",
    tagline: "Desert grace with endurance to spare.",
    base: { speed: 7, stamina: 8, luck: 6, grit: 5 },
    coatOptions: ["#f0e6d2", "#c4a882", "#5c4033", "#2a1f18"],
  },
  {
    id: "mustang",
    name: "Mustang",
    tagline: "Wild heart. Unpredictable finish.",
    base: { speed: 7, stamina: 7, luck: 8, grit: 7 },
    coatOptions: ["#6b4423", "#2f2a26", "#a67c52", "#d4c4a8"],
  },
  {
    id: "appaloosa",
    name: "Appaloosa",
    tagline: "Spotted legend of the rail.",
    base: { speed: 6, stamina: 7, luck: 7, grit: 8 },
    coatOptions: ["#e8dcc8", "#8b6914", "#4a3728", "#c0b090"],
  },
  {
    id: "frisian",
    name: "Friesian",
    tagline: "Black silk powerhouse.",
    base: { speed: 5, stamina: 9, luck: 4, grit: 9 },
    coatOptions: ["#0d0d0d", "#1a1a1a", "#2c1810", "#3d2b1f"],
  },
];

export const MANE_STYLES: { id: ManeStyle; label: string }[] = [
  { id: "flowing", label: "Flowing" },
  { id: "braided", label: "Braided" },
  { id: "cropped", label: "Cropped" },
  { id: "wild", label: "Wild" },
];

export const UPGRADE_COST = 1;
export const MAX_UPGRADE = 5;
export const STARTING_CHIPS = 100;

export const DEFAULT_HORSE: HorseConfig = {
  name: "Nightfall",
  breedId: "thoroughbred",
  coat: "#3b2414",
  silkPrimary: "#c41e3a",
  silkSecondary: "#f5f0e8",
  mane: "flowing",
  upgrades: { speed: 0, stamina: 0, luck: 0, grit: 0 },
};

export function getBreed(id: BreedId): Breed {
  return BREEDS.find((b) => b.id === id) ?? BREEDS[0];
}

export function getStats(horse: HorseConfig): Record<StatKey, number> {
  const breed = getBreed(horse.breedId);
  return {
    speed: Math.min(15, breed.base.speed + horse.upgrades.speed),
    stamina: Math.min(15, breed.base.stamina + horse.upgrades.stamina),
    luck: Math.min(15, breed.base.luck + horse.upgrades.luck),
    grit: Math.min(15, breed.base.grit + horse.upgrades.grit),
  };
}

export function powerScore(horse: HorseConfig): number {
  const s = getStats(horse);
  return s.speed * 1.4 + s.stamina * 1.1 + s.luck * 0.9 + s.grit * 1.2;
}

export function runRace(
  horse: HorseConfig,
  bet: number,
  fieldSize = 5
): RaceResult {
  const power = powerScore(horse);
  const field: number[] = Array.from({ length: fieldSize }, (_, i) =>
    i === 0 ? power : 18 + Math.random() * 22
  );
  const ranked = [...field]
    .map((p, i) => ({ i, p: p + Math.random() * 8 }))
    .sort((a, b) => b.p - a.p);
  const placed = ranked.findIndex((r) => r.i === 0) + 1;

  if (placed === 1) {
    const payout = Math.round(bet * 2.4);
    return {
      placed,
      payout,
      won: true,
      message: "Photo finish — you take the purse.",
    };
  }
  if (placed === 2) {
    const payout = Math.round(bet * 1.3);
    return {
      placed,
      payout,
      won: true,
      message: "Place money. The rail still loves you.",
    };
  }
  if (placed === 3) {
    const payout = Math.round(bet * 0.6);
    return {
      placed,
      payout,
      won: payout > 0,
      message: "Show ticket cashes thin.",
    };
  }
  return {
    placed,
    payout: 0,
    won: false,
    message: "Out of the money. Recalibrate and ride again.",
  };
}

const STORAGE_KEY = "jockey-casino-save-v1";

export interface SaveState {
  horse: HorseConfig;
  chips: number;
}

export function loadSave(): SaveState {
  if (typeof window === "undefined") {
    return { horse: DEFAULT_HORSE, chips: STARTING_CHIPS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { horse: DEFAULT_HORSE, chips: STARTING_CHIPS };
    return JSON.parse(raw) as SaveState;
  } catch {
    return { horse: DEFAULT_HORSE, chips: STARTING_CHIPS };
  }
}

export function persistSave(state: SaveState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
