import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Image plein écran avec pincement pour zoomer et glisser une fois zoomée.
 * Double-tap pour zoomer/dézoomer rapidement.
 */
export function ZoomableImage({ uri }: { uri: string }) {
  const echelle = useSharedValue(1);
  const echelleDepart = useSharedValue(1);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const decalageDepartX = useSharedValue(0);
  const decalageDepartY = useSharedValue(0);

  const pincement = Gesture.Pinch()
    .onStart(() => {
      echelleDepart.value = echelle.value;
    })
    .onUpdate((e) => {
      echelle.value = Math.min(Math.max(echelleDepart.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      if (echelle.value < 1.05) {
        echelle.value = withTiming(1);
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
      }
    });

  const glisser = Gesture.Pan()
    .onStart(() => {
      decalageDepartX.value = translationX.value;
      decalageDepartY.value = translationY.value;
    })
    .onUpdate((e) => {
      if (echelle.value > 1) {
        translationX.value = decalageDepartX.value + e.translationX;
        translationY.value = decalageDepartY.value + e.translationY;
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (echelle.value > 1) {
        echelle.value = withTiming(1);
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
      } else {
        echelle.value = withTiming(2.5);
      }
    });

  const geste = Gesture.Simultaneous(pincement, glisser, doubleTap);

  const styleAnime = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: echelle.value },
    ],
  }));

  return (
    <GestureDetector gesture={geste}>
      <Animated.View style={[StyleSheet.absoluteFill, styleAnime]}>
        <Image source={{ uri }} style={styles.image} contentFit="contain" cachePolicy="memory-disk" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});