import { StyleSheet, Text, SafeAreaView, Image, View, TextInput, TouchableOpacity, ImageBackground } from 'react-native';

export default function tbl_categoria() {
    return (

        <SafeAreaView style={styles.container}>
            {/*imagem de login */}
            <View style={styles.topo}>

                <Image
                    style={styles.login}
                    source={require('./assets/LookBy-logo.png')}
                />
            </View>
            {/*titulo de login */}
            <Text style={styles.texto}>CADASTRAR CATEGORIA</Text>

            {/*TEXTINPUT DE E-MAIL */}
            <View style={styles.containerTextInput}>
                <TextInput style={styles.textInput} placeholder='NOME CATEGORIA' placeholderTextColor={"#ffffff"} keyboardType='email-address' />
            </View>

            {/*TEXTINPUT DE SENHA */}
            <View style={styles.containerTextInput}>
                <TextInput style={[styles.textInput, styles.multilineText]} placeholder='OBSERVAÇÕES' placeholderTextColor={"#ffffff"} multiline />
            </View>
            {/* BOTÃO DE LOGIN */}
            <TouchableOpacity style={styles.btnCad}>
                <Text style={styles.txtCad}>CADASTRAR</Text>
            </TouchableOpacity>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 15
    },
    topo: {
        alignItems: 'center'
    },
    login: {
        width: 400,
        height: 120,
        marginTop: 100
    },
    texto: {
        fontSize: 28,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 30
    },
    containerTextInput: {
        flexDirection: 'row',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        paddingBottom: 8,
        marginBottom: 25,
        alignItems: 'center',
        color: "#fff"
    },
    textInput: {
        padding: 10,
        color: "#fff"
    },
    btnCad: {
        backgroundColor: '#16b5e7',
        padding: 20,
        borderRadius: 10,
        marginBottom: 30
    },
    txtCad: {
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 16,
        color: '#fff'
    },
    multilineText: {
        minHeight: 100,
        textAlignVertical: 'top'
    }


});
