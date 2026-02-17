import { useMemo } from "react";
import { Card, H1, H2, P, Pill } from "../components/ui";
import {
  getAllHistory,
  getBadges,
  computeStreakDays,
  countThisWeek,
} from "../lib/progress";

export default function Badges() {
  const history = useMemo(() => getAllHistory(), []);
  const badges = useMemo(() => getBadges(history), [history]);
  const streak = useMemo(() => computeStreakDays(history), [history]);
  const weekCount = useMemo(() => countThisWeek(history), [history]);

  const unlocked = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <H1>Badges</H1>
        <P>
          Des petites récompenses pour motiver la régularité, la précision et la
          vitesse.
        </P>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{unlocked}/{badges.length} débloqués</Pill>
          <Pill>Streak : {streak} jour(s)</Pill>
          <Pill>Semaine : {weekCount} session(s)</Pill>
        </div>
      </Card>

      {/* Liste des badges */}
      <Card>
        <H2>Collection</H2>
        <P>
          Tout est calculé automatiquement depuis ton historique (stocké en
          local).
        </P>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className={
                "rounded-3xl border p-4 " +
                (b.unlocked
                  ? "bg-white border-slate-200"
                  : "bg-slate-50 border-slate-200 opacity-70")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    <span className="mr-2">{b.emoji}</span>
                    {b.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {b.description}
                  </div>
                </div>

                <span
                  className={
                    "text-xs font-semibold rounded-full px-3 py-1 border " +
                    (b.unlocked
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200")
                  }
                >
                  {b.unlocked ? "Débloqué" : "À faire"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
