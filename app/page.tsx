import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Vynutí načtení čerstvých dat při každé návštěvě (řeší problém s neaktualizací názvů závodů) 
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  // DYNAMICKÝ ROK: Kód si sám zjistí aktuální rok (např. 2026)
  const currentYear = new Date().getFullYear();
  
  // Načtení závodů pro aktuální rok
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .eq('season_id', currentYear)
    .order('id', { ascending: true });

  // Načtení kategorií pro aktuální rok
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', currentYear)
    .order('order_by', { ascending: true });

  // Načtení výsledků
  const { data: results } = await supabase
    .from('results')
    .select('total_points, category_id, drivers(full_name, start_number)');

  // Funkce pro výpočet TOP 3 pro každou kategorii
  const getTopThree = (catId: string) => {
    const grouped: any = {};
    results?.filter(r => r.category_id === catId).forEach((r: any) => {
      const name = r.drivers.full_name;
      if (!grouped[name]) {
        grouped[name] = { name, points: 0, number: r.drivers.start_number };
      }
      grouped[name].points += r.total_points;
    });
    return Object.values(grouped).sort((a: any, b: any) => b.points - a.points).slice(0, 3);
  };

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '150vh' }}>
      
      {/* HERO SEKCE - ČISTÝ ENZO CUP */}
      <section style={{ 
        height: '25vh', 
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), #050505), url("https://lchw6dtdl0iuc4mh.public.blob.vercel-storage.com/Draha_OV.jpg")`,
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: 'clamp(4rem, 15vw, 9rem)', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '-5px' }}>
          ENZO<br/><span style={{ color: '#fbbf24' }}>CUP</span>
        </h1>
        <p style={{ marginTop: '20px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.1rem' }}>
            Oficiální výsledky sezóny {currentYear}
        </p>
      </section>

      {/* OBSAH */}
      <div style={{ maxWidth: '1250px', margin: '-120px auto 100px', padding: '0 20px', position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
        
        {/* KALENDÁŘ ZÁVODŮ */}
        <section>
          <h2 style={headerStyle}>📅 Kalendář závodů</h2>
          <div style={glassCardStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {races && races.length > 0 ? races.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '20px', color: '#fbbf24', fontWeight: 'bold' }}>
                        {new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}.
                    </td>
                    <td style={{ padding: '20px', fontWeight: '700', fontSize: '1.1rem' }}>{r.name}</td>
                  </tr>
                )) : (
                  <tr><td style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Žádné naplánované závody</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* PRŮBĚŽNÉ POŘADÍ */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={headerStyle}>🏆 Průběžné pořadí</h2>
            {/* PŘEJMENOVANÝ ODKAZ DLE PŘÁNÍ */}
            <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Kompletni vysledky ->
            </Link>
          </div>
          
          {categories?.map(cat => {
            const drivers = getTopThree(cat.id);
            if (drivers.length === 0) return null;
            return (
              <div key={cat.id} style={{ ...glassCardStyle, marginBottom: '25px' }}>
                <div style={{ padding: '12px 20px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {cat.name}
                </div>
                {drivers.map((d: any, idx) => (
                  <div key={idx} style={{ display: 'flex', padding: '18px 20px', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}>
                    <span style={{ width: '35px', fontWeight: '900', fontSize: '1.3rem', color: idx === 0 ? '#fbbf24' : '#555' }}>{idx + 1}.</span>
                    <div style={{ flex: 1, fontWeight: '700' }}>{d.name}</div>
                    <div style={{ fontWeight: '900', color: '#fbbf24', fontSize: '1.2rem' }}>{d.points} <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>b.</span></div>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
