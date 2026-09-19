import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'warning' | 'info';
}

export function Badge({ label, variant = 'warning' }: BadgeProps) {
  const couleurs = variant === 'warning'
    ? { fond: '#F3E1DE', texte: '#7B2D26' }  // même rouge sourdine que le quiz du prototype
    : { fond: '#E9E4D8', texte: '#5B5245' };

  return (
    <View style={[styles.badge, { backgroundColor: couleurs.fond }]}>
      <Text style={[styles.texte, { color: couleurs.texte }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  texte: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});