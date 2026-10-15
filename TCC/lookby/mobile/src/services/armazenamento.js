import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Guarda a sessão com segurança no celular.
// No navegador (expo web) o SecureStore não existe, então usa o localStorage.
const naWeb = Platform.OS === 'web';

export async function salvar(chave, valor) {
  if (naWeb) return localStorage.setItem(chave, valor);
  return SecureStore.setItemAsync(chave, valor);
}

export async function ler(chave) {
  if (naWeb) return localStorage.getItem(chave);
  return SecureStore.getItemAsync(chave);
}

export async function remover(chave) {
  if (naWeb) return localStorage.removeItem(chave);
  return SecureStore.deleteItemAsync(chave);
}
