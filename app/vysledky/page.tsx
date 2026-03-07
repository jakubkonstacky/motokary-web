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

  // 1. Načtení sezón (roků) pro horní filtr
  useEffect(() => {
    async function fetchInitial() {
      const { data } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setSeasons(data);
        // Nastavíme aktuální rok (podle dnešního data) nebo nejnovější v DB
        const currentYear = new Date().getFullYear();
        const hasCurrentYear = data.some(s => s.id === currentYear);
        setSelectedYear(hasCurrentYear ? currentYear : data[0].id);
      }
    }
    fetchInitial();
  }, []);

  // 2. Načtení všech dat pro vybraný rok
  useEffect(() => {
    if (!selectedYear) return;

    async function fetchData() {
      setLoading(true);

      // Načtení kategorií seřazených podle tvého nového sloupce order_by
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('season_id', selectedYear)
        .order('order_by', { ascending: true });
      setCategories(catData || []);

      // Načtení všech závodů pro daný rok (seřazené podle ID YYYYZZ)
      const { data: raceData } = await supabase
        .from('races')
        .select('*')
        .eq('season_id', selectedYear)
        .order('id', { ascending: true });
      setRaces(raceData || []);

      // Načtení výsledků s JOINem na races (pro filtr sezóny) a drivers
      const { data: resData, error } = await supabase
        .from('results')
        .select(`
          pos_race_1, pos_race_2, extra_point, total_points, race_id, category_id, pole_position,
          drivers (id, full_name, start_number),
          races!inner (season_id)
        `)
        .eq('races.season_id', selectedYear);

      if (error) {
        console.error("Chyba při načítání dat:", error);
        setLoading(false);
        return;
      }

      // --- Seskupení dat do matice [Kategorie -> Jezdec -> Závody] ---
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
            totalPoints: 0
          };
        }

        grouped[catId][dId].races[res.race_id] = {
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>🏆 Výsledky šampionátu</h1>
        <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Oficiální tabulky sezóny</p>
      </header>

      {/* --- PŘEPÍNAČ SEZÓN --- */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '50px', flexWrap: 'wrap' }}>
        {seasons.map(s => (
          <button 
            key={s.id} 
            onClick={() => setSelectedYear(s.id)} 
            style={{
              padding: '12px 25px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: '0.3s',
              background: selectedYear === s.id ? '#fbbf24' : '#1a1a1a',
              color: selectedYear === s.id ? '#000' : '#fff',
              boxShadow: selectedYear === s.id ? '0 0 15px rgba(251, 191, 36, 0.4)' : 'none'
            }}
          >
            {s.id}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Sestavuji tabulky pro rok {selectedYear}...</div>
      ) : (
        categories.map(cat => {
          // Získáme jezdce pro tuto kategorii a seřadíme je podle bodů
          const catDrivers = resultsByCat[cat.id] 
            ? Object.values(resultsByCat[cat.id]).sort((a: any, b: any) => b.totalPoints - a.totalPoints) 
            : [];
          
          return (
            <div key={cat.id} style={{ marginBottom: '80px' }}>
              {/* Název kategorie respektující order_by */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#fbbf24', textTransform: 'uppercase', fontSize: '1.5rem' }}>{cat.name}</h2>
                <span style={{ background: '#222', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#444' }}>{cat.id}</span>
              </div>

              <div style={{ overflowX: 'auto', background: '#111', borderRadius: '15px', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#1a1a1a', color: '#fbbf24', borderBottom: '2px solid #fbbf24' }}>
                      <th style={{ padding: '20px', textAlign: 'left' }}>Jezdec</th>
                      {races.map(r => (
                        <th key={r.id} style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem' }}>{new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}</div>
                          <div style={{ fontWeight: 'normal', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase' }}>{r.name}</div>
                        </th>
                      ))}
                      <th style={{ padding: '20px', background: '#fbbf24', color: '#000', textAlign: 'center' }}>BODY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catDrivers.length > 0 ? (catDrivers as any[]).map((driver, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #222', background: idx % 2 === 1 ? '#141414' : 'transparent' }}>
                        <td style={{ padding: '15px 20px', textAlign: 'left' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{driver.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#555' }}>#{driver.number}</div>
                        </td>
                        {races.map(r => {
                          const res = driver.races[r.id];
                          return (
                            <td key={r.id} style={{ padding: '10px', textAlign: 'center' }}>
                              {res ? (
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{res.p1} / {res.p2}</div>
                                  {/* Speciální zobrazení Pole Position */}
                                  {res.pole && res.extra > 0 ? (
                                    <div style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 'bold' }}>+1b. POLE</div>
                                  ) : res.extra > 0 ? (
                                    <div style={{ color: '#aaa', fontSize: '0.7rem' }}>+{res.extra}b.</div>
                                  ) : null}
                                </div>
                              ) : <span style={{ color: '#333' }}>X</span>}
                            </td>
                          );
                        })}
                        <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.3rem', textAlign: 'center', background: 'rgba(251, 191, 36, 0.03)' }}>
                          {driver.totalPoints}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={races.length + 2} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
                          V této kategorii zatím nebyly v roce {selectedYear} nahrány žádné výsledky.
                        </td>
                      </tr>
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
