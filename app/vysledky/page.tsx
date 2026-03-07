'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KomplexniVysledky() {
  const [year, setYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [driversData, setDriversData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Načtení sezón (z tabulky races)
  useEffect(() => {
    async function fetchSeasons() {
      const { data } = await supabase.from('races').select('year');
      if (data) {
        const uniqueYears = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b! - a!);
        setSeasons(uniqueYears as number[]);
        if (uniqueYears.length > 0) setYear(uniqueYears[0] as number);
      }
    }
    fetchSeasons();
  }, []);

  // 2. Načtení dat pro tabulku
  useEffect(() => {
    if (!year) return;
    async function fetchData() {
      setLoading(true);

      // Načteme závody daného roku
      const { data: racesData } = await supabase
        .from('races')
        .select('*')
        .eq('year', year)
        .order('race_date', { ascending: true });
      setRaces(racesData || []);

      // Načteme všechny výsledky a jezdce
      const { data: resultsData } = await supabase
        .from('results')
        .select(`
          position, points, bonus_points, race_id,
          drivers (id, full_name, start_number)
        `)
        .eq('year', year);

      // --- TRANSFORMACE DAT DO MATICE ---
      const driversMap: any = {};

      resultsData?.forEach((res: any) => {
        const dId = res.drivers.id;
        if (!driversMap[dId]) {
          driversMap[dId] = {
            name: res.drivers.full_name,
            number: res.drivers.start_number,
            results: {}, // race_id -> data
            total: 0
          };
        }
        driversMap[dId].results[res.race_id] = {
          pos: res.position,
          pts: Number(res.points || 0) + Number(res.bonus_points || 0)
        };
        driversMap[dId].total += Number(res.points || 0) + Number(res.bonus_points || 0);
      });

      // Seřadíme jezdce podle celkového počtu bodů
      const sortedDrivers = Object.values(driversMap).sort((a: any, b: any) => b.total - a.total);
      setDriversData(sortedDrivers);
      setLoading(false);
    }
    fetchData();
  }, [year]);

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h1 style={{ color: '#fbbf24', textAlign: 'center' }}>📊 Detailní výsledky</h1>

      {/* Přepínač let */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
        {seasons.map(s => (
          <button key={s} onClick={() => setYear(s)} style={{ padding: '8px 15px', background: year === s ? '#fbbf24' : '#222', color: year === s ? '#000' : '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Sestavuji tabulku...</p>
      ) : (
        <div style={{ overflowX: 'auto', background: '#111', borderRadius: '10px', border: '1px solid #333' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#222', borderBottom: '2px solid #fbbf24' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Jezdec</th>
                {races.map(race => (
                  <th key={race.id} style={{ padding: '10px', fontSize: '0.8rem', textAlign: 'center' }}>
                    <div style={{ color: '#fbbf24' }}>{new Date(race.race_date).toLocaleDateString('cs-CZ', { day: 'd.M.' })}</div>
                    <div style={{ color: '#666', fontWeight: 'normal' }}>{race.name}</div>
                  </th>
                ))}
                <th style={{ padding: '15px', textAlign: 'center', background: '#fbbf24', color: '#000' }}>CELKEM</th>
              </tr>
            </thead>
            <tbody>
              {driversData.map((driver, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '15px' }}>
                    <strong>{driver.name}</strong> <span style={{ color: '#666' }}>#{driver.number}</span>
                  </td>
                  {races.map(race => {
                    const res = driver.results[race.id];
                    return (
                      <td key={race.id} style={{ textAlign: 'center', padding: '10px' }}>
                        {res ? (
                          <div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{res.pos}.</span>
                            <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{res.pts} b.</div>
                          </div>
                        ) : (
                          <span style={{ color: '#444' }}>X</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', background: '#1a1a1a' }}>
                    {driver.total}
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
