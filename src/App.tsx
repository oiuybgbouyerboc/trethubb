import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  Copy,
  Check,
  ChevronDown,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

import Carousel from './components/Carousel';

export default function App() {
  const [isTikTok, setIsTikTok] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(3);
  const [selectedReviewImg, setSelectedReviewImg] = useState<string | null>(null);
  const reviewsCarouselRef = useRef<HTMLDivElement | null>(null);
  const isReviewsPausedRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  // Produits et tarifs du bloc Live Menu & Prices
  const menuItems = [
    {
      name: 'Tretinoin',
      strengths: '0.025% / 0.05% / 0.1%',
      price: '€13.00 to €15.00',
      status: '0.05% IN STOCK' as const,
    },
    {
      name: 'Tazarotene',
      strengths: '0.1%',
      price: '€20.00',
      status: 'IN STOCK' as const,
    },
    {
      name: 'Azelaic Acid',
      strengths: '20%',
      price: '€16.00',
      status: 'IN STOCK' as const,
    },
    {
      name: 'Azelaic Acid',
      strengths: '10%',
      price: '€14.00',
      status: 'PRE-ORDER' as const,
    },
    {
      name: 'Hydroquinone',
      strengths: '4%',
      price: '€16.00',
      status: 'PRE-ORDER' as const,
    },
  ];

  // Avis clients vérifiés (carrousel horizontal en boucle)
  const verifiedReviews = [
    {
      quote: 'Perfect — Delivered in 3 days to France',
      author: 'Neil • Verified Buyer',
      tag: 'Tretinoin 0.05%',
      image: '/review2.jpg',
    },
    {
      quote: 'Exactly as expected! Already noticing a difference after 2 weeks — highly recommend',
      author: 'Loan • Verified Buyer',
      tag: '3-Tube Bundle',
      image: '/review4.jpg',
    },
    {
      quote: 'Got it boss, just rated 5 stars on Vinted!',
      author: 'GhostRdyIt • Verified Buyer',
      tag: 'Tazarotene 0.1%',
      image: '/review3.jpg',
    },
    {
      quote: 'Best combo Tret 0.05% + Azelaic 20%',
      author: 'Taha • Verified Buyer',
      tag: 'Combo Pack',
      image: '/review1.jpg',
    },
  ];

  // Questions / réponses de la FAQ
  const faqItems = [
    {
      question: 'How does the Vinted checkout work? Is it safe?',
      answer: "Message us your order on Telegram and we send you a private disguised Vinted link (like a t-shirt or book). You pay safely through Vinted's buyer protection, and we ship your sealed skincare order within 24h. Never mention skincare or product names on Vinted.",
    },
    {
      question: 'Where do you ship from and how fast is delivery?',
      answer: 'All in-stock orders ship within 24 hours from France with a tracking number. Delivery across the European Union usually takes 3 to 5 business days.',
    },
    {
      question: 'How do I know the products are authentic?',
      answer: "All tubes are sourced from licensed Indian pharmacies, factory-sealed in their original box with long expiration dates. You can check real customer unboxings and delivery proofs via the 'Client Reviews & Trust' button below.",
    },
    {
      question: 'Which concentration should I start with?',
      answer: 'Beginners should start with 0.025% Tretinoin (2–3 nights per week) to let the skin adapt. Higher strengths (0.05%, 0.1%, or Tazarotene 0.1%) are for experienced users. Azelaic Acid (10% or 20%) can be paired to fade marks and redness. Check our Free PDF Usage Guide for the full protocol.',
    },
  ];

  // Envoie une étape du tunnel dans Vercel Analytics (apparaît dans Top Pages / requestPath)
  const trackFunnelStep = (stepPath: string, restorePath = '/') => {
    try {
      window.history.pushState(null, '', stepPath);
      window.setTimeout(() => {
        window.history.replaceState(null, '', restorePath);
      }, 100);
    } catch {
      // Ignore si bloqué par le navigateur
    }
  };

  // Lien Telegram traqué dédié au site (compte exactement les abonnés qui rejoignent depuis trethub.shop)
  const telegramChannelUrl = 'https://t.me/+5ee4_fBg_N1hODk0';

  // Copie "@TretHub" dans le presse-papiers (avec solution de secours pour les navigateurs intégrés comme TikTok)
  const copyTelegramHandle = async () => {
    trackFunnelStep('/funnel/4-copy-handle');
    const handle = '@TretHub';
    try {
      await navigator.clipboard.writeText(handle);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = handle;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Tes images locales dans le dossier public/
  const bgImages = [
    "/bg1.jpg",
    "/bg2.jpg?v=3",
    "/bg3.jpg"
  ];

  useEffect(() => {
    // Détection du navigateur interne TikTok
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isTikTokBrowser = /TikTok|BytedanceWebview|musical_ly/i.test(ua);
    const params = new URLSearchParams(window.location.search);
    const cameFromTikTokBrowser = params.get('tt') === '1';
    
    if (isTikTokBrowser) {
      setIsTikTok(true);
      // On garde ?tt=1 dans l'URL du navigateur TikTok : quand l'utilisateur tape ••• -> "Open in browser",
      // Safari/Chrome ouvre exactement cette URL avec ?tt=1, ce qui prouve à 100% la conversion TikTok -> Browser !
      try {
        window.history.replaceState(null, '', '/?tt=1');
      } catch {
        // Ignore
      }
    }

    // Enregistre dans Vercel Analytics si la session est sur TikTok Browser, passée de TikTok vers Browser, ou directe
    const funnelTimer = window.setTimeout(() => {
      if (isTikTokBrowser) {
        trackFunnelStep('/funnel/1-tiktok-browser', '/?tt=1');
      } else if (cameFromTikTokBrowser) {
        trackFunnelStep('/funnel/2a-tiktok-to-browser', '/');
      } else {
        trackFunnelStep('/funnel/2-external-browser', '/');
      }
    }, 600);

    // Carrousel d'images de fond
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }, 5000); // Change l'image toutes les 5 secondes

    // Défilement automatique fluide en boucle pour le carrousel d'avis
    let animationFrameId: number;
    let pixelAccumulator = 0;

    const stepReviewsScroll = () => {
      const el = reviewsCarouselRef.current;
      if (el && !isReviewsPausedRef.current) {
        pixelAccumulator += 0.55;
        if (pixelAccumulator >= 1) {
          const step = Math.floor(pixelAccumulator);
          pixelAccumulator -= step;
          el.scrollLeft += step;
          const halfWidth = el.scrollWidth / 2;
          if (halfWidth > 0 && el.scrollLeft >= halfWidth) {
            el.scrollLeft -= halfWidth;
          }
        }
      }
      animationFrameId = requestAnimationFrame(stepReviewsScroll);
    };

    animationFrameId = requestAnimationFrame(stepReviewsScroll);

    return () => {
      window.clearTimeout(funnelTimer);
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  const pauseReviewsAutoScroll = () => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    isReviewsPausedRef.current = true;
  };

  const resumeReviewsAutoScroll = (delayMs = 1200) => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = window.setTimeout(() => {
      isReviewsPausedRef.current = false;
    }, delayMs);
  };

  const handleReviewsInfiniteScroll = () => {
    const el = reviewsCarouselRef.current;
    if (!el) return;
    const halfWidth = el.scrollWidth / 2;
    if (halfWidth > 0 && el.scrollLeft >= halfWidth) {
      el.scrollLeft -= halfWidth;
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans relative overflow-x-hidden flex flex-col items-center selection:bg-[#FF9000] selection:text-black">
      
      {/* Dynamic Background Slider */}
      <div className="fixed inset-0 z-0">
        {bgImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={img} alt="" aria-hidden="true" className="w-full h-full object-cover" />
          </div>
        ))}
        {/* Filtre sombre pour garantir la lisibilité du texte */}
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"></div>
      </div>

      {/* Bannière TikTok grand format (x2) — en haut de la page, pousse le contenu vers le bas */}
      {isTikTok && (
        <div className="w-full relative z-20 bg-[#FF9000] text-black shadow-[0_12px_50px_rgba(255,144,0,0.55)] border-b-4 border-black/20">
          <div className="max-w-xl mx-auto flex items-start justify-between gap-4 px-6 py-6 sm:py-8">
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2.5 text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none">
                <AlertTriangle className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 animate-pulse" strokeWidth={2.75} />
                You are on TikTok
              </p>
              <p className="mt-2 text-base sm:text-xl font-bold leading-snug">
                Links may not work here.
              </p>
              <div className="mt-4 inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-black text-white text-lg sm:text-2xl font-extrabold px-5 py-3.5 rounded-2xl shadow-xl">
                <span>Tap</span>
                <span className="text-[#FF9000] text-2xl sm:text-3xl leading-none tracking-widest">•••</span>
                <span>→</span>
                <span className="text-[#FF9000]">"Open in browser"</span>
              </div>
            </div>
            <ArrowUpRight className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 self-start animate-bounce" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Main Content (Glassmorphism au-dessus du fond) */}
      <main className="w-full max-w-xl relative z-10 flex flex-col pt-10 pb-24 px-4 sm:px-6">
        
        {/* Logo + Sous-titre + Badge de statut en direct */}
        <div className="flex flex-col items-center justify-center mb-7">
          <div className="flex items-center justify-center text-5xl font-extrabold tracking-tight select-none shadow-black drop-shadow-2xl">
            <span className="text-white">Tret</span>
            <span className="ml-1.5 bg-[#FF9000] text-black px-3 py-0.5 rounded-xl">Hub</span>
          </div>
          <p className="text-neutral-300 font-medium text-sm mt-3.5 tracking-[0.2em] uppercase text-center drop-shadow-md">
            The Gold Standard in Skincare
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-neutral-900/90 border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-neutral-200 tracking-wide">
              Stock Live • Fast EU Dispatch (24h)
            </span>
          </div>
        </div>

        {/* Trust Indicators */}
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


        {/* Description */}
        <div className="mb-6 text-center px-4">
          <p className="text-sm text-neutral-400 font-light leading-relaxed">
            Discover our selection of <strong className="text-white">premium skincare actives</strong> — including <strong className="text-white">Tretinoin</strong> and <strong className="text-white">Azelaic Acid</strong> — to clear, refine and transform your skin. Authentic products, discreet shipping, real results.
          </p>
        </div>

        {/* CTA principal : Telegram */}
        <a
          href={telegramChannelUrl}
          onClick={() => trackFunnelStep('/funnel/3-click-telegram-top')}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative w-full flex items-center justify-center gap-3 bg-[#FF9000] hover:bg-[#ff9d21] text-black font-bold text-lg py-5 px-6 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(255,144,0,0.3)] hover:shadow-[0_0_40px_rgba(255,144,0,0.5)] hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          <Send className="w-6 h-6" />
          Access Telegram (Buy Here)
        </a>

        {/* Petit bouton : copier le @ Telegram pour le rechercher manuellement (2e moyen d'accès) */}
        <div className="mt-2.5 mb-8 flex items-center justify-center gap-2">
          <span className="text-sm text-neutral-400 font-medium">or</span>
          <button
            type="button"
            onClick={copyTelegramHandle}
            className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF9000]/60 px-4 py-2 rounded-xl transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span>Copied! Search it on Telegram</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#FF9000]" />
                <span>Copy <strong className="text-white">@TretHub</strong> to search on Telegram</span>
              </>
            )}
          </button>
        </div>

        {/* Bloc compact : Live Menu & Prices */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF9000]" />
              Live Menu & Prices
            </h2>
          </div>

          <div className="divide-y divide-white/10">
            {menuItems.map((item, idx) => {
              const isInStock = item.status.includes('IN STOCK');
              return (
                <div key={idx} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-white font-semibold text-sm">{item.name}</span>
                    <span className="text-neutral-400 text-xs ml-1.5">({item.strengths})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#FF9000] font-bold text-sm">{item.price}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isInStock
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-[#FF9000] bg-[#FF9000]/10 border-[#FF9000]/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 text-center">
            <p className="text-xs text-neutral-300 font-medium">
              Bundle discounts available on 3+ tubes • Single shipping fee
            </p>
          </div>
        </div>

        {/* Section Preuve Sociale Visuelle : Verified EU Deliveries (remontée juste après le menu) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#FF9000]" />
              Verified EU Deliveries
            </h2>
            <span className="text-xs text-neutral-400">Swipe →</span>
          </div>

          <div
            ref={reviewsCarouselRef}
            onScroll={handleReviewsInfiniteScroll}
            onTouchStart={pauseReviewsAutoScroll}
            onTouchEnd={() => resumeReviewsAutoScroll(1500)}
            onMouseEnter={pauseReviewsAutoScroll}
            onMouseLeave={() => resumeReviewsAutoScroll(400)}
            className="flex gap-3.5 overflow-x-auto pb-2 -mx-1 px-1 select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[...verifiedReviews, ...verifiedReviews].map((rev, idx) => (
              <div
                key={idx}
                className="w-[270px] shrink-0 overflow-hidden bg-neutral-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-xl"
              >
                <div className="w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedReviewImg(rev.image)}
                    className="relative w-full h-36 rounded-xl overflow-hidden mb-3 border border-white/10 group block"
                  >
                    <img
                      src={rev.image}
                      alt={rev.quote}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/15">
                      Tap to zoom
                    </span>
                  </button>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-0.5 text-[#FF9000] shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#FF9000] text-[#FF9000]" />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-[#FF9000] bg-[#FF9000]/10 px-2 py-0.5 rounded-full truncate">
                      {rev.tag}
                    </span>
                  </div>
                  <p className="w-full text-white text-xs font-medium leading-relaxed whitespace-normal break-words">
                    "{rev.quote}"
                  </p>
                </div>
                <p className="text-[11px] text-neutral-400 mt-2.5 pt-2 border-t border-white/10 truncate">
                  {rev.author}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Menu explicatif : How to Order Safely */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
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

        {/* FAQ accordéon (un seul élément ouvert à la fois) */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FF9000]" />
            FAQ
          </h2>

          <div className="divide-y divide-white/10">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-[#FF9000]' : 'text-white'}`}>
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-[#FF9000] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs text-neutral-400 leading-relaxed pb-4">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloc d'action final en bas de page */}
        <div className="flex flex-col gap-3">
          {/* Second bouton principal d'achat Telegram */}
          <a
            href={telegramChannelUrl}
            onClick={() => trackFunnelStep('/funnel/3-click-telegram-bottom')}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full flex items-center justify-center gap-3 bg-[#FF9000] hover:bg-[#ff9d21] text-black font-bold text-lg py-5 px-6 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(255,144,0,0.3)] hover:shadow-[0_0_40px_rgba(255,144,0,0.5)] hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <Send className="w-6 h-6" />
            Access Telegram (Buy Here)
          </a>

          {/* Option "or Copy @TretHub" en bas de page */}
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-sm text-neutral-400 font-medium">or</span>
            <button
              type="button"
              onClick={copyTelegramHandle}
              className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF9000]/60 px-4 py-2 rounded-xl transition-all duration-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Copied! Search it on Telegram</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#FF9000]" />
                  <span>Copy <strong className="text-white">@TretHub</strong> to search on Telegram</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://t.me/TretHubReviews"
              onClick={() => trackFunnelStep('/funnel/5-click-reviews')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center sm:justify-start gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#FF9000]/50 text-white font-medium py-4 px-5 rounded-2xl transition-all duration-300"
            >
              <Star className="w-5 h-5 text-[#FF9000] shrink-0" />
              <span className="text-sm">Client Reviews & Trust (@trethubreviews)</span>
            </a>
            
            <a
              href="https://drive.google.com/file/d/1D3twtdEgRI7sNdcnWexUd9nEspUw3ODj/view"
              onClick={() => trackFunnelStep('/funnel/6-click-pdf-guide')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center sm:justify-start gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 text-white font-medium py-4 px-5 rounded-2xl transition-all duration-300"
            >
              <FileText className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm">Free PDF Usage Guide</span>
            </a>
          </div>

          {/* Bouton TikTok déplacé tout en bas pour éviter la fuite de trafic dans le Hero */}
          <a
            href="https://www.tiktok.com/@tret.hub"
            onClick={() => trackFunnelStep('/funnel/7-click-tiktok')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-black/40 hover:bg-[#FF9000]/10 backdrop-blur-md border border-white/10 hover:border-[#FF9000] text-neutral-300 hover:text-white font-medium text-sm py-3.5 px-6 rounded-2xl transition-all duration-300"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#FF9000]" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
            Follow on TikTok (@tret.hub)
          </a>
        </div>
      </main>

      {/* Modale de zoom sur une preuve de livraison */}
      {selectedReviewImg && (
        <div
          onClick={() => setSelectedReviewImg(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full"
          >
            {/* Croix en haut à droite avec la DA noir/orange du site */}
            <button
              type="button"
              onClick={() => setSelectedReviewImg(null)}
              aria-label="Close preview"
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-neutral-950/90 hover:bg-[#FF9000] text-[#FF9000] hover:text-black border border-[#FF9000]/60 shadow-[0_0_20px_rgba(255,144,0,0.35)] flex items-center justify-center transition-all duration-200"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <img
              src={selectedReviewImg}
              alt="Verified review proof"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/20 shadow-2xl bg-neutral-950"
            />
            <button
              type="button"
              onClick={() => setSelectedReviewImg(null)}
              className="mt-3 w-full py-2.5 bg-[#FF9000] hover:bg-[#ff9d21] text-black font-bold text-sm rounded-xl transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Footer & Bouton de test */}
      <footer className="mt-auto pb-6 text-center relative z-10 flex flex-col items-center">
        <p className="text-neutral-500 text-xs tracking-wider uppercase mb-6">
          © {new Date().getFullYear()} Tret Hub. All rights reserved.
        </p>
        
        {/* Bouton de test TEMPORAIRE — flottant en bas à droite, visible uniquement en local (npm run dev), jamais sur le site en ligne */}
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => {
              const next = !isTikTok;
              setIsTikTok(next);
              if (next) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="fixed bottom-4 right-4 z-50 text-xs font-semibold text-white bg-neutral-900/95 border border-dashed border-[#FF9000] hover:bg-[#FF9000] hover:text-black px-3.5 py-2 rounded-xl shadow-lg backdrop-blur-md transition-colors"
          >
            [TEST] {isTikTok ? 'Masquer' : 'Afficher'} la bannière TikTok
          </button>
        )}
      </footer>
      
    </div>
  );
}
