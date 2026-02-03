import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

type NavItem = {
  label: string;
  to: string;
};

const primaryLinks: NavItem[] = [
  { label: "Active Wallets", to: "/active-wallets" },
  { label: "Volume", to: "/volume" },
  { label: "Community Pool", to: "/community-pool" },
];

const governanceLinks: NavItem[] = [
  { label: "Participation", to: "/governance/participation" },
  { label: "Validators", to: "/governance/validators" },
  { label: "Proposals", to: "/governance/proposals" },
];

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-slate-800 text-white shadow-sm"
      : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
  ].join(" ");

function NavLinks({
  links,
  onNavigate,
}: {
  links: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {links.map((link) => (
        <NavLink
          end
          key={link.to}
          to={link.to}
          className={navLinkClasses}
          onClick={onNavigate}
        >
          <span>{link.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen text-slate-100 md:flex">
      <aside className="hidden md:flex md:w-72 md:flex-col md:sticky md:top-0 md:h-screen md:border-r md:border-slate-800 md:bg-slate-950/75 md:backdrop-blur">
        <div className="px-6 py-6 border-b border-slate-800">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Terra Classic
          </p>
          <h1 className="mt-2 text-lg font-semibold text-white">
            Giga Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Consolidated analytics views for Terra Classic.
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <NavLinks links={primaryLinks} />
          <div className="mt-8 text-xs uppercase tracking-widest text-slate-500">
            Governance
          </div>
          <div className="mt-3">
            <NavLinks links={governanceLinks} />
          </div>
        </nav>
        <div className="px-6 py-5 border-t border-slate-800 text-xs text-slate-500">
          Updated snapshots will be wired in the next phase.
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="md:hidden sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs uppercase tracking-wider text-slate-200"
            >
              Menu
            </button>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Terra Classic
              </p>
              <p className="text-sm font-semibold text-white">Giga Dashboard</p>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-50 md:hidden ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 h-full w-72 border-r border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur transition-transform ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Terra Classic
              </p>
              <p className="text-sm font-semibold text-white">Giga Dashboard</p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-md border border-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-slate-300"
            >
              Close
            </button>
          </div>
          <nav className="px-4 py-6">
            <NavLinks
              links={primaryLinks}
              onNavigate={() => setDrawerOpen(false)}
            />
            <div className="mt-8 text-xs uppercase tracking-widest text-slate-500">
              Governance
            </div>
            <div className="mt-3">
              <NavLinks
                links={governanceLinks}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
