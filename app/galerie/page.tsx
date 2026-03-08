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

  // 1. Načtení sezón pro horní tlačítka
  useEffect(() => {
    async function fetchSeasons() {
      const { data } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setSeasons(data);
        const currentYear = new Date().getFullYear();
        // Nastavíme rok 2026 nebo 2025 jako výchozí
        setSelectedYear(data.some(s => s.id === currentYear) ? currentYear : data[0].id);
      }
    }
    fetchSeasons();
  }, []);

  // 2. Načtení fotek z tabulky "photos" podle sloupce "year"
  useEffect(() => {
    if (!selectedYear) return;

    async function fetchPhotos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('photos') // Tvoje tabulka v databázi
        .select('*')
        .eq('year', selectedYear) // Tvůj sloupec pro rok
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Chyba načítání:", error);
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    }
    fetchPhotos();
  }, [selectedYear]);

  const next = (e?: any) => { e?.stopPropagation(); setSelectedIndex((selectedIndex! + 1) % photos.length); };
  const prev = (e?: any) => { e?.stopPropagation(); setSelectedIndex((selectedIndex! - 1 + photos.length) % photos.length); };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>📸 Galerie</h1>
        <p style={{ color: '#666', textTransform: 'uppercase' }}>
          Sezóna {selectedYear}
        </p>
      </header>

      {/* TLAČÍTKA ROKŮ (FILTR) */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
        {seasons.map(s => (
          <button 
            key={s.id} 
            onClick={() => setSelectedYear(s.id)}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: selectedYear === s.id ? '#fbbf24' : '#111',
              color: selectedYear === s.id ? '#000' : '#fff'
            }}
          >
            {s.id}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#444' }}>Hledám fotky v databázi...</p>
      ) : (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' 
        }}>
          {photos.length > 0 ? photos.map((photo, index) => (
            <div 
              key={photo.id} 
              onClick={() => setSelectedIndex(index)}
              style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222', cursor: 'pointer' }}
            >
              <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#000' }}>
                <img 
                  src={photo.url} 
                  alt={photo.caption} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '15px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {photo.race_name} {/* Sloupec "race_name" */}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                    {photo.caption} {/* Sloupec "caption" */}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#444' }}>
              Pro rok {selectedYear} nemáš v tabulce "photos" žádné záznamy.
            </div>
          )}
        </div>
      )}

      {/* SLIDE SHOW (LIGHTBOX) */}
      {selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        >
