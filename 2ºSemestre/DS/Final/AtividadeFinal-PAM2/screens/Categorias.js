import { FlatList, SafeAreaView, StyleProp, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const categorias = [
    {
        codigo_categoria:1,
        nome_categoria:'Peças',
        observacoes_categoria:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.',
    },
    {
        codigo_categoria:2,
        nome_categoria:'Acessórios',
        observacoes_categoria:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.',
    },
    {
        codigo_categoria:3,
        nome_categoria:'Celulares',
        observacoes_categoria:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien. In at turpis tempor, pulvinar magna non, condimentum tortor. Etiam quis molestie dui, a sagittis purus.',
    },
    {
        codigo_categoria:4,
        nome_categoria:'Computadores',
        observacoes_categoria:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien. In at turpis tempor, pulvinar magna non, condimentum tortor. Etiam quis molestie dui, a sagittis purus.',
    },
    {
        codigo_categoria:5,
        nome_categoria:'Periféricoss',
        observacoes_categoria:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien. In at turpis tempor, pulvinar magna non, condimentum tortor. Etiam quis molestie dui, a sagittis purus.',
    },
];

const cadItem = ({ item }) => {
    return (
        <View style={styles.cad_container}>


            <View style={styles.cad_text_container}>

                <Text style={styles.cad_data}>{item.nome_categoria}</Text>

                <TouchableOpacity style={styles.cad_button_details}>
                    <Text style={styles.cad_button_text}>DETALHES</Text>
                </TouchableOpacity>

            </View>

        </View>
    )
}

export default function Categorias() {
    return (
        <SafeAreaView style={styles.container}>

            <FlatList
                data={categorias}
                renderItem={cadItem}
                ListEmptyComponent={<Text>A LISTA DE PRODUTOS ESTÁ VAZIA</Text>}
                keyExtractor={categorias => categorias.codigo_categoria}
            />

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
    header_container: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: '#F00',
    },
    header_title: {
        color: '#333',
        fontSize: 25,
        fontWeight: 'bold',
    },
    icone: {
        width: 60,
        height: 60,
        marginRight: 20,
    },
    cad_list_header: {
        height: 100,
    },
    cad_container: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        borderWidth: 2,
        borderRadius: 10,
        borderColor: '#CCC',
        marginBottom: 10,
        backgroundColor: '#999',
    },
    cad_image: {
        width: 150,
        height: 220,
        marginRight: 10,
        marginBottom: 10,
    },
    cad_text_container: {
        width: 200,
        justifyContent: 'center',
    },
    cad_data: {
        fontSize: 20,
        fontWeight: '600',
        color: '#00F',
        width: '100%',
        height:'auto',
        textAlign: 'center',
    },
    cad_author: {
        fontSize: 14,
        fontWeight: '400',
        width: '100%',
        textAlign: 'left',
        color: '#CCC',
        marginBottom: 10,
    },
    cad_button_details: {
        alignItems: 'center',
        backgroundColor: '#64CBF2',
        padding: 10,
        borderRadius: 5,
        marginTop: 90,
        width: '100%',
    },
    cad_button_text: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});