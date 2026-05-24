import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js'; // Pokud používáš vestavěný supabase klient, importuj svůj

// Inicializace Supabase (případně nahraď svým vlastním importem inicializovaného klienta)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Pomocná funkce pro vyčištění formátu času z databáze (např. "00:36:45.454" -> "36:45.454" nebo "36.454")
const formatTime = (timeString) => {
  if (!timeString) return '--:--.---';
  
  // Pokud čas začíná "00:", ořízneme ho pro čistější zobrazení
  let cleanTime = timeString;
  if (cleanTime.startsWith('00:')) {
    cleanTime = cleanTime.substring(3);
  }
  
  // Nahrazení případných teček/čárek pro jednotný vzhled
  return cleanTime.replace(',', '.');
};

export default function DetailVysledky({ raceId, categoryId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        
        // SQL dotaz přepsaný do Supabase JS syntaxe s novými sloupci pro časy závodů
        const { data, error } = await supabase
          .from('results')
          .select(`
            pos_qualy,
            qualy_time,
            pos_race_1,
            race_1_time,
            pos_race_2,
            race_2_time,
            total_points,
            extra_point,
            pole_position,
            drivers (
              full_name
            )
          `)
          .eq('race_id', raceId)
          .eq('category_id', categoryId);

        if (error) throw error;

        // Seřazení výsledků: primárně podle bodů sestupně, sekundárně podle vyhrané kvalifikace (Pole Position)
        const sortedData = data.sort((a, b) => {
          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points;
          }
          return (b.pole_position ? 1 : 0) - (a.pole_position ? 1 : 0);
        });

        setResults(sortedData);
      } catch (err) {
        console.error('Chyba při načítání výsledků:', err);
        setError('Nepodařilo se načíst výsledky závodu.');
      } finally {
        setLoading(false);
      }
    }

    if (raceId && categoryId) {
      fetchResults();
    }
  }, [raceId, categoryId]);

  if (loading) return <div className="p-8 text-center text-gray-600">Načítám výsledky závodu...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;
  if (results.length === 0) return <div className="p-8 text-center text-gray-500">Pro tento závod nejsou k dispozici žádné výsledky.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Výsledková listina závodu</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-3 tracking-wider">Poz.</th>
                <th className="px-6 py-3 tracking-wider">Jezdec</th>
                <th className="px-6 py-3 tracking-wider">Kvalifikace</th>
                <th className="px-6 py-3 tracking-wider">1. Závod (Pozice / Čas)</th>
                <th className="px-6 py-3 tracking-wider">2. Závod (Pozice / Čas)</th>
                <th className="px-6 py-3 tracking-wider text-right">Body</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
              {results.map((row, index) => {
                const driverName = row.drivers?.full_name || 'Neznámý jezdec';
                const celkovePoradi = index + 1;

                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    {/* Celkové pořadí dne */}
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      {celkovePoradi}. Místo
                    </td>

                    {/* Jméno jezdce */}
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {driverName}
                    </td>

                    {/* Kvalifikace */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-gray-900">{formatTime(row.qualy_time)}</span>
                        <span className="text-gray-500 text-xs">({row.pos_qualy}. poz)</span>
                        {row.pole_position && (
                          <span className="ml-1 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded font-bold flex items-center">
                            🥇 PP
                          </span>
                        )}
