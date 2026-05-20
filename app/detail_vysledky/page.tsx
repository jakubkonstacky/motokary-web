import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const formatInterval = (interval: string | null) => {
  if (!interval) return '--:--.---';
  const parts = interval.split(':');
  if (parts.length < 3) return interval;
  const minutes = parts[1];
  const secondsWithMs = parts[2];
  const [seconds, ms] = secondsWithMs.split('.');
  const formattedMs = ms ? ms.substring(0, 3) : '000';
  return `${minutes}:${seconds}.${formattedMs}`;
};

export default async function DetailVysledkyPage(props: { 
  searchParams: Promise<{ id?: string }> 
}) {
  const searchParams = await props.searchParams;
  const raceId = searchParams.id ? parseInt(searchParams.id) : null;

  if (!raceId) {
    return (
      <div style={THEME.container}>
        <h1 style={THEME.mainTitle}>Závod nenalezen</h1>
        <Link href="/" style={{ color: '#fbbf24', textDecoration: 'none' }}>← Zpět na kalendář</Link>
      </div>
    );
  }

  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single();
  if (!race) return <div style={THEME.container}>Závod neexistuje.</div>;

  const { data: prevRace } = await supabase.from('races').select('id').eq('season_id', race.season_id).lt('id', raceId).order('id', { ascending: false }).limit(1).single();
  const { data: nextRace } = await supabase.from('races').select('id').eq('season_id', race.season_id).gt('id', raceId).order('id', { ascending: true }).limit(1).single();

  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', race.season_id).order('order_by', { ascending: true });
  
  // Přidali jsme 'team_name' do výběru z databáze
  const { data: results } = await supabase.from('results').select('*, drivers(full_name)').eq('race_id', raceId).order('total_points', { ascending: false });

  const d = new Date(race.race_date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const czechDays = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'];
  const dayName = czechDays[d.getDay()];
  const formattedDate = `${day}. ${month}. ${year} - ${dayName}`;

  return (
    <div style={THEME.container}>
      
      {/* 1. NAVIGAČNÍ ODKAZY NAHOŘE */}
      <div style={navRowTopStyle}>
        <div style={navColStyle}>
          {prevRace && <Link href={`/detail_vysledky?id=${prevRace.id}`} style={navLinkStyle}>← Předchozí</Link>}
        </div>
        <div style={navColStyle}>
          <Link href="/" style={navLinkStyle}>← Zpět na kalendář</Link>
        </div>
        <div style={navColStyle}>
          {nextRace && <Link href={`/detail_vysledky?id=${nextRace.id}`} style={navLinkStyle}>Následující →</Link>}
        </div>
      </div>

      {/* 2. NÁZEV A DATUM */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={titleRowStyle}>
          <h1 style={{ ...THEME.mainTitle, fontSize: '1.7rem', margin: 0, letterSpacing: '0.5px' }}>
            {race.name}
          </h1>
          <div style={{ color: '#888', fontSize: '1rem', fontWeight: '500', opacity: 0.7 }}>
            {formattedDate}
          </div>
        </div>
        {race.desc && (
          <div style={{ color: '#555', marginTop: '8px', fontStyle: 'italic', fontSize: '0.85rem' }}>
            {race.desc}
          </div>
        )}
      </div>

      {/* VÝPISY VÝSLEDKŮ PO KATEGORIÍCH */}
      {categories?.map((cat) => {
        const catResults = results?.filter(r => r.category_id === cat.id) || [];
        if (catResults.length === 0) return null;

        // ROZHODNUTÍ: Jde o týmový závod? (Alespoň jeden výsledek má vyplněný team_name)
        const isTeamRace = catResults.some(r => r.team_name);

        // Pokud jde o týmový závod, seskupíme položky podle jména týmu
        let displayRows: any[] = [];
        if (isTeamRace) {
          const teamsMap: { [key: string]: any } = {};
          catResults.forEach(r => {
            const tName = r.team_name || 'Bezejmenný tým';
            if (!teamsMap[tName]) {
              teamsMap[tName] = {
                team_name: tName,
                drivers: [],
                pos_qualy: r.pos_qualy,
                qualy_time: r.qualy_time,
                pos_race_1: r.pos_race_1,
                pos_race_2: r.pos_race_2,
                total_points: r.total_points,
                extra_point: r.extra_point,
                pole_position: r.pole_position
              };
            }
            if (r.drivers?.full_name) {
              teamsMap[tName].drivers.push(r.drivers.full_name);
            }
          });
          displayRows = Object.values(teamsMap).sort((a, b) => (b.total_points + b.extra_point) - (a.total_points + a.extra_point));
        } else {
          displayRows = catResults;
        }

        return (
          <div key={cat.id} style={{ marginBottom: '50px' }}>
            <h2 style={{ ...THEME.categoryTitle, borderLeft: '3px solid #fbbf24', paddingLeft: '12px', fontSize: '1.3rem', marginBottom: '15px' }}>
              🏆 {cat.name} {isTeamRace && <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>(Týmový závod)</span>}
            </h2>
            <div style={THEME.tableContainer}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ ...THEME.th, width: '50px' }}>#</th>
                    <th style={{ ...THEME.th, textAlign: 'left' }}>{isTeamRace ? 'Tým / Jezdci' : 'Jezdec'}</th>
                    <th style={THEME.th}>Kval. čas</th>
                    <th style={THEME.th}>Kval. poz.</th>
                    <th style={THEME.th}>1. jízda</th>
                    <th style={THEME.th}>2. jízda</th>
                    <th style={{ ...THEME.th, textAlign: 'right', color: '#fbbf24' }}>Body</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ ...THEME.td, fontWeight: '800', color: idx < 3 ? '#fbbf24' : '#444' }}>{idx + 1}.</td>
                      
                      {/* Vykreslení jména (buď jezdec nebo tým + jezdci pod sebou/vedle sebe) */}
                      <td style={{ ...THEME.td, textAlign: 'left' }}>
                        {isTeamRace ? (
                          <div>
                            <div style={{ fontWeight: '800', color: '#fff', fontSize: '1rem' }}>{row.team_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                              {row.drivers.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{row.drivers?.full_name}</span>
                        )}
                      </td>
                      
                      <td style={{ ...THEME.td, textAlign: 'center', fontFamily: 'monospace', color: '#aaa', fontSize: '0.9rem' }}>
                        {formatInterval(row.qualy_time)}
                        {row.pole_position && (
                          <span style={{ marginLeft: '6px' }} title="Pole Position">🥇</span>
                        )}
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'center', fontSize: '0.9rem' }}>
                        {row.pos_qualy ? `${row.pos_qualy}.` : '-'}
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'center', fontSize: '0.9rem' }}>{row.pos_race_1 ? `${row.pos_race_1}.` : '-'}</td>
                      <td style={{ ...THEME.td, textAlign: 'center', fontSize: '0.9rem' }}>{row.pos_race_2 ? `${row.pos_race_2}.` : '-'}</td>
                      <td style={{ ...THEME.td, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.1rem' }}>
                        {(row.total_points || 0) + (row.extra_point || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* 3. NAVIGAČNÍ ODKAZY DOLE */}
      <div style={navRowBottomStyle}>
        <div style={navColStyle}>
          {prevRace && <Link href={`/detail_vysledky?id=${prevRace.id}`} style={navLinkStyle}>← Předchozí</Link>}
        </div>
        <div style={navColStyle}>
          <Link href="/" style={navLinkStyle}>← Zpět na kalendář</Link>
        </div>
        <div style={navColStyle}>
          {nextRace && <Link href={`/detail_vysledky?id=${nextRace.id}`} style={navLinkStyle}>Následující →</Link>}
        </div>
      </div>
    </div>
  );
}

// --- STYLY ---
const titleRowStyle: any = { display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '12px', marginBottom: '5px', flexWrap: 'wrap' };
const navRowTopStyle: any = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '15px' };
const navRowBottomStyle: any = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '40px', marginBottom: '40px' };
const navColStyle: any = { minWidth: '130px', display: 'flex', justifyContent: 'center' };
const navLinkStyle: any = { color: '#fbbf24', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', opacity: 0.7, transition: 'opacity 0.2s' };
