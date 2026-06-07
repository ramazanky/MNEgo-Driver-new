// src/screens/DriverForgotPasswordScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS } from '../config';
import { showToast } from '../services/toast';

export default function DriverForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendResetCode = async () => {
    if (!phone) {
      showToast.warning('Uyarı', 'Lütfen telefon numaranızı girin');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { phone, role: 'driver' });
      if (response.data.success) {
        showToast.success('Başarılı', 'Şifre sıfırlama kodu gönderildi');
        setStep(2);
        setCountdown(60);
      } else {
        showToast.error('Hata', response.data.error || 'Kod gönderilemedi');
      }
    } catch (error) {
      showToast.error('Hata', error.response?.data?.error || 'Kod gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { phone, role: 'driver' });
      if (response.data.success) {
        showToast.success('Başarılı', 'Kod tekrar gönderildi');
        setCountdown(60);
      } else {
        showToast.error('Hata', response.data.error || 'Kod gönderilemedi');
      }
    } catch (error) {
      showToast.error('Hata', error.response?.data?.error || 'Kod gönderilemedi');
    } finally {
      setResendLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      showToast.warning('Uyarı', 'Lütfen tüm alanları doldurun');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.warning('Uyarı', 'Şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 6) {
      showToast.warning('Uyarı', 'Şifre en az 6 karakter olmalıdır');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { phone, code, newPassword, role: 'driver' });
      if (response.data.success) {
        showToast.success('Başarılı', 'Şifreniz başarıyla değiştirildi');
        navigation.goBack();
      } else {
        showToast.error('Hata', response.data.error || 'Şifre değiştirilemedi');
      }
    } catch (error) {
      showToast.error('Hata', error.response?.data?.error || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>{step === 1 ? 'Telefon numaranızı girin' : 'Size gönderilen kodu girin'}</Text>
      </View>

      <View style={styles.form}>
        {step === 1 ? (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.dustyDenim} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Telefon Numarası" placeholderTextColor={COLORS.dustyDenim} value={phone} onChangeText={setPhone} keyboardType="phone-pad" selectionColor={COLORS.deepTeal} />
            </View>
            <TouchableOpacity style={styles.sendBtn} onPress={sendResetCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Kod Gönder</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color={COLORS.dustyDenim} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Doğrulama Kodu" placeholderTextColor={COLORS.dustyDenim} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={4} selectionColor={COLORS.deepTeal} />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.dustyDenim} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Yeni Şifre" placeholderTextColor={COLORS.dustyDenim} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} selectionColor={COLORS.deepTeal} />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.dustyDenim} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.dustyDenim} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Yeni Şifre Tekrar" placeholderTextColor={COLORS.dustyDenim} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showNewPassword} selectionColor={COLORS.deepTeal} />
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.resetBtnText}>Şifreyi Değiştir</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendContainer} onPress={resendCode} disabled={countdown > 0 || resendLoading}>
              {resendLoading ? <ActivityIndicator size="small" color={COLORS.deepTeal} /> : <Text style={[styles.resendText, countdown > 0 && styles.disabledText]}>{countdown > 0 ? `Kodu yeniden gönder (${countdown}s)` : 'Kodu yeniden gönder'}</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.inkBlack },
  header: { paddingHorizontal: 20, marginTop: 50, marginBottom: 40 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: 14, color: COLORS.dustyDenim, marginTop: 5 },
  form: { paddingHorizontal: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.dustyDenim, borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, backgroundColor: COLORS.prussianBlue },
  inputIcon: { marginRight: 10 },
  input: { paddingVertical: 14, fontSize: 16, color: COLORS.white, flex: 1 },
  sendBtn: { backgroundColor: COLORS.deepTeal, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  resetBtn: { backgroundColor: COLORS.deepTeal, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  resetBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  resendContainer: { alignItems: 'center', marginTop: 20 },
  resendText: { color: COLORS.deepTeal, fontSize: 14 },
  disabledText: { color: COLORS.dustyDenim },
});