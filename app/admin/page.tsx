'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// TABULKA BODOVÁNÍ - Tady si ji můžeš upravit
const POINTS_SCALE: Record<number, number> = {
  1: 25, 2: 22, 3: 20, 4: 18, 5: 16, 6: 15, 7: 14, 8: 13, 9: 12, 10: 11,
  11: 10, 12: 9, 13: 8, 14: 7, 15: 6, 16: 5, 17: 4, 18: 3, 19: 2, 20: 1
};

export default function MasterAdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('results');
  const [status, setStatus] = useState({ msg: '', type: '' });

  // Data stavy
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [currentResults, setCurrentResults] = useState<any[]>([]);

  // STAVY PRO AUTOMATICKÝ VÝPOČET
  const [p1, setP1] = useState<number>(0);
  const [p2, setP2] = useState<number>(0);
  const [totalCalculated, setTotalCalculated] = useState<number>(0);

  // Výpočet bodů při změně pozic
  useEffect(() => {
    const score1 = POINTS_SCALE[p1] || 0;
    const score2 = POINTS_SCALE[p2] || 0;
    setTotalCalculated(score1 + score2);
  }, [p1, p2]);

  // ... (loadGlobalData a loadYearData zůstávají stejné jako dříve)
  const loadGlobalData = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    setSeasons(s || []);
    setAllDrivers(d || []);
    if (!selectedYear && s && s.length > 0) setSelectedYear(s[0].id);
  };

  const loadYearData = async (year: number) => {
    const { data: r } = await supabase.from('races').select('*').eq('season_id', year).order('race_date', { ascending: true });
    const { data: c } = await supabase.from('categories').select('*').eq('season_id', year).order('order_by', { ascending: true });
    const { data: res } = await supabase.from('results').select('*, drivers(full_name), categories(name), races!inner(name, season_id)')
      .eq('races.season_id', year).order('race_id', { ascending: false }).order('category_id', { ascending: true }).order('total_points', { ascending: false });
    
    setFilteredRaces(r || []);
    setFilteredCategories(c || []);
    setCurrentResults(res || []);
  };

  useEffect(() => { if (isAuthorized) loadGlobalData(); }, [isAuthorized]);
  useEffect(() => { if (isAuthorized && selectedYear) loadYearData(selectedYear); }, [selectedYear, isAuthorized]);

  const handleAddResult = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('results').insert([{
      race_id: parseInt(fd.get('race_id') as string),
      driver_id: parseInt(fd.get('driver_id') as string),
      category_id: fd.get('category_id'),
      pos_race_1: p1 || null,
      pos_race_2: p2 || null,
      extra_point: parseInt(fd.get('extra') as string) || 0,
      total_points: totalCalculated, // Ukládáme vypočtenou hodnotu
      qualy_time: fd.get('qualy') || null,
      pole_position: e.target.pole.checked
    }]);
    if (error) setStatus({ msg: error.message, type: 'error' });
    else { 
        setStatus({ msg: 'Výsledek uložen.', type: 'success' }); 
        e.target.reset(); 
        setP1(0); setP2(0); // Resetujeme lokální body
        loadYearData(selectedYear!); 
    }
  };

  if (!isAuthorized) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#fbbf24' }}>🔐 Admin Vstup</h2>
        <input type="password" placeholder="Heslo" style={inputStyle} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && password === 'admin123' && setIsAuthorized(true)} />
        <button onClick={() => password === 'admin123' ? setIsAuthorized(true) : alert('Špatné heslo!')} style={submitBtnStyle}>Vstoupit</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1300px', margin: '40px auto', color: '#fff', padding: '0 20px' }}>
      
      {/* SELEKTOR ROKU A NAVIGACE (Zkráceno pro přehlednost) */}
      <nav style={navStyle}>
        {['results', 'races', 'categories', 'drivers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...tabBtnStyle, background: activeTab === tab ? '#fbbf24' : '#111', color: activeTab === tab ? '#000' : '#fff' }}>
            {tab === 'results' ? 'VÝSLEDKY' : tab.toUpperCase()}
          </button>
        ))}
      </nav>

      {activeTab === 'results' && (
        <>
          <form onSubmit={handleAddResult} style={formBoxStyle}>
            <h3 style={{ color: '#fbbf24', marginBottom: '20px' }}>ZADAT VÝSLEDKY {selectedYear}</h3>
            
            <div style={gridStyle}>
              <div style={inputGroup}><label>Závod</label>
                <select name="race_id" required style={inputStyle}>
                  <option value="">-- Vyber --</option>
                  {filteredRaces.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={inputGroup}><label>Kategorie</label>
                <select name="category_id" required style={inputStyle}>
                  <option value="">-- Vyber --</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={inputGroup}><label>Jezdec</label>
                <select name="driver_id" required style={inputStyle}>
                  <option value="">-- Vyber --</option>
                  {allDrivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ ...gridStyle, marginTop: '20px', gridTemplateColumns: '1fr 1fr 1fr 1.5fr' }}>
              <div style={inputGroup}>
                <label>1. Jízda (poz.)</label>
                <input 
                    type="number" 
                    value={p1 || ''} 
                    onChange={(e) => setP1(parseInt(e.target.value) || 0)} 
                    style={inputStyle} 
                    placeholder="např. 1" 
                />
              </div>
              <div style={inputGroup}>
                <label>2. Jízda (poz.)</label>
                <input 
                    type="number" 
                    value={p2 || ''} 
                    onChange={(e) => setP2(parseInt(e.target.value) || 0)} 
                    style={inputStyle} 
                    placeholder="např. 2" 
                />
              </div>
              <div style={inputGroup}>
                <label>Extra (PP +1)</label>
                <input name="extra" type="number" defaultValue="0" style={inputStyle} />
              </div>
              <div style={inputGroup}>
                <label style={{ color: '#fbbf24', fontWeight: 'bold' }}>CELKOVÉ BODY (Auto)</label>
                <input 
                    type="number" 
                    value={totalCalculated} 
                    readOnly 
                    style={{ ...inputStyle, background: '#111', borderColor: '#fbbf24', color: '#fbbf24', fontWeight: 'bold' }} 
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={inputGroup}><label>Kvaly Čas</label><input name="qualy" type="text" placeholder="00:45.123" style={inputStyle} /></div>
              <div style={{ paddingTop: '25px' }}>
                <input name="pole" type="checkbox" id="pole" style={{ transform: 'scale(1.5)', marginRight: '10px' }} />
                <label htmlFor="pole" style={{ color: '#fbbf24' }}>Pole Position</label>
              </div>
            </div>

            <button type="submit" style={submitBtnStyle}>ULOŽIT VÝSLEDEK</button>
          </form>

          {/* TABULKA (zůstává stejná jako dříve) */}
          <div style={THEME.tableContainer}>
            {/* ... tabulka results ... */}
          </div>
        </>
      )}
    </div>
  );
}

// --- STYLY --- (Zachovány tvé původní)
const loginBoxStyle: any = { maxWidth: '400px', margin: '100px auto', padding: '40px', background: '#111', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' };
const navStyle: any = { display: 'flex', gap: '8px', marginBottom: '30px', justifyContent: 'center' };
const tabBtnStyle: any = { padding: '12px 20px', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' };
const formBoxStyle: any = { background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #222', marginBottom: '30px' };
const inputGroup: any = { display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle: any = { padding: '12px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none', width: '100%' };
const submitBtnStyle: any = { padding: '15px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', marginTop: '20px' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' };
