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

  // 1. Načtení dat ze Supabase
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
        console.error("Chyba při načítání galerie:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPhotos();
  }, []);

  // 2. Ovládání klávesnicí (Šipky a Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') setSelectedIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev !== null ? (prev + 1) % photos.length : null));
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev !== null ? (prev - 1 + photos.length) % photos.length : null));
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>📸 Galerie</h1>
        <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Kliknutím otevřete slide show</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>Startuji motory a načítám fotky...</div>
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
                background: '#111', borderRadius: '12px', overflow: 'hidden', 
                border: '1px solid #222', cursor: 'zoom-in', transition: '0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fbbf24'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
            >
              <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#000' }}>
                <img 
                  src={photo.url} 
                  alt={photo.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '15px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 'bold' }}>{photo.category}</div>
                <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>{photo.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SLIDE SHOW MODAL (LIGHTBOX) --- */}
      {selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: '20px'
          }}
        >
          {/* Tlačítko zavřít */}
          <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer', zIndex: 10001 }}>✕</button>

          {/* Šipka vlevo */}
          <button 
            onClick={prevPhoto}
            style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', zIndex: 10001 }}
          >
            ❮
          </button>

          {/* Hlavní fotka ve Slideshow - ZDE JE OPRAVA OŘEZU */}
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '85%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img 
              src={photos[selectedIndex].url} 
              alt="Slide"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '75vh', 
                objectFit: 'contain', // Zobrazí fotku CELOU bez ořezu hlavy
                borderRadius: '5px',
                boxShadow: '0 0 40px rgba(0,0,0,0.8)'
              }} 
              onClick={(e) => e.stopPropagation()} // Kliknutí na fotku nezavře modal
            />
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <div style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 'bold' }}>{photos[selectedIndex].category}</div>
              <h2 style={{ margin: '10px 0' }}>{photos[selectedIndex].title}</h2>
              <div style={{ color: '#666' }}>{selectedIndex + 1} / {photos.length}</div>
            </div>
          </div>

          {/* Šipka vpravo */}
          <button 
            onClick={nextPhoto}
            style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', zIndex: 10001 }}
          >
            ❯
          </button>
        </div>
      )}
    </div>
  );
}
