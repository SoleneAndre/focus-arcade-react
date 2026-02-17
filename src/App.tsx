import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppShell from "./layout/AppShell";

import Dashboard from "./pages/Dashboard";
import Accessibility from "./pages/Accessibility";
import History from "./pages/History";
import Badges from "./pages/Badges";

const Play = lazy(() => import("./pages/Play"));

function Loading() {
  return <div className="p-6 text-slate-600">Chargement…</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/play"
          element={
            <Suspense fallback={<Loading />}>
              <Play />
            </Suspense>
          }
        />

        <Route path="/history" element={<History />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/accessibility" element={<Accessibility />} />
      </Route>
    </Routes>
  );
}
