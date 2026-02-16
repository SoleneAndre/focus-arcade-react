import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-semibold">Mini-jeux pour entraîner l’attention (7–14 ans)</h1>
        <p className="text-white/70 mt-2">
          Attention sélective, inhibition, vigilance — en sessions courtes façon arcade.
          <span className="ml-2 text-white/60">(Outil pédagogique, pas un test.)</span>
        </p>

        <div className="mt-5 flex gap-3">
          <Link to="/play" className="px-4 py-2 rounded-xl bg-violet-500/90 hover:bg-violet-500 font-semibold">
            Jouer
          </Link>
          <Link to="/accessibilite" className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/80">
            Accessibilité
          </Link>
        </div>
      </section>
    </div>
  );
}
