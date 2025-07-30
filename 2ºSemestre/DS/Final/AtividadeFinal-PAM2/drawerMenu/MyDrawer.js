import { Image, StyleSheet, Text, View } from 'react-native';

//IMPORTAÇÕES DO MENU DRAWER
import { createDrawerNavigator } from '@react-navigation/drawer';

//IMPORTAÇÃO DAS TELAS NAVEGAVEIS NO DRAWERMENU

import Home from '../screens/Home';
import Produtos from '../screens/Produtos';
import Categorias from '../screens/Categorias';

//CRIAÇÃO DO NAVIGATOR DO DRAWERMENU
const Drawer = createDrawerNavigator();
//CONSTRUÇÃO DE UM FUNCTIONAL COMPONENT
export default function MyDrawer() {

    return (
        <Drawer.Navigator
            initialRouteName='Home'
        >
            <Drawer.Screen
                name='Home'
                component={Home}
                options={{
                    title: 'Início',
                    headerTitleStyle: { color: 'transparent' }
                }}
            />


            <Drawer.Screen
                name='Produtos'
                component={Produtos}
                options={{
                    title: 'Produtos',
                    headerTitleStyle: { color: 'transparent' }
                }}
            />

            <Drawer.Screen
                name='Categorias'
                component={Categorias}
                options={{
                    title: 'Categorias',
                    headerTitleStyle: { color: 'transparent' }
                }}
            />

        </Drawer.Navigator>
    );
}

