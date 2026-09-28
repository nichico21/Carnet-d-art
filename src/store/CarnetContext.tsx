import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculerSerie, jourISO } from '../games/progression';

const STORAGE_KEY = '@carnet-d-art/carnet-v1';

interface JeuxState {
  xp: number;
  parties: number;
  serie: number;
  dernierJourJoue: string | null;
  meilleursScores: Record<string, number>;
}

interface CarnetState {
  notes: Record<string, number>;
  favoris: Record<string, boolean>;
  expositionNotes: Record<string, number>;
  veilleEnregistres: Record<string, boolean>;
  veilleDerniereConsultationId: string | null;
  jeux: JeuxState;
}

interface CarnetContextValue extends CarnetState {
  pret: boolean;
  setNote: (artworkId: string, note: number) => void;
  toggleFavori: (artworkId: string) => void;
  setExpositionNote: (expositionId: string, note: number) => void;
  toggleVeilleEnregistre: (contenuId: string) => void;
  setVeilleDerniereConsultation: (contenuId: string) => void;
  enregistrerPartie: (jeuId: string, score: number, xpGagne: number) => void;
}

const CarnetContext = createContext<CarnetContextValue | null>(null);

const JEUX_PAR_DEFAUT: JeuxState = {
  xp: 0,
  parties: 0,
  serie: 0,
  dernierJourJoue: null,
  meilleursScores: {},
};

export function CarnetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CarnetState>({
    notes: {},
    favoris: {},
    expositionNotes: {},
    veilleEnregistres: {},
    veilleDerniereConsultationId: null,
    jeux: JEUX_PAR_DEFAUT,
  });
  const [pret, setPret] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          setState((prev) => ({
            ...prev,
            ...parsed,
            jeux: { ...prev.jeux, ...(parsed.jeux ?? {}) },
          }));
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
      toggleVeilleEnregistre: (contenuId) =>
        setState((prev) => ({
          ...prev,
          veilleEnregistres: {
            ...prev.veilleEnregistres,
            [contenuId]: !prev.veilleEnregistres[contenuId],
          },
        })),
      setVeilleDerniereConsultation: (contenuId) =>
        setState((prev) => ({ ...prev, veilleDerniereConsultationId: contenuId })),
      enregistrerPartie: (jeuId, score, xpGagne) =>
        setState((prev) => {
          const aujourdhui = jourISO();
          return {
            ...prev,
            jeux: {
              xp: prev.jeux.xp + xpGagne,
              parties: prev.jeux.parties + 1,
              serie: calculerSerie(prev.jeux.serie, prev.jeux.dernierJourJoue, aujourdhui),
              dernierJourJoue: aujourdhui,
              meilleursScores: {
                ...prev.jeux.meilleursScores,
                [jeuId]: Math.max(prev.jeux.meilleursScores[jeuId] ?? 0, score),
              },
            },
          };
        }),
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