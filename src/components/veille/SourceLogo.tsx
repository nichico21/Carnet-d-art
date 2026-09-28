// src/components/veille/SourceLogo.tsx
import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

function extraireDomaine(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function SourceLogo({ url, size = 14 }: { url: string; size?: number }) {
  const domaine = extraireDomaine(url);
  if (!domaine) return null;

  return (
    <Image
      source={{ uri: `https://www.google.com/s2/favicons?sz=64&domain=${domaine}` }}
      style={[styles.logo, { width: size, height: size }]}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: { borderRadius: 3 },
});