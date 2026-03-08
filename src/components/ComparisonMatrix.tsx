import React from 'react';
import { useCompare } from '../context/CompareContext';
import { X, CheckCircle2, AlertCircle, Trash2, Gauge, Plus } from 'lucide-react';
import { cn } from './CarCard';

export const ComparisonMatrix: React.FC = () => {
  const { selectedCars, isCompareModalOpen, setIsCompareModalOpen, removeCar, clearComparison } = useCompare();

  if (!isCompareModalOpen || selectedCars.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6 opacity-100 animate-fade-in duration-300 overflow-y-auto">
      <div className="bg-[#0a0a0f]/80 w-full min-h-screen md:min-h-0 md:max-w-7xl md:max-h-[90vh] md:rounded-[2rem] border-0 md:border border-white/10 shadow-[0_0_100px_rgba(239,68,68,0.1)] flex flex-col relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[150px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600 rounded-full blur-[150px] opacity-10 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 md:p-8 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-black text-white tracking-tight">Garage View</h2>
              <p className="text-sm font-bold text-gray-400 mt-1 tracking-widest uppercase">Comparing {selectedCars.length} Vehicles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={clearComparison}
              className="text-sm font-bold text-gray-400 hover:text-red-400 transition-colors px-4 py-3 flex items-center gap-2 rounded-xl hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear All</span>
            </button>
            <button 
              onClick={() => setIsCompareModalOpen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 border border-white/10 hover:border-white/30 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Matrix Content */}
        <div className="relative z-10 flex-1 overflow-auto p-6 md:p-8 custom-scrollbar">
          <div className="min-w-[900px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="w-1/4 p-4 align-bottom">
                    <h3 className="text-xl font-display font-black text-gray-500 tracking-widest uppercase mb-4">Specs</h3>
                  </th>
                  {selectedCars.map(car => (
                    <th key={car.id} className="w-1/4 p-4 relative group align-bottom">
                      <button 
                        onClick={() => removeCar(car.id)}
                        className="absolute top-6 right-6 p-2 bg-black/80 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10 hover:border-red-500 hover:bg-red-500/20 text-gray-300 hover:text-red-500 z-20 scale-90 group-hover:scale-100"
                        title="Remove from comparison"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl mb-6 group-hover:border-white/30 transition-colors">
                        <img 
                          src={car.thumbnail.replace('hqdefault', 'maxresdefault')} 
                          alt={car.model} 
                          className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" 
                          onError={(e) => { e.currentTarget.src = car.thumbnail; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-4 left-4 right-4 text-center">
                          <div className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em]">{car.brand}</div>
                          <div className="text-2xl font-display font-black text-white leading-tight mt-1">{car.model}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">{car.price}</div>
                        <div className="mt-2 px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 uppercase tracking-widest border border-white/5">{car.segment}</div>
                      </div>
                    </th>
                  ))}
                  {Array.from({ length: 3 - selectedCars.length }).map((_, i) => (
                     <th key={`empty-${i}`} className="w-1/4 p-4 align-bottom">
                       <div className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center mb-[104px] transition-colors hover:border-white/30 hover:bg-white/10">
                          <Plus className="w-10 h-10 text-gray-600 mb-3" />
                          <div className="text-gray-500 text-sm font-bold tracking-widest uppercase">Empty Slot</div>
                       </div>
                     </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                
                {/* Performance Section */}
                <tr className="bg-white/[0.02]">
                  <td colSpan={4} className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500">
                    Performance Specs
                  </td>
                </tr>
                <TableRow label="Engine" cars={selectedCars} getValue={c => c.specs.engine ?? '—'} highlightType="higher"/>
                <TableRow label="Transmission" cars={selectedCars} getValue={c => c.specs.transmission ?? '—'} highlightType="higher"/>
                <TableRow label="Max Power" cars={selectedCars} getValue={c => c.specs.power ?? '—'} highlightType="higher"/>
                <TableRow label="Peak Torque" cars={selectedCars} getValue={c => c.specs.torque ?? '—'} highlightType="higher"/>

                {/* Efficiency Section */}
                <tr className="bg-white/[0.02]">
                  <td colSpan={4} className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500">
                    Efficiency &amp; Range
                  </td>
                </tr>
                <TableRow label="Mileage / Range" cars={selectedCars} getValue={c => c.specs.efficiency ?? '—'} highlightType="higher"/>

                {/* Practicality Section */}
                <tr className="bg-white/[0.02]">
                  <td colSpan={4} className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500">
                    Practicality
                  </td>
                </tr>
                <TableRow label="Ground Clearance" cars={selectedCars} getValue={c => c.specs.groundClearance ?? '—'} highlightType="higher"/>
                <TableRow label="Boot Space" cars={selectedCars} getValue={c => c.specs.bootSpace ?? '—'} highlightType="higher"/>

                {/* Features Section */}
                <tr className="bg-white/[0.02]">
                  <td colSpan={4} className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500">
                    Notable Features
                  </td>
                </tr>
                <tr className="group hover:bg-white/[0.03] transition-colors">
                  <td className="p-6 font-bold text-gray-500 uppercase tracking-wider text-sm">Features</td>
                  {selectedCars.map(car => (
                    <td key={car.id} className="p-6">
                      {car.specs.features && car.specs.features.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {car.specs.features.map((f, i) => (
                            <span key={i} className="text-[10px] font-bold text-gray-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: 3 - selectedCars.length }).map((_, i) => <td key={`emp-feat-${i}`} className="p-6"></td>)}
                </tr>

                {/* Safety Section */}
                <tr className="bg-white/[0.02]">
                  <td colSpan={4} className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500">
                    Safety &amp; Tech
                  </td>
                </tr>
                <tr className="group hover:bg-white/[0.03] transition-colors">
                  <td className="p-6 font-bold text-gray-500 uppercase tracking-wider text-sm">Airbags</td>
                  {selectedCars.map(car => (
                    <td key={car.id} className="p-6 text-center">
                      {car.specs.airbags != null ? (
                        <><span className="font-bold text-xl text-white">{car.specs.airbags} </span><span className="text-gray-500 text-sm font-bold ml-1 uppercase">airbags</span></>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: 3 - selectedCars.length }).map((_, i) => <td key={`emp-${i}`}></td>)}
                </tr>
                <tr className="group hover:bg-white/[0.03] transition-colors">
                  <td className="p-6 font-bold text-gray-500 uppercase tracking-wider text-sm">ADAS Tech</td>
                  {selectedCars.map(car => (
                    <td key={car.id} className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        {car.specs.hasADAS ? (
                          <div className="py-1.5 px-4 bg-green-500/20 rounded-full border border-green-500/30 flex items-center gap-2 text-green-400 font-bold tracking-wide">
                            <CheckCircle2 className="w-5 h-5"/> Equipped
                          </div>
                        ) : (
                          <div className="py-1.5 px-4 bg-gray-500/10 rounded-full border border-gray-500/20 flex items-center gap-2 text-gray-500 font-bold tracking-wide">
                            <AlertCircle className="w-5 h-5"/> Optional / N.A.
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - selectedCars.length }).map((_, i) => <td key={`emp-${i}`}></td>)}
                </tr>

                {/* Reviewer Verdict Section */}
                {selectedCars.some(c => c.specs.verdict) && (
                  <>
                    <tr className="bg-white/[0.02]">
                      <td colSpan={4} className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500">
                        AI Reviewer Verdict
                      </td>
                    </tr>
                    <tr className="group hover:bg-white/[0.03] transition-colors">
                      <td className="p-6 font-bold text-gray-500 uppercase tracking-wider text-sm">Verdict</td>
                      {selectedCars.map(car => (
                        <td key={car.id} className="p-6">
                          {car.specs.verdict ? (
                            <p className="text-gray-300 text-sm italic leading-relaxed border-l-2 border-red-500/40 pl-3">{car.specs.verdict}</p>
                          ) : (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedCars.length }).map((_, i) => <td key={`emp-${i}`} className="p-6"></td>)}
                    </tr>
                  </>
                )}

              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component
const TableRow = ({ 
  label, 
  cars, 
  getValue, 
  highlightType 
}: { 
  label: string; 
  cars: any[]; 
  getValue: (car: any) => string; 
  highlightType: 'higher' | 'lower' 
}) => {
  const numericValues = cars.map(c => parseFloat(getValue(c).replace(/[^\d.-]/g, ''))).filter(n => !isNaN(n));
  let bestVal: number | null = null;
  if (numericValues.length > 0) {
    bestVal = highlightType === 'higher' ? Math.max(...numericValues) : Math.min(...numericValues);
  }

  return (
    <tr className="group hover:bg-white/[0.03] transition-colors">
      <td className="p-6 font-bold text-gray-500 uppercase tracking-wider text-sm">{label}</td>
      {cars.map(car => {
        const val = getValue(car);
        const num = parseFloat(val.replace(/[^\d.-]/g, ''));
        const isBest = bestVal !== null && num === bestVal && numericValues.length > 1;

        return (
          <td key={car.id} className="p-6 text-center">
            <span className={cn(
              "font-black text-xl transition-colors text-shadow-sm",
              isBest ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" : "text-gray-100"
            )}>
              {val}
            </span>
            {isBest && (
              <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Class Leading</div>
            )}
          </td>
        );
      })}
      {Array.from({ length: 3 - cars.length }).map((_, i) => <td className="p-6" key={`emprow-${i}`}></td>)}
    </tr>
  );
};
