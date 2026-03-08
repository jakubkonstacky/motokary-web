import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function HomePage() {
  const currentYear = new Date().getFullYear();

  // Načtení závodů a všech kategorií
  const { data: races } = await supabase.from('races').select('*').eq('season_id', currentYear).order('id', { ascending: true });
  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', currentYear).order('order_by', { ascending: true });
  const { data: results } = await supabase.from('results').select('total_points, category_id, drivers(full_name, start_number)');

  // Pomocná funkce pro výpočet TOP 3 pro každou kategorii
  const calculateTopThree = (catId: string) => {
    const grouped: any = {};
    results?.filter(r => r.category_id === catId).forEach((r: any) => {
      const name = r.drivers.full_name;
      if (!grouped[name]) grouped[name] = { name, points: 0, number: r.drivers.start_number };
      grouped[name].points += r.total_points;
    });
    return Object.values(grouped).sort((a: any, b: any) => b.points - a.points).slice(0, 3);
  };

  return (
    <div style={{ backgroundColor: '#050505' }}>
      {/* HERO SEKCE: POUZE ENZO CUP */}
      <section style={{ 
        height: '75vh', backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), #050505), url("https://lchw6dtdl0iuc4mh.public.blob.vercel-storage.com/Draha_OV.jpg")`,
        backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'
      }}>
        <h1 style={{ fontSize: 'clamp(4rem, 15vw, 9rem)', fontWeight: '900', margin: 0, letterSpacing: '-6px', textTransform: 'uppercase' }}>
          ENZO<br/><span style={{ color: '#fbbf24' }}>CUP</span>
        </h1>
        <p style={{ marginTop: '20px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '2px' }}>Oficiální šampionát {currentYear}</p>
      </section>

      {/* OBSAH S VÝSLEDKY A KALENDÁŘEM */}
      <div style={{ maxWidth: '1250px', margin: '-120px auto 100px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
          
          {/* KALENDÁŘ */}
          <div>
            <h2 style={headerStyle}>📅 Kalendář závodů</h2>
            <div style={glassCardStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {races?.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '20px', color: '#fbbf24', fontWeight: 'bold' }}>{new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}.</td>
                      <td style={{ padding: '20px', fontWeight: '700' }}>{r.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* POŘADÍ PRO VŠECHNY KATEGORIE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={headerStyle}>🏆 Průběžné pořadí</h2>
              <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}>TABULKY →</Link>
            </div>
            
            {categories?.map((cat) => {
              const drivers = calculateTopThree(cat.id);
              if (drivers.length === 0) return null;
              return (
                <div key={cat.id} style={{ ...glassCardStyle, marginBottom: '20px' }}>
                  <div style={{ padding: '12px 20px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase' }}>{cat.name}</div>
                  {drivers.map((d: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', padding: '15px 20px', borderBottom: idx === 2 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ width: '35px', fontWeight: '900', color: idx === 0 ? '#fbbf24' : '#555' }}>{idx + 1}.</span>
                      <div style={{ flex: 1, fontWeight: '700' }}>{d.name}</div>
                      <div style={{ fontWeight: '900', color: '#fbbf24' }}>{d.points} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>b.</span></div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const glassCardStyle: any = { background: 'rgba(12, 12, 12, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' };
const headerStyle: any = { fontSize: '1.5rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px' };
