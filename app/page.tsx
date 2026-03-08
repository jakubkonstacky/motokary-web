import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const currentYear = new Date().getFullYear();

  // 1. Načtení závodů
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .eq('season_id', currentYear)
    .order('id', { ascending: true });

  // 2. Načtení Top 3 pro hlavní kategorii (např. Enzo Cup)
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', currentYear)
    .order('order_by', { ascending: true })
    .limit(1);

  const mainCategory = categories?.[0];
  let topDrivers: any[] = [];

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
      
      {/* HERO SEKCE S TVOJI FOTKOU DRÁHY */}
      <section style={{ 
        height: '75vh', 
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), #050505), url("https://lchw6dtdl0iuc4mh.public.blob.vercel-storage.com/Draha_OV.jpg")`,
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
          fontSize: 'clamp(3rem, 10vw, 6rem)', 
          fontWeight: '900', 
          margin: 0, 
          letterSpacing: '-4px', 
          lineHeight: '0.85',
          textTransform: 'uppercase'
        }}>
          KONSTACKÝ<br/><span style={{ color: '#fbbf24' }}>RACING</span>
        </h1>
        <p style={{ marginTop: '30px', fontSize: '1.2rem', color: '#ccc', maxWidth: '600px', fontWeight: '300', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Oficiální výsledky a kalendář sezóny {currentYear}
        </p>
      </section>

      {/* OBSAHOVÁ ČÁST (Karty přesahující do Hero sekce) */}
      <div style={{ maxWidth: '1250px', margin: '-120px auto 100px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '35px', alignItems: 'start' }}>
          
          {/* LEVÁ STRANA: KALENDÁŘ */}
          <div>
            <h2 style={headerStyle}>
              <span style={{ fontSize: '1.4rem' }}>📅</span> Kalendář závodů
            </h2>
            <div style={glassCardStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'normal' }}>Datum</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'normal' }}>Název závodu</th>
                    <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'normal' }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {races?.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '18px 15px', color: '#fbbf24', fontWeight: '800' }}>
                        {new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}.
                      </td>
                      <td style={{ padding: '18px 15px', fontWeight: '600', fontSize: '1.05rem' }}>{r.name}</td>
                      <td style={{ padding: '18px 15px', textAlign: 'right', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>{r.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRAVÁ STRANA: POŘADÍ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={headerStyle}>
                <span style={{ fontSize: '1.4rem' }}>🏆</span> Průběžné pořadí
              </h2>
              <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 'bold' }}>
                CELÁ TABULKA →
              </Link>
            </div>
            
            <div style={glassCardStyle}>
              <div style={{ padding: '12px 20px', background: 'rgba(251, 191, 36, 0.1)', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase' }}>{mainCategory?.name || 'Šampionát'}</span>
                <span style={{ color: 'rgba(251, 191, 36, 0.4)', fontSize: '0.7rem' }}>TOP 3</span>
              </div>

              <div style={{ padding: '10px 0' }}>
                {topDrivers.map((d, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', padding: '20px', 
                    borderBottom: idx === topDrivers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' 
                  }}>
                    <span style={{ 
                      width: '35px', fontWeight: '900', fontSize: '1.4rem',
                      color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#92400e' 
                    }}>
                      {idx + 1}.
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{d.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>#{d.number}</div>
                    </div>
                    <div style={{ fontWeight: '900', color: '#fbbf24', fontSize: '1.3rem' }}>
                      {d.points} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>b.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// SPOLEČNÉ STYLY PRO MODERNÍ DESIGN
const glassCardStyle: any = { 
  background: 'rgba(15, 15, 15, 0.75)', 
  backdropFilter: 'blur(12px)', 
  borderRadius: '20px', 
  border: '1px solid rgba(255,255,255,0.08)', 
  overflow: 'hidden',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const headerStyle: any = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  fontSize: '1.5rem', 
  margin: '0 0 20px 0', 
  color: '#fff', 
  fontWeight: '900',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};
