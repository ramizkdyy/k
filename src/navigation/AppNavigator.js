import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUserRole,
} from "../redux/slices/authSlice";
import { Image } from "react-native";

// Import screens - Yeni Tailwind ile oluşturulmuş ekranları kullan
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PostDetailScreen from "../screens/PostDetailScreen";

// Daha sonra ekleyebileceğiniz diğer ekranlar için hazırlık
// PostsScreen'i gerçek uygulama ile değiştirmek için kullanılabilir
import { View, Text } from "react-native";

// Placeholder screens - daha sonra bunları gerçek ekranlarla değiştirebilirsiniz
const PostsScreen = () => (
  <View className="flex-1 justify-center items-center">
    <Text>Posts Screen</Text>
  </View>
);
const OffersScreen = () => (
  <View className="flex-1 justify-center items-center">
    <Text>Offers Screen</Text>
  </View>
);

// Create navigation stacks
const AuthStack = createStackNavigator();
const LandlordStack = createStackNavigator();
const TenantStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth navigator for non-authenticated users
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4A90E2",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Giriş Yap",
          headerShown: false,
        }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: "Kayıt Ol",
          headerShown: false,
        }}
      />
      <AuthStack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
        options={{
          title: "Rol Seçin",
          headerShown: false,
        }}
      />
    </AuthStack.Navigator>
  );
};

// Landlord Stack Navigators for each tab
const LandlordHomeStack = () => {
  return (
    <LandlordStack.Navigator>
      <LandlordStack.Screen
        name="LandlordHomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <LandlordStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </LandlordStack.Navigator>
  );
};

const LandlordPropertiesStack = () => {
  return (
    <LandlordStack.Navigator>
      <LandlordStack.Screen
        name="MyPropertiesList"
        component={PostsScreen}
        options={{ title: "Mülklerim" }}
      />
      <LandlordStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </LandlordStack.Navigator>
  );
};

const LandlordOffersStack = () => {
  return (
    <LandlordStack.Navigator>
      <LandlordStack.Screen
        name="ReceivedOffersList"
        component={OffersScreen}
        options={{ title: "Gelen Teklifler" }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </LandlordStack.Navigator>
  );
};

const LandlordProfileStack = () => {
  return (
    <LandlordStack.Navigator>
      <LandlordStack.Screen
        name="LandlordProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </LandlordStack.Navigator>
  );
};

// Tenant Stack Navigators for each tab
const TenantHomeStack = () => {
  return (
    <TenantStack.Navigator>
      <TenantStack.Screen
        name="TenantHomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <TenantStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </TenantStack.Navigator>
  );
};

const TenantPropertiesStack = () => {
  return (
    <TenantStack.Navigator>
      <TenantStack.Screen
        name="FindPropertiesList"
        component={PostsScreen}
        options={{ title: "İlanlar" }}
      />
      <TenantStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </TenantStack.Navigator>
  );
};

const TenantOffersStack = () => {
  return (
    <TenantStack.Navigator>
      <TenantStack.Screen
        name="SentOffersList"
        component={OffersScreen}
        options={{ title: "Gönderilen Teklifler" }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </TenantStack.Navigator>
  );
};

const TenantProfileStack = () => {
  return (
    <TenantStack.Navigator>
      <TenantStack.Screen
        name="TenantProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      {/* Buraya diğer ilgili ekranları ekleyin */}
    </TenantStack.Navigator>
  );
};

// Landlord tab navigator
const LandlordTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#e0e0e0",
          paddingTop: 5,
          paddingBottom: 5,
        },
        headerStyle: {
          backgroundColor: "#4A90E2",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="LandlordHome"
        component={LandlordHomeStack}
        options={{
          title: "Ana Sayfa",
          tabBarLabel: "Ana Sayfa",

        }}
      />
      <Tab.Screen
        name="MyProperties"
        component={LandlordPropertiesStack}
        options={{
          title: "Mülklerim",
          tabBarLabel: "Mülklerim",

        }}
      />
      <Tab.Screen
        name="ReceivedOffers"
        component={LandlordOffersStack}
        options={{
          title: "Teklifler",
          tabBarLabel: "Teklifler",

        }}
      />
      <Tab.Screen
        name="LandlordProfile"
        component={LandlordProfileStack}
        options={{
          title: "Profil",
          tabBarLabel: "Profil",

        }}
      />
    </Tab.Navigator>
  );
};

// Tenant tab navigator
const TenantTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#e0e0e0",
          paddingTop: 5,
          paddingBottom: 5,
        },
        headerStyle: {
          backgroundColor: "#4A90E2",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="TenantHome"
        component={TenantHomeStack}
        options={{
          title: "Ana Sayfa",
          tabBarLabel: "Ana Sayfa",

        }}
      />
      <Tab.Screen
        name="FindProperties"
        component={TenantPropertiesStack}
        options={{
          title: "İlanlar",
          tabBarLabel: "İlanlar",
        }}
      />
      <Tab.Screen
        name="MySentOffers"
        component={TenantOffersStack}
        options={{
          title: "Tekliflerim",
          tabBarLabel: "Tekliflerim",

        }}
      />
      <Tab.Screen
        name="TenantProfile"
        component={TenantProfileStack}
        options={{
          title: "Profil",
          tabBarLabel: "Profil",

        }}
      />
    </Tab.Navigator>
  );
};

// Main navigator that determines which navigator to show based on auth state
const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : userRole === "landlord" ? (
        <LandlordTabNavigator />
      ) : (
        <TenantTabNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
