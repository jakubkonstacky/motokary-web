'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializace Supabase klienta
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterAdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Jednoduchá kontrola hesla před zobrazením obsahu
  if (!isAuthorized) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Vstup pro administrátora</h2>
        <input 
          type="password" 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Heslo"
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #333', background: '#222', color: '#fff' }}
        />
        <button 
          onClick={() => password === 'MojeTajneHeslo123' ? setIsAuthorized(true) : alert('Špatně!')}
          style={{ padding: '10px 20px', marginLeft: '10px', background: '#fbbf24', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Vstoupit
        </button>
      </div>
    );
  }
  
  const [activeTab, setActiveTab] = useState('results');
  const [status, setStatus] = useState({ msg: '', type: '' });
  
  // Data pro výběry v seznamech
  const [seasons, setSeasons] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Načtení všech číselníků při startu
  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  async function loadDatabaseInfo() {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: r } = await supabase.from('races').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    const { data: c } = await supabase.from('categories').select('*').order('order_by', { ascending: true });
    
    setSeasons(s || []);
    setRaces(r || []);
    setDrivers(d || []);
    setCategories(c || []);
  }

  const notify = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 5000);
  };

  // --- HANDLERY PRO ODESÍLÁNÍ DAT ---

  const handleAddSeason = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('seasons').insert([{ 
      id: parseInt(e.target.year.value), // Rok jako hlavní klíč
      name: e.target.name.value 
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Sezóna (rok) vytvořena'); loadDatabaseInfo(); e.target.reset(); }
  };

  const handleAddRace = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('races').insert([{
      id: parseInt(e.target.race_id.value), // Formát YYYYZZ
      season_id: parseInt(e.target.season_id.value),
      name: e.target.name.value,
      race_date: e.target.date.value
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Závod úspěšně přidán'); loadDatabaseInfo(); e.target.reset(); }
  };

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('categories').insert([{
      id: e.target.cat_id.value, // Formát PYYYY
      season_id: parseInt(e.target.season_id.value),
      name: e.target.name.value,
      order_by: parseInt(e.target.order_by.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Kategorie vytvořena'); loadDatabaseInfo(); e.target.reset(); }
  };

  const handleAddDriver = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('drivers').insert([{
      full_name: e.target.name.value,
      start_number: parseInt(e.target.number.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Jezdec přidán do databáze'); loadDatabaseInfo(); e.target.reset(); }
  };

  const handleAddResult = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    // V tabulce results není season_id, je to jasné z race_id
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

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', color: '#fff', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.5rem', marginBottom: '10px' }}>🏁 Master Admin</h1>
        <p style={{ color: '#666' }}>Správa šampionátu, kalendáře a výsledků</p>
      </header>
      
      {status.msg && (
        <div style={{ 
          padding: '15px 20px', 
          background: status.type === 'success' ? '#065f46' : '#991b1b', 
          borderRadius: '8px', 
          marginBottom: '30px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {status.msg}
        </div>
      )}

      {/* --- MENU PŘEPÍNAČŮ --- */}
      <nav style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {[
          { id: 'results', label: '🏆 Výsledky' },
          { id: 'races', label: '📅 Závody' },
          { id: 'categories', label: '🏷️ Kategorie' },
          { id: 'seasons', label: '📅 Sezóny' },
          { id: 'drivers', label: '👤 Jezdci' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            style={{ 
              padding: '12px 20px', 
              background: activeTab === tab.id ? '#fbbf24' : '#1a1a1a', 
              color: activeTab === tab.id ? '#000' : '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: '0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* --- TAB: VÝSLEDKY --- */}
      {activeTab === 'results' && (
        <form onSubmit={handleAddResult} style={formBoxStyle}>
          <h2 style={formTitleStyle}>Zadat výsledek závodu</h2>
          <div style={gridStyle}>
            <div style={inputGroupStyle}>
              <label>Závod</label>
              <select name="race_id" required style={inputStyle}>
                <option value="">-- Vyber závod (YYYYZZ) --</option>
                {races.map(r => <option key={r.id} value={r.id}>{r.id} | {r.name}</option>)}
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label>Kategorie</label>
              <select name="category_id" required style={inputStyle}>
                <option value="">-- Vyber kategorii (PYYYY) --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
              </select>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label>Jezdec</label>
            <select name="driver_id" required style={inputStyle}>
              <option value="">-- Vyber jezdce --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} (#{d.start_number})</option>)}
            </select>
          </div>
          <hr style={hrStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div style={inputGroupStyle}>
              <label>Jízda 1 (pořadí)</label>
              <input name="p1" type="number" placeholder="1" required style={inputStyle} />
            </div>
            <div style={inputGroupStyle}>
              <label>Jízda 2 (pořadí)</label>
              <input name="p2" type="number" placeholder="2" required style={inputStyle} />
            </div>
            <div style={inputGroupStyle}>
              <label>Extra body</label>
              <input name="extra" type="number" placeholder="1" style={inputStyle} />
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label>Celkové body do tabulky</label>
            <input name="total" type="number" placeholder="Např. 46" required style={{ ...inputStyle, borderColor: '#fbbf24', fontSize: '1.2rem' }} />
          </div>
          <div style={gridStyle}>
            <div style={inputGroupStyle}>
              <label>Čas kvalifikace</label>
              <input name="qualy" type="text" placeholder="00:00:45.123" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
              <input name="pole" type="checkbox" id="pole" style={{ width: '20px', height: '20px' }} />
              <label htmlFor="pole" style={{ fontWeight: 'bold', color: '#fbbf24', cursor: 'pointer' }}>Pole Position (+1b. info)</label>
            </div>
          </div>
          <button type="submit" style={submitBtnStyle}>Uložit výsledek</button>
        </form>
      )}

      {/* --- TAB: ZÁVODY --- */}
      {activeTab === 'races' && (
        <form onSubmit={handleAddRace} style={formBoxStyle}>
          <h2 style={formTitleStyle}>Nový závod</h2>
          <div style={inputGroupStyle}>
            <label>ID závodu (Formát YYYYZZ, např. 202601)</label>
            <input name="race_id" type="number" placeholder="202601" required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <label>Přiřadit k sezóně (rok)</label>
            <select name="season_id" required style={inputStyle}>
              {seasons.map(s => <option key={s.id} value={s.id}>Sezóna {s.id}</option>)}
            </select>
          </div>
          <div style={inputGroupStyle}>
            <label>Název závodu</label>
            <input name="name" type="text" placeholder="GP Cheb I." required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <label>Datum konání</label>
            <input name="date" type="date" required style={inputStyle} />
          </div>
          <button type="submit" style={submitBtnStyle}>Vytvořit závod</button>
        </form>
      )}

      {/* --- TAB: KATEGORIE --- */}
      {activeTab === 'categories' && (
        <form onSubmit={handleAddCategory} style={formBoxStyle}>
          <h2 style={formTitleStyle}>Nová kategorie</h2>
          <div style={gridStyle}>
            <div style={inputGroupStyle}>
              <label>ID Kategorie (Např. A2026)</label>
              <input name="cat_id" type="text" placeholder="A2026" required style={inputStyle} />
            </div>
            <div style={inputGroupStyle}>
              <label>Rok sezóny</label>
              <select name="season_id" required style={inputStyle}>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
              </select>
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label>Název kategorie</label>
            <input name="name" type="text" placeholder="Kategorie A (Elite)" required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <label>Pořadí zobrazení (order_by)</label>
            <input name="order_by" type="number" placeholder="1" defaultValue="1" style={inputStyle} />
            <small style={{ color: '#666' }}>1 = bude první v seznamu</small>
          </div>
          <button type="submit" style={submitBtnStyle}>Uložit kategorii</button>
        </form>
      )}

      {/* --- TAB: SEZÓNY --- */}
      {activeTab === 'seasons' && (
        <form onSubmit={handleAddSeason} style={formBoxStyle}>
          <h2 style={formTitleStyle}>Vytvořit sezónu</h2>
          <div style={inputGroupStyle}>
            <label>Rok (ID)</label>
            <input name="year" type="number" placeholder="2026" required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <label>Název sezóny</label>
            <input name="name" type="text" placeholder="Mistrovství Motokár 2026" required style={inputStyle} />
          </div>
          <button type="submit" style={submitBtnStyle}>Vytvořit rok</button>
        </form>
      )}

      {/* --- TAB: JEZDCI --- */}
      {activeTab === 'drivers' && (
        <form onSubmit={handleAddDriver} style={formBoxStyle}>
          <h2 style={formTitleStyle}>Nový jezdec do databáze</h2>
          <div style={inputGroupStyle}>
            <label>Celé jméno</label>
            <input name="name" type="text" placeholder="Michael Rychlý" required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <label>Startovní číslo</label>
            <input name="number" type="number" placeholder="99" required style={inputStyle} />
          </div>
          <button type="submit" style={submitBtnStyle}>Přidat jezdce</button>
        </form>
      )}
    </div>
  );
}

// --- STYLY ---

const formBoxStyle = {
  background: '#111',
  padding: '30px',
  borderRadius: '15px',
  border: '1px solid #222',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
};

const formTitleStyle = {
  marginTop: 0,
  marginBottom: '25px',
  fontSize: '1.4rem',
  color: '#fbbf24',
  borderLeft: '4px solid #fbbf24',
  paddingLeft: '15px'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  marginBottom: '15px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
  marginBottom: '15px'
};

const inputStyle = {
  padding: '12px 15px',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none'
};

const hrStyle = {
  border: '0',
  borderTop: '1px solid #222',
  margin: '20px 0'
};

const submitBtnStyle = {
  width: '100%',
  padding: '15px',
  background: '#fbbf24',
  color: '#000',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '15px',
  transition: '0.2s'
};
