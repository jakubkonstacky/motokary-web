'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterAdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const [status, setStatus] = useState({ msg: '', type: '' });

  // --- DATA ---
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [currentResults, setCurrentResults] = useState<any[]>([]);

  // 1. Globální data (Sezóny a Jezdci)
  const loadGlobalData = async () => {
    try {
      const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      const { data: d } = await supabase.from('drivers').select('*').order('full_name');
      
      const loadedSeasons = s || [];
      setSeasons(loadedSeasons);
      setAllDrivers(d || []);

      // Pokud máme sezóny a není vybrán rok, vybereme nejnovější
      if (!selectedYear && loadedSeasons.length > 0) {
        setSelectedYear(loadedSeasons[0].id);
      } else if (loadedSeasons.length === 0 && !selectedYear) {
        // ZÁCHRANA: Pokud není žádná sezóna v DB, nastavíme letošní rok, aby se zobrazily formuláře
        setSelectedYear(new Date().getFullYear());
      }
    } catch (err) {
      console.error("Chyba při načítání globálních dat:", err);
    }
  };

  // 2. Data pro konkrétní rok
  const loadYearData = async (year: number) => {
    try {
      const { data: r } = await supabase.from('races').select('*').eq('season_id', year).order('race_date', { ascending: true });
      const { data: c } = await supabase.from('categories').select('*').eq('season_id', year).order('order_by', { ascending: true });
      
      // Opravený dotaz na výsledky - odolnější proti chybám v relacích
      const { data: res } = await supabase
        .from('results')
        .select('*, drivers(full_name), categories(name), races(name, season_id)')
        .order('created_at', { ascending: false });

      // Filtrujeme výsledky až v aplikaci pro vyšší stabilitu
      const yearResults = res?.filter(item => item.races?.season_id === year) || [];

      setFilteredRaces(r || []);
      setFilteredCategories(c || []);
      setCurrentResults(yearResults);
    } catch (err) {
      console.error("Chyba při načítání dat roku:", err);
    }
  };

  useEffect(() => { if (isAuthorized) loadGlobalData(); }, [isAuthorized]);
  useEffect(() => { if (isAuthorized && selectedYear) loadYearData(selectedYear); }, [selectedYear, isAuthorized]);

  const notify = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
  };

  // --- HANDLERY (Smazat, Přidat...) ---
  const deleteItem = async (table: string, id: any) => {
    if (!window.confirm('Opravdu smazat?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) notify(error.message, 'error');
    else { notify('Smazáno.'); loadGlobalData(); if (selectedYear) loadYearData(selectedYear); }
  };

  const handleAddResult = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('results').insert([{
      race_id: parseInt(fd.get('race_id') as string),
      driver_id: parseInt(fd.get('driver_id') as string),
      category_id: fd.get('category_id'),
      pos_race_1: parseInt(fd.get('p1') as string) || null,
      pos_race_2: parseInt(fd.get('p2') as string) || null,
      extra_point: parseInt(fd.get('extra') as string) || 0,
      total_points: parseInt(fd.get('total') as string) || 0,
      qualy_time: fd.get('qualy') || null,
      pole_position: e.target.pole.checked
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Uloženo.'); e.target.reset(); loadYearData(selectedYear!); }
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
    <div style={THEME.container}>
      
      {/* VÝBĚR ROKU */}
      <div style={yearSelectorStyle}>
        <label style={{ fontWeight: 'bold', marginRight: '15px' }}>AKTIVNÍ ROK:</label>
        <select value={selectedYear || ''} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={selectYearStyle}>
          {seasons.length > 0 ? (
            seasons.map(s => <option key={s.id} value={s.id}>{s.id}</option>)
          ) : (
            <option value={new Date().getFullYear()}>{new Date().getFullYear()} (Nová sezóna)</option>
          )}
        </select>
        {seasons.length === 0 && <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '10px' }}>Tip: Nejdříve přidej rok v tabulce sezón.</p>}
      </div>

      <nav style={navStyle}>
        {['results', 'races', 'categories', 'drivers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...tabBtnStyle, background: activeTab === tab ? '#fbbf24' : '#111', color: activeTab === tab ? '#000' : '#fff' }}>
            {tab === 'results' ? 'Výsledky' : tab === 'races' ? 'Závody' : tab === 'categories' ? 'Kategorie' : 'Jezdci'}
          </button>
        ))}
      </nav>

      {status.msg && <div style={{ color: status.type === 'success' ? '#10b981' : '#ef4444', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>{status.msg}</div>}

      {/* --- SEKCE VÝSLEDKY --- */}
      {activeTab === 'results' && (
        <>
          <form onSubmit={handleAddResult} style={formBoxStyle}>
            <h3 style={{ color: '#fbbf24', marginBottom: '20px' }}>Zadat výsledky ({selectedYear})</h3>
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
            <div style={{ ...gridStyle, marginTop: '20px', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <div style={inputGroup}><label>Kvalifikace</label><input name="qualy" type="text" style={inputStyle} placeholder="00:45.123" /></div>
              <div style={inputGroup}><label>1. Jízda</label><input name="p1" type="number" style={inputStyle} /></div>
              <div style={inputGroup}><label>2. Jízda</label><input name="p2" type="number" style={inputStyle} /></div>
              <div style={inputGroup}><label>Extra (+1b PP)</label><input name="extra" type="number" defaultValue="0" style={inputStyle} /></div>
            </div>
            <div style={{ ...gridStyle, marginTop: '20px' }}>
              <div style={inputGroup}><label>Celkové body</label><input name="total" type="number" required style={{ ...inputStyle, borderColor: '#fbbf24' }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
                <input name="pole" type="checkbox" id="pole" style={{ width: '20px', height: '20px' }} />
                <label htmlFor="pole" style={{ color: '#fbbf24', fontWeight: 'bold' }}>Pole Position</label>
              </div>
            </div>
            <button type="submit" style={submitBtnStyle}>Uložit výsledek</button>
          </form>
          <div style={THEME.tableContainer}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                  <th style={THEME.th}>Jezdec / Závod</th>
                  <th style={THEME.th}>Kat.</th>
                  <th style={THEME.th}>Kvaly</th>
                  <th style={THEME.th}>PP</th>
                  <th style={{ ...THEME.th, color: '#fbbf24' }}>Celkem</th>
                  <th style={THEME.th}>Akce</th>
                </tr>
              </thead>
              <tbody>
                {currentResults.map(res => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={THEME.td}><strong>{res.drivers?.full_name}</strong><br/><small>{res.races?.name}</small></td>
                    <td style={THEME.td}>{res.categories?.name}</td>
                    <td style={THEME.td}>{res.qualy_time || '--'}</td>
                    <td style={THEME.td}>{res.pole_position ? '✅' : '-'}</td>
                    <td style={{ ...THEME.td, fontWeight: 'bold', color: '#fbbf24' }}>{(res.total_points || 0) + (res.extra_point || 0)} b.</td>
                    <td style={THEME.td}><button onClick={() => deleteItem('results', res.id)} style={delBtnStyle}>Smazat</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- OSTATNÍ SEKCE (Races, Categories, Drivers) --- */}
      {activeTab === 'races' && (
        <>
          <form onSubmit={async (e: any) => {
            e.preventDefault();
            const { error } = await supabase.from('races').insert([{ id: parseInt(e.target.race_id.value), season_id: selectedYear, name: e.target.name.value, race_date: e.target.date.value }]);
            if (error) notify(error.message, 'error'); else { notify('Přidáno.'); loadYearData(selectedYear!); e.target.reset(); }
          }} style={formBoxStyle}>
            <h3 style={{ color: '#fbbf24', marginBottom: '15px' }}>Nový závod</h3>
            <input name="race_id" type="number" placeholder="ID (např. 202601)" required style={inputStyle} />
            <input name="name" type="text" placeholder="Název" required style={{ ...inputStyle, marginTop: '10px' }} />
            <input name="date" type="date" required style={{ ...inputStyle, marginTop: '10px' }} />
            <button type="submit" style={submitBtnStyle}>Přidat závod</button>
          </form>
          <div style={listContainerStyle}>
            {filteredRaces.map(r => (
              <div key={r.id} style={listItemStyle}>
                <span>{r.name} ({r.id}) - {r.race_date}</span>
                <button onClick={() => deleteItem('races', r.id)} style={delBtnStyle}>Smazat</button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <form onSubmit={async (e: any) => {
            e.preventDefault();
            const { error } = await supabase.from('categories').insert([{ id: e.target.cat_id.value, season_id: selectedYear, name: e.target.name.value, order_by: parseInt(e.target.order_by.value) }]);
            if (error) notify(error.message, 'error'); else { notify('Přidáno.'); loadYearData(selectedYear!); e.target.reset(); }
          }} style={formBoxStyle}>
            <h3 style={{ color: '#fbbf24', marginBottom: '15px' }}>Nová kategorie</h3>
            <input name="cat_id" type="text" placeholder="ID (např. A2026)" required style={inputStyle} />
            <input name="name" type="text" placeholder="Název" required style={{ ...inputStyle, marginTop: '10px' }} />
            <input name="order_by" type="number" defaultValue="1" style={{ ...inputStyle, marginTop: '10px' }} />
            <button type="submit" style={submitBtnStyle}>Přidat kategorii</button>
          </form>
          <div style={listContainerStyle}>
            {filteredCategories.map(c => (
              <div key={c.id} style={listItemStyle}><span>{c.name} ({c.id})</span><button onClick={() => deleteItem('categories', c.id)} style={delBtnStyle}>Smazat</button></div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'drivers' && (
        <>
          <form onSubmit={async (e: any) => {
            e.preventDefault();
            const { error } = await supabase.from('drivers').insert([{ full_name: e.target.name.value, start_number: parseInt(e.target.number.value) }]);
            if (error) notify(error.message, 'error'); else { notify('Přidáno.'); loadGlobalData(); e.target.reset(); }
          }} style={formBoxStyle}>
            <h3 style={{ color: '#fbbf24', marginBottom: '15px' }}>Nový jezdec</h3>
            <input name="name" type="text" placeholder="Celé jméno" required style={inputStyle} />
            <input name="number" type="number" placeholder="Startovní číslo" required style={{ ...inputStyle, marginTop: '10px' }} />
            <button type="submit" style={submitBtnStyle}>Přidat jezdce</button>
          </form>
          <div style={listContainerStyle}>
            {allDrivers.map(d => (
              <div key={d.id} style={listItemStyle}><span>{d.full_name} (#{d.start_number})</span><button onClick={() => deleteItem('drivers', d.id)} style={delBtnStyle}>Smazat</button></div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}

// --- STYLY (Sjednocené s THEME) ---
const loginBoxStyle: any = { maxWidth: '400px', margin: '100px auto', padding: '40px', background: 'rgba(12,12,12,0.8)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', backdropFilter: 'blur(15px)' };
const yearSelectorStyle: any = { background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' };
const selectYearStyle: any = { padding: '8px 15px', background: '#111', color: '#fbbf24', border: '2px solid #fbbf24', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const navStyle: any = { display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center', flexWrap: 'wrap' };
const tabBtnStyle: any = { padding: '12px 25px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' };
const formBoxStyle: any = { background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px' };
const inputGroup: any = { display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle: any = { padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '10px', width: '100%' };
const submitBtnStyle: any = { padding: '15px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%', fontWeight: 'bold', marginTop: '20px' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' };
const listContainerStyle: any = { background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' };
const listItemStyle: any = { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' };
const delBtnStyle: any = { background: '#991b1b', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem' };
