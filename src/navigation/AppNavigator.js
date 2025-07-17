import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useDrawerProgress } from "@react-navigation/drawer";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

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
import { BlurView } from "expo-blur";

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

// Import icons
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
// Solid icons (for selected state)
import {
  faHouse as faHouseSolid,
  faBuilding as faBuildingSolid,
  faEnvelope as faEnvelopeSolid,
  faUser as faUserSolid,
  faSearch as faSearchSolid,
  faBars,
  faMapMarkerAlt,
  faGavel,
  faBell,
  faComments,
  faCog,
  faQuestionCircle,
  faSignOutAlt,
  faChevronLeft,
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
  faSignOutAlt as faSignOutAltRegular,
} from "@fortawesome/pro-regular-svg-icons";

import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  faBuilding,
  faEnvelope,
  faHouse,
  faUser,
} from "@fortawesome/pro-light-svg-icons";

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
const LandlordStack = createStackNavigator();
const TenantStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

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
              screen: "LandlordProfile",
            })
          }
          labelStyle={{ color: "white", fontSize: 16 }}
          icon={({ focused, size }) => (
            <FontAwesomeIcon icon={faUserRegular} size={20} color="white" />
          )}
        />

        <DrawerItem
          label="Nearby"
          onPress={() => {
            /* Navigate to Nearby page */
          }}
          labelStyle={{ color: "white", fontSize: 16 }}
          icon={({ focused, size }) => (
            <FontAwesomeIcon
              icon={faMapMarkerAltRegular}
              size={20}
              color="white"
            />
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
              /* Navigate to messages page */
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
        options={{
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: "Yeni İlan Oluştur",
          headerShown: false,
        }}
      />
      <TenantStack.Screen
        name="AllNearbyProperties"
        component={AllNearbyPropertiesScreen}
        options={{
          title: "Yakındaki Evler",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#000",
          headerShown: false,
          headerTitleStyle: {
            fontWeight: 600,
          },
          headerBackTitle: "",
          headerShadowVisible: false,
        }}
      />
      <LandlordStack.Screen
        name="AllMatchingUsers"
        component={AllMatchingUsers}
        options={{
          title: "Size Uygun Kiracılar",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#000",
          headerShown: false,
          headerTitleStyle: {
            fontWeight: 600,
          },
          headerBackTitle: "",
          headerShadowVisible: false,
          tabBarStyle: { display: 'none' }, // BottomTabs'ı gizle

        }}
      />
      <LandlordStack.Screen
        name="ProfileExpectation"
        component={ProfileExpectationScreen}
        options={{
          title: "Beklenti Profili Oluştur",
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="AllSimilarProperties"
        component={AllSimilarPropertiesScreen}
        options={{
          title: "Benzer İlanlar",
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
        component={PostsScreen}
        options={{
          title: "Mülklerim",
          headerShown: false,
          headerStyle: {
            backgroundColor: "#A0E79E",
          },
          headerTintColor: "#fff",
        }}
      />
      <LandlordStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: "Yeni İlan Oluştur",
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="EditPost"
        component={CreatePostScreen}
        options={{
          title: "İlan Düzenle",
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="Offers"
        component={OffersScreen}
        options={{
          headerStyle: {
            headerShown: false,
          }

        }}
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
        options={{ headerShown: false }}
      />
      <LandlordStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </LandlordStack.Navigator>
  );
};

const LandlordProfileStack = () => {
  return (
    <LandlordStack.Navigator
      screenOptions={{
        headerTintColor: "#fff",
        headerStyle: {
          backgroundColor: "#15803d",
          borderBottomWidth: 0,
          shadowOpacity: 0,
          shadowOffset: { height: 0, width: 0 },
          shadowRadius: 0,
          elevation: 0,
        },
        headerBackTitle: null,
      }}
    >
      <LandlordStack.Screen
        name="LandlordProfileScreen"
        component={ProfileScreen}
        options={{
          headerTitle: "Profil",
          headerTitleStyle: { fontSize: 20, color: "black" },
          headerShown: true,
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerShadowVisible: false,
        }}
      />
      <LandlordStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={({ navigation }) => ({
          headerTitle: "Profili Düzenle",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingHorizontal: 15 }}
            >
              <FontAwesomeIcon icon={faChevronLeft} size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerBackTitle: "",
          headerBackTitleVisible: false,
        })}
      />
      <LandlordStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: "Yeni İlan Oluştur",
          headerShown: false,
        }}
      />
      <LandlordStack.Screen
        name="ProfileExpectation"
        component={ProfileExpectationScreen}
        options={{
          title: "Beklenti Profili Oluştur",
          headerShown: false,
        }}
      />
    </LandlordStack.Navigator>
  );
};

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
        options={{
          headerShown: false,
        }}
      />
      <TenantStack.Screen
        name="AllNearbyProperties"
        component={AllNearbyPropertiesScreen}
        options={{
          title: "Yakındaki Evler",
          headerStyle: {
            backgroundColor: "#4A90E2",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <TenantStack.Screen
        name="ProfileExpectation"
        component={ProfileExpectationScreen}
        options={{
          title: "Beklenti Profili Oluştur",
          headerShown: false,
        }}
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
        options={{
          headerShown: false,
        }}
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
        options={{
          headerShown: false,
        }}
      />
    </TenantStack.Navigator>
  );
};

const TenantProfileStack = () => {
  return (
    <TenantStack.Navigator>
      <TenantStack.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerStyle: {
            display: "flex",
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 700,
          },
          headerTitleAlign: "left",
        }}
      />
      <TenantStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <TenantStack.Screen
        name="ProfileExpectation"
        component={ProfileExpectationScreen}
        options={{
          title: "Beklenti Profili Oluştur",
          headerShown: false,
        }}
      />
    </TenantStack.Navigator>
  );
};

// Tab Navigator
const LandlordTabNavigator = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerBackgroundContainerStyle: "",
          tabBarActiveTintColor: "#000",
          tabBarInactiveTintColor: "#999999",
          tabBarStyle: {
            backgroundColor: "rgba(255, 255, 255, 0.05)", // Daha yüksek opacity
            borderTopColor: "rgba(224, 224, 224, 0.2)",
            paddingTop: 5,
            paddingBottom: 5,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 8,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={100}
              tint="light"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderTopWidth: 0.5,
                borderTopColor: "rgba(0, 0, 0, 0.13)",
              }}
            />
          ),
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="LandlordHome"
          component={LandlordHomeStack}
          options={{
            title: "Ana Sayfa",
            tabBarLabel: "Ana Sayfa",
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={faHouse}
                size={24}
                color={focused ? "#000" : "#999999"}
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
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={faBuilding}
                size={24}
                color={focused ? "#000" : "#999999"}
              />
            ),
            headerStyle: {
              backgroundColor: "#A0E79E",
            },
          }}
        />
        <Tab.Screen
          name="ReceivedOffers"
          component={LandlordOffersStack}
          options={{
            title: "Teklifler",
            tabBarLabel: "Teklifler",
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={faEnvelope}
                size={24}
                color={focused ? "#000" : "#999999"}
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
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={faUser}
                size={24}
                color={focused ? "#000" : "#999999"}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// Tenant tab navigator
const TenantTabNavigator = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#A0E79E" }}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#45CC42",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#e0e0e0",
            paddingTop: 5,
            paddingBottom: 5,
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
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={focused ? faHouseSolid : faHouseRegular}
                size={24}
                color="#A0E79E"
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
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={focused ? faSearchSolid : faSearchRegular}
                size={24}
                color="#A0E79E"
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
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={focused ? faEnvelopeSolid : faEnvelopeRegular}
                size={24}
                color="#A0E79E"
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
            tabBarIcon: ({ focused }) => (
              <FontAwesomeIcon
                icon={focused ? faUserSolid : faUserRegular}
                size={24}
                color="#A0E79E"
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// Wrapped Tab Navigators with Animation
const LandlordTabNavigatorWrapped = () => {
  return (
    <AnimatedScreen>
      <LandlordTabNavigator />
    </AnimatedScreen>
  );
};

const TenantTabNavigatorWrapped = () => {
  return (
    <AnimatedScreen>
      <TenantTabNavigator />
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
          name="MainTabs"
          component={LandlordTabNavigatorWrapped}
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
          swipeEnabled: true,
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
          name="MainTabs"
          component={TenantTabNavigatorWrapped}
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

// Main navigator
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

  // More reliable profile check
  const profileExists = userProfile && Object.keys(userProfile).length > 0;
  const shouldShowCreateProfile =
    isAuthenticated && userRole && (!hasUserProfile || !profileExists);
  const shouldShowRoleSelection = isAuthenticated && !userRole;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView style={{ flex: 0 }} />
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
            ) : userRole === "EVSAHIBI" ? (
              <LandlordDrawerNavigator />
            ) : userRole === "KIRACI" ? (
              <TenantDrawerNavigator />
            ) : (
              <OnboardingNavigator />
            )}
          </ProfileLoader>
        </View>
      </NavigationContainer>
      <SafeAreaView style={{ flex: 0 }} />
    </View>
  );
};

export default AppNavigator;
