import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

 

export default function App() {
  return (
<View style={styles.container}>
<Text style={{
        color: 'white',
        fontSize: 45,
        fontWeight: 900,
        width: '100%',
        textAlign: 'center',
        padding: 25,
        backgroundColor: 'darkgreen'
      }}>EDUTY<Text style={{color: 'yellow'}}>.BET</Text></Text>
<StatusBar style="auto" />

 

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

<TouchableOpacity onPress={() => alert('toma cem reais')}>
<Ionicons name="logo-usd" size={60} color="darkgreen" />
</TouchableOpacity>

      <Text style={{ margin: 20, color: 'white', fontSize: 20}}>Acerte e ganhe R$100</Text>

 

      <TouchableOpacity onPress={() => alert('Desculpe você perdeu!')}>
<Ionicons name="ios-rocket" size={60} color="darkgreen" />
</TouchableOpacity>
</View>

 
   
</View>
  );
}

 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#282727',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    width: 500,
  },
  image: {
    position: 'relative',
    top: 100,
    width: 390
  },
});