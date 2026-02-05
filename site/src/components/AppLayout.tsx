import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import terraClassicSign from "../img/terra-classic-sign.svg";

type NavItem = {
  label: string;
  to: string;
};

const healthLinks: NavItem[] = [
  { label: "Active On-Chain Wallets", to: "/active-wallets" },
  { label: "24h Trading Volume", to: "/volume" },
];

const managementLinks: NavItem[] = [
  { label: "Expenditures and investments", to: "/community-pool" },
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
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return "dark";
  });
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("theme-light");
      root.dataset.theme = "light";
    } else {
      root.classList.remove("theme-light");
      root.dataset.theme = "dark";
    }
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen text-slate-100 md:flex">
      <aside className="hidden md:flex md:w-72 md:flex-col md:sticky md:top-0 md:h-screen md:border-r md:border-slate-800 md:bg-slate-950/75 md:backdrop-blur">
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
              <img
                src={terraClassicSign}
                alt=""
                className="h-4 w-4 opacity-70"
              />
              <span>TERRA CLASSIC</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:bg-slate-800/60"
            >
              {theme === "dark" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4V2M12 22V20M4 12H2M22 12H20M5.6 5.6L4.2 4.2M19.8 19.8L18.4 18.4M5.6 18.4L4.2 19.8M19.8 4.2L18.4 5.6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.4 14.7A8.5 8.5 0 0 1 9.3 3.6a.8.8 0 0 0-.9-.9A9.5 9.5 0 1 0 21.3 15.6a.8.8 0 0 0-.9-.9z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
          <h1 className="mt-2 text-lg font-semibold text-white">
            Truth Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Data collected during the research and writing of Terra Classic Four
            Years After: State of the Chain Report (2022–2026)
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="text-xs uppercase tracking-widest text-slate-500">
            Health
          </div>
          <div className="mt-3">
            <NavLinks links={healthLinks} />
          </div>
          <div className="mt-8 text-xs uppercase tracking-widest text-slate-500">
            Management
          </div>
          <div className="mt-3">
            <NavLinks links={managementLinks} />
          </div>
          <div className="mt-8 text-xs uppercase tracking-widest text-slate-500">
            Governance
          </div>
          <div className="mt-3">
            <NavLinks links={governanceLinks} />
          </div>
          <div className="mt-8">
            <a
              href="https://www.terra-classic.money"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/60 hover:text-white"
            >
              Back to Terra-classic.money
            </a>
          </div>
        </nav>
        <div className="px-6 py-5 border-t border-slate-800 text-xs text-slate-500 space-y-3">
          <p>
            All rights reserved @ Terra-Classic.money 2026 - Designed and
            developed by{" "}
            <a
              href="https://dawidskinder.pl"
              className="underline underline-offset-2"
            >
              DawidSkinder.pl
            </a>
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="md:hidden sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src={terraClassicSign}
                alt=""
                className="h-4 w-4 opacity-70"
              />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  TERRA CLASSIC
                </p>
                <p className="text-sm font-semibold text-white">
                  Truth Dashboard
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-800 bg-slate-900/70 text-slate-200"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6H20M4 12H20M4 18H20"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
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
          className={`absolute left-0 top-0 flex h-full w-72 flex-col border-r border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur transition-transform ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <img
                src={terraClassicSign}
                alt=""
                className="h-4 w-4 opacity-70"
              />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  TERRA CLASSIC
                </p>
                <p className="text-sm font-semibold text-white">
                  Truth Dashboard
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:bg-slate-800/60"
              >
                {theme === "dark" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4V2M12 22V20M4 12H2M22 12H20M5.6 5.6L4.2 4.2M19.8 19.8L18.4 18.4M5.6 18.4L4.2 19.8M19.8 4.2L18.4 5.6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.4 14.7A8.5 8.5 0 0 1 9.3 3.6a.8.8 0 0 0-.9-.9A9.5 9.5 0 1 0 21.3 15.6a.8.8 0 0 0-.9-.9z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-300"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="border-b border-slate-800 px-5 py-4 text-sm text-slate-400">
            Data collected during the research and writing of Terra Classic Four
            Years After: State of the Chain Report (2022–2026)
          </div>
          <nav className="flex-1 px-4 py-6">
            <div className="text-xs uppercase tracking-widest text-slate-500">
              Health
            </div>
            <div className="mt-3">
            <NavLinks
              links={healthLinks}
              onNavigate={() => setDrawerOpen(false)}
            />
            </div>
            <div className="mt-8 text-xs uppercase tracking-widest text-slate-500">
              Management
            </div>
            <div className="mt-3">
              <NavLinks
                links={managementLinks}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <div className="mt-8 text-xs uppercase tracking-widest text-slate-500">
              Governance
            </div>
            <div className="mt-3">
              <NavLinks
                links={governanceLinks}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <div className="mt-8">
              <a
                href="https://www.terra-classic.money"
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/60 hover:text-white"
              >
                Back to Terra-classic.money
              </a>
            </div>
          </nav>
          <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
            All rights reserved @ Terra-Classic.money 2026 - Designed and
            developed by{" "}
            <a
              href="https://dawidskinder.pl"
              className="underline underline-offset-2"
            >
              DawidSkinder.pl
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
