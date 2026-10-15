import { Redirect, Stack } from 'expo-router';
import { Carregando } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { cores } from '../../theme';

// Telas que exigem login
export default function AppLayout() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: cores.primaria,
        headerTitleStyle: { color: cores.texto },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pedido/novo" options={{ title: 'Novo pedido', presentation: 'modal' }} />
      <Stack.Screen name="pedido/[id]" options={{ title: 'Pedido' }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'Conversa' }} />
      <Stack.Screen name="usuario/[id]" options={{ title: 'Perfil' }} />
    </Stack>
  );
}
