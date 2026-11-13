import React from 'react';
import { Send } from 'lucide-react';

export function RedirectPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold mb-3">Rejoindre le Canal TretHub</h1>
      <p className="text-gray-400 mb-6 max-w-sm text-sm">
        Pour accéder au catalogue et commander, clique sur le bouton ci-dessous pour ouvrir Telegram.
      </p>
      
      {/* Vrai lien HTML natif sans script louche */}
      <a 
        href="https://t.me/TretHub"
        className="w-full max-w-xs bg-[#0088cc] hover:bg-[#0077b5] text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
      >
        <Send className="w-6 h-6" />
        Ouvrir Telegram
      </a>
    </div>
  );

