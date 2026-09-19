import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@carnet-d-art/carnet-v1';

interface CarnetState {
  notes: Record<string, number>;
  favoris: Record<string, boolean>;
  expositionNotes: Record<string, number>;
}

interface CarnetContextValue extends CarnetState {
  pret: boolean;
  setNote: (artworkId: string, note: number) => void;
  toggleFavori: (artworkId: string) => void;
  setExpositionNote: (expositionId: string, note: number) => void;
}

const CarnetContext = createContext<CarnetContextValue | null>(null);

export function CarnetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CarnetState>({
    notes: {},
    favoris: {},
    expositionNotes: {},
  });
  const [pret, setPret] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          setState((prev) => ({ ...prev, ...parsed }));
        }
      })
      .finally(() => setPret(true));
  }, []);

  useEffect(() => {
    if (!pret) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, pret]);

  const value = useMemo<CarnetContextValue>(
    () => ({
      ...state,
      pret,
      setNote: (artworkId, note) =>
        setState((prev) => ({ ...prev, notes: { ...prev.notes, [artworkId]: note } })),
      toggleFavori: (artworkId) =>
        setState((prev) => ({
          ...prev,
          favoris: { ...prev.favoris, [artworkId]: !prev.favoris[artworkId] },
        })),
      setExpositionNote: (expositionId, note) =>
        setState((prev) => ({
          ...prev,
          expositionNotes: { ...prev.expositionNotes, [expositionId]: note },
        })),
    }),
    [state, pret],
  );

  return <CarnetContext.Provider value={value}>{children}</CarnetContext.Provider>;
}

export function useCarnet() {
  const ctx = useContext(CarnetContext);
  if (!ctx) throw new Error('useCarnet doit être utilisé sous CarnetProvider');
  return ctx;
}
