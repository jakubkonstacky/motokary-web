import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);


export default async function HomePage() {
  const currentYear = new Date().getFullYear();

  // 1. Načtení závodů
  const { data: races } = await supabase.from('races').select('*').eq('season_id', currentYear).order('id', { ascending: true });

  // 2. Načtení VŠECH kategorií a výsledků
  const { data: allCategories } = await supabase.from('categories').select('*').eq('season_id', currentYear).order('order_by', { ascending: true });
  const { data: allResults } = await supabase.from('results').select('total_points, category_id, drivers(full_name, start_number)');

  // Pomocná funkce pro seskupení TOP 3 pro každou kategorii
  const getTopThree = (catId: string) => {
    const grouped: any = {};
    allResults?.filter(r => r.category_id === catId).forEach((r: any) => {
      const name = r.drivers.full_name;
      if (!grouped[name]) grouped[name] = { name, points: 0, number: r.drivers.start_number };
      grouped[name].points += r.total_points;
    });
    return Object.values(grouped).sort((a: any, b: any) => b.points - a.points).slice(0, 3);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505' }}>
      {/* HERO SEKCE */}
      <section style={{ 
        height: '75vh', backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), #050505), url("https://lchw6dtdl0iuc4mh.public.blob.vercel-storage.com/Draha_OV.jpg")`,
        backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'
      }}>
        <h1 style={{ fontSize: 'clamp(4rem, 15vw, 9rem)', fontWeight: '900', margin: 0, letterSpacing: '-6px', lineHeight: '0.8', textTransform: 'uppercase' }}>
          ENZO<br/><span style={{ color: '#fbbf24' }}>CUP</span>
        </h1>
        <p style={{ marginTop: '30px', fontSize: '1.2rem', color: '#ccc', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Oficiální šampionát motokár {currentYear}
        </p>
      </section>

      {/* OBSAH */}
      <div style={{ maxWidth: '1250px', margin: '-120px auto 100px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', alignItems: 'start' }}>
          
          {/* KALENDÁŘ */}
          <section>
            <h2 style={headerStyle}>📅 Kalendář závodů</h2>
            <div style={glassCardStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 20px', textAlign: 'left' }}>Datum</th>
                    <th style={{ padding: '15px 20px', textAlign: 'left' }}>Závod</th>
                  </tr>
                </thead>
                <tbody>
                  {races?.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '20px', color: '#fbbf24', fontWeight: '800' }}>{new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}.</td>
                      <td style={{ padding: '20px', fontWeight: '700' }}>{r.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PRŮBĚŽNÉ POŘADÍ - VŠECHNY KATEGORIE */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={headerStyle}>🏆 Průběžné pořadí</h2>
              <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 'bold' }}>VŠECHNY TABULKY →</Link>
            </div>
            
            {allCategories?.map((cat) => {
              const drivers = getTopThree(cat.id);
              if (drivers.length === 0) return null;
              return (
                <div key={cat.id} style={{ ...glassCardStyle, marginBottom: '20px' }}>
                  <div style={{ padding: '12px 20px', background: 'rgba(251, 191, 36, 0.1)', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {cat.name}
                  </div>
                  {drivers.map((d: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: idx === 2 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ width: '35px', fontWeight: '900', color: idx === 0 ? '#fbbf24' : '#555' }}>{idx + 1}.</span>
                      <div style={{ flex: 1, fontWeight: '700' }}>{d.name}</div>
                      <div style={{ fontWeight: '900', color: '#fbbf24' }}>{d.points} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>b.</span></div>
                    </div>
                  ))}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}

const glassCardStyle: any = { background: 'rgba(12, 12, 12, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' };
const headerStyle: any = { fontSize: '1.6rem', color: '#fff', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 20px 0' };
