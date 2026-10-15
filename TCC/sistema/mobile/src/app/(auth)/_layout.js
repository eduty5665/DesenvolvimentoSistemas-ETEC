import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { cores } from '../../theme';

// Telas públicas (login e cadastro). Se já estiver logado, vai para o app.
export default function AuthLayout() {
  const { usuario, carregando } = useAuth();
  if (!carregando && usuario) return <Redirect href="/inicio" />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: cores.primaria,
        headerShadowVisible: false,
        headerTitleStyle: { color: cores.texto },
        headerStyle: { backgroundColor: cores.fundo },
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
    </Stack>
  );
}
