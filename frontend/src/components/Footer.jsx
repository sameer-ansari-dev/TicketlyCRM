export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
          <img src="/favicon-32x32.png" alt="TicketlyCRM Favicon" className="w-4 h-4 rounded-xs object-contain" />
          <span>TicketlyCRM &copy; {new Date().getFullYear()} TicketlyCRM Technologies</span>
        </div>
        <p className="text-xs text-slate-500">
          Built with React &bull; Tailwind CSS &bull; FastAPI &bull; SQLite
        </p>
      </div>
    </footer>
  );
}