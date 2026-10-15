import { Redirect, Stack } from 'expo-router';
import { Carregando } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { AvisosProvider } from '../../contexts/AvisosContext';
import { cores } from '../../theme';

// Telas que exigem login. O cabeçalho é desenhado pelo componente <Tela>.
export default function AppLayout() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;

  return (
    <AvisosProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
    </AvisosProvider>
  );
}
