import { useEffect, useState } from "react";
import LandUseLandCover from "./LandUseLandCover/LandUseLandCover";

export default function Topography({ className = "" }) {
  const [isMobile, setIsMobile] = useState(
    () => !window.matchMedia("(min-width: 768px)").matches,
  );

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

  return (
    <div className={`flex flex-col h-full w-full ${className}`}>
      <div
        className="flex-1 min-h-0 relative"
        style={{
          height: isMobile ? "calc(100vh - 200px)" : "100%",
          minHeight: isMobile ? "400px" : "auto",
        }}
      >
        <LandUseLandCover isActive={true} />
      </div>
    </div>
  );
}