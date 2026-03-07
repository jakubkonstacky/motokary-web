'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VysledkyPage() {
  const [year, setYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [driversData, setDriversData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeasons() {
      const { data } = await supabase.from('races').select('year');
      if (data) {
        const uniqueYears = Array.from(new Set(data.map(d => d.year)))
          .filter(y => y !== null)
          .sort((a, b) => b! - a!);
        setSeasons(uniqueYears as number[]);
        if (uniqueYears.length > 0) setYear(uniqueYears[0] as number);
      }
    }
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (!year) return;
    async function fetchData() {
      setLoading(true);

      const { data: racesData } = await supabase
        .from('races')
        .select('*')
        .eq('year', year)
        .order('race_date', { ascending: true });
      setRaces(racesData || []);

      const { data: resultsData } = await supabase
        .from('results')
        .select(`
          position, points, bonus_points, race_id,
          drivers (id, full_name, start_number)
        `)
        .eq('year', year);

      const driversMap: any = {};

      resultsData?.forEach((res: any) => {
        // POJISTKA 1: Pokud chybí jezdec nebo závod (nekonzistentní data), řádek přeskočíme
        if (!res.drivers || !res.race_id) return;

        const dId = res.drivers.id;
        if (!driversMap[dId]) {
          driversMap[dId] = {
            name: res.drivers.full_name,
            number: res.drivers.start_number,
            results: {},
            total: 0
          };
        }
        
        const pts = (Number(res.points) || 0) + (Number(res.bonus_points) || 0);
        driversMap[dId].results[res.race_id] = { pos: res.position, pts: pts };
        driversMap[dId].total += pts;
      });

      setDriversData(Object.values(driversMap).sort((a: any, b: any) => b.total - a.total));
      setLoading(false);
    }
    fetchData();
  }, [year]);

  // Pomocná funkce pro bezpečné formátování data (Oprava RangeError)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '??';
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}.`; // Ruční formátování "1.2."
  };

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h1 style={{ color: '#fbbf24', textAlign: 'center' }}>📊 Výsledky {year}</h1>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
        {seasons.map(s => (
          <button key={s} onClick={() => setYear(s)} style={{ padding: '8px 15px', background: year === s ? '#fbbf24' : '#222', color: year === s ? '#000' : '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <p style={{ textAlign: 'center' }}>Načítám tabulku...</p> : (
        <div style={{ overflowX: 'auto', background: '#111', borderRadius: '10px', border: '1px solid #333' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#222' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Jezdec</th>
                {races.map(race => (
                  <th key={race.id} style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                    <div style={{ color: '#fbbf24' }}>{formatDate(race.race_date)}</div>
                    <div style={{ color: '#666' }}>{race.name}</div>
                  </th>
                ))}
                <th style={{ padding: '15px', textAlign: 'center', background: '#fbbf24', color: '#000' }}>SUMA</th>
              </tr>
            </thead>
            <tbody>
              {driversData.map((driver, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '15px' }}>
                    <strong>{driver.name}</strong> <span style={{ color: '#666' }}>#{driver.number}</span>
                  </td>
                  {races.map(race => {
                    const r = driver.results[race.id];
                    return (
                      <td key={race.id} style={{ textAlign: 'center', padding: '10px' }}>
                        {r ? <div><strong>{r.pos}.</strong><div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{r.pts}b</div></div> : <span style={{ color: '#444' }}>X</span>}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', background: '#1a1a1a' }}>{driver.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
