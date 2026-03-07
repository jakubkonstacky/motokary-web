'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VysledkyPage() {
  const [year, setYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<number[]>([]); // Dynamický seznam let
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. NAČTENÍ DOSTUPNÝCH SEZÓN (ROKŮ) Z DATABÁZE
  useEffect(() => {
    async function fetchSeasons() {
      // Vybereme jen sloupec 'year' ze všech řádků
      const { data } = await supabase
        .from('results')
        .select('year');

      if (data) {
        // Vytvoříme seznam unikátních roků a seřadíme je od nejnovějšího
        const uniqueYears = Array.from(new Set(data.map(item => item.year)))
          .filter((y): y is number => y !== null)
          .sort((a, b) => b - a);

        setSeasons(uniqueYears);
        
        // Pokud ještě nemáme vybraný rok, nastavíme ten nejnovější dostupný
        if (uniqueYears.length > 0 && !year) {
          setYear(uniqueYears[0]);
        }
      }
    }
    fetchSeasons();
  }, []);

  // 2. NAČTENÍ VÝSLEDKŮ PRO VYBRANÝ ROK
  useEffect(() => {
    if (!year) return;

    async function fetchResults() {
      setLoading(true);
      const { data } = await supabase
        .from('results')
        .select(`
          position, points, bonus_points, year,
          drivers (full_name, start_number)
        `)
        .eq('year', year)
        .order('position', { ascending: true });

      setResults(data || []);
      setLoading(false);
    }
    fetchResults();
  }, [year]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#fbbf24', textAlign: 'center' }}>🏆 Výsledky sezóny</h1>

      {/* --- DYNAMICKÝ PŘEPÍNAČ ROČNÍKŮ --- */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
        {seasons.map((s) => (
          <button
            key={s}
            onClick={() => setYear(s)}
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: year === s ? '#fbbf24' : '#222',
              color: year === s ? '#000' : '#fff',
              fontWeight: 'bold',
              transition: '0.3s'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* --- TABULKA VÝSLEDKŮ --- */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Načítám data...</p>
      ) : (
        <div style={{ background: '#111', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#222', color: '#fbbf24' }}>
                <th style={{ padding: '15px' }}>Pozice</th>
                <th style={{ padding: '15px' }}>Jezdec</th>
                <th style={{ padding: '15px' }}>Body celkem</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? results.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{r.position}.</td>
                  <td style={{ padding: '15px' }}>
                    {r.drivers?.full_name} <span style={{ color: '#666' }}>#{r.drivers?.start_number}</span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>
                    {Number(r.points || 0) + Number(r.bonus_points || 0)} b.
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Pro rok {year} zatím nejsou žádné výsledky.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
