// navigation/AppNavigator.js
import React, { useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectUserRole,
  selectCurrentUser,
  selectHasUserProfile,
  logout,
} from "../redux/slices/authSlice";

import {
  selectUserProfile,
  setUserProfile,
} from "../redux/slices/profileSlice";
import { Dimensions } from "react-native";
import { Image } from "expo-image";
import {
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
} from "../redux/api/apiSlice";

// ✅ SignalR Provider import eklendi
import { SignalRProvider } from "../contexts/SignalRContext";
import notificationService from "../services/notificationService";

// Import screens
import AllNearbyPropertiesScreen from "../screens/AllNearbyPropertiesScreen";
import AllMatchingUsers from "../screens/AllMatchingUsers";
import AllSimilarPropertiesScreen from "../screens/AllSimilarPropertiesScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import CreateProfileScreen from "../screens/CreateProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PostDetailScreen from "../screens/PostDetailScreen";
import PostsScreen from "../screens/PostsScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import ProfileExpectationScreen from "../screens/ProfileExpectationScreen";
import OffersScreen from "../screens/OffersScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ChatDetailScreen from "../screens/ChatDetailScreen";
import AllRecommendedPostsScreen from "../screens/AllRecommendedPostsScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import ExploreScreen from "../screens/ExploreScreen";
import FavoritePropertiesScreen from "../screens/FavoritePropertiesScreen";
import FavoriteProfilesScreen from "../screens/FavoriteProfilesScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
// Import icons
import PlatformBlurView from "../components/PlatformBlurView";
import {
  Home,
  Mail,
  User,
  Search,
  Fingerprint,
} from "lucide-react-native";

import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import AllOffersScreen from "../screens/AllOffersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import HelpSupportScreen from "../screens/HelpSupportScreen";

const { width: screenWidth } = Dimensions.get("window");

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
const RootStack = createStackNavigator();
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
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: "Şifremi Unuttum",
          headerShown: false,
        }}
      />
    </AuthStack.Navigator>
  );
};

// Role selection and profile creation navigator
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

// ✅ Sadece 4 tab için Tab Navigator - Landlord
const LandlordTabNavigator = () => {
  const userProfile = useSelector(selectUserProfile);
  const [currentRoute, setCurrentRoute] = useState("Home");

  // Tab bar stilini route'a göre belirle
  const getTabBarStyle = (routeName) => {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderTopColor: "rgba(224, 224, 224, 0.2)",
      paddingTop: 5,
      paddingBottom: 5,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      elevation: 8,
    };
  };

  // Tab bar background component'ini route'a göre belirle
  const getTabBarBackground = (routeName) => {
    return () => <View className="bg-white flex-1"></View>;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: getTabBarStyle(currentRoute),
        tabBarBackground: getTabBarBackground(currentRoute),
        headerShown: false,
      }}
      screenListeners={{
        state: (e) => {
          const state = e.data.state;
          if (state) {
            const routeName = state.routes[state.index].name;
            setCurrentRoute(routeName);
          }
        },
      }}
    >
      {/* Tab 1: Ana Sayfa */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Ana Sayfa",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <Home
              size={24}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: "",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Fingerprint
              size={22}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />

      {/* Tab 2: Mülklerim */}
      <Tab.Screen
        name="Properties"
        component={PostsScreen}
        options={{
          title: "Mülklerim",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <Search
              size={24}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />

      {/* Tab 3: Teklifler */}
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
        options={{
          title: "Teklifler",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <Mail
              size={24}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />

      {/* Tab 4: Profil */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profil",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => {
            return userProfile?.profileImageUrl &&
              userProfile.profileImageUrl !== "default_profile_image_url" ? (
              <View style={{ width: 28, height: 28 }}>
                <Image
                  source={{ uri: userProfile.profileImageUrl }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                  }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
                {focused && (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: "#000",
                    }}
                  />
                )}
              </View>
            ) : (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 100,
                  backgroundColor: "#f3f4f6",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#111827",
                    fontWeight: "bold",
                  }}
                >
                  {userProfile?.user?.name?.charAt(0) || "P"}
                </Text>
                {focused && (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor:
                        currentRoute === "Explore" ? "white" : "#000",
                    }}
                  />
                )}
              </View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
};


// ✅ Sadece 4 tab için Tab Navigator - Tenant (Düzeltilmiş)
const TenantTabNavigator = () => {
  const userProfile = useSelector(selectUserProfile);
  const [currentRoute, setCurrentRoute] = useState("Home");

  // Tab bar stilini route'a göre belirle - Artık her durumda aynı stil
  const getTabBarStyle = (routeName) => {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderTopColor: "rgba(224, 224, 224, 0.2)",
      paddingTop: 5,
      paddingBottom: 5,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      elevation: 8,
    };
  };

  // Tab bar background component'ini route'a göre belirle - Artık her durumda normal background
  const getTabBarBackground = (routeName) => {
    return () => <View className="bg-white flex-1"></View>;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#000", // Artık her durumda siyah
        tabBarInactiveTintColor: "#999999", // Artık her durumda gri
        tabBarStyle: getTabBarStyle(currentRoute),
        tabBarBackground: getTabBarBackground(currentRoute),
        headerShown: false,
      }}
      screenListeners={{
        state: (e) => {
          const state = e.data.state;
          if (state) {
            const routeName = state.routes[state.index].name;
            setCurrentRoute(routeName);
          }
        },
      }}
    >
      {/* Tab 1: Ana Sayfa */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Ana Sayfa",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <Home
              size={24}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: "",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Fingerprint
              size={22}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />

      {/* Tab 2: İlanlar */}
      <Tab.Screen
        name="Properties"
        component={PostsScreen}
        options={{
          title: "İlanlar",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <Search
              size={24}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />

      {/* Tab 3: Tekliflerim */}
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
        options={{
          title: "Tekliflerim",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <Mail
              size={24}
              color={focused ? "#000" : "#999999"}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />

      {/* Tab 4: Profil */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profil",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => {
            return userProfile?.profileImageUrl &&
              userProfile.profileImageUrl !== "default_profile_image_url" ? (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  overflow: "hidden",
                  borderWidth: focused ? 2 : 0,
                  borderColor: "#000", // Sabit renk
                }}
              >
                <Image
                  source={{ uri: userProfile.profileImageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  cachePolicy="memory-disk"
                />
              </View>
            ) : (
              <View>
                <User
                  size={24}
                  color={focused ? "#000" : "#999999"} // Sabit renk
                  fill={focused ? "#000" : "none"}
                />
              </View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
};
// ✅ Yeni yapı: Ana Stack Navigator - Sadece tab'lı ekranlar ve diğer ekranlar ayrı
const MainStackNavigator = () => {
  const userRole = useSelector(selectUserRole);

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      {/* Ana Tab Navigator */}
      <RootStack.Screen
        name="MainTabs"
        component={
          userRole === "EVSAHIBI" ? LandlordTabNavigator : TenantTabNavigator
        }
        options={{ headerShown: false }}
      />

      {/* Diğer tüm ekranlar - Bottom tab olmadan */}
      <RootStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="EditPost"
        component={CreatePostScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Offers"
        component={OffersScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="AllNearbyProperties"
        component={AllNearbyPropertiesScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AllOffers"
        component={AllOffersScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AllMatchingUsers"
        component={AllMatchingUsers}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="AllSimilarProperties"
        component={AllSimilarPropertiesScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="AllRecommendedPosts"
        component={AllRecommendedPostsScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="ProfileExpectation"
        component={ProfileExpectationScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="FavoriteProperties"
        component={FavoritePropertiesScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="FavoriteProfiles"
        component={FavoriteProfilesScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerShown: false }}
      />
      {/* <RootStack.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            headerShown: false, // Kendi header'ımız var
            gestureEnabled: true,
            animationTypeForReplace: 'push',
          }}
        /> */}
    </RootStack.Navigator>
  );
};



// ProfileLoader component - Loads profile when app starts
const ProfileLoader = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const hasUserProfile = useSelector(selectHasUserProfile);
  const userProfile = useSelector(selectUserProfile);

  const baseSkip = !isAuthenticated || !currentUser?.id || !hasUserProfile;

  const { data: landlordProfileData, isLoading: landlordLoading } =
    useGetLandlordProfileQuery(currentUser?.id, {
      skip: baseSkip || userRole !== "EVSAHIBI",
    });

  const { data: tenantProfileData, isLoading: tenantLoading } =
    useGetTenantProfileQuery(currentUser?.id, {
      skip: baseSkip || userRole !== "KIRACI",
    });

  const profileData =
    userRole === "EVSAHIBI" ? landlordProfileData : tenantProfileData;
  const isLoading =
    userRole === "EVSAHIBI" ? landlordLoading : tenantLoading;

  // Save profile info to Redux when loaded
  useEffect(() => {
    if (profileData && profileData.isSuccess && profileData.result) {
      dispatch(setUserProfile(profileData.result));
    }
  }, [profileData, dispatch]);

  // If authenticated and profile is marked as existing, but no profile data and loading
  if (isAuthenticated && hasUserProfile && !userProfile && isLoading) {
    return <LoadingScreen />;
  }

  return children;
};

// ✅ SignalR ile sarılmış Ana Navigator
const AppNavigatorContent = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const hasUserProfile = useSelector(selectHasUserProfile);
  const userProfile = useSelector(selectUserProfile);
  const currentUser = useSelector(selectCurrentUser);


  // More reliable profile check
  const profileExists = userProfile && Object.keys(userProfile).length > 0;
  const shouldShowCreateProfile =
    isAuthenticated && userRole && (!hasUserProfile || !profileExists);
  const shouldShowRoleSelection = isAuthenticated && !userRole;

  const navigationRef = useRef();

  // Set up navigation reference for notification service
  const onNavigationReady = () => {
    if (navigationRef.current) {
      notificationService.setNavigationRef(navigationRef.current);
    }
  };

  return (
    <View className="flex-1 bg-transparent">
      <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
        <View style={{ flex: 1 }}>
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
            ) : (
              <MainStackNavigator />
            )}
          </ProfileLoader>
        </View>
      </NavigationContainer>
    </View>
  );
};

// ✅ Main navigator - SignalR Provider ile sarılmış
const AppNavigator = () => {
  return (
    <SignalRProvider>
      <AppNavigatorContent />
    </SignalRProvider>
  );
};

export default AppNavigator;
