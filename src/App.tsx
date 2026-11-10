import React, { useState, useEffect } from 'react';

export default function App() {
  const [isTikTok, setIsTikTok] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);

  // Liste de tes images placées dans le dossier /public
  const bgImages = [
    '/bg1.jpg',
    '/bg2.jpg',
    '/bg3.jpg'
  ];

  useEffect(() => {
    // 1. DÉTECTION DU NAVIGATEUR TIKTOK
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (ua.toLowerCase().indexOf('tiktok') > -1) {
      setIsTikTok(true);
    }

    // 2. SLIDER D'IMAGES DE FOND (Change toutes les 4 secondes)
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ÉCRAN DE BLOCAGE TIKTOK
  if (isTikTok) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-sm">
          <h1 className="text-2xl font-bold mb-4 text-orange-500">Action Required 🚨</h1>
          <p className="mb-6 text-gray-300">You are currently viewing this on TikTok's internal browser.</p>
          <p className="mb-6 font-medium">To safely purchase and avoid link bugs, please tap the three dots <span className="bg-zinc-700 px-2 py-1 rounded">(•••)</span> in the top right corner and select <br/><br/><strong className="text-white bg-orange-600 px-2 py-1 rounded">"Open in external browser"</strong></p>
          <div className="animate-bounce text-4xl mt-4">↗️</div>
        </div>
      </div>
    );
  }

  // INTERFACE PRINCIPALE DU SITE
  return (
    <div className="relative min-h-screen text-white flex flex-col items-center py-12 px-4 overflow-hidden">
      
      {/* Fond d'écran qui défile avec un filtre sombre pour que le texte reste lisible */}
      <div
        className="fixed inset-0 z-[-1] transition-all duration-1000 ease-in-out bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImages[currentBg]})`,
          filter: 'brightness(0.25)' // Assombrit l'image
        }}
      />

      {/* En-tête / Logo */}
      <div className="mb-10 text-center mt-8">
        <h1 className="text-5xl font-extrabold bg-black px-5 py-2 rounded-xl inline-block border-2 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]">
          Tret <span className="text-orange-500">Hub</span>
        </h1>
        <p className="mt-4 text-sm tracking-widest uppercase text-gray-400 font-semibold">The Gold Standard in Skincare</p>
      </div>

      {/* Nouveau Copywriting "Glow Up / Ascend" */}
      <div className="max-w-md text-center mb-10 px-4 bg-black/40 p-6 rounded-2xl backdrop-blur-sm border border-zinc-800">
        <p className="text-xl font-medium mb-3">
          The ultimate cheat code to <span className="font-bold text-orange-400">ascend</span>.
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          Specializing in authentic <strong>Tretinoin</strong> and <strong>Azelaic Acid</strong> for a massive glow-up and flawless glass skin.
        </p>
      </div>

      {/* Boutons d'action avec tes liens exacts */}
      <div className="w-full max-w-sm space-y-4 flex flex-col">
        
        {/* Lien principal Telegram */}
        <a
          href="https://t.me/TretHub"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-5 rounded-xl text-center transition-all flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105"
        >
          <span className="text-lg">✈️ Access Telegram (Buy Here)</span>
        </a>

        {/* Liens secondaires (Reviews & PDF) */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <a
            href="https://t.me/TretHubReviews"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-zinc-900/80 backdrop-blur-md hover:bg-zinc-800 border border-zinc-700 text-gray-200 font-semibold py-4 px-2 rounded-xl text-center text-sm transition-all shadow-md"
          >
            ⭐ Client Reviews
          </a>
          <a
            href="https://drive.google.com/file/d/1D3twtdEgRI7sNdcnWexUd9nEspUw3ODj/view"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-zinc-900/80 backdrop-blur-md hover:bg-zinc-800 border border-zinc-700 text-gray-200 font-semibold py-4 px-2 rounded-xl text-center text-sm transition-all shadow-md"
          >
            📄 Free Usage Guide
          </a>
        </div>
      </div>

    </div>
  );
}
