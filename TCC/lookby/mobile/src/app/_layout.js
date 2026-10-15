import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { IrishGrover_400Regular } from '@expo-google-fonts/irish-grover/400Regular';
import { Itim_400Regular } from '@expo-google-fonts/itim/400Regular';
import { JockeyOne_400Regular } from '@expo-google-fonts/jockey-one/400Regular';
import { Jomhuria_400Regular } from '@expo-google-fonts/jomhuria/400Regular';
import { Koulen_400Regular } from '@expo-google-fonts/koulen/400Regular';
import { Lekton_700Bold } from '@expo-google-fonts/lekton/700Bold';
import { LindenHill_400Regular } from '@expo-google-fonts/linden-hill/400Regular';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { cores } from '../theme';

// Mantém a tela de abertura (logo) até as fontes do Figma carregarem
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [prontas, erro] = useFonts({
    Inter_400Regular, Inter_600SemiBold, Inter_700Bold,
    IrishGrover_400Regular, Itim_400Regular, JockeyOne_400Regular, Jomhuria_400Regular,
    Koulen_400Regular, Lekton_700Bold, LindenHill_400Regular,
  });

  useEffect(() => {
    if (prontas || erro) SplashScreen.hideAsync().catch(() => {});
  }, [prontas, erro]);

  if (!prontas && !erro) return null;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
    </AuthProvider>
  );
}
