// src/components/Topography.jsx
import { useState, useEffect } from "react";
import { Map, Droplets, Waves, Mountain, Zap, ChevronDown } from "lucide-react";
import LandUseLandCover from "./LandUseLandCover";
import SoilMap from "./SoilMap";
import FloodMap from "./FloodMap";

const NAV_ITEMS = [
  {
    id: "lulc",
    label: "Land Use",
    icon: Map,
    color: "#3b82f6",
    bg: "bg-blue-50",
    activeBg: "bg-blue-100",
    text: "text-blue-600",
    ring: "ring-blue-300",
    dot: "bg-blue-500",
  },
  {
    id: "soil",
    label: "Soil",
    icon: Droplets,
    color: "#10b981",
    bg: "bg-emerald-50",
    activeBg: "bg-emerald-100",
    text: "text-emerald-600",
    ring: "ring-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    id: "Flood",
    label: "Flood",
    icon: Waves,
    color: "#8b5cf6",
    bg: "bg-purple-50",
    activeBg: "bg-purple-100",
    text: "text-purple-600",
    ring: "ring-purple-300",
    dot: "bg-purple-500",
  },
  {
    id: "elevation",
    label: "Elevation",
    icon: Mountain,
    color: "#f59e0b",
    bg: "bg-amber-50",
    activeBg: "bg-amber-100",
    text: "text-amber-600",
    ring: "ring-amber-300",
    dot: "bg-amber-500",
  },
  {
    id: "Lightening",
    label: "Lightening",
    icon: Zap, // ✅ Changed from AlertTriangle
    color: "#ef4444",
    bg: "bg-red-50",
    activeBg: "bg-red-100",
    text: "text-red-600",
    ring: "ring-red-300",
    dot: "bg-red-500",
  },
];

function ComingSoon({ icon: PanelIcon, label, colorClass }) {
  return (
    <div className="flex h-full items-center justify-center bg-white rounded-lg">
      <div className="text-center">
        <PanelIcon size={48} className={`mx-auto mb-3 ${colorClass}`} />
        <p className="text-gray-700 font-semibold text-lg">{label}</p>
        <p className="text-gray-400 text-sm mt-1">Coming soon</p>
      </div>
    </div>
  );
}

// ✅ ONLY render the active tab - UNMOUNTS inactive components
function renderPanel(tabId) {
  switch (tabId) {
    case "lulc":
      return <LandUseLandCover key={`lulc-${Date.now()}`} isActive={true} />;
    case "soil":
      return <SoilMap key="soil-panel" isActive={true} />;
    case "Flood":
      return <FloodMap key={`flood-${Date.now()}`} isActive={true} />;
    case "elevation":
      return (
        <ComingSoon
          key="elevation-panel"
          icon={Mountain}
          label="Elevation Map"
          colorClass="text-amber-600"
        />
      );
    case "Lightening":
      return (
        <ComingSoon
          key="lightening-panel"
          icon={Zap}
          label="Lightening Map"
          colorClass="text-red-600"
        />
      );
    default:
      return null;
  }
}

export default function Topography({ className = "" }) {
  const [activeTab, setActiveTab] = useState("lulc");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [remountKey, setRemountKey] = useState(Date.now());

  const [isMobile, setIsMobile] = useState(
    () => !window.matchMedia("(min-width: 768px)").matches,
  );

  // Track mobile breakpoint
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handleChange = (e) => setIsMobile(!e.matches);
    handleChange(mql);
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    } else {
      mql.addListener(handleChange);
      return () => mql.removeListener(handleChange);
    }
  }, []);

  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab);
  const Icon = activeItem?.icon;
  const color = activeItem?.color;

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    // console.log(`Switching from ${activeTab} to ${tabId}`);
    setRemountKey(Date.now());
    setActiveTab(tabId);
    setIsDropdownOpen(false);
  };

  return (
    <div className={`flex flex-col h-full w-full ${className}`}>
      {/* Map Container - Takes remaining space */}
      <div
        className="flex-1 min-h-0 relative"
        style={{
          height: isMobile ? "calc(100vh - 200px)" : "100%",
          minHeight: isMobile ? "400px" : "auto",
        }}
      >
        {renderPanel(activeTab)}
      </div>
    </div>
  );
}
