'use client'; // Důležité: umožní interaktivní tlačítka

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializace Supabase (použije proměnné, které už máš ve Vercelu)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VysledkyPage() {
  const [year, setYear] = useState(2024); // Výchozí rok
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seznam dostupných ročníků (můžeš doplňovat)
  const seasons = [2025, 2024, 2023, 2001];

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      const { data } = await supabase
        .from('results')
        .select(`
          position,
          points,
          bonus_points,
          year,
          drivers (full_name, start_number)
        `)
        .eq('year', year) // FILTR: vezme jen výsledky pro vybraný rok
        .order('position', { ascending: true });

      setResults(data || []);
      setLoading(false);
    }
    fetchResults();
  }, [year]); // Spustí se znovu vždy, když změníš 'year'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#fbbf24', textAlign: 'center' }}>🏆 Výsledky sezóny</h1>

      {/* --- PŘEPÍNAČ ROČNÍKŮ --- */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
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
                <th style={{ padding: '15px' }}>Číslo</th>
                <th style={{ padding: '15px' }}>Body celkem</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? results.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{r.position}.</td>
                  <td style={{ padding: '15px' }}>{r.drivers?.full_name}</td>
                  <td style={{ padding: '15px', color: '#888' }}>#{r.drivers?.start_number}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>
                    {Number(r.points || 0) + Number(r.bonus_points || 0)} b.
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
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
