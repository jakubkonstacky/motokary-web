'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterAdminPage() {
  // ... (stavy zůstávají stejné)
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [currentResults, setCurrentResults] = useState<any[]>([]);

  // Pomocná funkce pro formátování času kvalifikace mm:ss.xxx
  const formatInterval = (interval: string | null) => {
    if (!interval) return '--:--.---';
    // Interval z DB vypadá např. "00:00:37.197061"
    const parts = interval.split(':');
    if (parts.length < 3) return interval;
    const minutes = parts[1];
    const secondsWithMs = parts[2]; // "37.197061"
    const [seconds, ms] = secondsWithMs.split('.');
    const formattedMs = ms ? ms.substring(0, 3) : '000';
    return `${minutes}:${seconds}.${formattedMs}`;
  };

  const loadYearData = async (year: number) => {
    try {
      const { data: r } = await supabase.from('races').select('*').eq('season_id', year).order('race_date', { ascending: true });
      const { data: c } = await supabase.from('categories').select('*').eq('season_id', year).order('order_by', { ascending: true });
      
      // ŘAZENÍ: race_id, category_id, total_points (sestupně)
      const { data: res, error } = await supabase
        .from('results')
        .select(`
          *,
          drivers (full_name),
          categories (name),
          races!inner (name, season_id)
        `)
        .eq('races.season_id', year)
        .order('race_id', { ascending: false })
        .order('category_id', { ascending: true })
        .order('total_points', { ascending: false });

      if (error) throw error;
      setFilteredRaces(r || []);
      setFilteredCategories(c || []);
      setCurrentResults(res || []);
    } catch (err: any) {
      console.error("Chyba:", err.message);
    }
  };

  // ... (useEffecty a handlery handleAddResult atd. zůstávají stejné)
  useEffect(() => { if (isAuthorized) loadGlobalData(); }, [isAuthorized]);
  useEffect(() => { if (isAuthorized && selectedYear) loadYearData(selectedYear); }, [selectedYear, isAuthorized]);

  const loadGlobalData = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    setSeasons(s || []);
    setAllDrivers(d || []);
    if (!selectedYear && s && s.length > 0) setSelectedYear(s[0].id);
  };

  const notify = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
  };

  const deleteItem = async (table: string, id: any) => {
    if (!window.confirm('Opravdu smazat?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) notify(error.message, 'error');
    else { notify('Smazáno.'); if (selectedYear) loadYearData(selectedYear); }
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
        <input type="password" placeholder="Heslo" style={inputStyle} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && password === 'admin1234' && setIsAuthorized(true)} />
        <button onClick={() => password === 'admin1234' ? setIsAuthorized(true) : alert('Špatné heslo!')} style={submitBtnStyle}>Vstoupit</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1300px', margin: '40px auto', color: '#fff', padding: '0 20px', fontFamily: 'sans-serif' }}>
      
      {/* VÝBĚR ROKU */}
      <div style={yearSelectorStyle}>
        <label style={{ fontWeight: 'bold' }}>AKTIVNÍ ROK: </label>
        <select value={selectedYear || ''} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={selectYearStyle}>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
      </div>

      <nav style={navStyle}>
        {['results', 'races', 'categories', 'drivers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...tabBtnStyle, background: activeTab === tab ? '#fbbf24' : '#111', color: activeTab === tab ? '#000' : '#fff' }}>
            {tab === 'results' ? 'Výsledky' : tab === 'races' ? 'Závody' : tab === 'categories' ? 'Kategorie' : 'Jezdci'}
          </button>
        ))}
      </nav>

      {status.msg && <div style={{ color: status.type === 'success' ? '#10b981' : '#ef4444', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>{status.msg}</div>}

      {activeTab === 'results' && (
        <>
          <form onSubmit={handleAddResult} style={formBoxStyle}>
            {/* ... (formulář zůstává stejný) */}
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
              <div style={inputGroup}><label>1. Jízda (poz.)</label><input name="p1" type="number" style={inputStyle} /></div>
              <div style={inputGroup}><label>2. Jízda (poz.)</label><input name="p2" type="number" style={inputStyle} /></div>
              <div style={inputGroup}><label>Extra (+1b PP)</label><input name="extra" type="number" defaultValue="0" style={inputStyle} /></div>
            </div>
            <div style={{ ...gridStyle, marginTop: '20px' }}>
              <div style={inputGroup}><label>Celkové body do tabulky</label><input name="total" type="number" required style={{ ...inputStyle, borderColor: '#fbbf24' }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
                <input name="pole" type="checkbox" id="pole" style={{ width: '20px', height: '20px' }} />
                <label htmlFor="pole" style={{ color: '#fbbf24', fontWeight: 'bold' }}>Pole Position</label>
              </div>
            </div>
            <button type="submit" style={submitBtnStyle}>Uložit výsledek</button>
          </form>

          {/* NOVÁ TABULKA VÝSLEDKŮ */}
          <div style={THEME.tableContainer}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                  <th style={THEME.th}>Závod ID</th>
                  <th style={THEME.th}>Kategorie</th>
                  <th style={THEME.th}>Závodník</th>
                  <th style={THEME.th}>PP</th>
                  <th style={THEME.th}>Čas kvaly</th>
                  <th style={THEME.th}>Race 1</th>
                  <th style={THEME.th}>Race 2</th>
                  <th style={{ ...THEME.th, color: '#fbbf24', textAlign: 'right' }}>Celkem body</th>
                  <th style={THEME.th}></th>
                </tr>
              </thead>
              <tbody>
                {currentResults.map(res => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={THEME.td}>{res.race_id}</td>
                    <td style={THEME.td}>{res.categories?.name}</td>
                    <td style={{ ...THEME.td, fontWeight: 'bold' }}>{res.drivers?.full_name}</td>
                    <td style={THEME.td}>{res.pole_position ? '✅' : '-'}</td>
                    <td style={THEME.td}>{formatInterval(res.qualy_time)}</td>
                    <td style={THEME.td}>{res.pos_race_1 || '-'}</td>
                    <td style={THEME.td}>{res.pos_race_2 || '-'}</td>
                    <td style={{ ...THEME.td, fontWeight: 'bold', color: '#fbbf24', textAlign: 'right' }}>
                        {(res.total_points || 0) + (res.extra_point || 0)}
                    </td>
                    <td style={THEME.td}>
                        <button onClick={() => deleteItem('results', res.id)} style={delBtnStyle}>Smazat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* OSTATNÍ SEKCE (Závody, Kategorie, Jezdci) ... */}
    </div>
  );
}

// STYLY KONSTANTY ...
const loginBoxStyle: any = { maxWidth: '400px', margin: '100px auto', padding: '40px', background: '#111', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' };
const yearSelectorStyle: any = { background: '#111', padding: '20px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #333', textAlign: 'center' };
const selectYearStyle: any = { padding: '8px 15px', background: '#222', color: '#fbbf24', border: '2px solid #fbbf24', borderRadius: '5px', fontWeight: 'bold' };
const navStyle: any = { display: 'flex', gap: '8px', marginBottom: '30px', justifyContent: 'center' };
const tabBtnStyle: any = { padding: '12px 20px', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const formBoxStyle: any = { background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #222', marginBottom: '30px' };
const inputGroup: any = { display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle: any = { padding: '12px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none', width: '100%' };
const submitBtnStyle: any = { padding: '15px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', marginTop: '20px' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' };
const delBtnStyle: any = { background: '#991b1b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' };
