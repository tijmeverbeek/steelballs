export default function OfflinePagina() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
          <span className="text-black font-black text-2xl tracking-tight">SB</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Geen verbinding</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Je bent offline. Verbind met internet en probeer het opnieuw.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
