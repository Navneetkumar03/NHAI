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
  yearRight
}) {
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
      <div className="flex items-center gap-3 flex-wrap max-[640px]:gap-2 max-[640px]:w-full max-[640px]:justify-between">
        <div className="flex items-center gap-3 flex-wrap max-[640px]:gap-2">
          <LayerSelector
            selectedLayer={selectedLayer}
            onLayerChange={handleLayerChange}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap max-[640px]:gap-2">
          {showDifferenceUI && availableDates.length > 0 && (
            <DateRangeSelector
              availableDates={availableDates}
              startDate={diffStartDate}
              endDate={diffEndDate}
              onStartDateChange={setDiffStartDate}
              onEndDateChange={setDiffEndDate}
            />
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 border ${showSegmentTable
              ? "bg-purple-100 text-purple-800 border-purple-300 shadow-sm"
              : "bg-white/80 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
          >
            <Table size={14} />
            Linear
          </button>

          <button
            onClick={() => {
              sendUserActivity(" Overview-Button", "InfraRisk");

              setShowOverview((prev) => !prev);
              setShowSegmentTable(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 border ${showOverview
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
