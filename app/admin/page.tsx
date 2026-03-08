'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterAdminPage() {
  // --- AUTH & UI STATE ---
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const [status, setStatus] = useState({ msg: '', type: '' });

  // --- DATA STATE ---
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  // 1. Načtení základních číselníků (Sezóny a Jezdci jsou globální)
  const loadGlobalData = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    setSeasons(s || []);
    setAllDrivers(d || []);
    
    // Automaticky nastavit aktuální rok jako výchozí, pokud existuje
    const currentYear = new Date().getFullYear();
    if (s?.some(season => season.id === currentYear)) {
      setSelectedYear(currentYear);
    } else if (s && s.length > 0) {
      setSelectedYear(s[0].id);
    }
  };

  // 2. Načtení dat závislých na zvoleném roce (Závody a Kategorie)
  const loadYearSpecificData = async (year: number) => {
    const { data: r } = await supabase.from('races').select('*').eq('season_id', year).order('id', { ascending: true });
    const { data: c } = await supabase.from('categories').select('*').eq('season_id', year).order('order_by', { ascending: true });
    setFilteredRaces(r || []);
    setFilteredCategories(c || []);
  };

  useEffect(() => {
    if (isAuthorized) loadGlobalData();
  }, [isAuthorized]);

  useEffect(() => {
    if (selectedYear) loadYearSpecificData(selectedYear);
  }, [selectedYear]);

  const notify = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 5000);
  };

  // --- LOGIN CHECK ---
  if (!isAuthorized) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#fbbf24' }}>🔐 Admin Vstup</h2>
        <input type="password" placeholder="Heslo" style={inputStyle} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && password === 'admin123' && setIsAuthorized(true)} />
        <button onClick={() => password === 'admin123' ? setIsAuthorized(true) : alert('Špatné heslo!')} style={submitBtnStyle}>Vstoupit</button>
      </div>
    );
  }

  // --- HANDLERY ---
  const handleAddResult = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('results').insert([{
      race_id: parseInt(fd.get('race_id') as string),
      driver_id: parseInt(fd.get('driver_id') as string),
      category_id: fd.get('category_id'),
      pos_race_1: parseInt(fd.get('p1') as string),
      pos_race_2: parseInt(fd.get('p2') as string),
      extra_point: parseInt(fd.get('extra') as string) || 0,
      total_points: parseInt(fd.get('total') as string),
      qualy_time: fd.get('qualy') || null,
      pole_position: e.target.pole.checked
    }]);
    if (error) notify(error.message, 'error');
    else { notify('✅ Výsledek uložen!'); e.target.reset(); }
  };

  const handleAddRace = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('races').insert([{
      id: parseInt(e.target.race_id.value),
      season_id: selectedYear,
      name: e.target.name.value,
      race_date: e.target.date.value
    }]);
    if (error) notify(error.message, 'error');
    else { notify('🏁 Závod vytvořen'); loadYearSpecificData(selectedYear!); e.target.reset(); }
  };

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('categories').insert([{
      id: e.target.cat_id.value,
      season_id: selectedYear,
      name: e.target.name.value,
      order_by: parseInt(e.target.order_by.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('🏷️ Kategorie vytvořena'); loadYearSpecificData(selectedYear!); e.target.reset(); }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', color: '#fff', padding: '0 20px', fontFamily: 'sans-serif' }}>
      
      {/* --- HLAVNÍ FILTR ROKU --- */}
      <div style={yearSelectorStyle}>
        <label style={{ fontWeight: 'bold', color: '#fbbf24' }}>SPRAVOVANÁ SEZÓNA: </label>
        <select 
          value={selectedYear || ''} 
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{ ...inputStyle, width: 'auto', marginLeft: '15px', border: '2px solid #fbbf24' }}
        >
          {seasons.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
        </select>
        <span style={{ marginLeft: '20px', fontSize: '0.8rem', color: '#666' }}>
          Všechny seznamy níže jsou filtrovány pro rok {selectedYear}
        </span>
      </div>

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fbbf24', margin: 0 }}>🏎️ Master Admin</h1>
        {status.msg && <div style={{ color: status.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 'bold', marginTop: '10px' }}>{status.msg}</div>}
      </header>

      {/* TABS */}
      <nav style={navStyle}>
        {['results', 'races', 'categories', 'drivers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...tabBtnStyle, background: activeTab === tab ? '#fbbf24' : '#111', color: activeTab === tab ? '#000' : '#fff' }}>
            {tab === 'results' ? 'Výsledky' : tab === 'races' ? 'Závody' : tab === 'categories' ? 'Kategorie' : 'Jezdci'}
          </button>
        ))}
      </nav>

      {/* SEKCE VÝSLEDKY */}
      {activeTab === 'results' && (
        <form onSubmit={handleAddResult} style={formBoxStyle}>
          <h3 style={formTitleStyle}>Nový výsledek pro rok {selectedYear}</h3>
          <div style={gridStyle}>
            <select name="race_id" required style={inputStyle}>
              <option value="">-- Vyber závod ({selectedYear}) --</option>
              {filteredRaces.map(r => <option key={r.id} value={r.id}>{r.id} | {r.name}</option>)}
            </select>
            <select name="category_id" required style={inputStyle}>
              <option value="">-- Vyber kategorii ({selectedYear}) --</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <select name="driver_id" required style={{ ...inputStyle, marginTop: '15px' }}>
            <option value="">-- Vyber jezdce --</option>
            {allDrivers.map(d => <option key={d.id} value={d.id}>{d.full_name} (#{d.start_number})</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <input name="p1" type="number" placeholder="Pořadí J1" required style={inputStyle} />
            <input name="p2" type="number" placeholder="Pořadí J2" required style={inputStyle} />
            <input name="extra" type="number" placeholder="Extra body" style={inputStyle} />
          </div>
          <input name="total" type="number" placeholder="CELKOVÉ BODY" required style={{ ...inputStyle, marginTop: '15px', border: '1px solid #fbbf24' }} />
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '15px' }}>
            <input name="qualy" type="text" placeholder="Čas kvalifikace" style={inputStyle} />
            <label style={{ color: '#fbbf24', fontWeight: 'bold' }}><input name="pole" type="checkbox" /> Pole Position</label>
          </div>
          <button type="submit" style={submitBtnStyle}>Uložit výsledek</button>
        </form>
      )}

      {/* SEKCE ZÁVODY */}
      {activeTab === 'races' && (
        <form onSubmit={handleAddRace} style={formBoxStyle}>
          <h3 style={formTitleStyle}>Přidat závod do sezóny {selectedYear}</h3>
          <input name="race_id" type="number" placeholder={`ID (např. ${selectedYear}01)`} required style={inputStyle} />
          <input name="name" type="text" placeholder="Název závodu" required style={inputStyle} />
          <input name="date" type="date" required style={inputStyle} />
          <button type="submit" style={submitBtnStyle}>Uložit závod</button>
        </form>
      )}

      {/* SEKCE KATEGORIE */}
      {activeTab === 'categories' && (
        <form onSubmit={handleAddCategory} style={formBoxStyle}>
          <h3 style={formTitleStyle}>Nová kategorie pro rok {selectedYear}</h3>
          <input name="cat_id" type="text" placeholder="ID (např. A2026)" required style={inputStyle} />
          <input name="name" type="text" placeholder="Název kategorie" required style={inputStyle} />
          <input name="order_by" type="number" placeholder="Pořadí (1, 2...)" defaultValue="1" style={inputStyle} />
          <button type="submit" style={submitBtnStyle}>Uložit kategorii</button>
        </form>
      )}

      {/* SEKCE JEZDCI */}
      {activeTab === 'drivers' && (
        <form onSubmit={handleAddDriver} style={formBoxStyle}>
          <h3 style={formTitleStyle}>Nový jezdec (globální)</h3>
          <input name="name" type="text" placeholder="Celé jméno" required style={inputStyle} />
          <input name="number" type="number" placeholder="Startovní číslo" required style={inputStyle} />
          <button type="submit" style={submitBtnStyle}>Přidat jezdce</button>
        </form>
      )}
    </div>
  );
}

// --- STYLY ---
const yearSelectorStyle: any = { background: '#111', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const loginBoxStyle: any = { maxWidth: '400px', margin: '100px auto', padding: '40px', background: '#111', borderRadius: '15px', textAlign: 'center', border: '1px solid #333' };
const navStyle: any = { display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' };
const tabBtnStyle: any = { padding: '10px 18px', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' };
const formBoxStyle: any = { background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '15px' };
const formTitleStyle: any = { margin: 0, fontSize: '1.1rem', color: '#fbbf24' };
const inputStyle: any = { padding: '12px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px', outline: 'none', width: '100%' };
const submitBtnStyle: any = { padding: '14px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
