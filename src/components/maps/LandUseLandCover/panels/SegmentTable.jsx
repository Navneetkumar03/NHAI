import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { getRiskColor } from "../constants";

export function SegmentTable({ data, onRowClick, selectedId, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="ml-2 text-xs text-gray-500">Loading segments...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-gray-500">
        No segment data available
      </div>
    );
  }

  const displayData = [...data].sort((a, b) => a.id - b.id);

  return (
    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="px-2 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200">
              ID
            </th>
            <th className="px-2 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200">
              Name
            </th>
            <th className="px-2 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200">
              Risk
            </th>
            <th className="px-2 py-1.5 text-right font-semibold text-gray-700 border-b border-gray-200">
              Velocity (mm/yr)
            </th>
            <th className="px-2 py-1.5 text-right font-semibold text-gray-700 border-b border-gray-200">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick(item.id)}
              className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === item.id ? "bg-blue-100" : ""
                } ${item.avg_velocity === null ? "opacity-50" : ""}`}
            >
              <td className="px-2 py-1.5 border-b border-gray-100">
                {item.id}
              </td>
              <td className="px-2 py-1.5 border-b border-gray-100 font-medium">
                {item.name}
              </td>
              <td
                className="px-2 py-1.5 border-b border-gray-100 font-medium"
                style={{
                  backgroundColor: getRiskColor(item.risk),
                }}
              >
                <span className="inline-flex items-center justify-center w-8 h-4 font-bold text-[10px]  font-semibold text-black">
                  {item.risk ?? "N/A"}
                </span>
              </td>
              <td className="px-2 py-1.5 border-b border-gray-100 text-right">
                {item.avg_velocity !== null ? (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      color: "black",
                      fontWeight: "bold",
                    }}
                  >
                    {item.avg_velocity.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </td>
              <td className="px-2 py-1.5 border-b border-gray-100 text-right">
                {item.point_count || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
