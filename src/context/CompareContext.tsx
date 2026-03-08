import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { type Car } from '../types/car';

interface CompareContextType {
  selectedCars: Car[];
  addCar: (car: Car) => boolean;
  removeCar: (carId: string) => void;
  clearComparison: () => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (isOpen: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const addCar = (car: Car) => {
    if (selectedCars.find(c => c.id === car.id)) return false;
    if (selectedCars.length >= 3) return false;
    
    setSelectedCars([...selectedCars, car]);
    return true;
  };

  const removeCar = (carId: string) => {
    setSelectedCars(selectedCars.filter(c => c.id !== carId));
    if (selectedCars.length === 1) {
      setIsCompareModalOpen(false);
    }
  };

  const clearComparison = () => {
    setSelectedCars([]);
    setIsCompareModalOpen(false);
  };

  return (
    <CompareContext.Provider value={{
      selectedCars,
      addCar,
      removeCar,
      clearComparison,
      isCompareModalOpen,
      setIsCompareModalOpen
    }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
