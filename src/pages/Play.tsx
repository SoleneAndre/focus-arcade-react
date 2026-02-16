import { useState } from "react";

export default function Play() {
  const [msg, setMsg] = useState("Choisis un jeu, puis on ajoute la logique.");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Jouer</h1>

      <div className="flex gap-2 flex-wrap">
        <button className="px-3 py-2 rounded-2xl border border-white/10 hover:bg-white/5"
          onClick={() => setMsg("Flèches Mania — à implémenter")}>
          Flèches Mania
        </button>
        <button className="px-3 py-2 rounded-2xl border border-white/10 hover:bg-white/5"
          onClick={() => setMsg("Stop & Go — à implémenter")}>
          Stop & Go
        </button>
        <button className="px-3 py-2 rounded-2xl border border-white/10 hover:bg-white/5"
          onClick={() => setMsg("Catch the Bonus — à implémenter")}>
          Catch the Bonus
        </button>
      </div>

      <div className="text-white/70">{msg}</div>
    </div>
  );
}
