'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializace Supabase klienta
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GaleriePage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true);
      // Předpokládáme tabulku "gallery" s poli: url, title, category
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Chyba při načítání galerie:", error);
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    }

    fetchPhotos();
  }, []);

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>📸 Galerie Týmu</h1>
        <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Záběry z trati i depa</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#444', marginTop: '50px' }}>Načítám fotografie...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '25px' 
        }}>
          {photos.length > 0 ? photos.map((photo) => (
            <div key={photo.id} style={{ 
              background: '#111', 
              borderRadius: '15px', 
              overflow: 'hidden', 
              border: '1px solid #222',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* KONTEJNER PRO OBRÁZEK: Fixní poměr 3:2 bez ořezu */}
              <div style={{ 
                width: '100%', 
                aspectRatio: '3 / 2', 
                background: '#050505', // Černé pozadí pro případné okraje
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #222'
              }}>
                <img 
                  src={photo.url} 
                  alt={photo.title}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain' // Zobrazí fotku CELOU
                  }} 
                />
              </div>

              {/* POPISKA POD FOTKOU */}
              <div style={{ padding: '20px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                  {photo.category || 'Závody'}
                </div>
                <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '500' }}>
                  {photo.title}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ colSpan: '100%', textAlign: 'center', color: '#444', padding: '100px 0' }}>
              V galerii zatím nejsou žádné fotky.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
