export default function Accessibility() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-2xl font-semibold">Accessibilité</h1>
      <ul className="list-disc pl-5 text-white/70 mt-3 space-y-1">
        <li>Mode Zen : rythme un peu ralenti.</li>
        <li>Mode lisible : texte plus grand.</li>
        <li>Aucune donnée personnelle : stockage local uniquement.</li>
      </ul>
    </div>
  );
}
