// src/app/routes.jsx
//
// Single source of truth for every page in the app.
// Each entry has:
//   - path:      the real URL (what react-router matches)
//   - nav:       the key MainLayout's sidebar uses for highlighting /
//                calling onNavChange
//   - component: the page to render
//
// To add a page: add ONE entry here. Nothing else needs to change.

import DashboardPage from "../pages/DashboardPage";
import WeatherMapPage from "../pages/WeatherMapPage";
import ReportsPage from "../pages/ReportsPage";
import AlertsPage from "../pages/AlertsPage";
import TopographyPage from "../pages/TopographyPage";
import TrafficPage from "../pages/TrafficPage";
import ActivityLog from "../components/dashboard/ActivityLog";

export const routes = [
  { path: "/dashboard", nav: "dashboard", component: DashboardPage },
  { path: "/weather", nav: "weather", component: WeatherMapPage },
  { path: "/deformationinsights", nav: "topography", component: TopographyPage },
  { path: "/traffic", nav: "traffic", component: TrafficPage },
  { path: "/reports", nav: "reports", component: ReportsPage },
  { path: "/alerts", nav: "alerts", component: AlertsPage },
  { path: "/activity-log", nav: "activity-log", component: ActivityLog },
];

export const DEFAULT_ROUTE = routes[0];

export const getRouteByNav = (nav) =>
  routes.find((r) => r.nav === nav) || DEFAULT_ROUTE;

export const getRouteByPath = (path) =>
  routes.find((r) => r.path === path) || DEFAULT_ROUTE;