import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function HomePage() {
  const currentYear = new Date().getFullYear();

  // Načtení dat (stejné jako předtím)
  const { data: races } = await supabase.from('races').select('*').eq('season_id', currentYear).order('id', { ascending: true });
  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', currentYear).order('order_by', { ascending: true }).limit(1);
  
  let topDrivers: any[] = [];
  if (categories?.[0]) {
    const { data: res } = await supabase.from('results').select('total_points, drivers(full_name, start_number)').eq('category_id', categories[0].id);
    const grouped: any = {};
    res?.forEach((r: any) => {
      const name = r.drivers.full_name;
      if (!grouped[name]) grouped[name] = { name, points: 0, number: r.drivers.start_number };
      grouped[name].points += r.total_points;
    });
    topDrivers = Object.values(grouped).sort((a: any, b: any) => b.points - a.points).slice(0, 3);
  }

  return (
    <div>
      {/* 1. HERO SECTION (Tady to začíná vypadat jako Motopark) */}
      <section style={{ 
        height: '70vh', 
        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3), #050505), url("https://images.unsplash.com/photo-1547447134-cd3f5c716030?q=80&w=2000")', // Později nahradíme vaší fotkou
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 20px'
      }}>
        <h1 style={{ fontSize: '5rem', fontWeight: '900', margin: 0, letterSpacing: '-3px', lineHeight: '0.9' }}>
          RYCHLOST.<br/><span style={{ color: '#fbbf24' }}>ADRENALIN.</span>
        </h1>
        <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#ccc', maxWidth: '600px', fontWeight: '300' }}>
          Sledujte cestu týmu Konstacký Racing v šampionátu motokár {currentYear}.
        </p>
      </section>

      {/* 2. DATÁ SEKCÍ (Karty s daty) */}
      <div style={{ maxWidth: '1200px', margin: '-100px auto 100px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          {/* BOX: KALENDÁŘ */}
          <div style={glassCardStyle}>
            <h2 style={cardTitleStyle}><span>📅</span> Kalendář závodů</h2>
            <div style={{ marginTop: '20px' }}>
              {races?.map(r => (
                <div key={r.id} style={raceRowStyle}>
                  <div style={{ color: '#fbbf24', fontWeight: '800', width: '60px' }}>{new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}</div>
                  <div style={{ flex: 1, fontWeight: '600' }}>{r.name}</div>
                  <div style={{ color: '#333', fontSize: '0.8rem' }}>#{r.id}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BOX: POŘADÍ */}
          <div style={glassCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={cardTitleStyle}><span>🏆</span> Průběžné pořadí</h2>
              <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}>DETAIL →</Link>
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ background: '#1a1a1a', padding: '8px 15px', borderRadius: '5px', fontSize: '0.8rem', color: '#fbbf24', marginBottom: '15px', display: 'inline-block' }}>
                {categories?.[0]?.name}
              </div>
              {topDrivers.map((d, idx) => (
                <div key={idx} style={driverRowStyle}>
                  <span style={{ width: '30px', fontWeight: '900', color: idx === 0 ? '#fbbf24' : '#555' }}>{idx + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700' }}>{d.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#444' }}>#{d.number}</div>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '1.2rem' }}>{d.points} <span style={{ fontSize: '0.7rem', color: '#444' }}>b.</span></div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// STYLOVÉ KOMPONENTY (PRO ČISTÝ KÓD)
const glassCardStyle: any = { background: 'rgba(20, 20, 20, 0.8)', backdropFilter: 'blur(15px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', padding: '35px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' };
const cardTitleStyle: any = { fontSize: '1.4rem', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' };
const raceRowStyle: any = { display: 'flex', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' };
const driverRowStyle: any = { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' };
