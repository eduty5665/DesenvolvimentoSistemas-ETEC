import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, SafeAreaView, Image, View, TextInput, TouchableOpacity } from 'react-native';

export default function TelaDrawer1() {
    return (
        <SafeAreaView style={styles.container}>
            {/*imagem de login */}
            <View>
                <Image style={styles.login} source={require('../assets/logo.jpg')}/>
            </View>

            <View>
                <Text style={styles.text}>BEM VINDO!</Text>
                <StatusBar style="auto" />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    text:{
        fontSize:40,
        color: '#00F',
        fontWeight: 'bold',
    },
    login: {
        width: 200,
        height:200
    }
});