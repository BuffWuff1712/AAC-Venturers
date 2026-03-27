export function Card({ className = "", children }) {
  return (
    <div className={`rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-soft ${className}`}>
      {children}
    </div>
  );
}
