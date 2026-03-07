'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GaleriePage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<number[]>([]); // Dynamický seznam let z DB
  const [loading, setLoading] = useState(true);

  // 1. NAČTENÍ DOSTUPNÝCH SEZÓN (ROKŮ) Z TABULKY PHOTOS
  useEffect(() => {
    async function fetchPhotoSeasons() {
      const { data } = await supabase
        .from('photos')
        .select('year');

      if (data) {
        // Vytvoříme seznam unikátních roků z fotek a seřadíme je
        const uniqueYears = Array.from(new Set(data.map(item => item.year)))
          .filter((y): y is number => y !== null)
          .sort((a, b) => b - a);

        setSeasons(uniqueYears);
        
        // Nastavíme výchozí rok na nejnovější nalezený
        if (uniqueYears.length > 0 && !year) {
          setYear(uniqueYears[0]);
        }
      }
    }
    fetchPhotoSeasons();
  }, []);

  // 2. NAČTENÍ FOTEK PRO VYBRANÝ ROK
  useEffect(() => {
    if (!year) return;

    async function fetchPhotos() {
      setLoading(true);
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: false });

      setPhotos(data || []);
      setLoading(false);
    }
    fetchPhotos();
  }, [year]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fbbf24', textAlign: 'center', fontSize: '2.5rem' }}>📸 Fotogalerie</h1>
      
      {/* --- DYNAMICKÝ FILTR ROČNÍKŮ --- */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
        {seasons.map((s) => (
          <button
            key={s}
            onClick={() => setYear(s)}
            style={{
              padding: '10px 25px',
              borderRadius: '25px',
              border: '1px solid #fbbf24',
              cursor: 'pointer',
              backgroundColor: year === s ? '#fbbf24' : 'transparent',
              color: year === s ? '#000' : '#fbbf24',
              fontWeight: 'bold',
              transition: '0.3s'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* --- GRID S FOTKAMI --- */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Načítám vzpomínky...</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {photos.length > 0 ? photos.map((photo) => (
            <div key={photo.id} style={{ 
              background: '#111', 
              borderRadius: '10px', 
              overflow: 'hidden', 
              border: '1px solid #222'
            }}>
              <img 
                src={photo.url} 
                alt={photo.caption} 
                style={{ width: '100%', height: '250px', objectFit: 'cover' }} 
              />
              <div style={{ padding: '15px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  {photo.race_name || 'Závod'}
                </div>
                <p style={{ margin: '5px 0 0 0', fontSize: '1rem' }}>{photo.caption}</p>
              </div>
            </div>
          )) : (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666', padding: '50px' }}>
              Pro tento rok zatím nemáme v galerii žádné fotky.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
