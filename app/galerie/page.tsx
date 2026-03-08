'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GaleriePage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPhotos(data || []);
      } catch (err) {
        console.error("Chyba:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPhotos();
  }, []);

  // Funkce pro zavření a navigaci
  const closeShow = () => setSelectedIndex(null);
  const next = (e: any) => { e.stopPropagation(); setSelectedIndex((selectedIndex! + 1) % photos.length); };
  const prev = (e: any) => { e.stopPropagation(); setSelectedIndex((selectedIndex! - 1 + photos.length) % photos.length); };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>📸 Galerie</h1>
        <p style={{ color: '#666', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Kliknutím na fotku otevřete slide show
        </p>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#444' }}>Načítám fotky...</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {photos.map((photo, index) => (
            <div 
              key={photo.id} 
              onClick={() => setSelectedIndex(index)} // KLIKNI SEM
              style={{ 
                background: '#111', borderRadius: '12px', overflow: 'hidden', 
                border: '1px solid #222', cursor: 'pointer', transition: '0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#000' }}>
                <img 
                  src={photo.url} 
                  alt={photo.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '15px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold' }}>{photo.category}</div>
                <div style={{ fontSize: '1rem', marginTop: '5px' }}>{photo.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SLIDE SHOW (MODAL) --- */}
      {selectedIndex !== null && (
        <div 
          onClick={closeShow}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999
          }}
        >
          <button onClick={closeShow} style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer' }}>✕</button>
          
          <button onClick={prev} style={navBtnStyle({ left: '20px' })}>❮</button>
          
          <div style={{ maxWidth: '90%', maxHeight: '80%', textAlign: 'center' }}>
            <img 
              src={photos[selectedIndex].url} 
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px', objectFit: 'contain' }} 
              onClick={(e) => e.stopPropagation()} 
            />
            <h3 style={{ color: '#fbbf24', marginTop: '20px' }}>{photos[selectedIndex].title}</h3>
          </div>

          <button onClick={next} style={navBtnStyle({ right: '20px' })}>❯</button>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = (pos: any): any => ({
  position: 'absolute', ...pos,
  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', 
  padding: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem'
});
