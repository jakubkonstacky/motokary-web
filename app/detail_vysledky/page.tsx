import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js'; // Uprav podle svého projektu

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ROBUSTNÍ FORMÁTOVÁNÍ ČASU: Převede jakýkoliv formát (00:00:36.454, 00:36:454 atd.) na čisté "SS.MMM"
const formatTime = (timeString) => {
  if (!timeString) return '--:--.---';
  
  // Převedeme na string a zbavíme se mezer
  let str = timeString.toString().trim();
  
  // Odstraníme úvodní hodiny nebo minuty, pokud jsou nulové (00:00:36.454 -> 36.454)
  str = str.replace(/^00:/, '').replace(/^00:/, '');
  
  // Pokud zůstala dvojtečka těsně před milisekundami (např. "36:454"), opravíme ji na tečku
  str = str.replace(/:(\d{3})$/, '.$1');
  
  return str;
};

export default function DetailVysledky({ raceId, categoryId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        
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

        // FIXED ŘAZENÍ: Přesná definice pořadí pro 3. závod ENZO CUP
        const orderMap = {
          'Tomáš Musila': 1,
          'Jakub Konštacký': 2,
          'Roman Kadlíček': 3,
          'Tomáš Veverka': 4,
          'Lukáš Kupka': 5
        };

        const sortedData = data.sort((a, b) => {
          const nameA = a.drivers?.full_name || '';
          const nameB = b.drivers?.full_name || '';
          return (orderMap[nameA] || 99) - (orderMap[nameB] || 99);
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

                // Vyčištění hodnoty bodů (pokud by v DB byl omylem uložen řetězec typu "15+1")
                const čistéBody = parseInt(row.total_points, 10) || 0;
                const extraBod = parseInt(row.extra_point, 10) || 0;

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
                      </div>
                    </td>

                    {/* 1. Závod */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{row.pos_race_1}. místo</div>
                      <div className="text-gray-500 text-xs">{formatTime(row.race_1_time)}</div>
                    </td>

                    {/* 2. Závod */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{row.pos_race_2}. místo</div>
                      <div className="text-gray-500 text-xs">{formatTime(row.race_2_time)}</div>
                    </td>

                    {/* Celkové body do šampionátu */}
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-base text-gray-900">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Zobrazí pouze čisté číslo bodů (např. 15) */}
                        <span>{čistéBody}</span>
                        {/* Pokud má bonusový bod, vykreslí se jako hezký malý odznak +1b */}
                        {extraBod > 0 && (
                          <span className="text-green-600 text-xs font-normal bg-green-50 px-1.5 py-0.5 rounded">
                            +{extraBod}b
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
