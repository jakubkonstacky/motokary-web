'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Načtení sezón ze Supabase pro dropdown
  useEffect(() => {
    async function loadSeasons() {
      const { data } = await supabase
        .from('seasons')
        .select('id')
        .order('id', { ascending: false });
      setSeasons(data || []);
    }
    loadSeasons();

    // 2. Zavření dropdownu při kliknutí kamkoliv mimo něj
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav style={navWrapperStyle}>
      <div style={navContainerStyle}>
        
        {/* LOGO - ENZOCUP */}
        <Link href="/" style={logoStyle} onClick={() => setIsOpen(false)}>
          <span style={{ color: '#fbbf24' }}>ENZO</span>CUP
        </Link>

        {/* HLAVNÍ MENU */}
        <div style={menuItemsStyle}>
          
          {/* POLOŽKA S DROPDOWNEM */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              style={{
                ...navLinkButtonStyle,
                color: isOpen ? '#fbbf24' : '#fff'
              }}
            >
              KALENDÁŘ ZÁVODŮ 
              <span style={{ fontSize: '0.6rem', marginLeft: '8px', transition: '0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                ▼
              </span>
            </button>

            {/* VYSKAKOVACÍ MENU - Zobrazeno pouze při isOpen */}
            {isOpen && (
              <div style={dropdownContainerStyle}>
                <div style={dropdownArrowStyle} />
                {seasons.length > 0 ? (
                  seasons.map((s) => (
                    <Link 
                      key={s.id} 
                      href={`/?year=${s.id}`} 
                      style={dropdownLinkStyle}
                      onClick={() => setIsOpen(false)}
                    >
                      Sezóna {s.id}
                    </Link>
                  ))
                ) : (
                  <div style={{ padding: '15px', color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>
                    Žádné sezóny
                  </div>
                )}
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

// --- STYLY (S OPRAVOU PRO CHROME NA NB) ---

const navWrapperStyle: any = {
  background: '#000',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 9999, // Musí být nad obsahem stránky
  width: '100%',
  overflow: 'visible' // Klíčové pro zobrazení dropdownu
};

const navContainerStyle: any = {
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 20px',
  overflow: 'visible'
};

const logoStyle: any = {
  fontSize: '1.6rem',
  fontWeight: '900',
  textDecoration: 'none',
  color: '#fff',
  letterSpacing: '1px'
};

const menuItemsStyle: any = {
  display: 'flex',
  gap: '25px',
  alignItems: 'center'
};

const navLinkStyle: any = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  transition: 'color 0.2s'
};

const navLinkButtonStyle: any = {
  ...navLinkStyle,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '10px 0',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center'
};

const dropdownContainerStyle: any = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#111',
  border: '1px solid #333',
  borderRadius: '12px',
  minWidth: '180px',
  padding: '8px 0',
  marginTop: '15px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
  zIndex: 10000,
  display: 'block'
};

const dropdownArrowStyle: any = {
  position: 'absolute',
  top: '-7px',
  left: '50%',
  transform: 'translateX(-50%) rotate(45deg)',
  width: '12px',
  height: '12px',
  background: '#111',
  borderTop: '1px solid #333',
  borderLeft: '1px solid #333'
};

const dropdownLinkStyle: any = {
  display: 'block',
  padding: '12px 25px',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '600',
  textAlign: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  transition: 'background 0.2s'
};
