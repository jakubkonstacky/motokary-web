'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadSeasons() {
      // Načtení všech sezón pro dropdown
      const { data } = await supabase.from('seasons').select('id').order('id', { ascending: false });
      setSeasons(data || []);
    }
    loadSeasons();
  }, []);

  return (
    <nav style={navWrapperStyle}>
      <div style={navContainerStyle}>
        
        {/* LOGO - ENZOCUP */}
        <Link href="/" style={logoStyle}>
          <span style={{ color: '#fbbf24' }}>ENZO</span>CUP
        </Link>

        {/* MENU POLOŽKY */}
        <div style={menuItemsStyle}>
          
          {/* ROZBALOVACÍ KALENDÁŘ */}
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button style={navLinkButtonStyle}>
              KALENDÁŘ ZÁVODŮ <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>

            {/* DROPDOWN MENU - Styl sjednocený s THEME */}
            {isDropdownOpen && (
              <div style={dropdownStyle}>
                {seasons.map((s) => (
                  <Link 
                    key={s.id} 
                    href={`/?year=${s.id}`} // Předpokládáme, že úvodní strana filtruje dle URL
                    style={dropdownLinkStyle}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Sezóna {s.id}
                  </Link>
                ))}
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

// STYLY PRO DROPDOWN A MENU
const navWrapperStyle: any = {
  background: '#000',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  position: 'sticky',
  top: 0,
  zIndex: 1000
};

const navContainerStyle: any = {
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px'
};

const logoStyle: any = {
  fontSize: '1.5rem',
  fontWeight: '900',
  textDecoration: 'none',
  color: '#fff',
  letterSpacing: '1px'
};

const menuItemsStyle: any = {
  display: 'flex',
  gap: '30px',
  alignItems: 'center'
};

const navLinkStyle: any = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: '700',
  transition: 'color 0.2s'
};

const navLinkButtonStyle: any = {
  ...navLinkStyle,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit'
};

const dropdownStyle: any = {
  position: 'absolute',
  top: '100%',
  left: '0',
  background: 'rgba(12, 12, 12, 0.95)',
  backdropFilter: 'blur(15px)', // Glassmorphism
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '10px 0',
  minWidth: '160px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  marginTop: '10px'
};

const dropdownLinkStyle: any = {
  display: 'block',
  padding: '12px 20px',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: '600',
  transition: 'background 0.2s'
};
