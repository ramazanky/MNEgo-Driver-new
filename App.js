// App.js - TAM EKSİKSİZ DİL ve TEMA DESTEKLİ
import './src/services/i18n';

import React from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/config/toast.config';
import { ThemeProvider, useTheme } from './src/services/ThemeContext';

import SplashScreen from './src/screens/SplashScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import DriverLoginScreen from './src/screens/DriverLoginScreen';
import DriverRegisterScreen from './src/screens/DriverRegisterScreen';
import DriverForgotPasswordScreen from './src/screens/DriverForgotPasswordScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import DriverProfileScreen from './src/screens/DriverProfileScreen';
import DriverDocumentsScreen from './src/screens/DriverDocumentsScreen';
import DriverEarningsScreen from './src/screens/DriverEarningsScreen';
import DriverTripHistoryScreen from './src/screens/DriverTripHistoryScreen';
import DriverVehicleScreen from './src/screens/DriverVehicleScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import WalletBalanceScreen from './src/screens/WalletBalanceScreen';
import ChatScreen from './src/screens/ChatScreen';
import ThemeScreen from './src/screens/ThemeScreen';

const Stack = createStackNavigator();

function AppContent() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.inkBlack }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.inkBlack} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.inkBlack }}>
        <Toast config={toastConfig} />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
            <Stack.Screen name="DriverRegister" component={DriverRegisterScreen} />
            <Stack.Screen name="DriverForgotPassword" component={DriverForgotPasswordScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
            <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
            <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
            <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
            <Stack.Screen name="DriverTripHistory" component={DriverTripHistoryScreen} />
            <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
            <Stack.Screen name="WalletBalance" component={WalletBalanceScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Theme" component={ThemeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
      <Toast />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}