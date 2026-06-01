"use client";

export default function OfflinePagina() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Stalenballen Cup" className="w-20 h-20 object-contain" />
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
