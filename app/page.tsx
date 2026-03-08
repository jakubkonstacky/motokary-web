import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Inicializace Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const currentYear = new Date().getFullYear();

  // 1. Načtení závodů pro aktuální sezónu
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .eq('season_id', currentYear)
    .order('id', { ascending: true });

  // 2. Načtení hlavní kategorie pro náhled pořadí
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', currentYear)
    .order('order_by', { ascending: true })
    .limit(1);

  const mainCategory = categories?.[0];
  let topDrivers: any[] = [];

  // 3. Výpočet TOP 3 jezdců pro náhled na úvodní straně
  if (mainCategory) {
    const { data: res } = await supabase
      .from('results')
      .select('total_points, drivers(full_name, start_number)')
      .eq('category_id', mainCategory.id);

    const grouped: any = {};
    res?.forEach((r: any) => {
      const name = r.drivers.full_name;
      if (!grouped[name]) {
        grouped[name] = { name, points: 0, number: r.drivers.start_number };
      }
      grouped[name].points += r.total_points;
    });

    topDrivers = Object.values(grouped)
      .sort((a: any, b: any) => b.points - a.points)
      .slice(0, 3);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505' }}>
      
      {/* HERO SEKCE - Horní část s fotkou dráhy */}
      <section style={{ 
        height: '80vh', 
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), #050505), url("https://lchw6dtdl0iuc4mh.public.blob.vercel-storage.com/Draha_OV.jpg")`,
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        textAlign: 'center', 
        padding: '0 20px' 
      }}>
        <h1 style={{ 
          fontSize: 'clamp(4rem, 15vw, 9rem)', 
          fontWeight: '900', 
          margin: 0, 
          letterSpacing: '-6px', 
          lineHeight: '0.8',
          textTransform: 'uppercase'
        }}>
          ENZO<br/><span style={{ color: '#fbbf24' }}>CUP</span>
        </h1>
        <p style={{ marginTop: '30px', fontSize: '1.2rem', color: '#ccc', maxWidth: '600px', fontWeight: '300', letterSpacing: '3px', textTransform: 'uppercase' }}>
          Oficiální šampionát motokár {currentYear}
        </p>
      </section>

      {/* HLAVNÍ OBSAH - Kalendář a Pořadí */}
      <div style={{ maxWidth: '1250px', margin: '-140px auto 100px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', alignItems: 'start' }}>
          
          {/* LEVÝ SLOUPY: KALENDÁŘ */}
          <section>
            <h2 style={headerStyle}>
              <span style={{ fontSize: '1.4rem' }}>📅</span> Kalendář závodů
            </h2>
            <div style={glassCardStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 'normal' }}>Datum</th>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 'normal' }}>Závod</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'normal' }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {races && races.length > 0 ? races.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '20px', color: '#fbbf24', fontWeight: '800' }}>
                        {new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}.
                      </td>
                      <td style={{ padding: '20px', fontWeight: '700', fontSize: '1.1rem' }}>{r.name}</td>
                      <td style={{ padding: '20px', textAlign: 'right', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>{r.id}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Sezóna se připravuje...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PRAVÝ SLOUPY: PRŮBĚŽNÉ POŘADÍ */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={headerStyle}>
                <span style={{ fontSize: '1.4rem' }}>🏆</span> Průběžné pořadí
              </h2>
              <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 'bold', letterSpacing: '1px' }}>
                TABULKY →
              </Link>
            </div>
            
            <div style={glassCardStyle}>
              <div style={{ padding: '12px 25px', background: 'rgba(251, 191, 36, 0.1)', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase' }}>{mainCategory?.name || 'Šampionát'}</span>
                <span style={{ color: 'rgba(251, 191, 36, 0.4)', fontSize: '0.7rem' }}>TOP 3</span>
              </div>

              <div style={{ padding: '5px 0' }}>
                {topDrivers.length > 0 ? topDrivers.map((d, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', padding: '20px 25px', 
                    borderBottom: idx === topDrivers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' 
                  }}>
                    <span style={{ 
                      width: '40px', fontWeight: '900', fontSize: '1.6rem',
                      color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#92400e' 
                    }}>
                      {idx + 1}.
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '1.15rem' }}>{d.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>#{d.number}</div>
                    </div>
                    <div style={{ fontWeight: '900', color: '#fbbf24', fontSize: '1.4rem' }}>
                      {d.points} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>b.</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Zatím neodjet žádný závod.</div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// SPOLEČNÉ STYLY
const glassCardStyle: any = { 
  background: 'rgba(12, 12, 12, 0.8)', 
  backdropFilter: 'blur(16px)', 
  borderRadius: '24px', 
  border: '1px solid rgba(255,255,255,0.08)', 
  overflow: 'hidden',
  boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6)'
};

const headerStyle: any = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  fontSize: '1.6rem', 
  margin: 0, 
  color: '#fff', 
  fontWeight: '900',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};
