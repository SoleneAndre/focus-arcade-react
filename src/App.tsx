import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Accessibility from "./pages/Accessibility";

function Nav() {
  const link = ({ isActive }: { isActive: boolean }) =>
    "px-3 py-2 rounded-xl border border-white/10 " +
    (isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5");

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-grid place-items-center w-8 h-8 rounded-xl border border-violet-400/40 bg-violet-400/10">★</span>
          <span>Focus Arcade</span>
        </div>
        <nav className="flex items-center gap-2">
          <NavLink to="/" className={link}>Accueil</NavLink>
          <NavLink to="/play" className={link}>Jouer</NavLink>
          <NavLink to="/accessibilite" className={link}>Accessibilité</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="text-white">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/accessibilite" element={<Accessibility />} />
        </Routes>
      </main>
    </div>
  );
}
