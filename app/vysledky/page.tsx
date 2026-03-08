import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { THEME } from '@/lib/theme'; // Import centrálních stylů

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function VysledkyPage({ searchParams }: { searchParams: { year?: string } }) {
  const { data: allSeasons } = await supabase.from('races').select('season_id');
  const years = Array.from(new Set(allSeasons?.map(s => s.season_id))).sort((a, b) => b - a);
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : (years[0] || new Date().getFullYear());

  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', selectedYear).order('order_by', { ascending: true });
  const { data: races } = await supabase.from('races').select('*').eq('season_id', selectedYear).order('id', { ascending: true });
  const { data: resultsData } = await supabase.from('results').select('*, drivers(full_name)');

  return (
    <div style={THEME.container}>
      
      <h1 style={THEME.mainTitle}>Výsledky šampionátu</h1>

      {/* Navigace s tlačítky jako v galerii */}
      <div style={THEME.seasonNav}>
        {years.map(year => (
          <Link key={year} href={`/vysledky?year=${year}`} style={{
            ...THEME.seasonLinkBase,
            background: selectedYear === year ? '#fbbf24' : 'rgba(255,255,255,0.08)',
            color: selectedYear === year ? '#000' : '#fff', // Bílý text pro neaktivní rok
          }}>
            {year}
          </Link>
        ))}
      </div>

      {categories?.map((cat) => {
        const catResults = resultsData?.filter(r => r.category_id === cat.id) || [];
        const driverStats: any = {};

        catResults.forEach(r => {
          const name = r.drivers?.full_name;
          if (!name) return;
          if (!driverStats[name]) driverStats[name] = { name, raceData: {}, total: 0 };
          
          const pBase = r.total_points || 0;
          const pExtra = r.extra_point || 0;
          
          driverStats[name].raceData[r.race_id] = { display: pBase, extra: pExtra > 0, p1: r.pos_race_1, p2: r.pos_race_2 };
          driverStats[name].total += (pBase + pExtra);
        });

        const sortedDrivers = Object.values(driverStats).sort((a: any, b: any) => b.total - a.total);
        if (sortedDrivers.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: '80px' }}>
            <h2 style={THEME.categoryTitle}>🏆 {cat.name}</h2>
            <div style={THEME.tableContainer}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={THEME.th}>#</th>
                    <th style={THEME.th}>Jezdec</th>
                    {races?.map((r, i) => <th key={r.id} style={{ ...THEME.th, textAlign: 'center' }}>{i + 1}.</th>)}
                    <th style={{ ...THEME.th, color: '#fbbf24', textAlign: 'right' }}>CELKEM</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDrivers.map((d: any, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={THEME.td}>{idx + 1}.</td>
                      <td style={{ ...THEME.td, fontWeight: '700' }}>{d.name}</td>
                      {races?.map(r => {
                        const info = d.raceData[r.id];
                        return (
                          <td key={r.id} style={{ ...THEME.td, textAlign: 'center' }}>
                            {info ? (
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>
                                  {info.display}
                                  {info.extra && <span style={THEME.extraPoint}>+1</span>}
                                </div>
                                {r.show_race_position && (
                                  <div style={THEME.positionSub}>{info.p1}. / {info.p2}. jízda</div>
                                )}
                              </div>
                            ) : <span style={{ opacity: 0.1 }}>0</span>}
                          </td>
                        );
                      })}
                      <td style={{ ...THEME.td, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.2rem' }}>
                        {d.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
