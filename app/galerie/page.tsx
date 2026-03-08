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
  
  // Stav pro Slideshow (Lightbox)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setPhotos(data || []);
      setLoading(false);
    }
    fetchPhotos();
  }, []);

  // Funkce pro přepínání ve slideshow
  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % photos.length);
    }
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>📸 Galerie Týmu</h1>
        <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Klikni na fotku pro slide show</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#444' }}>Načítám...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {photos.map((photo, index) => (
            <div 
              key={photo.id} 
              onClick={() => setSelectedIndex(index)}
              style={{ 
                background: '#111', borderRadius: '10px', overflow: 'hidden', 
                border: '1px solid #222', cursor: 'zoom-in'
              }}
            >
              <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#000' }}>
                <img 
                  src={photo.url} 
                  alt={photo.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SLIDE SHOW MODAL --- */}
      {selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}
        >
          {/* Zavírací křížek */}
          <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>✕</button>

          {/* Šipka vlevo */}
          <button 
            onClick={prevPhoto}
            style={{ position: 'absolute', left: '20px', background: '#222', border: 'none', color: '#fff', padding: '15px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ❮
          </button>

          {/* Aktuální fotka v plné kráse */}
          <div style={{ textAlign: 'center', maxWidth: '90%', maxHeight: '80%' }}>
            <img 
              src={photos[selectedIndex].url} 
              alt="Slide"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} 
            />
            <div style={{ marginTop: '20px' }}>
              <div style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold' }}>{photos[selectedIndex].category}</div>
              <h3 style={{ margin: '5px 0' }}>{photos[selectedIndex].title}</h3>
              <div style={{ color: '#666' }}>{selectedIndex + 1} / {photos.length}</div>
            </div>
          </div>

          {/* Šipka vpravo */}
          <button 
            onClick={nextPhoto}
            style={{ position: 'absolute', right: '20px', background: '#222', border: 'none', color: '#fff', padding: '15px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ❯
          </button>
        </div>
      )}
    </div>
  );
}
