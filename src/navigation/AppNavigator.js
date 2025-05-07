import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUserRole,
  selectCurrentUser,
} from "../redux/slices/authSlice";
import { selectUserProfile } from "../redux/slices/profileSlice";
import { Image } from "react-native";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import CreateProfileScreen from "../screens/CreateProfileScreen"; // Yeni profil oluşturma ekranı
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PostDetailScreen from "../screens/PostDetailScreen";

// Placeholder screens
import { View, Text } from "react-native";
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
const MainStack = createStackNavigator(); // Ana stack - rol seçimi için
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
      <AuthStack.Screen
        name="CreateProfile"
        component={CreateProfileScreen}
        options={{
          title: "Profil Oluştur",
          headerShown: false,
        }}
      />
    </AuthStack.Navigator>
  );
};

// Rol seçimi ve profil oluşturma için navigator
const OnboardingNavigator = () => {
  return (
    <MainStack.Navigator
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
      <MainStack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
        options={{
          title: "Rol Seçin",
          headerShown: false,
        }}
      />
      <MainStack.Screen
        name="CreateProfile"
        component={CreateProfileScreen}
        options={{
          title: "Profil Oluştur",
          headerShown: false,
        }}
      />
    </MainStack.Navigator>
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
      <LandlordStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
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
      <TenantStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
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
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Ev ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyProperties"
        component={LandlordPropertiesStack}
        options={{
          title: "Mülklerim",
          tabBarLabel: "Mülklerim",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Mülk ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="ReceivedOffers"
        component={LandlordOffersStack}
        options={{
          title: "Teklifler",
          tabBarLabel: "Teklifler",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Teklif ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="LandlordProfile"
        component={LandlordProfileStack}
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Profil ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
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
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Ev ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="FindProperties"
        component={TenantPropertiesStack}
        options={{
          title: "İlanlar",
          tabBarLabel: "İlanlar",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Arama ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MySentOffers"
        component={TenantOffersStack}
        options={{
          title: "Tekliflerim",
          tabBarLabel: "Tekliflerim",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Teklif ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="TenantProfile"
        component={TenantProfileStack}
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/logo_kirax.jpg")} // Profil ikonuyla değiştirin
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main navigator that determines which navigator to show based on auth and profile state
const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const userProfile = useSelector(selectUserProfile);
  const currentUser = useSelector(selectCurrentUser);

  console.log("Navigation State:", {
    isAuthenticated,
    userRole,
    userProfile,
    currentUser,
  });

  // Profil durumuna göre akışı belirle
  const hasProfile = userProfile !== null && userProfile !== undefined;
  const shouldShowCreateProfile = isAuthenticated && userRole && !hasProfile;
  const shouldShowRoleSelection =
    isAuthenticated &&
    (!userRole || userRole === "none" || userRole === null || userRole === "");

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : shouldShowRoleSelection ? (
        <OnboardingNavigator />
      ) : shouldShowCreateProfile ? (
        <MainStack.Navigator>
          <MainStack.Screen
            name="CreateProfile"
            component={CreateProfileScreen}
            options={{ headerShown: false }}
          />
        </MainStack.Navigator>
      ) : userRole === "landlord" ? (
        <LandlordTabNavigator />
      ) : (
        <TenantTabNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
