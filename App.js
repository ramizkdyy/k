import React, { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Text, View, Button } from "react-native";
import { store, persistor } from "./src/redux/store";
import "./global.css";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  setTestCredentials,
  logout,
  selectIsAuthenticated,
} from "./src/redux/slices/authSlice";

// Component to test Redux state
const ReduxTester = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
};

// Root component with Redux setup
const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppNavigator />
        <ReduxTester />
      </PersistGate>
    </Provider>
  );
};

export default App;
