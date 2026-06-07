// src/screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../services/api';
import { COLORS } from '../config';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!phone) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı girin');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(phone);
      Alert.alert('Başarılı', 'Doğrulama kodu gönderildi');
      setStep(2);
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.error || 'Kod gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code || !newPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(phone, code, newPassword);
      Alert.alert('Başarılı', 'Şifreniz değiştirildi. Lütfen giriş yapın.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.error || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>🚕 TaksiApp</Text>
        <Text style={styles.subtitle}>Şifremi Unuttum</Text>
      </View>

      <View style={styles.form}>
        {step === 1 && (
          <>
            <TextInput style={styles.input} placeholder="Telefon Numarası" placeholderTextColor={COLORS.dustyDenim} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TouchableOpacity style={styles.button} onPress={sendCode} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Kod Gönder</Text>}
            </TouchableOpacity>
          </>
        )}
        {step === 2 && (
          <>
            <TextInput style={styles.input} placeholder="Doğrulama Kodu" placeholderTextColor={COLORS.dustyDenim} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <TextInput style={styles.input} placeholder="Yeni Şifre" placeholderTextColor={COLORS.dustyDenim} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Yeni Şifre Tekrar" placeholderTextColor={COLORS.dustyDenim} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <TouchableOpacity style={styles.button} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Şifremi Değiştir</Text>}
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Giriş Ekranına Dön</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.inkBlack },
  header: { alignItems: 'center', marginTop: 100, marginBottom: 50 },
  logo: { fontSize: 36, fontWeight: 'bold', color: COLORS.dustyDenim },
  subtitle: { fontSize: 18, color: COLORS.white, marginTop: 10 },
  form: { paddingHorizontal: 30 },
  input: { borderWidth: 1, borderColor: COLORS.duskBlue, borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16, backgroundColor: COLORS.prussianBlue, color: COLORS.white },
  button: { backgroundColor: COLORS.duskBlue, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  backText: { textAlign: 'center', marginTop: 20, color: COLORS.dustyDenim },
});