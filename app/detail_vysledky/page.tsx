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
  const { data: results } = await supabase.from('results').select('*, drivers(full_name)').eq('race_id', raceId).order('total_points', { ascending: false });

  // Formátování data: 26. 04. 2026 - NE
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
      <div style={{ ...navRowStyle, marginBottom: '20px' }}>
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

      {/* 2. HLAVNÍ NÁZEV A DATUM POD ODKAZY */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={titleRowStyle}>
          <h1 style={{ ...THEME.mainTitle, fontSize: '3.5rem', margin: 0 }}>
            {race.name}
          </h1>
          <div style={{ color: '#888', fontSize: '1.2rem', fontWeight: '500', paddingBottom: '10px' }}>
            {formattedDate}
          </div>
        </div>

        {race.desc && (
          <div style={{ color: '#555', marginTop: '10px', fontStyle: 'italic' }}>
            {race.desc}
          </div>
        )}
      </div>
