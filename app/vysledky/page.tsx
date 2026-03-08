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

  useEffect(() => {
    async function fetchInitial() {
      const { data } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setSeasons(data);
        const currentSystemYear = new Date().getFullYear();
        const hasCurrentYear = data.some(s => s.id === currentSystemYear);
        setSelectedYear(hasCurrentYear ? currentSystemYear : data[0].id);
      }
    }
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;

    async function fetchData() {
      setLoading(true);
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('season_id', selectedYear)
        .order('order_by', { ascending: true });
      setCategories(catData || []);

      const { data: raceData } = await supabase
        .from('races')
        .select('*')
        .eq('season_id', selectedYear)
        .order('id', { ascending: true });
      setRaces(raceData || []);

      const { data: resData, error } = await supabase
        .from('results')
        .select(`
          pos_race_1, pos_race_2, extra_point, total_points, race_id, category_id, pole_position,
          drivers (id, full_name, start_number),
          races!inner (season_id)
        `)
        .eq('races.season_id', selectedYear);

      if (error) {
        setLoading(false);
        return;
      }

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
            raceResults: {},
            totalPoints: 0
          };
        }
        grouped[catId][dId].raceResults[res.race_id] = {
          p1: res.pos_race_1,
          p2: res.pos_race_2,
          pts: res.total_points,
          extra: res.extra_point,
          pole: res.pole_position
        };
        grouped[catId][dId].totalPoints += (Number(res.total_points) || 0);
      });

      setResultsByCat(grouped);
      setLoading(false);
    }
    fetchData();
  }, [selectedYear]);

  const getRankColor = (index: number) => {
    if (index === 0) return '#fbbf24'; // Zlato
    if (index === 1) return '#94a3b8'; // Stříbro
    if (index === 2) return '#92400e'; // Bronz
    return '#444';
  };

  const getRowBg = (index: number) => {
    if (index === 0) return 'rgba(251, 191, 36, 0.08)';
    if (index === 1) return 'rgba(148, 163, 184, 0.05)';
    if (index === 2) return 'rgba(146, 64, 14, 0.05)';
    return 'transparent';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1300px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* HLAVIČKA BEZ DODATEČNÉHO TEXTU */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>🏆 Výsledky Šampionátu</h1>
      </header>

      {/* FILTR SEZÓN */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '50px', flexWrap: 'wrap' }}>
        {seasons.map(s => (
          <button key={s.id} onClick={() => setSelectedYear(s.id)} style={{
            padding: '12px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            background: selectedYear === s.id ? '#fbbf24' : '#111',
            color: selectedYear === s.id ? '#000' : '#fff',
            transition: '0.2s'
          }}>{s.id}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Sestavuji tabulky...</div>
      ) : (
        categories.map(cat => {
          const catDrivers = resultsByCat[cat.id] 
            ? Object.values(resultsByCat[cat.id]).sort((a: any, b: any) => b.totalPoints - a.totalPoints) 
            : [];
          
          return (
            <div key={cat.id} style={{ marginBottom: '80px' }}>
              <h2 style={{ color: '#fbbf24', textTransform: 'uppercase', marginBottom: '20px' }}>{cat.name}</h2>

              <div style={{ overflowX: 'auto', background: '#0a0a0a', borderRadius: '15px', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ background: '#111', color: '#fbbf24', borderBottom: '2px solid #fbbf24' }}>
                      <th style={{ padding: '20px', textAlign: 'center', width: '60px' }}>P.</th>
                      <th style={{ padding: '20px', textAlign: 'left' }}>Jezdec</th>
                      {races.map(r => (
                        <th key={r.id} style={{ padding: '10px', textAlign: 'center', borderLeft: '1px solid #1a1a1a' }}>
                          <div style={{ fontSize: '0.8rem' }}>{new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}</div>
                          <div style={{ fontWeight: 'normal', color: '#666', fontSize: '0.65rem' }}>{r.name}</div>
                        </th>
                      ))}
                      <th style={{ padding: '20px', background: '#fbbf24', color: '#000', textAlign: 'center', width: '100px' }}>CELKEM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catDrivers.length > 0 ? (catDrivers as any[]).map((driver, idx) => (
                      <tr key={idx} style={{ 
                        borderBottom: '1px solid #1a1a1a', 
                        background: idx < 3 ? getRowBg(idx) : (idx % 2 === 1 ? '#0d0d0d' : 'transparent') 
                      }}>
                        <td style={{ 
                          padding: '15px', textAlign: 'center', fontWeight: 'bold', 
                          color: getRankColor(idx), fontSize: idx < 3 ? '1.4rem' : '1.1rem' 
                        }}>
                          {idx + 1}.
                        </td>
                        
                        <td style={{ padding: '15px 20px', textAlign: 'left' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{driver.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#555' }}>#{driver.number}</div>
                        </td>

                        {races.map(r => {
                          const res = driver.raceResults[r.id];
                          return (
                            <td key={r.id} style={{ padding: '10px', textAlign: 'center', borderLeft: '1px solid #1a1a1a' }}>
                              {res ? (
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{res.p1} / {res.p2}</div>
                                  <div style={{ fontSize: '0.8rem', marginTop: '3px' }}>
                                    {res.pole && res.extra > 0 ? (
                                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                                        {res.pts} b. <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(+ {res.extra} b.)</span>
                                      </span>
                                    ) : (
                                      <span style={{ color: '#aaa' }}>{res.pts} b.</span>
                                    )}
                                  </div>
                                </div>
                              ) : <span style={{ color: '#222' }}>X</span>}
                            </td>
                          );
                        })}

                        <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.4rem', textAlign: 'center', background: 'rgba(251, 191, 36, 0.05)', color: idx === 0 ? '#fbbf24' : '#fff' }}>
                          {driver.totalPoints}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={races.length + 3} style={{ padding: '40px', textAlign: 'center' }}>Žádné výsledky</td></tr>
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
