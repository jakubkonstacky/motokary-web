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

  // Zjištění aktuálního roku pro porovnání
  const currentSystemYear = new Date().getFullYear();

  useEffect(() => {
    async function loadSeasons() {
      const { data } = await supabase.from('seasons').select('id').order('id', { ascending: false });
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

  return (
    <nav style={navWrapperStyle}>
      <div style={navContainerStyle}>
        
        {/* LOGO */}
        <Link href="/" style={logoStyle} onClick={() => setIsOpen(false)}>
          <span style={{ color: '#fbbf24' }}>ENZO</span>CUP
        </Link>

        {/* MENU */}
        <div style={menuItemsStyle}>
          
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(!isOpen);
              }} 
              style={{
                ...navLinkButtonStyle,
                color: isOpen ? '#fbbf24' : '#fff',
                border: isOpen ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid transparent'
              }}
            >
              KALENDÁŘ ZÁVODŮ {isOpen ? '▲' : '▼'}
            </button>

            {/* VYČIŠTĚNÝ DROPDOWN */}
            {isOpen && (
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

                {seasons.length === 0 && (
                  <div style={{ padding: '15px', color: '#666', fontSize: '0.8rem' }}>
                    Žádné sezóny nenalezeny
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
  padding: '0 20px'
};

const logoStyle: any = { fontSize: '1.5rem', fontWeight: '900', textDecoration: 'none', color: '#fff' };
const menuItemsStyle: any = { display: 'flex', gap: '25px', alignItems: 'center' };
const navLinkStyle: any = { color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' };
const navLinkButtonStyle: any = { 
    ...navLinkStyle, 
    background: 'none', 
    cursor: 'pointer', 
    padding: '8px 15px', 
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    transition: 'all 0.2s'
};

const dropdownContainerStyle: any = {
  position: 'absolute',
  top: '55px',
  right: '0',
  background: '#111',
  border: '1px solid #333',
  borderRadius: '12px',
  minWidth: '220px',
  padding: '8px 0',
  boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
  zIndex: 10002
};

const dropdownArrowStyle: any = {
  position: 'absolute',
  top: '-6px',
  right: '25px',
  width: '12px',
  height: '12px',
  background: '#111',
  borderTop: '1px solid #333',
  borderLeft: '1px solid #333',
  transform: 'rotate(45deg)'
};

const dropdownLinkStyle: any = {
  display: 'block',
  padding: '12px 20px',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '600',
  borderBottom: '1px solid #222',
  transition: 'background 0.2s'
};

// Styl pro popisek "Aktuální"
const currentBadgeStyle: any = {
  color: '#fbbf24',
  fontSize: '0.75rem',
  marginLeft: '8px',
  fontWeight: '400',
  opacity: 0.8
};
