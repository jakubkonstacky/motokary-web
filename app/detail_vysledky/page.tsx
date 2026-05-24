import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Vylepšená čistící funkce pro zobrazení časů ve formátu "SS.MMM" nebo "MM:SS.MMM"
const formatInterval = (interval: string | null) => {
  if (!interval) return '--:--.---';
  let str = interval.toString().trim();
  
  // Odstranění zbytečných úvodních nul z Postgres intervalu
  str = str.replace(/^00:/, '').replace(/^00:/, '');
  // Oprava případné dvojtečky na tečku před milisekundami
  str = str.replace(/:(\d{3})$/, '.$1');
  
  return str;
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
  
  // Načteme všechny potřebné sloupce včetně nově přidaných časů jednotlivých jízd
  const { data: results } = await supabase.from('results').select('*, drivers(full_name), categories(name)').eq('race_id', raceId);

  const d = new Date(race.race_date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const czechDays = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'];
  const dayName = czechDays[d.getDay()];
  const formattedDate = `${day}. ${month}. ${year} - ${dayName}`;

  const isTeamRace = results?.some(r => r.team_name) || false;

  return (
    <div style={THEME.container}>
      
      {/* NAVIGAČNÍ ODKAZY NAHOŘE */}
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

      {/* NÁZEV A DATUM */}
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

      {/* ZOBRAZENÍ VÝSLEDKŮ */}
      {isTeamRace ? (
        // ===================================================================
        // JEDNA JEDINÁ KOMBINOVANÁ TABULKA PRO TÝMOVÝ ZÁVOD
        // ===================================================================
        (() => {
          const teamsMap: { [key: string]: any } = {};
          
          results?.forEach(r => {
            const tName = r.team_name || 'Bezejmenný tým';
            if (!teamsMap[tName]) {
              teamsMap[tName] = {
                team_name: tName,
                driversList: [],
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
              const catName = r.categories?.name ? r.categories.name.replace(' CUP', '') : '';
              teamsMap[tName].driversList.push({
                name: r.drivers.full_name,
                cat: catName
              });
            }
          });

          const sortedTeams = Object.values(teamsMap).sort(
            (a: any, b: any) => {
              const scoreA = (parseInt(a.total_points, 10) || 0) + (parseInt(a.extra_point, 10) || 0);
              const scoreB = (parseInt(b.total_points, 10) || 0) + (parseInt(b.extra_point, 10) || 0);
              return scoreB - scoreA;
            }
          );

          return (
            <div style={{ marginBottom: '50px' }}>
              <h2 style={{ ...THEME.categoryTitle, borderLeft: '3px solid #fbbf24', paddingLeft: '12px', fontSize: '1.3rem', marginBottom: '15px' }}>
                🏆 Výsledky Vytrvalostního Týmového Závodu
              </h2>
              <div style={THEME.tableContainer}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ ...THEME.th, width: '50px' }}>#</th>
                      <th style={{ ...THEME.th, textAlign: 'left' }}>Sestava týmu (Kategorie)</th>
                      <th style={THEME.th}>Kvalifikace</th>
                      <th style={THEME.th}>Závod (Čas/Poz.)</th>
                      <th style={{ ...THEME.th, textAlign: 'right', color: '#fbbf24' }}>Body</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.map((team: any, idx: number) => {
                      const cisteBody = parseInt(team.total_points, 10) || 0;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ ...THEME.td, fontWeight: '800', color: idx < 3 ? '#fbbf24' : '#444' }}>{idx + 1}.</td>
                          <td style={{ ...THEME.td, textAlign: 'left' }}>
                            <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '1.05rem', marginBottom: '4px' }}>
                              {team.team_name}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem' }}>
                              {team.driversList.map((d: any, i: number) => (
                                <span key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <strong style={{ color: '#fff' }}>{d.name}</strong> 
                                  {d.cat && <span style={{ color: '#888', marginLeft: '4px', fontSize: '0.75rem' }}>({d.cat})</span>}
                                </span>
                              ))}
                            </div>
                          </td>
                         {/* KVALIFIKACE */}
                          <td style={{ ...THEME.td, textAlign: 'center', fontFamily: 'monospace', color: '#aaa', fontSize: '0.9rem' }}>
                            {formatInterval(team.qualy_time)}
                             </div>
                             <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>
                               {team.pole_position && <span style={{ marginLeft: '6px' }} title="Pole Position">🥇</span>}
                              ({team.pos_qualy ? `${team.pos_qualy}. poz` : '-'})
                            </div>
                          </td>

                         {/* 1. JÍZDA - DOPLNĚN ČAS */}
                          <td style={{ ...THEME.td, textAlign: 'center' }}>
                            <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: '0.9rem' }}>
                              {formatInterval(team.race_1_time)}
                            </div>
                           <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>
                              ({team.pos_race_1 ? `${team.pos_race_1}. poz` : '-'})
                            </div>                            
                          </td>

                          <td style={{ ...THEME.td, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.15rem' }}>
                            {cisteBody + (parseInt(team.extra_point, 10) || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      ) : (
        // ===================================================================
        // STANDARDNÍ ROZPAD PODLE KATEGORIÍ (VČETNĚ ČASŮ JÍZD 1 A 2)
        // ===================================================================
        categories?.map((cat) => {
          const catResults = results?.filter(r => r.category_id === cat.id) || [];
          if (catResults.length === 0) return null;

          // Pevná definice pořadí dne (obchází chybu v tabulce ze souboru)
          const orderMap: Record<string, number> = {
            'Tomáš Musila': 1,
            'Jakub Konštacký': 2,
            'Roman Kadlíček': 3,
            'Tomáš Veverka': 4,
            'Lukáš Kupka': 5
          };

          const sortedResults = [...catResults].sort((a: any, b: any) => {
            const nameA = a.drivers?.full_name || '';
            const nameB = b.drivers?.full_name || '';
            return (orderMap[nameA] || 99) - (orderMap[nameB] || 99);
          });

          return (
            <div key={cat.id} style={{ marginBottom: '50px' }}>
              <h2 style={{ ...THEME.categoryTitle, borderLeft: '3px solid #fbbf24', paddingLeft: '12px', fontSize: '1.3rem', marginBottom: '15px' }}>
                🏆 {cat.name}
              </h2>
              <div style={THEME.tableContainer}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ ...THEME.th, width: '50px' }}>#</th>
                      <th style={{ ...THEME.th, textAlign: 'left' }}>Jezdec</th>
                      <th style={THEME.th}>Kvalifikace XX</th>
                      <th style={THEME.th}>1. jízda (Poz. / Čas)</th>
                      <th style={THEME.th}>2. jízda (Poz. / Čas)</th>
                      <th style={{ ...THEME.th, textAlign: 'right', color: '#fbbf24' }}>Body</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((row, idx) => {
                      const cisteBody = parseInt(row.total_points, 10) || 0;
                      const extraBod = parseInt(row.extra_point, 10) || 0;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ ...THEME.td, fontWeight: '800', color: idx < 3 ? '#fbbf24' : '#444' }}>{idx + 1}.</td>
                          <td style={{ ...THEME.td, textAlign: 'left' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{row.drivers?.full_name}</span>
                          </td>
                          
                          {/* KVALIFIKACE */}
                          <td style={{ ...THEME.td, textAlign: 'center' }}>
                            <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: '0.9rem' }}>
                              {formatInterval(row.qualy_time)}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>
                              ({row.pos_qualy ? `${row.pos_qualy}. poz` : '-'})
                              {row.pole_position && <span style={{ marginLeft: '4px' }} title="Pole Position">🥇 PP</span>}
                            </div>
                          </td>

                          {/* 1. JÍZDA - DOPLNĚN ČAS */}
                          <td style={{ ...THEME.td, textAlign: 'center' }}>
                            <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: '0.9rem' }}>
                              {formatInterval(row.race_1_time)}
                            </div>
                           <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>
                              ({row.pos_race_1 ? `${row.pos_race_1}. poz` : '-'})
                            </div>                            
                          </td>

                          {/* 2. JÍZDA - DOPLNĚN ČAS */}
                          <td style={{ ...THEME.td, textAlign: 'center' }}>
                            <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: '0.9rem' }}>
                              {formatInterval(row.race_2_time)}
                            </div>
                           <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>
                              ({row.pos_race_2 ? `${row.pos_race_2}. poz` : '-'})
                            </div>
                          </td>

                          {/* BODY DO ŠAMPIONÁTU */}
                          <td style={{ ...THEME.td, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.1rem' }}>
                            <div style={{ display: 'flex', itemsCenter: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <span>{cisteBody}</span>
                              {extraBod > 0 && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                                  +{extraBod}b
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {/* NAVIGAČNÍ ODKAZY DOLE */}
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
