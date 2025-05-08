import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectUserRole,
  selectCurrentUser,
  selectHasUserProfile,
} from "../redux/slices/authSlice";

import {
  selectUserProfile,
  setUserProfile,
} from "../redux/slices/profileSlice";
import { Image } from "react-native";
import {
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
} from "../redux/api/apiSlice";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import CreateProfileScreen from "../screens/CreateProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PostDetailScreen from "../screens/PostDetailScreen";
import PostsScreen from "../screens/PostsScreen"; // Import the new PostsScreen
import CreatePostScreen from "../screens/CreatePostScreen"; // Import the new CreatePostScreen

// Placeholder screens
import { View, Text, ActivityIndicator } from "react-native";
const OffersScreen = () => (
  <View className="flex-1 justify-center items-center">
    <Text>Offers Screen</Text>
  </View>
);

// Loading screen to show while fetching profile
const LoadingScreen = () => (
  <View className="flex-1 justify-center items-center bg-white">
    <ActivityIndicator size="large" color="#4A90E2" />
    <Text className="mt-3 text-base text-gray-500">Profil yükleniyor...</Text>
  </View>
);

// Create navigation stacks
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
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
      <LandlordStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: "Yeni İlan Oluştur",
          headerShown: false,
        }}
      />
    </LandlordStack.Navigator>
  );
};

const LandlordPropertiesStack = () => {
  return (
    <LandlordStack.Navigator>
      <LandlordStack.Screen
        name="MyPropertiesList"
        component={PostsScreen} // Use the new PostsScreen component
        options={{ title: "Mülklerim" }}
      />
      <LandlordStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
      />
      <LandlordStack.Screen
        name="CreatePost"
        component={CreatePostScreen} // Add CreatePostScreen to navigation
        options={{
          title: "Yeni İlan Oluştur",
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="EditPost"
        component={CreatePostScreen} // Reuse CreatePostScreen for editing
        options={{
          title: "İlan Düzenle",
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="Offers"
        component={OffersScreen}
        options={{ title: "Teklifler" }}
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
      <LandlordStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
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
      <LandlordStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: "Yeni İlan Oluştur",
          headerShown: false,
        }}
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
        component={PostsScreen} // Use the new PostsScreen component
        options={{ title: "İlanlar" }}
      />
      <TenantStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
      />
      <TenantStack.Screen
        name="Offers"
        component={OffersScreen}
        options={{ title: "Teklifler" }}
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
      <TenantStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: "İlan Detayı" }}
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

// ProfileLoader bileşeni - Uygulama başlatıldığında profili yükler
const ProfileLoader = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const hasUserProfile = useSelector(selectHasUserProfile);
  const userProfile = useSelector(selectUserProfile);

  // Role göre doğru profil sorgusunu kullan
  const {
    data: profileData,
    isLoading,
    error,
  } = userRole === "EVSAHIBI"
    ? useGetLandlordProfileQuery(currentUser?.id, {
        skip: !isAuthenticated || !currentUser?.id || !hasUserProfile,
      })
    : useGetTenantProfileQuery(currentUser?.id, {
        skip: !isAuthenticated || !currentUser?.id || !hasUserProfile,
      });

  // Profil bilgileri yüklendiğinde Redux'a kaydet
  useEffect(() => {
    if (profileData && profileData.isSuccess && profileData.result) {
      dispatch(setUserProfile(profileData.result));
    }
  }, [profileData, dispatch]);

  // Kimlik doğrulaması var ve profil var olarak işaretlenmişse, ama profil verisi yoksa ve yükleme işlemi devam ediyorsa
  if (isAuthenticated && hasUserProfile && !userProfile && isLoading) {
    return <LoadingScreen />;
  }

  return children;
};

// Main navigator that determines which navigator to show based on auth and profile state
const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const hasUserProfile = useSelector(selectHasUserProfile);
  const userProfile = useSelector(selectUserProfile);
  const currentUser = useSelector(selectCurrentUser);

  console.log("Navigation State:", {
    currentUser,
    isAuthenticated,
    userProfile,
    userRole,
    hasUserProfile,
  });

  // Daha güvenilir profil kontrolü
  const profileExists = userProfile && Object.keys(userProfile).length > 0;
  const shouldShowCreateProfile =
    isAuthenticated && userRole && (!hasUserProfile || !profileExists);
  const shouldShowRoleSelection = isAuthenticated && !userRole;

  return (
    <NavigationContainer>
      <ProfileLoader>
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
        ) : userRole === "EVSAHIBI" ? (
          <LandlordTabNavigator />
        ) : userRole === "KIRACI" ? (
          <TenantTabNavigator />
        ) : (
          <OnboardingNavigator />
        )}
      </ProfileLoader>
    </NavigationContainer>
  );
};

export default AppNavigator;
