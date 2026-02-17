import { useMemo } from "react";
import { Card, H1, H2, P, Pill, Stat, Button, ButtonGhost } from "../components/ui";
import { filterHistory } from "../lib/core";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();

  const all = useMemo(() => {
    // récupère tout l’historique (tous jeux/niveaux) :
    // ton core filtre par game/level/zen, donc on “balaye” vite fait
    // (simple & suffisant pour un dashboard)
    const combos = [
      ["flanker", "beginner", false],
      ["flanker", "explorer", false],
      ["flanker", "expert", false],
      ["gonogo", "beginner", false],
      ["gonogo", "explorer", false],
      ["gonogo", "expert", false],
      ["oddball", "beginner", false],
      ["oddball", "explorer", false],
      ["oddball", "expert", false],
      ["flanker", "beginner", true],
      ["gonogo", "beginner", true],
      ["oddball", "beginner", true],
    ] as const;

    const merged = combos.flatMap(([g, l, z]) => filterHistory(g as any, l as any, z as any));
    merged.sort((a, b) => b.t - a.t);
    return merged;
  }, []);

  const stats = useMemo(() => {
    const sessions = all.length;
    const avgScore = sessions ? Math.round(all.reduce((s, x) => s + x.score, 0) / sessions) : 0;
    const avgAcc = sessions ? Math.round(all.reduce((s, x) => s + (x.acc ?? 0), 0) / sessions) : 0;

    // streak simple = nb de jours consécutifs avec au moins 1 session
    const days = new Set(all.map((x) => new Date(x.t).toDateString()));
    const uniqueDays = Array.from(days).map((d) => new Date(d).getTime()).sort((a, b) => b - a);

    let streak = 0;
    if (uniqueDays.length) {
      const oneDay = 24 * 60 * 60 * 1000;
      let cur = uniqueDays[0];
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        if (cur - uniqueDays[i] <= oneDay * 1.2 && cur - uniqueDays[i] >= oneDay * 0.8) {
          streak++;
          cur = uniqueDays[i];
        } else break;
      }
    }

    return { sessions, avgScore, avgAcc, streak };
  }, [all]);

  const recent = all.slice(0, 6);

  return (
    <div className="space-y-4">
      <Card>
        <H1>Bienvenue 👋</H1>
        <P>
          Objectif : des sessions courtes, régulières, et mesurables. Tu joues → tu progresses → tu vois tes résultats.
        </P>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>Clair</Pill>
          <Pill>Simple</Pill>
          <Pill>Progression</Pill>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => nav("/play")}>Reprendre une session</Button>
          <ButtonGhost onClick={() => nav("/accessibility")}>Options d’accessibilité</ButtonGhost>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-3">
        <Stat label="Sessions" value={String(stats.sessions)} />
        <Stat label="Score moyen" value={stats.sessions ? String(stats.avgScore) : "—"} />
        <Stat label="Précision moyenne" value={stats.sessions ? `${stats.avgAcc}%` : "—"} />
        <Stat label="Streak (jours)" value={stats.sessions ? String(stats.streak) : "—"} />
      </div>

      <Card>
        <H2>Dernières sessions</H2>
        <P>Un petit aperçu rapide de ce que tu as fait récemment.</P>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr className="text-left">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Jeu</th>
                <th className="py-2 pr-4">Niveau</th>
                <th className="py-2 pr-4">Zen</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Acc</th>
                <th className="py-2 pr-4">RT</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {recent.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={7}>
                    Fais une session pour remplir le dashboard ✨
                  </td>
                </tr>
              ) : (
                recent.map((x) => (
                  <tr key={x.t} className="border-t border-slate-100">
                    <td className="py-3 pr-4">{new Date(x.t).toLocaleString()}</td>
                    <td className="py-3 pr-4">{x.game}</td>
                    <td className="py-3 pr-4">{x.level}</td>
                    <td className="py-3 pr-4">{x.zen ? "Oui" : "Non"}</td>
                    <td className="py-3 pr-4 font-semibold">{x.score}</td>
                    <td className="py-3 pr-4">{x.acc != null ? `${x.acc}%` : "—"}</td>
                    <td className="py-3 pr-4">{x.rt != null ? `${x.rt} ms` : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
