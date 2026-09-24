import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Shield,
  KeyRound,
  X,
} from "lucide-react";
import NHAILOGO from "../../assets/NHAILOGO.png";
import { logoutUser } from "../../services/api";
import ChangePasswordForm from "./ChangePasswordForm"; // adjust path to wherever you saved it

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const Header = ({ only, onLogout, user } = {}) => {
  const showLogo = only !== "content";
  const showRest = only !== "logo";

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false); // NEW

  const rootRef = useRef(null);
  const dateInputRef = useRef(null);
  const userButtonRef = useRef(null);
  const menuRef = useRef(null);

  const displayName = user?.name || user?.username || "Admin User";
  const displayEmail = user?.email;
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "NHAI HQ";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "Select Date";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      if ("showPicker" in HTMLInputElement.prototype) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const toggleUserMenu = () => {
    if (userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 8,
        left: rect.right - 208,
      });
    }
    setIsUserMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    try {
      await logoutUser();
    } catch (err) {
      console.error("Error logging out:", err);
    } finally {
      onLogout?.();
    }
  };

  // NEW: open modal, close dropdown menu
  const handleOpenChangePassword = () => {
    setIsUserMenuOpen(false);
    setIsChangePasswordOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // MOBILE ALIGNMENT: the header is rendered in two parts — the logo card
  // (`only="logo"`, outside the scroll area) and the status card
  // (`only="content"`, inside a scrolling panel). When that panel shows a
  // vertical scrollbar, it takes a few pixels from the status card's width,
  // so the two cards stop lining up on the right. The "content" instance
  // measures that scrollbar and publishes its width as a CSS variable; the
  // "logo" instance reserves the same space (see its wrapper below).
  useEffect(() => {
    if (only !== "content") return;

    const findScroller = () => {
      let el = rootRef.current?.parentElement;
      while (el && el !== document.body) {
        const oy = window.getComputedStyle(el).overflowY;
        if (oy === "auto" || oy === "scroll") return el;
        el = el.parentElement;
      }
      return null;
    };

    const measure = () => {
      const scroller = findScroller();
      let sb = 0;
      if (scroller) {
        const cs = window.getComputedStyle(scroller);
        const borders =
          (parseFloat(cs.borderLeftWidth) || 0) +
          (parseFloat(cs.borderRightWidth) || 0);
        sb = Math.max(0, scroller.offsetWidth - scroller.clientWidth - borders);
      }
      document.documentElement.style.setProperty(
        "--header-scrollbar-w",
        `${sb}px`,
      );
    };

    measure();
    window.addEventListener("resize", measure);
    // The scrollbar can appear/disappear when the panel's content grows or shrinks.
    const scroller = findScroller();
    const observer = new ResizeObserver(measure);
    if (scroller) {
      observer.observe(scroller);
      if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    }
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [only]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`w-full bg-[#1366D9] select-none font-sans ${only === "logo" ? "max-[900px]:pr-[var(--header-scrollbar-w,0px)]" : ""
        }`}
    >

      <div className="relative w-full min-w-[1020px] h-[100px] pb-1.5 bg-[#1366D9] flex items-center shadow-lg max-[900px]:min-w-0 max-[900px]:flex-col max-[900px]:h-auto max-[900px]:py-2 max-[900px]:gap-2">
        {showLogo && (
          <div className="relative z-10 h-full -mr-8 pr-12 flex items-center mt-3 ml-1 gap-3 shrink-0 bg-[#EEF4FA] max-[900px]:w-[calc(100%-1rem)]! max-[900px]:min-w-0! max-[900px]:ml-0! max-[900px]:mr-0! max-[900px]:mt-0 max-[900px]:px-4 max-[900px]:justify-between max-[900px]:h-auto max-[900px]:py-3 max-[900px]:rounded-xl max-[900px]:shadow-sm">
            <div className="flex items-center gap-2 max-[900px]:gap-2 shrink-0">
              <img
                src={NHAILOGO}
                alt="NHAI Logo"
                className="h-15 w-16 object-contain shrink-0 max-[900px]:h-10 max-[900px]:w-10 max-[480px]:h-9 max-[480px]:w-9"
              />
              {/* NHAI name + full form: desktop only (hidden on mobile) */}
              <div className="leading-tight max-[900px]:hidden">
                <p className="text-[22px] font-extrabold text-blue-600 tracking-tight leading-none max-[900px]:text-base max-[480px]:text-sm">
                  NHAI
                </p>
                <p className="text-[10px] font-bold leading-[1.3] mt-[3px] whitespace-nowrap max-[900px]:text-[10px] max-[480px]:text-[9px]">
                  National Highways
                  <br />
                  Authority of India
                </p>
              </div>
            </div>


            <div className="hidden max-[900px]:block max-[900px]:flex-1 max-[900px]:min-w-0 ml-2">
              <h2
                className="text-[#0F172A] font-extrabold text-[11px] leading-snug max-[480px]:text-[10px]"
                style={{ textAlign: "left" }}
              >
                INFRARISK: AI-Based Remote Monitoring
              </h2>

              {/* Mobile-only tagline under the title (desktop shows it in the center panel) */}
              <div
                className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[9px] font-bold max-[480px]:text-[8px] max-[480px]:gap-x-1.5"
                style={{ textAlign: "left" }}
              >
                <span className="text-gray-800 whitespace-nowrap">
                  <span className="text-gray-400 mr-0.5">•</span>Smart
                  Monitoring
                </span>
                <span className="text-gray-800 whitespace-nowrap">
                  <span className="text-gray-400 mr-0.5">•</span>Predictive
                  Insights
                </span>
                <span className="text-gray-800 whitespace-nowrap">
                  <span className="text-gray-400 mr-0.5">•</span>Safer Highways
                </span>
              </div>
            </div>

            <div className="h-10 bg-gradient-to-b from-transparent via-gray-300/80 to-transparent  mr-2 max-[900px]:hidden" />
          </div>
        )}

        {showRest && (
          <>

            <div className="relative z-20 flex-1 h-full mt-3 shadow-[-10px_0_20px_rgba(0,0,0,0.08)] bg-white flex flex-col justify-center pl-2 pr-5 rounded-bl-[125px] rounded-br-[150px] rounded-tr-[450px] shadow-[-8px_0_18px_-2px_rgba(0,0,0,0.07)] [clip-path:polygon(0_0,calc(100%_-_250px)_0,100%_160%,0_100%)] max-[900px]:hidden">
              <h2 className="text-[#0F172A] w-full font-extrabold text-xl  tracking-tight leading-none max-[900px]:text-center max-[900px]:leading-snug max-[480px]:text-base">
                INFRARISK: AI-Based Remote Monitoring
              </h2>
              <div className="flex items-start gap-2 text-xs font-bold mt-2  max-[900px]:justify-center max-[900px]:flex-wrap max-[480px]:gap-1.5 max-[480px]:text-[10px]">
                <span className="text-gray-800 flex items-start gap-1.5">
                  <span className="text-gray-400 text-[10px]">•</span> Smart
                  Monitoring
                </span>
                <span className="text-gray-800 flex items-start gap-1.5">
                  <span className="text-gray-400 text-[10px]">•</span>{" "}
                  Predictive Insights
                </span>
                <span className="text-gray-800 flex items-start gap-1.5">
                  <span className="text-gray-400 text-[10px]">•</span> Safer
                  Highways
                </span>
              </div>
            </div>

            <div className="relative z-30 h-[50%] rounded-[16px] shadow-[-10px_0_20px_rgba(0,0,0,0.08)] bg-white bg-[#EEF4FA]  mx-3 my-3 px-5 py-5 -ml-20  flex items-center gap-6 shrink-0 max-[1024px]:px-8 max-[1024px]:gap-4 max-[900px]:w-[calc(100%-1rem)]! max-[900px]:min-w-0! max-[900px]:ml-0! max-[900px]:mr-0! max-[900px]:mt-0 max-[900px]:my-0 max-[900px]:h-auto max-[900px]:rounded-xl max-[900px]:justify-between max-[900px]:flex-nowrap max-[900px]:px-4 max-[900px]:py-3 max-[900px]:gap-2 max-[480px]:gap-1.5 max-[480px]:px-2">
              <div className="flex items-center gap-2.5 max-[900px]:gap-1.5 shrink-0">
                <span className="w-3.5 h-3.5 bg-[#22C55E] rounded-full inline-block animate-pulse shrink-0 max-[480px]:w-2.5 max-[480px]:h-2.5"></span>
                <div className="text-left whitespace-nowrap">
                  <div className="text-[10px] text-gray-700 font-bold tracking-tight leading-none max-[480px]:text-[9px]">
                    System Status
                  </div>
                  <div className="text-xs font-bold text-[#16A34A] mt-0.5 max-[480px]:text-[10px]">
                    Operational
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 max-[900px]:gap-1.5 p-1.5 max-[900px]:p-0 rounded-lg shrink-0">
                <Calendar className="w-5 h-5 text-[#0F172A] stroke-[2.2] shrink-0 max-[480px]:w-4 max-[480px]:h-4" />
                <div className="text-left whitespace-nowrap">
                  <div className="text-xs font-bold text-[#0F172A] leading-tight max-[480px]:text-[10px]">
                    {formatDateDisplay(selectedDate)}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold leading-tight max-[480px]:text-[9px]">
                    {currentTime}
                  </div>
                </div>
              </div>

              <div
                ref={userButtonRef}
                onClick={toggleUserMenu}
                className="flex items-center gap-2.5 max-[900px]:gap-1.5 cursor-pointer group hover:bg-black/5 p-1 max-[900px]:p-0 rounded-lg transition-colors shrink-0"
              >
                <div className="w-9 h-9 bg-[#0B172A] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md group-hover:scale-105 transition-transform shrink-0 max-[480px]:w-7 max-[480px]:h-7 max-[480px]:text-[10px]">
                  {initials}
                </div>
                <div className="text-left whitespace-nowrap">
                  <div className="text-xs font-bold text-[#0F172A] leading-tight max-[480px]:text-[10px]">
                    {displayName}
                  </div>

                  {/* <div className="text-[10px] text-gray-500 font-semibold leading-tight">
                    NHAI HQ
                  </div> */}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-700 ml-0.5 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {isUserMenuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150"
            style={{
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
            }}
          >
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-900">{displayName}</p>
              <p className="text-[10px] text-gray-500">{displayEmail}</p>
            </div>

            {/* NEW: Change Password menu item */}
            <div className="py-1">
              <button
                onClick={handleOpenChangePassword}
                className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
              >
                <KeyRound className="w-4 h-4 text-gray-500" />
                Change Password
              </button>
            </div>

            <div className="border-t border-gray-100 pt-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                Log Out
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* NEW: Change Password modal */}
      {isChangePasswordOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] p-4">
            <div className="relative">
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="absolute -top-3 -right-3 bg-white rounded-full shadow-md p-1.5 hover:bg-gray-50 z-10"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <ChangePasswordForm
                defaultUsername={user?.username || ""}
                onSuccess={() => {
                  // Close modal shortly after success message shows
                  setTimeout(() => setIsChangePasswordOpen(false), 1200);
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Header;