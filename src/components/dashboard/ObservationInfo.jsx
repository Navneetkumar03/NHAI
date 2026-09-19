// components/ObservationInfo.jsx


export default function ObservationInfo({ startDate, endDate, count }) {

    return (
        <div className="flex flex-wrap  gap-x-4 gap-y-1 bg-white border border-gray-100 rounded-xl2 shadow-card px-4 py-2 mt-1 shrink-0">
            <p className="text-[10px]  sm:text-xs font-bold">
                Observation Period: <span className="font-medium">{startDate} to {endDate}</span>
            </p>
            <p className="text-[10px] sm:text-xs  font-bold">
                Observations: <span className="font-medium">{count} (as on date) </span>
            </p>
        </div>
    );
}