// Componentes visuais reutilizados nas telas
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { cores, espaco, raio } from '../theme';
import { STATUS } from '../utils/formatar';

export function Botao({ titulo, onPress, variante = 'primario', carregando, desabilitado, icone, style }) {
  const estilos = {
    primario: { fundo: cores.primaria, texto: '#fff', borda: cores.primaria },
    secundario: { fundo: cores.superficie, texto: cores.primaria, borda: cores.primaria },
    perigo: { fundo: cores.superficie, texto: cores.perigo, borda: cores.perigo },
    sucesso: { fundo: cores.sucesso, texto: '#fff', borda: cores.sucesso },
  }[variante];
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        s.botao,
        { backgroundColor: estilos.fundo, borderColor: estilos.borda, opacity: inativo ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={estilos.texto} />
      ) : (
        <View style={s.linha}>
          {icone && <Ionicons name={icone} size={18} color={estilos.texto} style={{ marginRight: 6 }} />}
          <Text style={[s.botaoTexto, { color: estilos.texto }]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Campo({ rotulo, erro, style, ...props }) {
  return (
    <View style={[{ marginBottom: espaco.md }, style]}>
      {rotulo && <Text style={s.rotulo}>{rotulo}</Text>}
      <TextInput
        placeholderTextColor={cores.textoSecundario}
        style={[s.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, erro && { borderColor: cores.perigo }]}
        {...props}
      />
      {erro ? <Text style={s.erro}>{erro}</Text> : null}
    </View>
  );
}

// Lista de opções em "chips" (ex.: categorias, veículo)
export function Opcoes({ opcoes, valor, onChange, rotulo }) {
  return (
    <View style={{ marginBottom: espaco.md }}>
      {rotulo && <Text style={s.rotulo}>{rotulo}</Text>}
      <View style={s.chips}>
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)}
              onPress={() => onChange(o.valor)}
              style={[s.chip, ativo && s.chipAtivo]}
            >
              {o.icone && (
                <Ionicons name={o.icone} size={16} color={ativo ? '#fff' : cores.texto} style={{ marginRight: 4 }} />
              )}
              <Text style={[s.chipTexto, ativo && { color: '#fff' }]}>{o.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Cartao({ children, onPress, style }) {
  if (!onPress) return <View style={[s.cartao, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.cartao, pressed && { opacity: 0.8 }, style]}>
      {children}
    </Pressable>
  );
}

export function StatusBadge({ status }) {
  const st = STATUS[status] || STATUS.ABERTO;
  return (
    <View style={[s.badge, { backgroundColor: st.fundo }]}>
      <Text style={[s.badgeTexto, { color: st.cor }]}>{st.rotulo}</Text>
    </View>
  );
}

export function Vazio({ icone = 'file-tray-outline', titulo, texto }) {
  return (
    <View style={s.vazio}>
      <Ionicons name={icone} size={48} color={cores.textoSecundario} />
      <Text style={s.vazioTitulo}>{titulo}</Text>
      {texto && <Text style={s.vazioTexto}>{texto}</Text>}
    </View>
  );
}

export function Carregando() {
  return (
    <View style={s.centro}>
      <ActivityIndicator size="large" color={cores.primaria} />
    </View>
  );
}

export function MensagemErro({ texto }) {
  if (!texto) return null;
  return (
    <View style={s.caixaErro}>
      <Ionicons name="alert-circle-outline" size={18} color={cores.perigo} />
      <Text style={s.caixaErroTexto}>{texto}</Text>
    </View>
  );
}

export function Estrelas({ nota = 0, tamanho = 16, onChange }) {
  return (
    <View style={s.linha}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} hitSlop={6} disabled={!onChange}>
          <Ionicons
            name={n <= Math.round(nota) ? 'star' : 'star-outline'}
            size={tamanho}
            color="#F59E0B"
            style={{ marginRight: 2 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function Avatar({ nome = '?', tamanho = 44 }) {
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  return (
    <View style={[s.avatar, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}>
      <Text style={[s.avatarTexto, { fontSize: tamanho * 0.38 }]}>{iniciais}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo },
  botao: {
    minHeight: 48,
    borderRadius: raio.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
  },
  botaoTexto: { fontSize: 16, fontWeight: '600' },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  input: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    paddingVertical: 12,
    fontSize: 16,
    color: cores.texto,
  },
  erro: { color: cores.perigo, fontSize: 13, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espaco.md,
    paddingVertical: 8,
    borderRadius: raio.pill,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  chipAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipTexto: { fontSize: 14, color: cores.texto, fontWeight: '500' },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.lg,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: raio.pill },
  badgeTexto: { fontSize: 12, fontWeight: '700' },
  vazio: { alignItems: 'center', padding: espaco.xl, marginTop: 40 },
  vazioTitulo: { fontSize: 17, fontWeight: '600', color: cores.texto, marginTop: espaco.md, textAlign: 'center' },
  vazioTexto: { fontSize: 14, color: cores.textoSecundario, marginTop: 6, textAlign: 'center' },
  caixaErro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.perigoClaro,
    padding: espaco.md,
    borderRadius: raio.md,
    marginBottom: espaco.md,
  },
  caixaErroTexto: { color: cores.perigo, flex: 1, fontSize: 14 },
  avatar: { backgroundColor: cores.destaqueClaro, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: cores.primariaEscura, fontWeight: '700' },
});
