import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { cores } from '../../theme';

// Telas públicas (login, cadastro e recuperação de senha). Quem já está logado vai para a Home.
export default function AuthLayout() {
  const { usuario, carregando } = useAuth();
  if (!carregando && usuario) return <Redirect href="/home" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: cores.fundo } }} />
  );
}
