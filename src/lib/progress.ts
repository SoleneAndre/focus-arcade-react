import type { GameId, LevelId, HistoryEntry } from "./core";
import { filterHistory } from "./core";

const GAMES: GameId[] = ["flanker", "gonogo", "oddball"];
const LEVELS: LevelId[] = ["beginner", "explorer", "expert"];
const ZENS = [false, true] as const;

export type BadgeId =
  | "first_session"
  | "ten_sessions"
  | "fifty_sessions"
  | "streak_3"
  | "streak_7"
  | "weekly_3"
  | "weekly_5"
  | "acc_90"
  | "rt_300"
  | "score_250"
  | "all_games";

export type Badge = {
  id: BadgeId;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
};

export function getAllHistory(): HistoryEntry[] {
  const merged = GAMES.flatMap((g) =>
    LEVELS.flatMap((l) => ZENS.flatMap((z) => filterHistory(g, l, z)))
  );

  merged.sort((a, b) => b.t - a.t);

  // dédup simple
  const seen = new Set<string>();
  return merged.filter((x) => {
    const key = `${x.t}-${x.score}-${x.game}-${x.level}-${x.zen ? 1 : 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dayKey(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function computeStreakDays(history: HistoryEntry[]): number {
  if (!history.length) return 0;

  const days = Array.from(new Set(history.map((x) => dayKey(x.t))))
    .map((k) => new Date(k).getTime())
    .sort((a, b) => b - a);

  if (!days.length) return 0;

  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 1;
  let cur = days[0];

  for (let i = 1; i < days.length; i++) {
    const diff = cur - days[i];
    if (diff >= oneDay * 0.8 && diff <= oneDay * 1.2) {
      streak++;
      cur = days[i];
    } else break;
  }
  return streak;
}

function weekKey(ts: number) {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // lundi=0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return dayKey(monday.getTime());
}

export function countThisWeek(history: HistoryEntry[]): number {
  const wk = weekKey(Date.now());
  return history.filter((x) => weekKey(x.t) === wk).length;
}

export function computeAverages(history: HistoryEntry[]) {
  const n = history.length;
  if (!n) return { sessions: 0, avgScore: null as number | null, avgAcc: null as number | null, avgRt: null as number | null };

  const avgScore = Math.round(history.reduce((s, x) => s + (x.score ?? 0), 0) / n);

  const accVals = history.map((x) => x.acc).filter((v): v is number => v != null);
  const rtVals = history.map((x) => x.rt).filter((v): v is number => v != null);

  const avgAcc = accVals.length ? Math.round(accVals.reduce((s, v) => s + v, 0) / accVals.length) : null;
  const avgRt = rtVals.length ? Math.round(rtVals.reduce((s, v) => s + v, 0) / rtVals.length) : null;

  return { sessions: n, avgScore, avgAcc, avgRt };
}

export function getBadges(history: HistoryEntry[]): Badge[] {
  const sessions = history.length;
  const streak = computeStreakDays(history);
  const weekCount = countThisWeek(history);

  const bestScore = history.length ? Math.max(...history.map((x) => x.score ?? 0)) : 0;
  const hasAcc90 = history.some((x) => (x.acc ?? 0) >= 90);
  const hasRt300 = history.some((x) => (x.rt ?? 999999) <= 300 && (x.acc ?? 0) >= 70);

  const gamesPlayed = new Set(history.map((x) => x.game));
  const allGames = (["flanker", "gonogo", "oddball"] as const).every((g) => gamesPlayed.has(g));

  const list: Omit<Badge, "unlocked">[] = [
    { id: "first_session", title: "Première session", description: "Tu as lancé ta première session.", emoji: "✨" },
    { id: "ten_sessions", title: "Régulier·e", description: "10 sessions terminées.", emoji: "📌" },
    { id: "fifty_sessions", title: "Machine", description: "50 sessions terminées.", emoji: "🏁" },

    { id: "streak_3", title: "Streak 3 jours", description: "3 jours consécutifs avec au moins 1 session.", emoji: "🔥" },
    { id: "streak_7", title: "Streak 7 jours", description: "7 jours consécutifs. Très solide.", emoji: "🌋" },

    { id: "weekly_3", title: "Objectif hebdo", description: "3 sessions cette semaine.", emoji: "🗓️" },
    { id: "weekly_5", title: "Semaine parfaite", description: "5 sessions cette semaine.", emoji: "🏆" },

    { id: "acc_90", title: "Précision", description: "Atteindre ≥ 90% sur une session.", emoji: "🎯" },
    { id: "rt_300", title: "Rapide", description: "RT ≤ 300 ms (avec ≥ 70% de précision).", emoji: "⚡" },
    { id: "score_250", title: "Gros score", description: "Atteindre un score ≥ 250.", emoji: "🚀" },

    { id: "all_games", title: "Explorer", description: "Jouer aux 3 jeux au moins une fois.", emoji: "🧭" },
  ];

  const unlocked: Record<BadgeId, boolean> = {
    first_session: sessions >= 1,
    ten_sessions: sessions >= 10,
    fifty_sessions: sessions >= 50,

    streak_3: streak >= 3,
    streak_7: streak >= 7,

    weekly_3: weekCount >= 3,
    weekly_5: weekCount >= 5,

    acc_90: hasAcc90,
    rt_300: hasRt300,
    score_250: bestScore >= 250,

    all_games: allGames,
  };

  return list.map((b) => ({ ...b, unlocked: unlocked[b.id] }));
}
