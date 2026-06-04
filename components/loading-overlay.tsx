"use client";

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-2.5 justify-center items-center">
          <div className="w-3.5 h-3.5 bg-zinc-100 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-3.5 h-3.5 bg-zinc-100 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-3.5 h-3.5 bg-zinc-100 rounded-full animate-bounce" />
        </div>
        <p className="text-zinc-400 text-xs font-semibold tracking-widest uppercase animate-pulse select-none">
          Loading
        </p>
      </div>
    </div>
  );
}
