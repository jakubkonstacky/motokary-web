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
  const [categories, setCategories] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [resultsByCat, setResultsByCat] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // 1. Načtení sezón
  useEffect(() => {
    async function fetchInitial() {
      const { data } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setSeasons(data);
        setSelectedYear(data[0].id);
      }
    }
    fetchInitial();
  }, []);

  // 2. Načtení dat pro vybraný rok
  useEffect(() => {
    if (!selectedYear) return;

    async function fetchData() {
      setLoading(true);

      // Načtení kategorií pro daný rok
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('season_id', selectedYear)
        .order('order_by', { ascending: true }); // TADY JE ZMĚNA
      setCategories(catData || []);

      // Načtení závodů pro daný rok
      const { data: raceData } = await supabase
        .from('races')
        .select('*')
        .eq('season_id', selectedYear)
        .order('id', { ascending: true });
      setRaces(raceData || []);

      // Načtení výsledků s JOINem na races a drivers
      const { data: resData } = await supabase
        .from('results')
        .select(`
          pos_race_1, pos_race_2, extra_point, total_points, race_id, category_id,
          drivers (id, full_name, start_number),
          races!inner (season_id)
        `)
        .eq('races.season_id', selectedYear);

      // --- Seskupení dat podle kategorií ---
      const grouped: any = {};
      
      resData?.forEach((res: any) => {
        const catId = res.category_id;
        const dId = res.drivers?.id;
        if (!dId) return;

        if (!grouped[catId]) grouped[catId] = {};
        if (!grouped[catId][dId]) {
          grouped[catId][dId] = {
            name: res.drivers.full_name,
            number: res.drivers.start_number,
            races: {},
            total: 0
          };
        }

        grouped[catId][dId].races[res.race_id] = {
          p1: res.pos_race_1,
          p2: res.pos_race_2,
          pts: res.total_points,
          extra: res.extra_point
        };
        grouped[catId][dId].total += (res.total_points || 0);
      });

      setResultsByCat(grouped);
      setLoading(false);
    }
    fetchData();
  }, [selectedYear]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', color: '#fbbf24' }}>🏆 Oficiální výsledky</h1>

      {/* Přepínač sezón */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
        {seasons.map(s => (
          <button key={s.id} onClick={() => setSelectedYear(s.id)} style={{
            padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer',
            background: selectedYear === s.id ? '#fbbf24' : '#222', color: selectedYear === s.id ? '#000' : '#fff'
          }}>
            {s.id}
          </button>
        ))}
      </div>

      {loading ? <p style={{ textAlign: 'center' }}>Načítám...</p> : (
        categories.map(cat => {
          const catDrivers = resultsByCat[cat.id] ? Object.values(resultsByCat[cat.id]).sort((a: any, b: any) => b.total - a.total) : [];
          
          return (
            <div key={cat.id} style={{ marginBottom: '60px' }}>
              <h2 style={{ color: '#fbbf24', borderLeft: '4px solid #fbbf24', paddingLeft: '15px', textTransform: 'uppercase' }}>
                {cat.name} <span style={{ color: '#444', fontSize: '0.9rem' }}>({cat.id})</span>
              </h2>

              <div style={{ overflowX: 'auto', background: '#111', borderRadius: '10px', border: '1px solid #333' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#222', color: '#fbbf24' }}>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Jezdec</th>
                      {races.map(r => (
                        <th key={r.id} style={{ padding: '10px', fontSize: '0.7rem' }}>
                          <div>{new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}</div>
                          <div style={{ fontWeight: 'normal' }}>{r.name}</div>
                        </th>
                      ))}
                      <th style={{ padding: '15px', background: '#fbbf24', color: '#000' }}>SUMA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catDrivers.length > 0 ? (catDrivers as any[]).map((driver, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '15px', textAlign: 'left' }}>
                          <strong>{driver.name}</strong> <span style={{ color: '#666' }}>#{driver.number}</span>
                        </td>
                        {races.map(r => {
                          const res = driver.races[r.id];
                          return (
                            <td key={r.id} style={{ padding: '10px', textAlign: 'center' }}>
                              {res ? (
                                <div>
                                  <div style={{ fontWeight: 'bold' }}>{res.p1} / {res.p2}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{res.pts}b</div>
                                </div>
                              ) : <span style={{ color: '#333' }}>X</span>}
                            </td>
                          );
                        })}
                        <td style={{ padding: '15px', fontWeight: 'bold', background: 'rgba(251,191,36,0.1)' }}>{driver.total}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={races.length + 2} style={{ padding: '20px', color: '#444' }}>V této kategorii zatím nejsou žádné výsledky.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
