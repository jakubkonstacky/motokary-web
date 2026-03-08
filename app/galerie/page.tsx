'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme'; // Import tvého centrálního skladu stylů

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GaleriePage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 1. Načtení sezón
  useEffect(() => {
    async function fetchSeasons() {
      const { data } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setSeasons(data);
        const currentYear = new Date().getFullYear();
        setSelectedYear(data.some(s => s.id === currentYear) ? currentYear : data[0].id);
      }
    }
    fetchSeasons();
  }, []);

  // 2. Načtení fotek
  useEffect(() => {
    if (!selectedYear) return;

    async function fetchPhotos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('year', selectedYear)
        .order('created_at', { ascending: false });

      if (!error) {
        setPhotos(data || []);
      }
      setLoading(false);
    }
    fetchPhotos();
  }, [selectedYear]);

  const next = (e?: any) => { e?.stopPropagation(); setSelectedIndex((selectedIndex! + 1) % photos.length); };
  const prev = (e?: any) => { e?.stopPropagation(); setSelectedIndex((selectedIndex! - 1 + photos.length) % photos.length); };

  return (
    <div style={THEME.container}>
      
      {/* Hlavní nadpis - Sentence case a posunutý nahoru */}
      <h1 style={THEME.mainTitle}>Fotogalerie</h1>

      {/* TLAČÍTKA ROKŮ - Sjednocená s výsledky (8px rohy, bez rámečku) */}
      <div style={THEME.seasonNav}>
        {seasons.map(s => (
          <button 
            key={s.id} 
            onClick={() => setSelectedYear(s.id)}
            style={{
              ...THEME.seasonLinkBase,
              cursor: 'pointer',
              background: selectedYear === s.id ? '#fbbf24' : 'rgba(255,255,255,0.08)',
              color: selectedYear === s.id ? '#000' : '#fff',
            }}
          >
            {s.id}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#444' }}>Načítám...</p>
      ) : (
        <div style={galleryGridStyle}>
          {photos.length > 0 ? photos.map((photo, index) => (
            <div 
              key={photo.id} 
              onClick={() => setSelectedIndex(index)}
              style={{ ...THEME.tableContainer, cursor: 'pointer', border: 'none' }}
            >
              <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#000', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
                <img 
                  src={photo.url} 
                  alt={photo.caption} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {photo.race_name}
                </div>
                <div style={{ fontSize: '1rem', marginTop: '8px', fontWeight: '600', color: '#fff' }}>
                    {photo.caption}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0', color: '#666' }}>
              <p>V sezóně {selectedYear} nebyly nalezeny žádné záznamy.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL SLIDESHOW (LIGHTBOX) */}
      {selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        >
          <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer' }}>✕</button>
          <button onClick={prev} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem' }}>❮</button>
          
          <div style={{ maxWidth: '90%', maxHeight: '80%', textAlign: 'center' }}>
            <img src={photos[selectedIndex].url} style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
            <h3 style={{ color: '#fbbf24', marginTop: '20px', fontSize: '1.5rem', fontWeight: '800' }}>{photos[selectedIndex].caption}</h3>
          </div>

          <button onClick={next} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem' }}>❯</button>
        </div>
      )}
    </div>
  );
}

const galleryGridStyle: any = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
  gap: '25px' 
};
