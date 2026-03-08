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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' }}>
      
      <h1 style={{ fontSize: '2.5rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center' }}>
        Výsledky Šampionátu
      </h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
        {years.map(year => (
          <Link 
            key={year} 
            href={`/vysledky?year=${year}`}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: '700',
              background: selectedYear === year ? '#fbbf24' : 'rgba(255,255,255,0.05)',
              color: selectedYear === year ? '#000' : '#888',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Sezóna {year}
          </Link>
        ))}
      </div>

      {categories?.map((cat) => {
        const catResults = resultsData?.filter(r => r.category_id === cat.id) || [];
        
        const driverStats: any = {};
        catResults.forEach(r => {
          const name = r.drivers?.full_name;
          if (!name) return;
          if (!driverStats[name]) {
            driverStats[name] = {
              name,
              raceData: {},
              total: 0
            };
          }
          
          const pointsBase = (r.total_points || 0);
          const pointsExtra = (r.extra_point || 0);
          
          driverStats[name].raceData[r.race_id] = {
            displayPoints: pointsBase, // TADY JE ZMĚNA: Pouze základní body
            hasExtra: pointsExtra > 0,
            p1: r.pos_race_1,
            p2: r.pos_race_2
          };
          // CELKEM se ale stále počítá se vším všudy
          driverStats[name].total += (pointsBase + pointsExtra);
        });

        const sortedDrivers = Object.values(driverStats).sort((a: any, b: any) => b.total - a.total);
        if (sortedDrivers.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fbbf24', marginBottom: '20px', textTransform: 'uppercase' }}>
              🏆 {cat.name}
            </h2>
            
            <div style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Jezdec</th>
                    {races?.map((r, index) => (
                      <th key={r.id} style={{ ...thStyle, textAlign: 'center' }}>
                        {index + 1}. závod
                      </th>
                    ))}
                    <th style={{ ...thStyle, color: '#fbbf24', textAlign: 'right' }}>CELKEM</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDrivers.map((d: any, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={tdStyle}>{idx + 1}.</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{d.name}</td>
                      {races?.map(r => {
                        const raceInfo = d.raceData[r.id];
                        return (
                          <td key={r.id} style={{ ...tdStyle, textAlign: 'center' }}>
                            {raceInfo ? (
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>
                                  {raceInfo.displayPoints}
                                  {raceInfo.hasExtra && (
                                    <span style={{ color: '#fbbf24', fontSize: '0.75rem', verticalAlign: 'top', marginLeft: '1px', fontWeight: '900' }}>+1</span>
                                  )}
                                </div>
                                {r.show_race_position && (
                                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
                                    {raceInfo.p1}. / {raceInfo.p2}. jízda
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ opacity: 0.1 }}>0</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.2rem' }}>
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

const tableContainerStyle: any = {
  background: 'rgba(12, 12, 12, 0.8)',
  backdropFilter: 'blur(15px)',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  overflowX: 'auto'
};

const thStyle: any = { padding: '20px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#666', letterSpacing: '1px' };
const tdStyle: any = { padding: '20px', fontSize: '1rem' };
