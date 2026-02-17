import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useMode } from "../context/ModeContext";

import type { GameId, LevelId, Trial, HistoryEntry } from "../lib/core";
import {
  LEVELS,
  makeTrial,
  sleep,
  computeScore,
  loadBest,
  saveBest,
  pushHistory,
  filterHistory,
  exportHistoryCSV,
  exportHistoryJSON,
  clearHistory,
  gameLabel,
  levelLabel,
} from "../lib/core";

import { Card, H2, P, Pill, Button, ButtonGhost, Stat } from "../components/ui";

const ScoreChart = lazy(() => import("../components/ScoreChart"));

type AgePresetId = "7-9" | "10-12" | "13-14";

const AGE_PRESETS: Record<
  AgePresetId,
  { label: string; trialsFactor: number; slow: boolean; defaultLevel: LevelId }
> = {
  "7-9": { label: "7–9 ans", trialsFactor: 0.5, slow: true, defaultLevel: "beginner" },
  "10-12": { label: "10–12 ans", trialsFactor: 1, slow: true, defaultLevel: "explorer" },
  "13-14": { label: "13–14 ans", trialsFactor: 1, slow: false, defaultLevel: "expert" },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function mean(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
}

function GameCard({
  title,
  subtitle,
  emoji,
  active,
  onClick,
  disabled,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "text-left w-full rounded-3xl border p-4 md:p-5",
        "bg-white hover:bg-slate-50 transition",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        active ? "border-slate-900 shadow-sm" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-900">
            <span className="mr-2">{emoji}</span>
            {title}
          </div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        {active && (
          <span className="text-[10px] font-bold rounded-full px-2 py-1 bg-slate-900 text-white">
            CHOISI
          </span>
        )}
      </div>
    </button>
  );
}

export default function Play() {
  const { mode } = useMode();

  const [game, setGame] = useState<GameId>("flanker");
  const [level, setLevel] = useState<LevelId>("beginner");
  const [zen, setZen] = useState(false);

  // Mode psy : âge + réglages (appliqués avant de lancer)
  const [age, setAge] = useState<AgePresetId>(() => {
    const v = localStorage.getItem("fa_age") as AgePresetId | null;
    return v && AGE_PRESETS[v] ? v : "10-12";
  });

  const [trialsFactor, setTrialsFactor] = useState<number>(() => {
    const v = Number(localStorage.getItem("fa_trialsFactor") || "1");
    return [0.5, 1, 1.5, 2].includes(v) ? v : 1;
  });

  const [slow, setSlow] = useState<boolean>(() => localStorage.getItem("fa_slow") === "1");

  const [running, setRunning] = useState(false);
  const [stimulus, setStimulus] = useState("Choisis un jeu puis clique sur Démarrer");
  const [feedback, setFeedback] = useState("");

  const [score, setScore] = useState<number | null>(null);
  const [acc, setAcc] = useState<number | null>(null);
  const [rt, setRt] = useState<number | null>(null);
  const [streakBest, setStreakBest] = useState<number | null>(null);

  const [best, setBest] = useState<number>(() => loadBest(game, level, zen));

  const runIdRef = useRef(0);

  // Base config
  const baseCfg = LEVELS[level];
  const trials = clamp(Math.round(baseCfg.trials * trialsFactor), 6, 200);
  const stimMs = Math.round(baseCfg.stimMs * (zen ? 1.1 : 1) * (slow ? 1.35 : 1));
  const itiMs = Math.round(baseCfg.itiMs * (zen ? 1.1 : 1) * (slow ? 1.15 : 1));

  // Appliquer preset âge (mode psy)
  useEffect(() => {
    localStorage.setItem("fa_age", age);

    const p = AGE_PRESETS[age];
    setTrialsFactor(p.trialsFactor);
    setSlow(p.slow);
    setLevel(p.defaultLevel);
  }, [age]);

  useEffect(() => localStorage.setItem("fa_trialsFactor", String(trialsFactor)), [trialsFactor]);
  useEffect(() => localStorage.setItem("fa_slow", slow ? "1" : "0"), [slow]);

  // Histo (psy)
  const hist = useMemo(() => {
    const h: HistoryEntry[] = filterHistory(game, level, zen);
    return h.map((x, i) => ({ i, score: x.score }));
  }, [game, level, zen]);

  useEffect(() => {
    setBest(loadBest(game, level, zen));
  }, [game, level, zen]);

  // Reset visuel si changement
  useEffect(() => {
    setRunning(false);
    setFeedback("");
    setScore(null);
    setAcc(null);
    setRt(null);
    setStreakBest(null);
    runIdRef.current++;
  }, [game, level, zen]);

  type Resp = { kind: "key" | "click"; key?: string; rt: number } | null;

  function waitResponse(trial: Trial, timeoutMs: number): Promise<Resp> {
    return new Promise((resolve) => {
      const started = performance.now();
      let done = false;

      const finish = (r: Resp) => {
        if (done) return;
        done = true;
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("click", onClick);
        clearTimeout(t);
        resolve(r);
      };

      const onKey = (e: KeyboardEvent) => {
        if (trial.type === "flanker") {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          finish({ kind: "key", key: e.key, rt: Math.round(performance.now() - started) });
          return;
        }

        // Go/No-Go + Oddball : Espace uniquement
        if (e.code !== "Space") return;
        finish({ kind: "key", key: "Space", rt: Math.round(performance.now() - started) });
      };

      const onClick = () => {
        // plus “mignon” pour enfants : clic autorisé sur Oddball
        if (trial.type !== "oddball") return;
        finish({ kind: "click", rt: Math.round(performance.now() - started) });
      };

      window.addEventListener("keydown", onKey);
      window.addEventListener("click", onClick);
      const t = window.setTimeout(() => finish(null), timeoutMs);
    });
  }

  function evaluate(trial: Trial, resp: Resp) {
    if (trial.type === "flanker") {
      if (!resp) return { answered: false, correct: false, rt: null as number | null };
      const want = trial.correctKey; // ✅ correction TS
      const ok = resp.kind === "key" && resp.key === want;
      return { answered: true, correct: ok, rt: resp.rt };
    }

    if (trial.type === "gonogo") {
      if (trial.isGo) {
        if (!resp) return { answered: false, correct: false, rt: null as number | null };
        const ok = resp.kind === "key" && resp.key === "Space";
        return { answered: true, correct: ok, rt: resp.rt };
      } else {
        const ok = resp === null;
        return { answered: resp !== null, correct: ok, rt: resp?.rt ?? null };
      }
    }

    // oddball
    if (trial.isBonus) {
      if (!resp) return { answered: false, correct: false, rt: null as number | null };
      return { answered: true, correct: true, rt: resp.rt };
    } else {
      const ok = resp === null;
      return { answered: resp !== null, correct: ok, rt: resp?.rt ?? null };
    }
  }

  function showStimulus(t: Trial) {
    if (t.type === "flanker") return t.s;
    if (t.type === "gonogo") return t.isGo ? "GO 🟢" : "STOP 🔴";
    return t.isBonus ? "⭐ BONUS ⭐" : t.symbol;
  }

  function childInstruction(g: GameId) {
    if (g === "flanker") return "Regarde la flèche du milieu. Appuie ← ou →.";
    if (g === "gonogo") return "Appuie ESPACE sur GO 🟢. Ne touche rien sur STOP 🔴.";
    return "Appuie ESPACE (ou clique) seulement sur ⭐ BONUS ⭐.";
  }

  async function start() {
    const runId = ++runIdRef.current;

    setRunning(true);
    setFeedback("");
    setScore(null);
    setAcc(null);
    setRt(null);
    setStreakBest(null);

    let answered = 0;
    let correct = 0;
    const rtsCorrect: number[] = [];
    let streak = 0;
    let streakMax = 0;

    for (let i = 0; i < trials; i++) {
      if (runIdRef.current !== runId) return;

      const t: Trial = makeTrial(game, { ...baseCfg, trials } as any);
      setStimulus(showStimulus(t));

      const resp = await waitResponse(t, stimMs);
      if (runIdRef.current !== runId) return;

      const ev = evaluate(t, resp);

      if (ev.answered) answered++;
      if (ev.correct) {
        correct++;
        streak++;
        streakMax = Math.max(streakMax, streak);
        if (ev.rt != null) rtsCorrect.push(ev.rt);
      } else {
        streak = 0;
      }

      if (!zen) {
        if (mode === "child") {
          if (!ev.answered) setFeedback("Prends ton temps 😊");
          else if (ev.correct) setFeedback("Bravo ! 🎉");
          else setFeedback("On réessaie 🙂");
        } else {
          if (!ev.answered) setFeedback("⏳ Omission");
          else if (ev.correct) setFeedback("✅ Correct");
          else setFeedback("❌ Incorrect");
        }
      } else {
        setFeedback("");
      }

      await sleep(itiMs);
    }

    const acc01 = correct / Math.max(1, answered);
    const mRt = mean(rtsCorrect);
    const finalScore = computeScore(acc01, mRt, streakMax);

    setScore(finalScore);
    setAcc(Math.round(acc01 * 100));
    setRt(mRt);
    setStreakBest(streakMax);

    const newBest = saveBest(game, level, zen, finalScore);
    setBest(newBest);

    pushHistory({
      t: Date.now(),
      game,
      level,
      zen,
      score: finalScore,
      acc: Math.round(acc01 * 100),
      rt: mRt,
      streakBest: streakMax,
    });

    setStimulus(mode === "child" ? "Terminé ! 🌟" : "Session terminée ✅");
    setFeedback(mode === "child" ? "Super travail 🧠✨" : "Enregistré");
    setRunning(false);
  }

  function stop() {
    runIdRef.current++;
    setRunning(false);
    setStimulus(mode === "child" ? "Pause 😊" : "Arrêté");
    setFeedback("");
  }

  return (
    <div className="space-y-4">
      {/* 1) Choix du jeu (visible pour l’enfant) */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <H2>Choisir un jeu</H2>
            <P>Tu choisis ton défi, puis on démarre une petite session.</P>
          </div>
          <Pill>{mode === "child" ? "👧 Enfant" : "👩‍⚕️ Psy"}</Pill>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <GameCard
            title="Flanker"
            subtitle="Ignorer les distractions"
            emoji="🧭"
            active={game === "flanker"}
            onClick={() => setGame("flanker")}
            disabled={running}
          />
          <GameCard
            title="Go/No-Go"
            subtitle="Contrôle de l’impulsivité"
            emoji="🛑"
            active={game === "gonogo"}
            onClick={() => setGame("gonogo")}
            disabled={running}
          />
          <GameCard
            title="Oddball"
            subtitle="Vigilance & attention"
            emoji="⭐"
            active={game === "oddball"}
            onClick={() => setGame("oddball")}
            disabled={running}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{gameLabel(game)}</Pill>
          <Pill>{levelLabel(level)}</Pill>
          {zen && <Pill>Zen</Pill>}
          {mode === "therapist" && <Pill>Meilleur : {best || "—"}</Pill>}
        </div>
      </Card>

      {/* 2) Panneau psy (compact) : âge + options avant de lancer */}
      {mode === "therapist" && (
        <Card>
          <H2>Réglages thérapeute</H2>
          <P>Choisis l’âge, l’app règle automatiquement la séance.</P>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-xs font-medium text-slate-600">Âge</div>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm"
                value={age}
                onChange={(e) => setAge(e.target.value as AgePresetId)}
                disabled={running}
              >
                <option value="7-9">7–9 ans</option>
                <option value="10-12">10–12 ans</option>
                <option value="13-14">13–14 ans</option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-xs font-medium text-slate-600">Niveau</div>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm"
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelId)}
                disabled={running}
              >
                <option value="beginner">Beginner</option>
                <option value="explorer">Explorer</option>
                <option value="expert">Expert</option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2 flex items-center gap-2 mt-0">
              <input
                type="checkbox"
                checked={zen}
                onChange={(e) => setZen(e.target.checked)}
                disabled={running}
              />
              <div>
                <div className="text-sm font-medium text-slate-800">Zen</div>
                <div className="text-xs text-slate-500">Moins de feedback</div>
              </div>
            </label>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Session: {trials} essais • stimulus {stimMs}ms • pause {itiMs}ms • preset: {AGE_PRESETS[age].label}
          </div>

          {/* Optionnels : visibles mais pas envahissants */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2 flex items-center justify-between">
              <span className="text-sm text-slate-800">Taille session</span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm"
                value={trialsFactor}
                onChange={(e) => setTrialsFactor(Number(e.target.value))}
                disabled={running}
              >
                <option value={0.5}>Courte</option>
                <option value={1}>Standard</option>
                <option value={1.5}>Longue</option>
                <option value={2}>Très longue</option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2 flex items-center gap-2">
              <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} disabled={running} />
              <span className="text-sm text-slate-800">Ralentir (plus confortable)</span>
            </label>
          </div>
        </Card>
      )}

      {/* 3) Zone séance (enfant-friendly + pro) */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <H2>Session</H2>
            <P>
              {mode === "child"
                ? childInstruction(game)
                : "Flanker: ←/→ • Go/No-Go: Espace sur GO, inhibition sur STOP • Oddball: réponse sur BONUS"}
            </P>
          </div>

          <div className="flex gap-2">
            <Button onClick={start} disabled={running}>
              Démarrer
            </Button>
            <ButtonGhost onClick={stop} disabled={!running}>
              Stop
            </ButtonGhost>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
          <div className="text-5xl md:text-6xl text-center font-bold select-none py-8">
            {stimulus}
          </div>

          <div className="text-center text-slate-600 min-h-[24px]">
            {feedback}
          </div>

          {mode === "child" && (
            <div className="mt-3 text-center text-xs text-slate-500">
              Astuce : fais une petite pause entre 2 sessions 😊
            </div>
          )}
        </div>
      </Card>

      {/* 4) Résultats */}
      {mode === "therapist" ? (
        <div className="grid md:grid-cols-4 gap-3">
          <Stat label="Score" value={score ?? "—"} />
          <Stat label="Précision" value={acc != null ? `${acc}%` : "—"} />
          <Stat label="RT moyen (correct)" value={rt != null ? `${rt} ms` : "—"} />
          <Stat label="Meilleure série" value={streakBest ?? "—"} />
        </div>
      ) : (
        <Card className="text-center">
          <div className="text-sm text-slate-700">Bravo, tu entraînes ton attention 🧠✨</div>
          <div className="text-xs text-slate-500 mt-1">L’important c’est d’essayer, pas d’être parfait.</div>
        </Card>
      )}

      {/* 5) Progression + exports (psy only, pour ne pas surcharger l’enfant) */}
      {mode === "therapist" && (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <H2>Progression</H2>
              <P>Évolution du score sur ce jeu / niveau / mode.</P>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ButtonGhost onClick={exportHistoryJSON}>Export JSON</ButtonGhost>
              <ButtonGhost onClick={exportHistoryCSV}>Export CSV</ButtonGhost>
              <ButtonGhost onClick={clearHistory}>Clear</ButtonGhost>
            </div>
          </div>

          <div className="mt-4">
            <Suspense
              fallback={
                <div className="h-48 flex items-center justify-center text-slate-500">
                  Chargement du graphique…
                </div>
              }
            >
              <ScoreChart data={hist} />
            </Suspense>
          </div>
        </Card>
      )}
    </div>
  );
}
