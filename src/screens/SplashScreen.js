// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../services/ThemeContext';

export default function SplashScreen({ navigation }) {
  const { colors } = useTheme();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Direkt token kontrolü yap, dil işini geç
        const token = await AsyncStorage.getItem('driver_token');
        console.log('🔍 SplashScreen - Token var mı?', !!token);
        
        // Varsayılan dili kaydet
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (!savedLanguage) {
          await AsyncStorage.setItem('app_language', 'tr');
          console.log('🔍 Varsayılan dil kaydedildi: tr');
        }
        
        if (token) {
          console.log('🔍 Token var, DriverHome ekranına gidiliyor');
          navigation.replace('DriverHome');
        } else {
          console.log('🔍 Token yok, DriverLogin ekranına gidiliyor');
          navigation.replace('DriverLogin');
        }
      } catch (error) {
        console.error('🔍 SplashScreen hatası:', error);
        navigation.replace('DriverLogin');
      }
    };

    checkLogin();
  }, [navigation]);

  const styles = {
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inkBlack },
    logo: { fontSize: 48, fontWeight: 'bold', color: colors.white, marginBottom: 10 },
    subtitle: { fontSize: 16, color: colors.dustyDenim, marginTop: 10 },
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />
      <Text style={styles.logo}>🚕 MNEgo</Text>
      <ActivityIndicator size="large" color={colors.success} />
      <Text style={styles.subtitle}>Yükleniyor...</Text>
    </View>
  );
}