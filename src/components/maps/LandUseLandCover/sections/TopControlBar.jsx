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
  return (
    <div
      className="flex flex-wrap items-center justify-start gap-3 mb-2 px-3 py-2 rounded-lg relative z-[2000] max-[640px]:gap-1.5 max-[640px]:px-2 max-[640px]:py-1.5"
      style={{
        background:
          "linear-gradient(135deg, #e0e7ff 0%, #dbeafe 50%, #ede9fe 100%)",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(99, 102, 241, 0.1)",
        border: "1px solid rgba(99, 102, 241, 0.1)",
      }}
    >
      <div className="flex items-center gap-3 flex-wrap max-[640px]:gap-1.5 max-[640px]:order-1 max-[640px]:flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap max-[640px]:gap-1.5">
          <LayerSelector
            selectedLayer={selectedLayer}
            onLayerChange={handleLayerChange}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap max-[640px]:gap-1.5">
          <button
            onClick={() => {
              const willOpen = !showSegmentTable;

              setShowSegmentTable(willOpen);
              setShowOverview(false);

              if (willOpen) {
                sendUserActivity("Liner-Button", "InfraRisk");
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 border whitespace-nowrap max-[640px]:px-1.5 max-[640px]:py-1 max-[640px]:gap-1 max-[480px]:text-[10px] max-[480px]:px-1 ${
              showSegmentTable
                ? "bg-purple-100 text-purple-800 border-purple-300 shadow-sm"
                : "bg-white/80 text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <Table
              size={14}
              className="max-[640px]:w-3 max-[640px]:h-3 flex-shrink-0"
            />
            <span>Linear</span>
          </button>

          <button
            onClick={() => {
              sendUserActivity(" Overview-Button", "InfraRisk");

              setShowOverview((prev) => !prev);
              setShowSegmentTable(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 border whitespace-nowrap max-[640px]:px-1.5 max-[640px]:py-1 max-[480px]:text-[10px] max-[480px]:px-1 ${
              showOverview
                ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                : "bg-white/80 text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span>Overview</span>
          </button>
        </div>
      </div>
      {showDifferenceUI && availableDates.length > 0 && (
        <div className="flex items-center max-[640px]:order-3 max-[640px]:w-full max-[640px]:ml-11 max-[480px]:ml-9">
          <DateRangeSelector
            availableDates={availableDates}
            startDate={diffStartDate}
            endDate={diffEndDate}
            onStartDateChange={setDiffStartDate}
            onEndDateChange={setDiffEndDate}
          />
        </div>
      )}

      {showLULC && (
        <div className="flex items-center gap-4 max-[640px]:w-full max-[640px]:flex-wrap max-[640px]:gap-2 max-[640px]:order-4">
          <span className="font-bold text-black text-md tracking-wide max-[480px]:text-xs max-[480px]:w-full">
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
