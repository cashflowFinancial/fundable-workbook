import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Play, Pause, CheckSquare, Square, Printer, BookOpen, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// SUB-COMPONENT: AUDIO PROMPT
// ---------------------------------------------------------------------------
const AudioPrompt = ({ label = "Listen to guidance", isPlaying, onClick }) => (
  <button 
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`no-print flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${
      isPlaying 
      ? 'bg-[#1A2F23] text-[#C5A059] border-[#1A2F23] shadow-md' 
      : 'bg-white text-[#1A2F23] border-[#1A2F23]/30 hover:border-[#1A2F23] hover:bg-[#F5F2EA]'
    }`}
  >
    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
    <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
  </button>
);

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
const Workbook = () => {
  const [activePage, setActivePage] = useState(0);

  // -- STATE MANAGEMENT WITH AUTO-SAVE (LOCALSTORAGE) --
  
  // Initialize answers from local storage or empty object
  const [answers, setAnswers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workbook_answers');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Initialize scorecard from local storage or empty object
  const [scorecard, setScorecard] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workbook_scorecard');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Save changes to local storage whenever answers change
  useEffect(() => {
    localStorage.setItem('workbook_answers', JSON.stringify(answers));
  }, [answers]);

  // Save changes to local storage whenever scorecard changes
  useEffect(() => {
    localStorage.setItem('workbook_scorecard', JSON.stringify(scorecard));
  }, [scorecard]);

  
  // Audio State
  const audioRef = useRef(null);
  const [currentAudioKey, setCurrentAudioKey] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Print Mode State
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  // Colors
  const theme = {
    bg: '#F5F2EA',      // Cream
    text: '#1C1917',    // Near Black
    primary: '#1A2F23', // Hunter Green
    accent: '#C5A059',  // Gold
  };

  // -------------------------------------------------------------------------
  // AUDIO LOGIC
  // -------------------------------------------------------------------------
 const playAudio = async (audioKey) => {
  if (!audioKey) return;

  // Toggle if same track
  if (currentAudioKey === audioKey && audioRef.current) {
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().catch((e) => console.log("Audio play error:", e));
      setIsAudioPlaying(true);
    }
    return;
  }

  // Stop any currently playing audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }

  setCurrentAudioKey(audioKey);
  setIsAudioPlaying(false);

  const exts = ["mp3", "m4a"];
  let lastErr = null;

  for (const ext of exts) {
    try {
      const url = `/audio/${audioKey}.${ext}`;
      const a = new Audio(url);
      a.preload = "auto";

      a.addEventListener("ended", () => setIsAudioPlaying(false));
      a.addEventListener("pause", () => setIsAudioPlaying(false));
      a.addEventListener("play", () => setIsAudioPlaying(true));

      audioRef.current = a;
      a.currentTime = 0;

      await a.play();
      setIsAudioPlaying(true);
      return; // success
    } catch (e) {
      lastErr = e;
    }
  }

  console.log(`Audio not found for key: ${audioKey}. Tried .mp3 and .m4a`, lastErr);
  setIsAudioPlaying(false);
};
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // PRINT LOGIC
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Check URL query param ?print=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === '1') {
      setIsPrintMode(true);
      setAutoPrint(true); // Trigger print automatically if loaded via URL
    }
  }, []);

  // Trigger print dialog only when autoPrint is requested
  useEffect(() => {
    if (isPrintMode && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
        setAutoPrint(false); // Reset so it doesn't loop
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [isPrintMode, autoPrint]);

  // -------------------------------------------------------------------------
  // CONTENT DATA
  // -------------------------------------------------------------------------
  const pages = [
    {
      id: 'page-1',
      title: 'Cover',
      audioKey: 'cover-welcome',
      render: () => (
        <div className="flex flex-col items-center justify-center text-center h-full py-12">
          <div className="w-20 h-1 bg-[#C5A059] mb-8 no-print"></div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#1A2F23] tracking-tight leading-tight mb-4">
            Get Fundable Fast™
          </h1>
          <h2 className="text-2xl font-serif text-[#1C1917] font-light uppercase tracking-widest mb-12">
            The Cash Flow Reality Workbook
          </h2>
          <p className="text-lg text-[#1C1917]/80 max-w-md mx-auto font-sans leading-relaxed border-t border-[#1A2F23]/20 pt-8">
            A diagnostic guide for people who want money to move toward them instead of away.
          </p>
        </div>
      )
    },
    {
      id: 'page-2',
      title: 'How to Use This Workbook',
      audioKey: 'how-to-use',
      render: () => (
        <div className="space-y-6 max-w-xl mx-auto text-lg font-light leading-relaxed">
          <p>This is not a book to skim.</p>
          <p>This is not a worksheet to rush through.</p>
          <p className="font-medium text-[#1A2F23]">This workbook works only if you answer honestly.</p>
          <div className="py-2">
            <p>You do not need perfect numbers.</p>
            <p>You do not need accounting software.</p>
          </div>
          <p className="font-serif text-xl italic text-[#1A2F23]">You do need the courage to see what’s real.</p>
          <div className="bg-[#1A2F23] text-[#F5F2EA] p-8 mt-6 shadow-lg">
            <p className="mb-2">Set aside 30–45 uninterrupted minutes.</p>
            <p>Answer what you know. Leave blank what you don’t.</p>
            <p className="mt-4 font-bold text-[#C5A059]">What you see here is the starting point, not the verdict.</p>
          </div>
        </div>
      )
    },
    {
      id: 'page-3',
      title: 'The Cash Flow Truth',
      audioKey: 'cash-flow-truth',
      render: () => (
        <div className="flex flex-col justify-center h-full space-y-10">
          <div className="space-y-8">
            {["Money is not a reward.", "Money is not a personality test.", "Money is not proof of worth."].map((text, i) => (
              <p key={i} className="text-3xl font-serif text-[#1C1917] border-l-4 border-[#C5A059] pl-6 py-2">
                {text}
              </p>
            ))}
          </div>
          <p className="text-5xl font-serif font-bold text-[#1A2F23] mt-8">
            Money is movement.
          </p>
        </div>
      )
    },
    {
      id: 'page-4',
      title: 'The Cash Flow Truth (Prompts)',
      // No audio key specified for this page in requirements
      render: () => (
        <div className="space-y-12">
          {[
            { id: "q1", label: "Where does money come from for you right now?" },
            { id: "q2", label: "Where does money disappear without a plan?" },
            { id: "q3", label: "If you stopped working for 30 days, what would immediately break?" }
          ].map((prompt) => (
            <div key={prompt.id} className="break-inside-avoid">
              <label className="block text-xl font-serif text-[#1A2F23] mb-4">{prompt.label}</label>
              <textarea 
                className="w-full bg-white border-b-2 border-[#E7E5E0] focus:border-[#C5A059] p-4 text-lg outline-none transition-colors min-h-[100px] resize-none font-sans"
                placeholder={isPrintMode ? "" : "Write here..."}
                value={answers[prompt.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [prompt.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'page-5',
      title: 'Business or Idea? Decide.',
      audioKey: 'business-or-idea',
      render: () => (
        <div className="space-y-8 h-full flex flex-col">
          <h3 className="text-xl font-serif text-[#1A2F23] text-center mb-4">Choose what’s most true today:</h3>
          <div className="grid md:grid-cols-2 gap-8 flex-grow">
            <div className="bg-white p-8 border border-[#E7E5E0] flex flex-col">
              <h4 className="font-bold text-[#1A2F23] mb-4 text-lg border-b border-[#C5A059] pb-2">I already have a business.</h4>
              <textarea 
                className="flex-grow w-full bg-[#F5F2EA]/30 p-4 resize-none outline-none"
                placeholder={isPrintMode ? "" : "Describe it..."}
                value={answers['have_business'] || ''}
                onChange={(e) => setAnswers({ ...answers, 'have_business': e.target.value })}
              />
            </div>
            <div className="bg-white p-8 border border-[#E7E5E0] flex flex-col">
              <h4 className="font-bold text-[#1A2F23] mb-4 text-lg border-b border-[#C5A059] pb-2">I want to start a business.</h4>
              <textarea 
                className="flex-grow w-full bg-[#F5F2EA]/30 p-4 resize-none outline-none"
                placeholder={isPrintMode ? "" : "Describe it..."}
                value={answers['start_business'] || ''}
                onChange={(e) => setAnswers({ ...answers, 'start_business': e.target.value })}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'page-6',
      title: 'What You Think The Problem Is',
      // No audio key specified
      render: () => (
        <div className="max-w-xl mx-auto space-y-8">
          <div className="space-y-3">
            {["Not enough customers", "Pricing is too low", "Expenses are too high", "I'm bad at sales", "I don't have capital"].map((opt, i) => {
              const checked = answers[`problem_${i}`];
              return (
                <button 
                  type="button"
                  key={i} 
                  disabled={isPrintMode}
                  onClick={() => setAnswers({...answers, [`problem_${i}`]: !checked})}
                  className={`w-full text-left p-4 border transition-all flex items-center gap-4 ${checked ? 'bg-[#1A2F23] text-white border-[#1A2F23]' : 'bg-white border-[#E7E5E0] text-[#1C1917]'}`}
                >
                  {checked || isPrintMode ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  <span className="text-lg">{opt}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-8 border-t border-[#1A2F23]/10 break-inside-avoid">
            <p className="font-bold text-[#1A2F23] text-xl mb-4 font-serif">“If this one thing were fixed, my financial life would improve.”</p>
            <input 
              type="text" 
              className="w-full bg-transparent border-b-2 border-[#1A2F23] py-2 text-xl focus:outline-none focus:border-[#C5A059]"
              value={answers['problem_fix'] || ''}
              onChange={(e) => setAnswers({ ...answers, 'problem_fix': e.target.value })}
            />
          </div>
        </div>
      )
    },
    {
      id: 'page-7',
      title: 'Fundability Reality Check',
      audioKey: 'fundability-check',
      render: () => {
        const rows = [
          "I have a separate business bank account.",
          "I know my exact monthly burn rate.",
          "My personal/business finances are separate.",
          "I have a clear revenue model generating cash.",
          "I have financial records for the last 12 months.",
          "I pay myself a consistent salary.",
          "I have a plan for where next month's money comes from.",
          "I can access $5,000 in credit if needed."
        ];
        
        // Calculate Total Score
        const totalScore = rows.reduce((acc, _, idx) => acc + (scorecard[idx] || 0), 0);

        return (
          <div className="space-y-6">
            <div className="bg-white border border-[#E7E5E0]">
              <div className="grid grid-cols-12 bg-[#1A2F23] text-[#F5F2EA] p-3 text-sm uppercase tracking-widest font-bold">
                <div className="col-span-6 md:col-span-8">Statement</div>
                <div className="col-span-2 md:col-span-1 text-center">0</div>
                <div className="col-span-2 md:col-span-1 text-center">1</div>
                <div className="col-span-2 md:col-span-1 text-center">2</div>
              </div>
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 p-3 border-b border-[#E7E5E0] items-center hover:bg-[#F5F2EA] transition-colors break-inside-avoid">
                  <div className="col-span-6 md:col-span-8 font-serif pr-4">{row}</div>
                  {[0, 1, 2].map((val) => (
                    <div key={val} className="col-span-2 md:col-span-1 flex justify-center">
                       {isPrintMode ? (
                         <div className="w-5 h-5 border border-gray-400 rounded-full"></div>
                       ) : (
                         <button 
                           type="button"
                           onClick={() => setScorecard({...scorecard, [idx]: val})}
                           className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${scorecard[idx] === val ? 'bg-[#C5A059] border-[#C5A059] text-white' : 'border-[#1C1917]/20'}`}
                         >
                           {scorecard[idx] === val && <Check className="w-4 h-4" />}
                         </button>
                       )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="text-right text-2xl font-serif text-[#1A2F23] font-bold">
              Total Score: {totalScore} / 16
            </div>
            <p className="text-sm text-[#1C1917]/60 italic text-center">0 = Not in place, 1 = Somewhat, 2 = Fully in place</p>
          </div>
        )
      }
    },
    {
      id: 'page-8',
      title: 'What Your Score Means',
      audioKey: 'score-meaning',
      render: () => (
        <div className="grid gap-6 h-full items-center md:grid-cols-3">
          {[
            { range: "0–5", title: "Invisible to Capital", desc: "Lenders cannot see a structure to fund. High risk." },
            { range: "6–11", title: "Leaking Potential", desc: "Money comes in but lacks direction. Moderate risk." },
            { range: "12–16", title: "Fundable but Unprotected", desc: "Good flow, but vulnerable to shocks. Low risk, high opportunity." }
          ].map((card, i) => (
            <div key={i} className="bg-white p-8 border-t-4 border-[#1A2F23] shadow-sm flex flex-col text-center h-full justify-center break-inside-avoid">
              <span className="text-4xl font-bold text-[#C5A059] mb-2">{card.range}</span>
              <h3 className="font-serif text-2xl text-[#1A2F23] mb-4">{card.title}</h3>
              <p className="text-[#1C1917]/80">{card.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'page-9',
      title: 'Your Cash Flow Map',
      audioKey: 'cash-flow-map',
      render: () => (
        <div className="space-y-6 h-full flex flex-col">
          <div className="grid md:grid-cols-2 gap-4 flex-grow">
            {['Money In', 'Money Out'].map((label, i) => (
              <div key={i} className="bg-white p-6 border border-[#E7E5E0] flex flex-col">
                <h3 className="font-serif text-xl uppercase tracking-widest text-[#1A2F23] mb-4 border-b border-[#E7E5E0] pb-2">{label}</h3>
                <textarea 
                  className="w-full flex-grow resize-none outline-none text-lg p-2"
                  placeholder={isPrintMode ? "" : "List items..."}
                  value={answers[`map_${label}`] || ''}
                  onChange={(e) => setAnswers({...answers, [`map_${label}`]: e.target.value})}
                />
              </div>
            ))}
          </div>
          <div className="bg-[#1A2F23] p-6 text-[#F5F2EA] break-inside-avoid">
            <p className="font-serif text-lg italic mb-2">What surprises you?</p>
            <input 
              className="w-full bg-transparent border-b border-[#C5A059] text-[#F5F2EA] focus:outline-none py-2"
              value={answers['map_reflection'] || ''}
              onChange={(e) => setAnswers({ ...answers, 'map_reflection': e.target.value })}
            />
          </div>
        </div>
      )
    },
    {
      id: 'page-10',
      title: 'The Constraint Question',
      audioKey: 'constraint-question',
      render: () => (
        <div className="max-w-3xl mx-auto space-y-12 py-8 text-center">
          <h3 className="text-4xl font-serif text-[#1A2F23] leading-snug">
            “If $25,000 appeared tomorrow, what would break first?”
          </h3>
          <textarea 
             className="w-full h-64 bg-white border border-[#E7E5E0] p-6 text-xl font-sans outline-none focus:border-[#C5A059]"
             placeholder={isPrintMode ? "" : "Write your answer here..."}
             value={answers['constraint'] || ''}
             onChange={(e) => setAnswers({...answers, 'constraint': e.target.value})}
          />
        </div>
      )
    },
    {
      id: 'page-11',
      title: 'What This Workbook Can & Cannot Do',
      // No audio key specified
      render: () => (
        <div className="grid md:grid-cols-2 h-full border border-[#E7E5E0] bg-white">
          <div className="p-8 border-r border-[#E7E5E0] bg-[#F5F2EA]/30">
             <div className="flex items-center gap-2 mb-8 text-[#1A2F23]">
               <Check className="w-6 h-6" />
               <h3 className="font-bold tracking-widest uppercase">This Workbook</h3>
             </div>
             <ul className="space-y-6 text-lg font-serif">
               <li>Shows patterns</li>
               <li>Reveals blind spots</li>
               <li>Creates awareness</li>
             </ul>
          </div>
          <div className="p-8 bg-white">
             <div className="flex items-center gap-2 mb-8 text-[#1C1917]/50">
               <span className="text-2xl font-bold">×</span>
               <h3 className="font-bold tracking-widest uppercase">Does Not</h3>
             </div>
             <ul className="space-y-6 text-[#1C1917]/60 text-lg font-serif">
               <li>Design your cash flow system</li>
               <li>Prepare you for funding</li>
               <li>Fix structural leaks</li>
             </ul>
          </div>
        </div>
      )
    },
    {
      id: 'page-12',
      title: 'The Next Step',
      audioKey: 'next-step',
      render: () => (
      <div className="flex flex-col items-center justify-center text-center h-full space-y-6">
      <h2 className="text-4xl font-serif font-bold text-[#1A2F23]">
        From awareness to control.
      </h2>

      <p className="text-xl text-[#1C1917]">
        Continue inside the app.
      </p>

      <p className="text-sm text-[#1C1917]/50 italic">
        If you’re not ready to continue today, your answers are saved.
      </p>

      <div className="w-32 h-32 border-2 border-[#1A2F23] flex items-center justify-center no-print">
        <span className="uppercase tracking-widest text-xs">QR Code</span>
      </div>
    </div>
  )
}
  ];

  // -------------------------------------------------------------------------
  // NAVIGATION HANDLERS
  // -------------------------------------------------------------------------
  const next = () => { if (activePage < pages.length - 1) setActivePage(activePage + 1); window.scrollTo(0,0); };
  const prev = () => { if (activePage > 0) setActivePage(activePage - 1); window.scrollTo(0,0); };

  // -------------------------------------------------------------------------
  // RENDER MODES
  // -------------------------------------------------------------------------

  // 1. PRINT MODE RENDER
  if (isPrintMode) {
    return (
      <div className="bg-white text-[#1C1917] p-0 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Print Controls (Hidden when actually printing via CSS) */}
          <div className="no-print sticky top-0 bg-yellow-50 border-b border-yellow-200 p-4 mb-8 flex justify-between items-center z-50">
             <span className="text-yellow-900 font-bold">Print Preview Mode</span>
             <div className="flex gap-4">
               <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-[#1A2F23] text-white rounded">
                 <Printer className="w-4 h-4"/> Print
               </button>
               <button type="button" onClick={() => setIsPrintMode(false)} className="px-4 py-2 text-[#1A2F23] underline">
                 Exit
               </button>
             </div>
          </div>

          {pages.map((page, index) => (
            <div key={page.id} className="page print-section mb-16 pb-16 border-b border-dashed border-gray-300 last:border-0">
               {index > 0 && <div className="text-xs uppercase tracking-widest text-[#C5A059] mb-4">Page {index + 1} — {page.title}</div>}
               {page.render()}
            </div>
          ))}
        </div>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .page { page-break-after: always; break-after: page; border: none !important; margin-bottom: 0 !important; padding-bottom: 0 !important; height: 100vh; }
            body { background: white; -webkit-print-color-adjust: exact; }
          }
        `}</style>
      </div>
    );
  }

  // 2. INTERACTIVE MODE RENDER
  const currentPage = pages[activePage];

  return (
    <div className="min-h-screen font-sans text-[#1C1917] flex flex-col transition-colors duration-500" style={{ backgroundColor: theme.bg }}>
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-[#E7E5E0] sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1A2F23] text-[#C5A059] flex items-center justify-center font-serif font-bold rounded">G</div>
          <span className="font-serif font-bold text-[#1A2F23] tracking-wide hidden sm:inline-block">Get Fundable Fast™</span>
        </div>
        <div className="flex items-center gap-4">
           {/* Print Toggle Button for ease of use */}
           <button 
             type="button" 
             onClick={() => { setIsPrintMode(true); setAutoPrint(true); }} // Trigger print
             title="Switch to Print View" 
             className="p-2 hover:bg-gray-100 rounded-full transition-colors"
           >
              <Printer className="w-5 h-5 text-[#1A2F23]" />
           </button>
           <div className="text-xs font-mono text-[#1C1917]/50">Page {activePage + 1} of {pages.length}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col p-4 md:p-12 overflow-hidden relative">
        <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col h-full">
          
          <div className="flex justify-between items-end mb-8 border-b border-[#1A2F23]/10 pb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#C5A059] font-bold">{activePage > 0 && currentPage.title}</h2>
            {currentPage.audioKey && (
              <AudioPrompt 
                label="Listen" 
                isPlaying={isAudioPlaying && currentAudioKey === currentPage.audioKey}
                onClick={() => playAudio(currentPage.audioKey)}
              />
            )}
          </div>

          <div className="flex-grow animate-fadeIn">
            {currentPage.render()}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="px-6 py-6 border-t border-[#E7E5E0] bg-white flex justify-between items-center fixed bottom-0 w-full z-20">
        <button 
          type="button"
          onClick={prev} disabled={activePage === 0}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors ${activePage === 0 ? 'opacity-0 pointer-events-none' : 'text-[#1A2F23] hover:text-[#C5A059]'}`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="w-full max-w-xs mx-4 h-1 bg-[#E7E5E0] rounded-full overflow-hidden hidden sm:block">
           <div className="h-full bg-[#1A2F23] transition-all duration-500" style={{ width: `${((activePage + 1) / pages.length) * 100}%` }} />
        </div>

        <button 
          type="button"
          onClick={next} disabled={activePage === pages.length - 1}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors ${activePage === pages.length - 1 ? 'opacity-0 pointer-events-none' : 'text-[#1A2F23] hover:text-[#C5A059]'}`}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Workbook;
