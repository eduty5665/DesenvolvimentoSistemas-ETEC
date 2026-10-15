import { Redirect } from 'expo-router';
import { Carregando } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

// Tela inicial: manda para o login ou para o app, conforme a sessão
export default function Inicio() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando />;
  return <Redirect href={usuario ? '/inicio' : '/login'} />;
}
