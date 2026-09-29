// src/components/Sidebar.jsx
import {
  LayoutDashboard,
  Bell,
  FileText,
  HelpCircle,
  Mountain,
  Activity,
} from "lucide-react";

function useAuthUser() {
  try {
    return JSON.parse(sessionStorage.getItem("authUser")) || null;
  } catch {
    return null;
  }
}

// `id` below must match a `nav` value in ../../app/routes.jsx

export default function Sidebar({ activeItem, onNavClick, onClose }) {
  const authUser = useAuthUser();
  // const isAdmin = authUser?.role?.toLowerCase() === "admin";
  const isAdmin = false;
  const handleNavClick = (id) => {
    if (onNavClick) onNavClick(id);
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
    { label: "Deformation Insights", icon: Mountain, id: "topography" },
    // { label: "Traffic", icon: TrafficCone, id: "traffic" },
    // { label: "Intense RF", icon: CloudSun, id: "weather" },
    { label: "Reports", icon: FileText, id: "reports" },

    //{ label: "Monitoring", icon: Radar, id: "monitoring" },
    { label: "Alerts", icon: Bell, badge: 3, id: "alerts" },
    ...(isAdmin
      ? [
        {
          label: "Activity Log",
          icon: Activity,
          id: "activity-log",
        },
      ]
      : []), // { label: "Integrations", icon: Puzzle, id: "integrations" },
  ];
  return (
    <aside className="w-37 h-screen  bg-[#0a1130] flex flex-col">
      <div>
        {/* Navigation */}
        <nav className="mt-4 px-6 space-y-7">
          {navItems.map(({ label, icon: Icon, id, badge }) => {
            const isActive = activeItem === id;
            return (
              <button
                key={label}
                disabled={!id}
                onClick={() => id && handleNavClick(id)}
                className={`group relative w-full flex flex-col items-center justify-center  py-2 rounded-xl text-[14px] font-medium transition-all duration-200 ${!id
                  ? "cursor-not-allowed opacity-50"
                  : isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.25 : 2}
                  className={
                    isActive
                      ? "text-white flex-shrink-0"
                      : "text-slate-400 group-hover:text-blue-400 flex-shrink-0"
                  }
                />
                <span className="leading-tight text-center text-white">
                  {label}
                </span>

                {badge ? (
                  <span className="absolute top-1.5 right-8 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings + Help */}
      {/* <div className="mt-auto px-2 pb-4">
        <div className="h-px bg-white/5 mt-1" />

        <button
          onClick={() => console.log("Help clicked")}
          className="group w-full flex flex-col items-center justify-center gap-1 py-2.5 mt-1 rounded-xl text-[10px] font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
        >
          <HelpCircle
            size={18}
            className="text-slate-400 group-hover:text-blue-400"
          />

          <span>Help</span>
        </button>
      </div> */}

    </aside>
  );
}