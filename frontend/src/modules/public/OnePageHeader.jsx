import React, { useState } from "react";

export default function OnePageHeader({ onJump }) {
  const [open, setOpen] = useState(false);

  const link = "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:text-orange-600";
  const mobileLink = "block px-4 py-3 rounded-lg text-sm font-medium hover:bg-orange-50 hover:text-orange-600";

  const Item = ({ id, label }) => (
    <button
      onClick={() => { onJump(id); setOpen(false); }}
      className={link}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => onJump("hero")} className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              MV
            </div>
            <span className="font-extrabold text-xl text-gray-900 group-hover:text-orange-600 transition-colors">
              MODVICE
            </span>
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <Item id="hero" label="Home" />
          <Item id="new" label="New Arrivals" />
          <Item id="top" label="Top Sellers" />
          <Item id="trend" label="Trending" />
          <Item id="about" label="About" />
          <Item id="contact" label="Contact" />
        </nav>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          <button onClick={() => { onJump("hero"); setOpen(false); }} className={mobileLink}>Home</button>
          <button onClick={() => { onJump("new"); setOpen(false); }} className={mobileLink}>New Arrivals</button>
          <button onClick={() => { onJump("top"); setOpen(false); }} className={mobileLink}>Top Sellers</button>
          <button onClick={() => { onJump("trend"); setOpen(false); }} className={mobileLink}>Trending</button>
          <button onClick={() => { onJump("about"); setOpen(false); }} className={mobileLink}>About</button>
          <button onClick={() => { onJump("contact"); setOpen(false); }} className={mobileLink}>Contact</button>
        </div>
      )}
    </header>
  );
}
