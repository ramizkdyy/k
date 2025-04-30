import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

// Auth Screens
import LoginScreen from "./Screens/Auth/LoginScreen";
import SignupScreen from "./Screens/Auth/SignupScreen";

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen

                name="Login"
                component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen}
            />
        </Stack.Navigator>
    )
}





const Navigation = () => {
    return (
        <NavigationContainer>
            <AuthStack />
        </NavigationContainer>
    )
}

export default Navigation

const styles = StyleSheet.create({})