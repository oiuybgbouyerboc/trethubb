import React, { useState, useEffect } from 'react';

export default function App() {
  const [isTikTok, setIsTikTok] = useState(false);

  useEffect(() => {
    // DÉTECTION TIKTOK
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (ua.toLowerCase().indexOf('tiktok') > -1) {
      setIsTikTok(true);
    }
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

  // DESIGN ORIGINAL RESTAURÉ
  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center py-10 px-5 font-sans">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-5xl font-bold flex items-center gap-2 mb-2">
          Tret <span className="bg-[#FF8C00] text-black px-3 py-1 rounded-lg">Hub</span>
        </h1>
        <p className="text-gray-400 text-xs tracking-[0.2em] font-semibold uppercase">The Gold Standard in Skincare</p>
      </div>

      {/* 3 Features Cards */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
        <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
          <span className="text-[#FF8C00] text-2xl mb-2">🛡️</span>
          <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">100% Authentic<br/>Actives</span>
        </div>
        <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
          <span className="text-[#FF8C00] text-2xl mb-2">🔒</span>
          <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Secure Pay<br/>Via Vinted</span>
        </div>
        <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
          <span className="text-[#FF8C00] text-2xl mb-2">🚚</span>
          <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Fast Ship<br/>From France</span>
        </div>
      </div>

      {/* Description Safe SEO */}
      <div className="text-center max-w-sm mb-10">
        <p className="text-gray-400 text-sm">
          Specializing in premium skincare actives to <span className="text-white font-bold">ascend</span> and get a massive <span className="text-white font-bold">glow-up</span>.<br/>
          <span className="text-white font-medium mt-1 inline-block">Tretinoin, Azelaic Acid, and Tazarotene.</span>
        </p>
      </div>

      {/* How to Order Box */}
      <div className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl w-full max-w-md p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[#FF8C00] text-xl">📦</span>
          <h2 className="text-xl font-bold text-white">How to Order Safely</h2>
        </div>

        <div className="relative border-l border-zinc-700 ml-4 pl-8 space-y-8">
          
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-[45px] top-0 bg-[#FF8C00] text-black font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm ring-4 ring-[#1A1A1A]">1</div>
            <h3 className="text-white font-bold mb-1">Join the Telegram Channel</h3>
            <p className="text-gray-400 text-sm">Browse our full menu and prices (Tretinoin, Azelaic, etc).</p>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-[45px] top-0 bg-[#FF8C00] text-black font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm ring-4 ring-[#1A1A1A]">2</div>
            <h3 className="text-white font-bold mb-1">Message Us Your Order</h3>
            <p className="text-gray-400 text-sm">Tell us exactly what you need. We calculate the total.</p>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-[45px] top-0 bg-[#FF8C00] text-black font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm ring-4 ring-[#1A1A1A]">3</div>
            <h3 className="text-white font-bold mb-1">Secure Stealth Checkout</h3>
            <p className="text-gray-400 text-sm">We send you a custom Vinted link (like a t-shirt or book). You buy it, but we ship your skincare order 100% securely.</p>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-4 flex flex-col pb-10">
        
        <a
          href="https://t.me/TretHub"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#FF8C00] hover:bg-orange-600 text-black font-bold py-4 rounded-xl text-center text-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>✈️</span> Access Telegram (Buy Here)
        </a>

        <div className="grid grid-cols-2 gap-4">
          <a
            href="https://t.me/TretHubReviews"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1A1A1A] border border-zinc-800 hover:bg-zinc-800 text-gray-300 font-semibold py-3 px-2 rounded-xl text-center text-sm transition-colors"
          >
            ⭐ Client Reviews
          </a>
          <a
            href="https://drive.google.com/file/d/1D3twtdEgRI7sNdcnWexUd9nEspUw3ODj/view"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1A1A1A] border border-zinc-800 hover:bg-zinc-800 text-gray-300 font-semibold py-3 px-2 rounded-xl text-center text-sm transition-colors"
          >
            📄 Free Usage Guide
          </a>
        </div>
      </div>

    </div>
  );
}
