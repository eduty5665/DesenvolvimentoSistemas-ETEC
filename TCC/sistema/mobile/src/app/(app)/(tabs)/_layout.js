import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { useAuth } from '../../../contexts/AuthContext';
import { cores } from '../../../theme';

export default function TabsLayout() {
  const { usuario } = useAuth();
  const entregador = usuario?.tipo === 'ENTREGADOR';

  const icone = (nome) => ({ color, size }) => <Ionicons name={nome} color={color} size={size} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        headerTitleStyle: { color: cores.texto },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: entregador ? 'Pedidos disponíveis' : 'Meus pedidos',
          tabBarLabel: entregador ? 'Pedidos' : 'Início',
          tabBarIcon: icone(entregador ? 'search-outline' : 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="entregas"
        options={{
          title: 'Minhas entregas',
          tabBarLabel: 'Entregas',
          tabBarIcon: icone('cube-outline'),
          // Aba só aparece para entregadores
          href: entregador ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="conversas"
        options={{ title: 'Conversas', tabBarIcon: icone('chatbubbles-outline') }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone('person-outline') }} />
    </Tabs>
  );
}
