'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const currentSystemYear = new Date().getFullYear(); // 2026

  useEffect(() => {
    async function loadSeasons() {
      const { data } = await supabase.from('seasons').select('id').order('id', { ascending: false });
      setSeasons(data || []);
    }
    loadSeasons();
  }, []);

  return (
    <nav style={navWrapperStyle}>
      <div style={navContainerStyle}>
        
        {/* LOGO */}
        <Link href="/" style={logoStyle} onClick={() => setIsOpen(false)}>
          <span style={{ color: '#fbbf24' }}>ENZO</span>CUP
        </Link>

        {/* MENU */}
        <div style={menuItemsStyle}>
          
          {/* KALENDÁŘ - HOVER KONTEJNER */}
          <div 
            style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {/* Přímý odkaz na aktuální rok bez šipky */}
            <Link 
              href={`/?year=${currentSystemYear}`} 
              style={{
                ...navLinkStyle,
                color: isOpen ? '#fbbf24' : '#fff',
                padding: '25px 0' // Zvětšená plocha pro snadnější najetí
              }}
            >
              KALENDÁŘ ZÁVODŮ
            </Link>

            {/* DROPDOWN MENU PŘI HOVERU */}
            {isOpen && seasons.length > 0 && (
              <div style={dropdownContainerStyle}>
                <div style={dropdownArrowStyle} />
                
                {seasons.map((s) => {
                  const isCurrent = s.id === currentSystemYear;
                  return (
                    <Link 
                      key={s.id} 
                      href={`/?year=${s.id}`} 
                      style={dropdownLinkStyle}
                      onClick={() => setIsOpen(false)}
                    >
                      Sezóna {s.id} {isCurrent && <span style={currentBadgeStyle}>(Aktuální)</span>}
                    </Link>
                  );
                })}
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

// --- STYLY ---

const navWrapperStyle: any = {
  background: '#000',
  borderBottom: '1px solid #222',
  position: 'fixed',
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
  padding: '0 20px',
  height: '100%'
};

const logoStyle: any = { 
  fontSize: '1.5rem', 
  fontWeight: '900', 
  textDecoration: 'none', 
  color: '#fff',
  transition: 'transform 0.2s'
};

const menuItemsStyle: any = { 
  display: 'flex', 
  gap: '35px', 
  alignItems: 'center',
  height: '100%'
};

const navLinkStyle: any = { 
  color: '#fff', 
  textDecoration: 'none', 
  fontSize: '0.85rem', 
  fontWeight: '700', 
  textTransform: 'uppercase',
  transition: 'all 0.2s ease'
};

const dropdownContainerStyle: any = {
  position: 'absolute',
  top: '70px', // Přesně na hranu lišty
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#111',
  border: '1px solid #333',
  borderRadius: '0 0 12px 12px',
  minWidth: '220px',
  padding: '10px 0',
  boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
  zIndex: 10002,
  animation: 'fadeIn 0.2s ease-out'
};

const dropdownArrowStyle: any = {
  position: 'absolute',
  top: '-6px',
  left: '50%',
  width: '12px',
  height: '12px',
  background: '#111',
  borderTop: '1px solid #333',
  borderLeft: '1px solid #333',
  transform: 'translateX(-50%) rotate(45deg)'
};

const dropdownLinkStyle: any = {
  display: 'block',
  padding: '12px 25px',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'background 0.2s',
  borderBottom: '1px solid rgba(255,255,255,0.03)'
};

const currentBadgeStyle: any = {
  color: '#fbbf24',
  fontSize: '0.75rem',
  marginLeft: '8px',
  fontWeight: '400',
  opacity: 0.8
};
