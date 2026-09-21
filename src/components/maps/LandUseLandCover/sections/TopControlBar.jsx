import { useLayoutEffect, useRef, useState } from "react";
import { DateRangeSelector } from "../controls/DateRangeSelector";
import { LayerSelector } from "../controls/LayerSelector";
import { Table } from "lucide-react";
import { YearSelect } from "../controls/YearSelect";
import { sendUserActivity } from "../../../../services/api/auth";

export function TopControlBar({
  availableDates,
  diffEndDate,
  diffStartDate,
  handleLayerChange,
  selectedLayer,
  setDiffEndDate,
  setDiffStartDate,
  setShowOverview,
  setShowSegmentTable,
  setYearLeft,
  setYearRight,
  showDifferenceUI,
  showLULC,
  showOverview,
  showSegmentTable,
  yearLeft,
  yearRight,
}) {
  // MOBILE: the date range row should start exactly under the Layer dropdown
  // (not under the "Layer:" label). The dropdown's real left position is
  // measured, so it stays correct whatever the label font/width is.
  const rowRef = useRef(null);
  const layerWrapRef = useRef(null);
  const [dateOffset, setDateOffset] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (window.innerWidth > 640) {
        setDateOffset(0); // desktop keeps its normal inline layout
        return;
      }
      const row = rowRef.current;
      const control = layerWrapRef.current?.querySelector(
        "select, button, [role='combobox'], [role='button']",
      );
      if (!row || !control) return;
      const offset =
        control.getBoundingClientRect().left - row.getBoundingClientRect().left;
      setDateOffset(Math.max(0, Math.round(offset)));
    };

    measure();
    const raf = requestAnimationFrame(measure); // again once fonts/layout settle
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [selectedLayer]);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 mb-2 px-3 py-2 rounded-lg relative z-[2000] max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-2 max-[640px]:px-2 max-[640px]:py-1.5"
      style={{
        background:
          "linear-gradient(135deg, #e0e7ff 0%, #dbeafe 50%, #ede9fe 100%)",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(99, 102, 241, 0.1)",
        border: "1px solid rgba(99, 102, 241, 0.1)",
      }}
    >
      {/*
        Mobile layout (<=640px):
        - Line 1: Layer selector + Linear + Overview, all on ONE row.
        - Line 2 (only in Difference mode): the date range, full width.
        How: the inner button wrapper uses `max-[640px]:contents`, so its
        children join this row's flex-wrap. The Layer wrapper has a 0 basis
        (it grows to fill what's left) so the three items always fit on the
        first line, and the date range has a 100% basis, which forces it
        onto the next line. Desktop is unchanged: Layer, date range,
        Linear, Overview in a single wrapping row.
      */}
      <div
        ref={rowRef}
        className="flex items-center gap-3 flex-wrap max-[640px]:gap-1.5 max-[640px]:w-full max-[640px]:justify-start"
      >
        <div
          ref={layerWrapRef}
          className="flex items-center gap-3 flex-wrap max-[640px]:gap-2 max-[640px]:flex-1 max-[640px]:min-w-0 max-[640px]:basis-0"
        >
          <LayerSelector
            selectedLayer={selectedLayer}
            onLayerChange={handleLayerChange}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap max-[640px]:contents">
          {showDifferenceUI && availableDates.length > 0 && (
            <div
              className="max-[640px]:order-last max-[640px]:basis-full max-[640px]:min-w-0 max-[640px]:flex max-[640px]:justify-start max-[640px]:*:m-0!"
              style={{ paddingLeft: dateOffset }}
            >
              <DateRangeSelector
                availableDates={availableDates}
                startDate={diffStartDate}
                endDate={diffEndDate}
                onStartDateChange={setDiffStartDate}
                onEndDateChange={setDiffEndDate}
              />
            </div>
          )}

          <button
            onClick={() => {
              const willOpen = !showSegmentTable;

              setShowSegmentTable(willOpen);
              setShowOverview(false);

              if (willOpen) {
                sendUserActivity("Liner-Button", "InfraRisk");
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 border max-[640px]:flex-none max-[640px]:gap-1 max-[640px]:px-2 max-[640px]:text-[11px] ${showSegmentTable
              ? "bg-purple-100 text-purple-800 border-purple-300 shadow-sm"
              : "bg-white/80 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
          >
            <Table size={14} className="max-[640px]:w-3 max-[640px]:h-3" />
            Linear
          </button>

          <button
            onClick={() => {
              sendUserActivity(" Overview-Button", "InfraRisk");

              setShowOverview((prev) => !prev);
              setShowSegmentTable(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 border max-[640px]:flex-none max-[640px]:px-2 max-[640px]:text-[11px] ${showOverview
              ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
              : "bg-white/80 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
          >
            Overview
          </button>
        </div>
      </div>

      {showLULC && (
        <div className="flex items-center gap-4 max-[640px]:w-full max-[640px]:flex-wrap max-[640px]:gap-2">
          <span className="text-sm font-medium text-gray-700 tracking-wide max-[480px]:text-xs max-[480px]:w-full">
            Land Cover Comparison
          </span>
          <YearSelect
            label="Left"
            value={yearLeft}
            onChange={setYearLeft}
            disabledYears={[yearRight]}
          />
          <YearSelect
            label="Right"
            value={yearRight}
            onChange={setYearRight}
            disabledYears={[yearLeft]}
          />
        </div>
      )}
    </div>
  );
}