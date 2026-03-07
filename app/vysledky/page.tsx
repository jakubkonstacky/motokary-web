'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VysledkyPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [driversMatrix, setDriversMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Načtení dostupných sezón (roků)
  useEffect(() => {
    async function fetchSeasons() {
      const { data } = await supabase
        .from('seasons')
        .select('id, name')
        .order('id', { ascending: false });
      
      if (data && data.length > 0) {
        setSeasons(data);
        setSelectedYear(data[0].id); // Automaticky vybere nejnovější rok
      }
    }
    fetchSeasons();
  }, []);

  // 2. Načtení dat pro vybranou sezónu
  useEffect(() => {
    if (!selectedYear) return;

    async function fetchData() {
      setLoading(true);

      // Načtení závodů dané sezóny
      const { data: racesData } = await supabase
        .from('races')
        .select('*')
        .eq('season_id', selectedYear)
        .order('id', { ascending: true });

      const currentRaces = racesData || [];
      setRaces(currentRaces);

      // Načtení výsledků s využitím JOINu na races (pro filtr sezóny) a drivers
      const { data: resultsData, error } = await supabase
        .from('results')
        .select(`
          pos_race_1, pos_race_2, extra_point, total_points, race_id,
          drivers (id, full_name, start_number),
          races!inner (season_id)
        `)
        .eq('races.season_id', selectedYear);

      if (error) {
        console.error("Chyba při načítání:", error);
        setLoading(false);
        return;
      }

      // --- Transformace dat do tabulkové matice ---
      const matrix: any = {};

      resultsData?.forEach((res: any) => {
        if (!res.drivers) return; // Ochrana proti nekonzistentním datům
        
        const dId = res.drivers.id;
        if (!matrix[dId]) {
          matrix[dId] = {
            name: res.drivers.full_name,
            number: res.drivers.start_number,
            raceResults: {}, // Mapování race_id -> výsledky
            totalSeasonPoints: 0
          };
        }

        matrix[dId].raceResults[res.race_id] = {
          p1: res.pos_race_1,
          p2: res.pos_race_2,
          extra: res.extra_point,
          total: res.total_points
        };
        matrix[dId].totalSeasonPoints += (Number(res.total_points) || 0);
      });

      // Seřazení jezdců podle celkových bodů
      setDriversMatrix(Object.values(matrix).sort((a: any, b: any) => b.totalSeasonPoints - a.totalSeasonPoints));
      setLoading(false);
    }
    fetchData();
  }, [selectedYear]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', color: '#fbbf24', fontSize: '2.5rem' }}>🏆 Výsledky sezóny</h1>

      {/* Přepínač sezón */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
        {seasons.map(s => (
          <button 
            key={s.id} 
            onClick={() => setSelectedYear(s.id)}
            style={{
              padding: '10px 20px',
              background: selectedYear === s.id ? '#fbbf24' : '#222',
              color: selectedYear === s.id ? '#000' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {s.id}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Sestavuji tabulku výsledků...</p>
      ) : (
        <div style={{ overflowX: 'auto', background: '#111', borderRadius: '15px', border: '1px solid #333' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#222', color: '#fbbf24', borderBottom: '2px solid #fbbf24' }}>
                <th style={{ padding: '20px', textAlign: 'left' }}>Jezdec</th>
                {races.map(r => (
                  <th key={r.id} style={{ padding: '10px', fontSize: '0.8rem' }}>
                    <div>{new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}</div>
                    <div style={{ fontWeight: 'normal', color: '#aaa' }}>{r.name}</div>
                  </th>
                ))}
                <th style={{ padding: '20px', background: '#fbbf24', color: '#000' }}>CELKEM</th>
              </tr>
            </thead>
            <tbody>
              {driversMatrix.map((driver, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '15px', textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>{driver.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>#{driver.number}</div>
                  </td>
                  {races.map(r => {
                    const res = driver.raceResults[r.id];
                    return (
                      <td key={r.id} style={{ padding: '10px' }}>
                        {res ? (
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{res.p1} / {res.p2}</div>
                            {res.extra > 0 && <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>+{res.extra} b.</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#444' }}>X</span> /* */
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '1.2rem', background: 'rgba(251, 191, 36, 0.05)' }}>
                    {driver.totalSeasonPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
