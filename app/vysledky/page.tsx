import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

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
    <div style={containerStyle}>
      
      {/* Hlavní nadpis - Text posunut výše */}
      <h1 style={mainTitleStyle}>Výsledky šampionátu</h1>

      {/* Navigace mezi sezónami - Zobrazen pouze rok */}
      <div style={seasonNavStyle}>
        {years.map(year => (
          <Link key={year} href={`/vysledky?year=${year}`} style={{
            ...seasonLinkBase,
            background: selectedYear === year ? '#fbbf24' : 'rgba(255,255,255,0.05)',
            color: selectedYear === year ? '#000' : '#888',
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
            <h2 style={categoryTitleStyle}>🏆 {cat.name}</h2>
            <div style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Jezdec</th>
                    {races?.map((r, i) => <th key={r.id} style={{ ...thStyle, textAlign: 'center' }}>{i + 1}.</th>)}
                    <th style={{ ...thStyle, color: '#fbbf24', textAlign: 'right' }}>CELKEM</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDrivers.map((d: any, idx) => (
                    <tr key={idx} style={tableRowStyle}>
                      <td style={tdStyle}>{idx + 1}.</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{d.name}</td>
                      {races?.map(r => {
                        const info = d.raceData[r.id];
                        return (
                          <td key={r.id} style={{ ...tdStyle, textAlign: 'center' }}>
                            {info ? (
                              <div>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>
                                  {info.display}
                                  {info.extra && <span style={extraPointStyle}>+1</span>}
                                </div>
                                {r.show_race_position && (
                                  <div style={positionSubStyle}>{info.p1}. / {info.p2}. jízda</div>
                                )}
                              </div>
                            ) : <span style={{ opacity: 0.1 }}>0</span>}
                          </td>
                        );
                      })}
                      <td style={totalCellStyle}>{d.total}</td>
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

// KONSTANTY STYLŮ
const containerStyle: any = { 
  maxWidth: '1400px', 
  margin: '0 auto', 
  padding: '10px 20px 40px 20px', // Snížené horní polstrování pro posun textu nahoru
  minHeight: '100vh' 
};

const mainTitleStyle: any = { 
  fontSize: '2.5rem', 
  fontWeight: '800', 
  color: '#fbbf24', 
  textTransform: 'none', 
  marginBottom: '40px', 
  textAlign: 'center',
  marginTop: '0' // Odstranění horního okraje pro maximální posun nahoru
};



const categoryTitleStyle: any = { fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24', marginBottom: '25px', textTransform: 'none' };
const seasonNavStyle: any = { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px' };
const seasonLinkBase: any = { padding: '10px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: 'none' };
const tableContainerStyle: any = { background: 'rgba(12, 12, 12, 0.8)', backdropFilter: 'blur(15px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' };
const thStyle: any = { padding: '20px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#666' };
const tdStyle: any = { padding: '20px', fontSize: '1rem' };
const extraPointStyle: any = { color: '#fbbf24', fontSize: '0.75rem', verticalAlign: 'top', marginLeft: '1px', fontWeight: '900' };
const positionSubStyle: any = { fontSize: '0.7rem', color: '#888', marginTop: '4px' };
const totalCellStyle: any = { ...tdStyle, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.2rem' };
const tableHeaderRowStyle: any = { borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.03)' };
const tableRowStyle: any = { borderBottom: '1px solid rgba(255,255,255,0.05)' };
