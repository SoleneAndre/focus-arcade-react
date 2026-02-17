export type GameId = "flanker" | "gonogo" | "oddball";
export type LevelId = "beginner" | "explorer" | "expert";

export type HistoryEntry = {
  t: number;
  game: GameId;
  level: LevelId;
  zen: boolean;
  score: number;
  acc: number; // %
  rt: number | null; // ms
  streakBest: number;
};

export const LEVELS: Record<LevelId, { trials: number; stimMs: number; itiMs: number; incongRate: number; goRate: number; bonusRate: number; }> = {
  beginner: { trials: 25, stimMs: 1500, itiMs: 450, incongRate: 0.35, goRate: 0.75, bonusRate: 0.18 },
  explorer: { trials: 35, stimMs: 1150, itiMs: 420, incongRate: 0.45, goRate: 0.72, bonusRate: 0.15 },
  expert:   { trials: 45, stimMs: 900,  itiMs: 380, incongRate: 0.55, goRate: 0.70, bonusRate: 0.12 },
};

export const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export function gameLabel(g: GameId) {
  if (g === "flanker") return "Flèches Mania";
  if (g === "gonogo") return "Stop & Go";
  return "Catch the Bonus";
}
export function levelLabel(l: LevelId) {
  if (l === "beginner") return "Débutant";
  if (l === "explorer") return "Explorateur";
  return "Expert";
}

export type Trial =
  | { type: "flanker"; s: string; correctKey: "ArrowLeft" | "ArrowRight" }
  | { type: "gonogo"; isGo: boolean }
  | { type: "oddball"; isBonus: boolean; symbol: string };

export function makeTrial(game: GameId, cfg: (typeof LEVELS)[LevelId]): Trial {
  const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  if (game === "flanker") {
    const dir = rand<"L" | "R">(["L", "R"]);
    const incong = Math.random() < cfg.incongRate;

    const center = dir === "L" ? "←" : "→";
    const flankDir = incong ? (dir === "L" ? "R" : "L") : dir;
    const flank = flankDir === "L" ? "←" : "→";

    const s = `${flank}${flank}${center}${flank}${flank}`;
    const correctKey = dir === "L" ? "ArrowLeft" : "ArrowRight";
    return { type: "flanker", s, correctKey };
  }

  if (game === "gonogo") {
    return { type: "gonogo", isGo: Math.random() < cfg.goRate };
  }

  const fillers = ["◆","●","■","▲","✦","✸","✚","✖"];
  const isBonus = Math.random() < cfg.bonusRate;
  return { type: "oddball", isBonus, symbol: isBonus ? "⭐" : rand(fillers) };
}

export function computeScore(acc01: number, meanRt: number | null, streakBest: number) {
  const accPts = Math.round(acc01 * 1000);
  const streakPts = streakBest * 12;
  const speedPts = meanRt == null ? 0 : Math.round(clamp((1200 - meanRt) / 2, 0, 220));
  return accPts + streakPts + speedPts;
}

const BEST_PREFIX = "focusArcade.best.react.v1";
const HISTORY_KEY = "focusArcade.history.react.v1";

export function bestKey(game: GameId, level: LevelId, zen: boolean) {
  return `${BEST_PREFIX}.${game}.${level}.${zen ? "zen" : "std"}`;
}

export function loadBest(game: GameId, level: LevelId, zen: boolean) {
  const v = Number(localStorage.getItem(bestKey(game, level, zen)) || 0);
  return Number.isFinite(v) ? v : 0;
}

export function saveBest(game: GameId, level: LevelId, zen: boolean, score: number) {
  const k = bestKey(game, level, zen);
  const prev = loadBest(game, level, zen);
  if (score > prev) localStorage.setItem(k, String(score));
  return Math.max(prev, score);
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function pushHistory(entry: HistoryEntry) {
  const arr = loadHistory();
  arr.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-200)));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function filterHistory(game: GameId, level: LevelId, zen: boolean) {
  return loadHistory().filter(h => h.game === game && h.level === level && h.zen === zen).slice(-40);
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportHistoryJSON() {
  download("focus-arcade-history.json", JSON.stringify(loadHistory(), null, 2), "application/json");
}

export function exportHistoryCSV() {
  const arr = loadHistory();
  const header = "date,game,level,zen,score,acc,rt,streakBest";
  const lines = arr.map(h => {
    const date = new Date(h.t).toISOString();
    const rt = h.rt ?? "";
    return `"${date}","${h.game}","${h.level}","${h.zen}","${h.score}","${h.acc}","${rt}","${h.streakBest}"`;
  });
  download("focus-arcade-history.csv", [header, ...lines].join("\n"), "text/csv");
}
