import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../components/ui";
import { useMode } from "../context/ModeContext";

const items = [
  { to: "/", label: "Dashboard" },
  { to: "/play", label: "Jouer" },
    { to: "/history", label: "Historique" },   // ✅ ajouté
  { to: "/accessibility", label: "Accessibilité" },
];

function getTitle(pathname: string) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/play")) return "Jouer";
  if (pathname.startsWith("/accessibility")) return "Accessibilité";
  if (pathname.startsWith("/history")) return "Historique";
  return "Focus Arcade";
}

export default function AppShell() {
  const loc = useLocation();
  const nav = useNavigate();
  const title = getTitle(loc.pathname);
  const { mode, setMode } = useMode();  // ✅ ICI

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-6xl px-4 py-5 md:py-7">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 md:gap-6">
          {/* Sidebar */}
          <aside className="md:sticky md:top-6 h-fit">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Focus Arcade</div>
                  <div className="text-xs text-slate-500">Mode Notion ✨</div>
                </div>
                <button
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  onClick={() => nav("/play")}
                >
                  ▶︎ Play
                </button>
              </div>

              <div className="mt-4 space-y-1">
                {items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-2xl px-3 py-2 text-sm font-medium",
                        "hover:bg-slate-50",
                        isActive ? "bg-slate-100 text-slate-900" : "text-slate-700"
                      )
                    }
                    end={it.to === "/"}
                  >
                    {it.label}
                  </NavLink>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-700">Astuce</div>
                <div className="mt-1 text-xs text-slate-600">
                  Fais 1 session courte → une pause → une session courte.
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="space-y-4">
            {/* Topbar */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm px-5 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xl font-semibold text-slate-900">{title}</div>
                  <div className="text-sm text-slate-600">Clair, simple, efficace.</div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-2xl px-4 py-2.5 font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800"
                    onClick={() => nav("/")}
                  >
                    Accueil
                  </button>
<div className="flex gap-2">
  <button
    onClick={() => setMode(mode === "child" ? "therapist" : "child")}
    className="rounded-2xl px-4 py-2.5 font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
  >
    Mode : {mode === "child" ? "👧 Enfant" : "👩‍⚕️ Psy"}
  </button>

  <button
    className="rounded-2xl px-4 py-2.5 font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800"
    onClick={() => nav("/")}
  >
    Accueil
  </button>

  <button
    className="rounded-2xl px-4 py-2.5 font-semibold bg-slate-900 text-white hover:bg-slate-800"
    onClick={() => nav("/play")}
  >
    Lancer une session
  </button>
</div>
                </div>
              </div>
            </div>

            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
