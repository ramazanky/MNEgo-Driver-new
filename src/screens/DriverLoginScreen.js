// src/screens/DriverLoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { useTheme } from '../services/ThemeContext';
import { COLORS } from '../config';
import { showToast } from '../services/toast';

export default function DriverLoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 48 },
    logo: { fontSize: 48, fontWeight: 'bold', color: colors.white, marginBottom: 8 },
    subtitle: { fontSize: 18, color: colors.dustyDenim },
    form: { width: '100%' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.duskBlue, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, backgroundColor: colors.prussianBlue },
    input: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, color: colors.white, fontSize: 16 },
    loginBtn: { backgroundColor: COLORS.success, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    loginBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 18 },
    forgotText: { textAlign: 'center', marginTop: 16, color: colors.dustyDenim, fontSize: 14 },
    registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    registerText: { color: colors.dustyDenim },
    registerLink: { color: COLORS.success, fontWeight: 'bold' },
    languageBtn: { position: 'absolute', top: 60, right: 20, backgroundColor: colors.prussianBlue, padding: 10, borderRadius: 30 }
  };


  const handleLogin = async () => {
  if (!phone || !password) {
    showToast.error(t('errors.connection_error'), t('errors.invalid_phone'));
    return;
  }

  setLoading(true);
  try {
    const res = await authService.login(phone, password, 'driver');
    if (res.data.success) {
      await AsyncStorage.setItem('driver_token', res.data.token);
      await AsyncStorage.setItem('driver', JSON.stringify(res.data.user));
      showToast.success(t('common.welcome'), t('success.profile_updated'));
      
      // 🔥 navigation.replace yerine navigation.reset KULLAN
      navigation.reset({
        index: 0,
        routes: [{ name: 'DriverHome' }],
      });
    }
  } catch (error) {
    showToast.error(t('auth.login'), error.response?.data?.error || t('errors.connection_error'));
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />
      


      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🚕 MNEgo</Text>
          <Text style={styles.subtitle}>{t('auth.login')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={colors.dustyDenim} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.phone')}
              placeholderTextColor={colors.dustyDenim}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.dustyDenim} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.dustyDenim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.dustyDenim} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.loginBtnText}>{t('auth.login')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('DriverForgotPassword')}>
            <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>{t('common.no')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverRegister')}>
              <Text style={styles.registerLink}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}