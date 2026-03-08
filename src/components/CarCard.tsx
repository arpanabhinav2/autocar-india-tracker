import React from 'react';
import { type Car } from '../types/car';
import { useCompare } from '../context/CompareContext';
import { Settings2, Zap, Gauge, Play, Plus, Check, Cpu, Star } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CarCardProps {
  car: Car;
}

export const CarCard: React.FC<CarCardProps> = ({ car }) => {
  const { selectedCars, addCar, removeCar } = useCompare();
  const isSelected = selectedCars.some(c => c.id === car.id);
  const isMaxSelected = selectedCars.length >= 3 && !isSelected;

  const handleCompareToggle = () => {
    if (isSelected) removeCar(car.id);
    else addCar(car);
  };

  // Confidence label
  const confidenceLabel =
    (car.confidence_score ?? 0) >= 1.0 ? { label: 'AI + Transcript', color: 'text-green-400 bg-green-500/10 border-green-500/20' } :
    (car.confidence_score ?? 0) >= 0.5 ? { label: 'AI Extracted', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' } :
    { label: 'Auto', color: 'text-gray-500 bg-white/5 border-white/10' };

  return (
    <div className="glass-card group flex flex-col h-full bg-[#111118]">
      <div className="relative aspect-[16/10] overflow-hidden bg-black/50">
        <img 
          src={car.thumbnail} 
          alt={car.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <span className="px-3 py-1.5 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
            {car.brand}
          </span>
          <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-gray-200 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10">
            {car.segment}
          </span>
        </div>

        {/* Confidence Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border backdrop-blur-md ${confidenceLabel.color}`}>
            {confidenceLabel.label}
          </span>
        </div>

        {/* Play overlay */}
        <a 
          href={`https://youtube.com/watch?v=${car.videoId}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/20 backdrop-blur-[2px]"
        >
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 delay-100">
            <Play className="w-6 h-6 text-white ml-1 fill-current" />
          </div>
        </a>
      </div>

      <div className="p-6 flex-grow flex flex-col relative z-20 bg-gradient-to-b from-transparent to-black/40">
        {/* Title & Price */}
        <div className="mb-4">
          <h3 className="font-display font-black text-xl leading-tight mb-1 text-white group-hover:text-red-400 transition-colors line-clamp-2" title={car.title}>
            {car.model || car.title.split('|')[0]}
          </h3>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 font-bold text-xl">
            {car.price}
          </p>
          {car.specs.engine && (
            <p className="text-gray-500 text-xs font-bold tracking-wide mt-1 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> {car.specs.engine}
            </p>
          )}
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 mt-auto">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2.5 hover:bg-white/10 transition-colors">
            <Zap className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Power</p>
              <p className="text-xs font-bold text-gray-100">{car.specs.power ?? '—'}</p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2.5 hover:bg-white/10 transition-colors">
            <Settings2 className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Torque</p>
              <p className="text-xs font-bold text-gray-100">{car.specs.torque ?? '—'}</p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2.5 col-span-2 hover:bg-white/10 transition-colors">
            <Gauge className="w-4 h-4 text-green-400 shrink-0" />
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Efficiency</p>
              <p className="text-xs font-bold text-gray-100">{car.specs.efficiency ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Features chips */}
        {car.specs.features && car.specs.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {car.specs.features.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {f}
              </span>
            ))}
            {car.specs.features.length > 3 && (
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                +{car.specs.features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Reviewer Verdict */}
        {car.specs.verdict && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
            <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-gray-300 text-[11px] italic leading-relaxed line-clamp-2">{car.specs.verdict}</p>
          </div>
        )}

        {/* Compare Button */}
        <button 
          onClick={handleCompareToggle}
          disabled={isMaxSelected}
          className={cn(
            "w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider mt-auto",
            isSelected 
              ? "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]" 
              : isMaxSelected
                ? "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/30"
          )}
        >
          {isSelected ? (
            <><Check className="w-4 h-4" /> Added to Garage</>
          ) : isMaxSelected ? (
            "Garage Full (3/3)"
          ) : (
            <><Plus className="w-4 h-4" /> Add to Compare</>
          )}
        </button>
      </div>
    </div>
  );
};
