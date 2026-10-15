import { Redirect } from 'expo-router';
import { View } from 'react-native';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { cores } from '../theme';

// Tela de abertura (splash screen do Figma): mostra a logo enquanto confere a sessão
export default function Inicio() {
  const { usuario, carregando } = useAuth();
  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, justifyContent: 'center' }}>
        <Logo />
      </View>
    );
  }
  return <Redirect href={usuario ? '/home' : '/login'} />;
}
