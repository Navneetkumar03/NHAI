// src/components/ActivityLog.jsx
import { useMemo, useState } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  X,
  Inbox,
} from "lucide-react";

/* ============================================================================
 * MOCK DATA — replace with your API response (same shape)
 * ==========================================================================*/

const MOCK_LOGS = [
  {
    id: 1,
    username: "r.sharma",
    role: "Admin",
    logintime: "2026-09-16T08:12:00Z",
    logouttime: "2026-09-16T11:47:00Z",
    activity: "Selected Overlay Layer",
    tab: "LULC",
  },
  {
    id: 2,
    username: "a.verma",
    role: "Analyst",
    logintime: "2026-09-16T07:55:00Z",
    logouttime: "2026-09-16T09:30:00Z",
    activity: "Clicked Flyover Point: FLYOVER 2",
    tab: "InfraRisk",
  },
  {
    id: 3,
    username: "s.iyer",
    role: "Viewer",
    logintime: "2026-09-16T09:02:00Z",
    logouttime: null,
    activity: "Selected Layer: Difference",
    tab: "InfraRisk",
  },
  {
    id: 4,
    username: "r.sharma",
    role: "Admin",
    logintime: "2026-09-15T14:20:00Z",
    logouttime: "2026-09-15T18:03:00Z",
    activity: "Selected Start Date: 2024-01-01",
    tab: "InfraRisk",
  },
  {
    id: 5,
    username: "p.nair",
    role: "Analyst",
    logintime: "2026-09-15T10:00:00Z",
    logouttime: "2026-09-15T10:41:00Z",
    activity: "Clicked Velocity PointId: 42",
    tab: "InfraRisk",
  },
  {
    id: 6,
    username: "a.verma",
    role: "Analyst",
    logintime: "2026-09-14T13:15:00Z",
    logouttime: "2026-09-14T16:52:00Z",
    activity: "Selected Overlay Layer",
    tab: "Soil",
  },
];

/* ============================================================================
 * CONSTANTS
 * ==========================================================================*/

const ROLE_STYLES = {
  Admin: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Analyst: "bg-blue-50 text-blue-700 border-blue-200",
  Viewer: "bg-slate-100 text-slate-600 border-slate-200",
};

const COLUMNS = [
  { key: "username", label: "User" },
  { key: "role", label: "Role" },
  { key: "logintime", label: "Login" },
  { key: "logouttime", label: "Logout" },
  { key: "activity", label: "Activity" },
  { key: "tab", label: "Tab" },
];

/* ============================================================================
 * HELPERS
 * ==========================================================================*/

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(loginIso, logoutIso) {
  if (!loginIso || !logoutIso) return null;
  const ms = new Date(logoutIso) - new Date(loginIso);
  if (ms <= 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function initials(name) {
  return name
    .split(/[.\s_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

/* ============================================================================
 * SUB-COMPONENTS
 * ==========================================================================*/

function SortButton({ active, direction, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800 transition-colors"
    >
      {children}
      {active ? (
        direction === "asc" ? (
          <ArrowUp size={12} className="text-indigo-600" />
        ) : (
          <ArrowDown size={12} className="text-indigo-600" />
        )
      ) : (
        <ArrowUpDown size={12} className="text-slate-300" />
      )}
    </button>
  );
}

function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.Viewer;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${style}`}
    >
      {role}
    </span>
  );
}

function TabPill({ tab }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
      {tab}
    </span>
  );
}

function EmptyState({ onClear }) {
  return (
    <tr>
      <td colSpan={COLUMNS.length} className="py-14">
        <div className="flex flex-col items-center gap-2 text-center">
          <Inbox size={28} className="text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            No activity matches your filters
          </p>
          <button
            onClick={onClear}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ==========================================================================*/

export default function ActivityLog({ logs = MOCK_LOGS }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortKey, setSortKey] = useState("logintime");
  const [sortDir, setSortDir] = useState("desc");

  const roles = useMemo(
    () => Array.from(new Set(logs.map((l) => l.role))).sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let rows = logs.filter((l) => {
      const matchesQuery =
        !q ||
        l.username.toLowerCase().includes(q) ||
        l.activity.toLowerCase().includes(q) ||
        l.tab.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || l.role === roleFilter;
      return matchesQuery && matchesRole;
    });

    rows = rows.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [logs, query, roleFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const clearFilters = () => {
    setQuery("");
    setRoleFilter("all");
  };

  const hasFilters = query.trim() !== "" || roleFilter !== "all";

  return (
    <div className="rounded-xl bg-white shadow-card border border-slate-100 overflow-hidden">
      {/* HEADER */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 max-[640px]:flex-col max-[640px]:items-stretch"
        style={{
          background:
            "linear-gradient(135deg, #e0e7ff 0%, #dbeafe 50%, #ede9fe 100%)",
        }}
      >
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Activity Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} of {logs.length} events
          </p>
        </div>

        <div className="flex items-center gap-2 max-[640px]:w-full">
          <div className="relative flex-1 min-w-[200px] max-[640px]:min-w-0">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user, activity, tab…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs rounded-md border border-slate-200 bg-white/80 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          >
            <option value="all">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              title="Clear filters"
              className="flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-2.5">
                <SortButton
                  active={sortKey === "username"}
                  direction={sortDir}
                  onClick={() => toggleSort("username")}
                >
                  User
                </SortButton>
              </th>
              <th className="text-left px-4 py-2.5">
                <SortButton
                  active={sortKey === "role"}
                  direction={sortDir}
                  onClick={() => toggleSort("role")}
                >
                  Role
                </SortButton>
              </th>
              <th className="text-left px-4 py-2.5">
                <SortButton
                  active={sortKey === "logintime"}
                  direction={sortDir}
                  onClick={() => toggleSort("logintime")}
                >
                  Login
                </SortButton>
              </th>
              <th className="text-left px-4 py-2.5">
                <SortButton
                  active={sortKey === "logouttime"}
                  direction={sortDir}
                  onClick={() => toggleSort("logouttime")}
                >
                  Logout
                </SortButton>
              </th>
              <th className="text-left px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Activity
                </span>
              </th>
              <th className="text-left px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Tab
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyState onClear={clearFilters} />
            ) : (
              filtered.map((log) => {
                const duration = formatDuration(log.logintime, log.logouttime);
                return (
                  <tr
                    key={log.id}
                    className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex-shrink-0">
                          {initials(log.username)}
                        </span>
                        <span className="font-medium text-slate-800 text-xs">
                          {log.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <RoleBadge role={log.role} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatTime(log.logintime) || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      {log.logouttime ? (
                        <span className="text-slate-600 tabular-nums">
                          {formatTime(log.logouttime)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                      {duration && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-slate-400">
                          <Clock size={10} />
                          {duration}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[280px] truncate">
                      {log.activity}
                    </td>
                    <td className="px-4 py-2.5">
                      <TabPill tab={log.tab} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
