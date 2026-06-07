// src/screens/DriverRegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { useTheme } from '../services/ThemeContext';
import { COLORS } from '../config';
import { showToast } from '../services/toast';

export default function DriverRegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    scrollContent: { flexGrow: 1, padding: 24 },
    backBtn: { marginBottom: 16, width: 40 },
    header: { alignItems: 'center', marginBottom: 32 },
    logo: { fontSize: 40, fontWeight: 'bold', color: colors.white, marginBottom: 4 },
    subtitle: { fontSize: 16, color: colors.dustyDenim },
    form: { width: '100%' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.duskBlue, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, backgroundColor: colors.prussianBlue },
    input: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, color: colors.white, fontSize: 16 },
    registerBtn: { backgroundColor: COLORS.success, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    registerBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 18 },
    loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    loginText: { color: colors.dustyDenim },
    loginLink: { color: COLORS.success, fontWeight: 'bold' },
    languageBtn: { position: 'absolute', top: 60, right: 20, zIndex: 10, backgroundColor: colors.prussianBlue, padding: 10, borderRadius: 30 }
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      showToast.error( t('errors.connection_error'), t('auth.full_name') + ' gerekli');
      return false;
    }
    if (!formData.phone.trim()) {
      showToast.error( t('errors.connection_error'), t('auth.phone') + ' gerekli');
      return false;
    }
    if (!formData.password) {
      showToast.error( t('errors.connection_error'), t('auth.password') + ' gerekli');
      return false;
    }
    if (formData.password.length < 6) {
      showToast.error( t('errors.connection_error'), t('auth.password') + ' en az 6 karakter olmalı');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast.error( t('errors.connection_error'), 'Şifreler eşleşmiyor');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await authService.registerDriver({
        phone: formData.phone,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email || null
      });

      if (res.data.success) {
        showToast.success( t('common.welcome'), t('success.profile_updated'));
        
        // Kayıt başarılı, giriş yap
        const loginRes = await authService.login(formData.phone, formData.password, 'driver');
        if (loginRes.data.success) {
          await AsyncStorage.setItem('driver_token', loginRes.data.token);
          await AsyncStorage.setItem('driver', JSON.stringify(loginRes.data.user));
          navigation.replace('DriverHome');
        }
      }
    } catch (error) {
      showToast.error( t('auth.register'), error.response?.data?.error || t('errors.connection_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />
      


      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>🚕 MNEgo</Text>
          <Text style={styles.subtitle}>{t('auth.register')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={colors.dustyDenim} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.full_name')}
              placeholderTextColor={colors.dustyDenim}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={colors.dustyDenim} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.phone')}
              placeholderTextColor={colors.dustyDenim}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.dustyDenim} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.email') + " (isteğe bağlı)"}
              placeholderTextColor={colors.dustyDenim}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.dustyDenim} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.dustyDenim}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.dustyDenim} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.dustyDenim} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password') + " Tekrar"}
              placeholderTextColor={colors.dustyDenim}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.dustyDenim} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.registerBtnText}>{t('auth.register')}</Text>}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('common.yes')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverLogin')}>
              <Text style={styles.loginLink}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}