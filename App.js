import React, { useEffect } from 'react';
import { I18nManager, Platform, LogBox } from 'react-native';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Tajawal_400Regular, Tajawal_700Bold, Tajawal_900Black } from '@expo-google-fonts/tajawal';
import * as SplashScreen from 'expo-splash-screen';

import WelcomeScreen from './src/screens/WelcomeScreen';
import InputScreen from './src/screens/InputScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ReportScreen from './src/screens/ReportScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Tajawal_400Regular,
    Tajawal_700Bold,
    Tajawal_900Black,
  });

  useEffect(() => {
    // تفعيل RTL للعربية
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#0F172A' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Input" component={InputScreen} />
          <Stack.Screen name="Preview" component={PreviewScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
