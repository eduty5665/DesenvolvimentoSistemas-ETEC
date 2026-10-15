import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

// Busca dados da API sempre que a tela ganha foco.
// Devolve { dados, setDados, carregando, atualizando, erro, recarregar }
export function useCarregar(buscar, deps = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  const recarregar = useCallback(async (puxou = false) => {
    if (puxou) setAtualizando(true);
    try {
      setDados(await buscarRef.current());
      setErro('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar])
  );

  return { dados, setDados, carregando, atualizando, erro, recarregar };
}
