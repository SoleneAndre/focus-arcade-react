import { useMemo, useState } from "react";
import { Card, H1, H2, P, Pill, Stat, ButtonGhost } from "../components/ui";
import type { GameId, LevelId, HistoryEntry } from "../lib/core";
import {
  filterHistory,
  exportHistoryCSV,
  exportHistoryJSON,
  clearHistory,
  gameLabel,
  levelLabel,
} from "../lib/core";

type SortKey = "date_desc" | "date_asc" | "score_desc" | "score_asc";

function fmt(dt: number) {
  return new Date(dt).toLocaleString();
}

export default function History() {
  const [game, setGame] = useState<GameId>("flanker");
  const [level, setLevel] = useState<LevelId>("beginner");
  const [zen, setZen] = useState(false);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");

  const rows = useMemo(() => {
    const base: HistoryEntry[] = filterHistory(game, level, zen);

    const filtered = q.trim()
      ? base.filter((x) => {
          const s = [
            x.game,
            x.level,
            x.zen ? "zen" : "normal",
            String(x.score),
            x.acc != null ? `${x.acc}` : "",
            x.rt != null ? `${x.rt}` : "",
            fmt(x.t),
          ]
            .join(" ")
            .toLowerCase();
          return s.includes(q.trim().toLowerCase());
        })
      : base;

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "date_desc") return b.t - a.t;
      if (sort === "date_asc") return a.t - b.t;
      if (sort === "score_desc") return (b.score ?? 0) - (a.score ?? 0);
      return (a.score ?? 0) - (b.score ?? 0);
    });

    return sorted;
  }, [game, level, zen, q, sort]);

  const stats = useMemo(() => {
    const n = rows.length;
    if (!n) return { n: 0, avgScore: "—", avgAcc: "—", avgRt: "—" };

    const avgScore = Math.round(rows.reduce((s, x) => s + (x.score ?? 0), 0) / n);
    const accVals = rows.map((x) => x.acc).filter((v): v is number => v != null);
    const rtVals = rows.map((x) => x.rt).filter((v): v is number => v != null);

    const avgAcc = accVals.length ? `${Math.round(accVals.reduce((s, v) => s + v, 0) / accVals.length)}%` : "—";
    const avgRt = rtVals.length ? `${Math.round(rtVals.reduce((s, v) => s + v, 0) / rtVals.length)} ms` : "—";

    return { n, avgScore: String(avgScore), avgAcc, avgRt };
  }, [rows]);

  function wipe() {
    clearHistory();
    // petit refresh UX simple : reset recherche pour voir "vide"
    setQ("");
  }

  return (
    <div className="space-y-4">
      <Card>
        <H1>Historique</H1>
        <P>Filtre, trie, retrouve tes sessions et exporte tes données.</P>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{gameLabel(game)}</Pill>
          <Pill>{levelLabel(level)}</Pill>
          <Pill>{zen ? "Zen" : "Normal"}</Pill>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Jeu</label>
            <select
              className="mt-1 w-full rounded-2xl bg-white border border-slate-200 px-3 py-2 text-slate-900"
              value={game}
              onChange={(e) => setGame(e.target.value as GameId)}
            >
              <option value="flanker">Flanker</option>
              <option value="gonogo">Go / No-Go</option>
              <option value="oddball">Oddball</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Niveau</label>
            <select
              className="mt-1 w-full rounded-2xl bg-white border border-slate-200 px-3 py-2 text-slate-900"
              value={level}
              onChange={(e) => setLevel(e.target.value as LevelId)}
            >
              <option value="beginner">Beginner</option>
              <option value="explorer">Explorer</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 mt-6 md:mt-0">
            <input type="checkbox" checked={zen} onChange={(e) => setZen(e.target.checked)} />
            <span className="text-sm text-slate-800">Zen</span>
          </label>

          <div>
            <label className="text-xs font-medium text-slate-600">Tri</label>
            <select
              className="mt-1 w-full rounded-2xl bg-white border border-slate-200 px-3 py-2 text-slate-900"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="date_desc">Date (récent → ancien)</option>
              <option value="date_asc">Date (ancien → récent)</option>
              <option value="score_desc">Score (haut → bas)</option>
              <option value="score_asc">Score (bas → haut)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto] items-end">
          <div>
            <label className="text-xs font-medium text-slate-600">Recherche</label>
            <input
              className="mt-1 w-full rounded-2xl bg-white border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="ex: 250, zen, 98, 320ms…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <ButtonGhost onClick={exportHistoryJSON}>Exporter JSON</ButtonGhost>
          <ButtonGhost onClick={exportHistoryCSV}>Exporter CSV</ButtonGhost>
          <ButtonGhost onClick={wipe}>Effacer</ButtonGhost>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-3">
        <Stat label="Sessions" value={String(stats.n)} />
        <Stat label="Score moyen" value={stats.avgScore} />
        <Stat label="Précision moyenne" value={stats.avgAcc} />
        <Stat label="RT moyen" value={stats.avgRt} />
      </div>

      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <H2>Sessions</H2>
            <P>Affichage : {gameLabel(game)} — {levelLabel(level)}{zen ? " • Zen" : ""}</P>
          </div>
          <div className="text-xs text-slate-500">
            {rows.length ? `${rows.length} résultat(s)` : "Aucun résultat"}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr className="text-left">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Acc</th>
                <th className="py-2 pr-4">RT</th>
                <th className="py-2 pr-4">Série</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-500">
                    Rien à afficher. Fais une session dans “Jouer” ✨
                  </td>
                </tr>
              ) : (
                rows.map((x) => (
                  <tr key={x.t} className="border-t border-slate-100">
                    <td className="py-3 pr-4">{fmt(x.t)}</td>
                    <td className="py-3 pr-4 font-semibold">{x.score}</td>
                    <td className="py-3 pr-4">{x.acc != null ? `${x.acc}%` : "—"}</td>
                    <td className="py-3 pr-4">{x.rt != null ? `${x.rt} ms` : "—"}</td>
                    <td className="py-3 pr-4">{x.streakBest != null ? x.streakBest : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Tip : garde ton “Zen” pour la constance, et le “Normal” pour te challenger.
        </div>
      </Card>
    </div>
  );
}
