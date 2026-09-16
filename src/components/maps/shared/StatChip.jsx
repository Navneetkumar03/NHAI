// // Small stat chip used inside FlyoverDetailsPanel's summary grid.
// export default function StatChip({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5 bg-gray-50 rounded-lg px-2 py-1.5 min-w-0 border border-gray-100">
//       <span className="text-[9px] text-gray-400 uppercase tracking-wide truncate">
//         {label}
//       </span>
//       <span className="text-[13px] font-bold text-gray-800 truncate">
//         {value}
//       </span>
//     </div>
//   );
// }



export default function StatChip({ label, value, valueClassName = "truncate" }) {
  return (
    <div className="rounded-md bg-gray-50  py-1.5">
      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-[12px] font-bold text-gray-800 ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}