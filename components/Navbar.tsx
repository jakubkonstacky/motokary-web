'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSeasons() {
      const { data, error } = await supabase.from('seasons').select('id').order('id', { ascending: false });
      if (error) console.error("Chyba načítání sezón:", error);
      setSeasons(data || []);
    }
    loadSeasons();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug log pro tebe
  console.log("Menu je otevřené:", isOpen, "Počet sezón:", seasons.length);

  return (
    <nav style={navWrapperStyle}>
      <div style={navContainerStyle}>
        
        <Link href="/" style={logoStyle} onClick={() => setIsOpen(false)}>
          <span style={{ color: '#fbbf24' }}>ENZO</span>CUP
        </Link>

        <div style={menuItemsStyle}>
          
          <div style={{ position: 'relative', zIndex: 10001 }} ref={dropdownRef}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(!isOpen);
              }} 
              style={{
                ...navLinkButtonStyle,
                color: isOpen ? '#fbbf24' : '#fff',
                border: isOpen ? '1px solid #fbbf24' : 'none' // Vizualizace kliknutí
              }}
            >
              KALENDÁŘ ZÁVODŮ {isOpen ? '▲' : '▼'}
            </button>

            {/* DROPDOWN - Vynucené zobrazení */}
            {isOpen && (
              <div style={dropdownContainerStyle}>
                {/* TESTOVACÍ ODKAZ - Pokud uvidíš toto a ne sezóny, je chyba v DB */}
                <div style={{ padding: '10px', color: '#fbbf24', fontSize: '0.7rem', borderBottom: '1px solid #333' }}>
                  DEBUG: {seasons.length} sezón nalezeno
                </div>

                {seasons.map((s) => (
                  <Link 
                    key={s.id} 
                    href={`/?year=${s.id}`} 
                    style={dropdownLinkStyle}
                    onClick={() => setIsOpen(false)}
                  >
                    Sezóna {s.id}
                  </Link>
                ))}

                {/* Záložní odkaz pokud by DB byla prázdná */}
                <Link href="/?year=2026" style={dropdownLinkStyle} onClick={() => setIsOpen(false)}>
                  Aktuální (2026)
                </Link>
              </div>
            )}
          </div>

          <Link href="/vysledky" style={navLinkStyle}>VÝSLEDKY</Link>
          <Link href="/galerie" style={navLinkStyle}>GALERIE</Link>
          <Link href="/o-nas" style={navLinkStyle}>O NÁS</Link>
          <Link href="/kontakt" style={navLinkStyle}>KONTAKT</Link>
        </div>
      </div>
    </nav>
  );
}

// --- STYLY (S EXTRÉMNÍM Z-INDEXEM) ---

const navWrapperStyle: any = {
  background: '#000',
  borderBottom: '1px solid #222',
  position: 'fixed', // Změna na fixed pro absolutní jistotu nad obsahem
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 10000,
  height: '70px',
  display: 'flex',
  alignItems: 'center'
};

const navContainerStyle: any = {
  maxWidth: '1400px',
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 20px'
};

const logoStyle: any = { fontSize: '1.5rem', fontWeight: '900', textDecoration: 'none', color: '#fff' };
const menuItemsStyle: any = { display: 'flex', gap: '20px', alignItems: 'center' };
const navLinkStyle: any = { color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' };
const navLinkButtonStyle: any = { ...navLinkStyle, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 15px', borderRadius: '8px' };

const dropdownContainerStyle: any = {
  position: 'absolute',
  top: '50px', // Přesná pozice pod lištou
  right: '0',
  background: '#111',
  border: '2px solid #fbbf24', // Výrazný okraj pro testování
  borderRadius: '12px',
  minWidth: '200px',
  boxShadow: '0 20px 50px rgba(0,0,0,1)',
  zIndex: 10002, // Nejvyšší možný prvek
  display: 'block'
};

const dropdownLinkStyle: any = {
  display: 'block',
  padding: '15px 20px',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '600',
  borderBottom: '1px solid #222'
};
