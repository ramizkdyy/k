// navigation/AppNavigator.js
import React, { useEffect, useState } from "react";
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
import { Image, Dimensions } from "react-native";
import {
  useGetLandlordProfileQuery,
  useGetTenantProfileQuery,
} from "../redux/api/apiSlice";

// ✅ SignalR Provider import eklendi
import { SignalRProvider } from "../contexts/SignalRContext";

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
import ExploreScreen from '../screens/ExploreScreen';


// Import icons
import { BlurView } from "expo-blur";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
// Solid icons (for selected state)
import {
  faHouse as faHouseSolid,
  faBuilding as faBuildingSolid,
  faEnvelope as faEnvelopeSolid,
  faUser as faUserSolid,
  faSearch as faSearchSolid,
  faFingerprint as faFingerprintSolid,
  faBars,
  faMapMarkerAlt,
  faGavel,
  faBell,
  faComments,
  faCog,
  faQuestionCircle,
  faSignOutAlt,
  faChevronLeft,
  faMagnifyingGlass as faMagnifyingGlassSolid,
} from "@fortawesome/pro-solid-svg-icons";
// Regular icons (for unselected state)
import {
  faHouse as faHouseRegular,
  faBuilding as faBuildingRegular,
  faEnvelope as faEnvelopeRegular,
  faUser as faUserRegular,
  faSearch as faSearchRegular,
  faMapMarkerAlt as faMapMarkerAltRegular,
  faGavel as faGavelRegular,
  faBell as faBellRegular,
  faComments as faCommentsRegular,
  faCog as faCogRegular,
  faQuestionCircle as faQuestionCircleRegular,
  faMagnifyingGlass as faMagnifyingGlassLight,
  faSignOutAlt as faSignOutAltRegular,
  faFingerprint as faFingerprintRegular

} from "@fortawesome/pro-regular-svg-icons";

import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

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
const RootStack = createStackNavigator(); // Yeni: Ana stack
const Tab = createBottomTabNavigator();

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const userProfile = useSelector(selectUserProfile);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#A0E79E" }}>
      {/* Header section */}
      <View
        style={{
          backgroundColor: "#A0E79E",
          padding: 20,
          paddingTop: 50,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          Merhaba, {userProfile?.firstName || "Kullanıcı"}
        </Text>
      </View>

      {/* Drawer menu items */}
      <DrawerContentScrollView
        {...props}
        style={{ backgroundColor: "#A0E79E" }}
        contentContainerStyle={{ backgroundColor: "#A0E79E", flex: 1 }}
      >
        <DrawerItem
          label="Home"
          onPress={() => props.navigation.navigate("MainTabs")}
          labelStyle={{ color: "white", fontSize: 16 }}
          icon={({ focused, size }) => (
            <FontAwesomeIcon icon={faHouseRegular} size={20} color="white" />
          )}
        />

        <DrawerItem
          label="Profile"
          onPress={() =>
            props.navigation.navigate("MainTabs", {
              screen: "Profile",
            })
          }
          labelStyle={{ color: "white", fontSize: 16 }}
          icon={({ focused, size }) => (
            <FontAwesomeIcon icon={faUserRegular} size={20} color="white" />
          )}
        />

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.3)",
            marginTop: 10,
            paddingTop: 10,
          }}
        >
          <DrawerItem
            label="Get law support"
            onPress={() => {
              /* Navigate to legal support page */
            }}
            labelStyle={{ color: "white", fontSize: 16 }}
            icon={({ focused, size }) => (
              <FontAwesomeIcon icon={faGavelRegular} size={20} color="white" />
            )}
          />

          <DrawerItem
            label="Notification"
            onPress={() => {
              /* Navigate to notifications page */
            }}
            labelStyle={{ color: "white", fontSize: 16 }}
            icon={({ focused, size }) => (
              <FontAwesomeIcon icon={faBellRegular} size={20} color="white" />
            )}
          />

          <DrawerItem
            label="Message"
            onPress={() => {
              props.navigation.navigate("Messages");
            }}
            labelStyle={{ color: "white", fontSize: 16 }}
            icon={({ focused, size }) => (
              <FontAwesomeIcon
                icon={faCommentsRegular}
                size={20}
                color="white"
              />
            )}
          />
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.3)",
            marginTop: 10,
            paddingTop: 10,
          }}
        >
          <DrawerItem
            label="Setting"
            onPress={() => {
              /* Navigate to settings page */
            }}
            labelStyle={{ color: "white", fontSize: 16 }}
            icon={({ focused, size }) => (
              <FontAwesomeIcon icon={faCogRegular} size={20} color="white" />
            )}
          />

          <DrawerItem
            label="Help"
            onPress={() => {
              /* Navigate to help page */
            }}
            labelStyle={{ color: "white", fontSize: 16 }}
            icon={({ focused, size }) => (
              <FontAwesomeIcon
                icon={faQuestionCircleRegular}
                size={20}
                color="white"
              />
            )}
          />

          <DrawerItem
            label="Logout"
            onPress={handleLogout}
            labelStyle={{ color: "white", fontSize: 16 }}
            icon={({ focused, size }) => (
              <FontAwesomeIcon
                icon={faSignOutAltRegular}
                size={20}
                color="white"
              />
            )}
          />
        </View>
      </DrawerContentScrollView>

      {/* Bottom spacer */}
      <View style={{ backgroundColor: "#A0E79E", height: 50 }} />
    </View>
  );
};

// Animated screen wrapper for main content
const AnimatedScreen = ({ children }) => {
  const progress = useDrawerProgress();

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1]);
    const translateX = interpolate(progress.value, [0, 1], [0, 20]);
    const borderRadius = interpolate(progress.value, [0, 1], [0, 15]);

    return {
      transform: [{ scale }, { translateX }],
      borderRadius,
      overflow: "hidden",
      backgroundColor: "#A0E79E",
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#A0E79E" }}>
      <Animated.View
        style={[{ flex: 1, backgroundColor: "#A0E79E" }, animatedStyle]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

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
  const [currentRoute, setCurrentRoute] = useState('Home');

  // Tab bar stilini route'a göre belirle
  const getTabBarStyle = (routeName) => {
    if (routeName === 'Explore') {
      return {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0,
        borderTopWidth: 0,
        backgroundColor: 'transparent',
        paddingTop: 5,
        paddingBottom: 5,
      };
    } else {
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
    }
  };

  // Tab bar background component'ini route'a göre belirle
  const getTabBarBackground = (routeName) => {
    if (routeName === 'Explore') {
      return () => (
        <BlurView
          intensity={40}
          tint="dark"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        />
      );
    } else {
      return () => <View className="bg-white flex-1"></View>;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: currentRoute === 'Explore' ? "white" : "#000",
        tabBarInactiveTintColor: currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999",
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
            <FontAwesomeIcon
              icon={focused ? faMagnifyingGlassSolid : faMagnifyingGlassLight}
              size={24}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: '',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <FontAwesomeIcon
              icon={focused ? faFingerprintSolid : faFingerprintRegular}
              size={22}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
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
            <FontAwesomeIcon
              icon={focused ? faHouseSolid : faHouseRegular}
              size={24}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
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
            <FontAwesomeIcon
              icon={focused ? faEnvelopeSolid : faEnvelopeRegular}
              size={24}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
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
            return userProfile?.profileImageUrl !==
              "default_profile_image_url" ? (
              <View style={{ width: 28, height: 28 }}>
                <Image
                  source={{ uri: userProfile.profileImageUrl }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                  }}
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
                      borderColor: currentRoute === 'Explore' ? "white" : "#000",
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
                      borderColor: currentRoute === 'Explore' ? "white" : "#000",
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

// ✅ Sadece 4 tab için Tab Navigator - Tenant
const TenantTabNavigator = () => {
  const userProfile = useSelector(selectUserProfile);
  const [currentRoute, setCurrentRoute] = useState('Home');

  // Tab bar stilini route'a göre belirle
  const getTabBarStyle = (routeName) => {
    if (routeName === 'Explore') {
      return {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0,
        borderTopWidth: 0,
        backgroundColor: 'transparent',
        paddingTop: 5,
        paddingBottom: 5,
      };
    } else {
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
    }
  };

  // Tab bar background component'ini route'a göre belirle
  const getTabBarBackground = (routeName) => {
    if (routeName === 'Explore') {
      return () => (
        <BlurView
          intensity={15}
          tint="dark"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        />
      );
    } else {
      return () => <View className="bg-white flex-1"></View>;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: currentRoute === 'Explore' ? "white" : "#000",
        tabBarInactiveTintColor: currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999",
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
            <FontAwesomeIcon
              icon={focused ? faSearchSolid : faSearchRegular}
              size={24}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: '',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <FontAwesomeIcon
              icon={focused ? faFingerprintSolid : faFingerprintRegular}
              size={22}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
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
            <FontAwesomeIcon
              icon={focused ? faHouseSolid : faHouseRegular}
              size={24}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
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
            <FontAwesomeIcon
              icon={focused ? faEnvelopeSolid : faEnvelopeRegular}
              size={24}
              color={focused ? (currentRoute === 'Explore' ? "white" : "#000") : (currentRoute === 'Explore' ? "rgba(255, 255, 255, 0.6)" : "#999999")}
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
            return userProfile?.profileImageUrl !==
              "default_profile_image_url" ? (
              <View style={{ width: 28, height: 28 }}>
                <Image
                  source={{ uri: userProfile.profileImageUrl }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                  }}
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
                      borderColor: currentRoute === 'Explore' ? "white" : "#000",
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
                      borderColor: currentRoute === 'Explore' ? "white" : "#000",
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
        component={userRole === "EVSAHIBI" ? LandlordTabNavigator : TenantTabNavigator}
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

// Wrapped Tab Navigators with Animation
const MainStackNavigatorWrapped = () => {
  return (
    <AnimatedScreen>
      <MainStackNavigator />
    </AnimatedScreen>
  );
};

// Drawer Navigators
const LandlordDrawerNavigator = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#A0E79E",
      }}
    >
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: "#A0E79E",
            width: 250,
          },
          drawerActiveTintColor: "white",
          drawerInactiveTintColor: "rgba(255,255,255,0.8)",
          swipeEnabled: false,
          swipeEdgeWidth: screenWidth,
          drawerType: "slide",
          overlayColor: "transparent",
          sceneContainerStyle: {
            backgroundColor: "#A0E79E",
          },
        }}
      >
        <Drawer.Screen
          name="MainStack"
          component={MainStackNavigatorWrapped}
          options={{
            title: "Ana Sayfa",
          }}
        />
      </Drawer.Navigator>
    </View>
  );
};

const TenantDrawerNavigator = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#A0E79E",
      }}
    >
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: "#A0E79E",
            width: 250,
          },
          drawerActiveTintColor: "white",
          drawerInactiveTintColor: "rgba(255,255,255,0.8)",
          swipeEnabled: false,
          swipeEdgeWidth: screenWidth,
          swipeMinDistance: 10,
          drawerType: "slide",
          overlayColor: "transparent",
          sceneContainerStyle: {
            backgroundColor: "#A0E79E",
          },
          gestureHandlerProps: {
            enableTrackpadTwoFingerGesture: true,
          },
        }}
      >
        <Drawer.Screen
          name="MainStack"
          component={MainStackNavigatorWrapped}
          options={{
            title: "Ana Sayfa",
          }}
        />
      </Drawer.Navigator>
    </View>
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

  // Use correct profile query based on role
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

  console.log("Navigation State:", {
    currentUser,
  });

  // More reliable profile check
  const profileExists = userProfile && Object.keys(userProfile).length > 0;
  const shouldShowCreateProfile =
    isAuthenticated && userRole && (!hasUserProfile || !profileExists);
  const shouldShowRoleSelection = isAuthenticated && !userRole;

  return (
    <View className="flex-1 bg-transparent">
      <NavigationContainer>
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