'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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

  // 1. Načtení sezón pro filtr
  useEffect(() => {
    async function fetchSeasons() {
      const { data } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setSeasons(data);
        // Nastavení aktuálního nebo nejnovějšího roku
        const currentYear = new Date().getFullYear();
        setSelectedYear(data.some(s => s.id === currentYear) ? currentYear : data[0].id);
      }
    }
    fetchSeasons();
  }, []);

  // 2. Načtení fotek pro vybraný rok
  useEffect(() => {
    if (!selectedYear) return;

    async function fetchPhotos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('season_id', selectedYear) // Filtrace podle roku
        .order('created_at', { ascending: false });

      if (!error) setPhotos(data || []);
      setLoading(false);
    }
    fetchPhotos();
  }, [selectedYear]);

  // Funkce pro slideshow
  const next = (e?: any) => { e?.stopPropagation(); setSelectedIndex((selectedIndex! + 1) % photos.length); };
  const prev = (e?: any) => { e?.stopPropagation(); setSelectedIndex((selectedIndex! - 1 + photos.length) % photos.length); };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>📸 Galerie</h1>
        <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {selectedYear ? `Sezóna ${selectedYear}` : 'Načítám...'}
        </p>
      </header>

      {/* --- FILTR ROKŮ --- */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
        {seasons.map(s => (
          <button 
            key={s.id} 
            onClick={() => setSelectedYear(s.id)}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: selectedYear === s.id ? '#fbbf24' : '#111',
              color: selectedYear === s.id ? '#000' : '#fff',
              transition: '0.2s'
            }}
          >
            {s.id}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#444' }}>Načítám snímky...</p>
      ) : (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' 
        }}>
          {photos.length > 0 ? photos.map((photo, index) => (
            <div 
              key={photo.id} 
              onClick={() => setSelectedIndex(index)}
              style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222', cursor: 'zoom-in' }}
            >
              <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#000' }}>
                <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '15px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 'bold' }}>{photo.category}</div>
                <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>{photo.title}</div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#444' }}>
              V sezóně {selectedYear} zatím nejsou žádné fotky.
            </div>
          )}
        </div>
      )}

      {/* --- SLIDESHOW MODAL --- */}
      {selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        >
          <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer' }}>✕</button>
          <button onClick={prev} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem' }}>❮</button>
          
          <div style={{ maxWidth: '90%', maxHeight: '80%', textAlign: 'center' }}>
            <img 
              src={photos[selectedIndex].url} 
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px', objectFit: 'contain' }} 
              onClick={(e) => e.stopPropagation()} 
            />
            <h3 style={{ color: '#fbbf24', marginTop: '20px' }}>{photos[selectedIndex].title}</h3>
          </div>

          <button onClick={next} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem' }}>❯</button>
        </div>
      )}
    </div>
  );
}
