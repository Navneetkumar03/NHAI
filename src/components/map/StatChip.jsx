export default function StatChip({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-1 py-1 h-full">
      <p className="text-[8px] font-bold uppercase tracking-tight text-gray-400 leading-snug break-words">
        {label}
      </p>
      <p className="text-[13px] font-bold text-gray-800 leading-tight mt-0.5 break-words">
        {value}
      </p>
    </div>
  );
}