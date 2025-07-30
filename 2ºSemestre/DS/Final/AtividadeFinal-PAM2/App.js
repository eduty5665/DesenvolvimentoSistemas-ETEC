import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from './screens/Login';
import CreateUser from './screens/CreateUser';
import DrawerMenu from "./drawerMenu/DrawerMenu";



const Stack = createNativeStackNavigator();

export default function App() {

  return (

    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">

        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: "LOGIN" }}
        />

        <Stack.Screen
          name="CreateUser"
          component={CreateUser}
          options={{ title: "CADASTRO" }}
        />

        <Stack.Screen
          name="DrawerMenu"
          component={DrawerMenu}
          options={
            {
              title: "",
              headerShown: false
            }
          }
        />
      </Stack.Navigator>
    </NavigationContainer>

  )

}