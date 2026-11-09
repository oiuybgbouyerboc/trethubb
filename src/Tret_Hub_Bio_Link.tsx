import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Star, 
  FileText, 
  ArrowUpRight, 
  AlertTriangle, 
  ShieldCheck,
  Truck,
  PackageCheck,
  Send,
  Lock
} from 'lucide-react';

export default function App() {
  const [isTikTok, setIsTikTok] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Background images (Placeholder URLs - you will replace these with your own photos later)
  const bgImages = [
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1080&auto=format&fit=crop", // Minimalist skincare
    "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1080&auto=format&fit=crop", // Cream textures
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1080&auto=format&fit=crop", // Clean medical vibe
    "https://images.unsplash.com/photo-1571781526291-c477ebef020d?q=80&w=1080&auto=format&fit=crop"  // Packaging
  ];

  useEffect(() => {
    // Detect TikTok internal browser
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (ua.toLowerCase().includes('tiktok')) {
      setIsTikTok(true);
    }

    // Background Slider Interval
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans relative overflow-x-hidden flex flex-col items-center selection:bg-[#FF9000] selection:text-black">
      
      {/* Dynamic Background Slider with Dark Overlay */}
      <div className="fixed inset-0 z-0">
        {bgImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={img} alt="Skincare background" className="w-full h-full object-cover" />
          </div>
        ))}
        {/* Very dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"></div>
      </div>

      {/* TikTok Warning Overlay (Highest z-index) */}
      {isTikTok && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center">
          <div className="absolute top-4 right-4 sm:right-6 animate-bounce text-[#FF9000] drop-shadow-[0_0_15px_rgba(255,144,0,0.8)]">
            <ArrowUpRight size={56} strokeWidth={2.5} />
          </div>
          
          <div className="pointer-events-auto mt-20 mx-4 max-w-md bg-black/80 border border-[#FF9000] rounded-2xl p-5 shadow-[0_0_40px_rgba(255,144,0,0.2)] backdrop-blur-xl animate-in fade-in slide-in-from-top-10 duration-500">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#FF9000]/10 rounded-full shrink-0 mt-0.5 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-[#FF9000]" />
              </div>
              <div>
                <h3 className="font-bold text-[#FF9000] text-sm mb-1.5 uppercase tracking-wider">Action Required</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  You are viewing this on TikTok. To safely purchase, please tap the <strong className="text-white">three dots (•••)</strong> in the top right corner and select <strong className="text-white">"Open in external browser"</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content (Glassmorphism layered above background) */}
      <main className="w-full max-w-xl relative z-10 flex flex-col pt-12 pb-24 px-4 sm:px-6">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center justify-center text-5xl font-extrabold tracking-tight select-none shadow-black drop-shadow-2xl">
            <span className="text-white">Tret</span>
            <span className="ml-1.5 bg-[#FF9000] text-black px-3 py-0.5 rounded-xl">Hub</span>
          </div>
          <p className="text-neutral-300 font-medium text-sm mt-4 tracking-[0.2em] uppercase text-center drop-shadow-md">
            The Gold Standard in Skincare
          </p>
        </div>

        {/* Trust Indicators (Crucial for conversion) */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="flex flex-col items-center justify-center p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-center">
            <ShieldCheck className="w-6 h-6 text-[#FF9000] mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-300">100% Authentic<br/>Actives</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-center">
            <Lock className="w-6 h-6 text-[#FF9000] mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-300">Secure Pay<br/>via Vinted</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-center">
            <Truck className="w-6 h-6 text-[#FF9000] mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-300">Fast Ship<br/>From France</span>
          </div>
        </div>

        {/* Available Products Tagline */}
        <div className="mb-8 text-center px-4">
          <p className="text-sm text-neutral-400 font-light leading-relaxed">
            Specializing in premium pharmaceutical-grade <span className="text-white font-medium">Tretinoin</span>, <span className="text-white font-medium">Azelaic Acid</span>, and <span className="text-white font-medium">Tazarotene</span>.
          </p>
        </div>

        {/* The Stealth Process Explanation - Builds Trust */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
          {/* Subtle accent glow inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF9000] rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none"></div>
          
          <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#FF9000]" />
            How to Order Safely
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#FF9000] text-black font-bold text-xs flex items-center justify-center z-10 shrink-0">1</div>
                <div className="w-0.5 h-full bg-white/10 my-1"></div>
              </div>
              <div className="pb-2">
                <h4 className="text-white text-sm font-semibold">Join the Telegram Channel</h4>
                <p className="text-neutral-400 text-xs mt-1 leading-relaxed">Browse our full menu and prices (Tretinoin, Azelaic, etc).</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#FF9000] text-black font-bold text-xs flex items-center justify-center z-10 shrink-0">2</div>
                <div className="w-0.5 h-full bg-white/10 my-1"></div>
              </div>
              <div className="pb-2">
                <h4 className="text-white text-sm font-semibold">Message Us Your Order</h4>
                <p className="text-neutral-400 text-xs mt-1 leading-relaxed">Tell us exactly what you need. We calculate the total.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#FF9000] text-black font-bold text-xs flex items-center justify-center z-10 shrink-0">3</div>
              </div>
              <div>
                <h4 className="text-white text-sm font-semibold">Secure Stealth Checkout</h4>
                <p className="text-neutral-400 text-xs mt-1 leading-relaxed">We send you a custom Vinted link (like a t-shirt or book). You buy it, but we ship your skincare order 100% securely.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col gap-4">
          
          {/* Primary CTA */}
          <a
            href="#"
            className="group relative w-full flex items-center justify-center gap-3 bg-[#FF9000] hover:bg-[#ff9d21] text-black font-bold text-lg py-5 px-6 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(255,144,0,0.3)] hover:shadow-[0_0_40px_rgba(255,144,0,0.5)] hover:-translate-y-1 overflow-hidden"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            
            <Send className="w-6 h-6" />
            Access Telegram (Buy Here)
          </a>

          {/* Secondary CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <a
              href="#"
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 text-white font-medium py-4 px-5 rounded-2xl transition-all duration-300"
            >
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm">Client Reviews & Trust</span>
            </a>
            
            <a
              href="#"
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 text-white font-medium py-4 px-5 rounded-2xl transition-all duration-300"
            >
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Free PDF Usage Guide</span>
            </a>
          </div>
        </div>

      </main>

      {/* Footer & TikTok Tester Toggle */}
      <footer className="mt-auto pb-6 text-center relative z-10 flex flex-col items-center">
        <p className="text-neutral-500 text-xs tracking-wider uppercase mb-6">
          © {new Date().getFullYear()} Tret Hub. All rights reserved.
        </p>
        
        {/* TikTok Tester Toggle - For you to test the banner */}
        <button 
          onClick={() => setIsTikTok(!isTikTok)}
          className="px-4 py-1.5 text-[10px] text-neutral-400 bg-white/5 backdrop-blur-sm border border-neutral-800 rounded-full hover:text-white hover:border-[#FF9000] transition-colors uppercase tracking-widest"
        >
          {isTikTok ? "Hide TikTok Overlay" : "Simulate TikTok Browser"}
        </button>
      </footer>
      
    </div>
  );
}