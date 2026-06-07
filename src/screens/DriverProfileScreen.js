// src/screens/DriverProfileScreen.js - TAM EKSİKSİZ DİL DESTEKLİ
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { driverService } from '../services/api';
import { useTheme } from '../services/ThemeContext';
import { COLORS, API_URL, BASE_URL } from '../config';
import { showToast } from '../services/toast';

export default function DriverProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    email: '',
    rating: 0,
    total_trips: 0,
    total_earnings: 0,
    current_balance: 0,
    identity_verified: false,
    license_verified: false,
    account_status: 'pending',
    is_available: false,
    profile_photo: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Dinamik stiller
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inkBlack },
    loadingText: { color: colors.dustyDenim, marginTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    editBtn: { padding: 8 },
    photoContainer: { alignItems: 'center', marginTop: -40, marginBottom: 20 },
    photoWrapper: { position: 'relative' },
    photoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.duskBlue, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.white, overflow: 'hidden' },
    profileImage: { width: '100%', height: '100%', borderRadius: 50 },
    cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.duskBlue, borderRadius: 20, padding: 6 },
    photoHint: { fontSize: 12, color: colors.dustyDenim, marginTop: 8 },
    infoSection: { backgroundColor: colors.prussianBlue, margin: 16, padding: 16, borderRadius: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: 16 },
    field: { marginBottom: 16 },
    label: { fontSize: 12, color: colors.dustyDenim, marginBottom: 4 },
    value: { fontSize: 16, color: colors.white, paddingVertical: 8 },
    input: { borderWidth: 1, borderColor: colors.duskBlue, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: colors.inkBlack, color: colors.white },
    statsSection: { backgroundColor: colors.prussianBlue, margin: 16, padding: 16, borderRadius: 16 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statCard: { alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.success },
    statLabel: { fontSize: 12, color: colors.dustyDenim, marginTop: 4 },
    balanceCard: { backgroundColor: colors.inkBlack, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 },
    balanceLabel: { fontSize: 12, color: colors.dustyDenim },
    balanceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.success, marginTop: 4 },
    verificationSection: { backgroundColor: colors.prussianBlue, margin: 16, padding: 16, borderRadius: 16 },
    verificationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.duskBlue },
    verificationText: { flex: 1, fontSize: 14, color: colors.white, marginLeft: 12 },
    verificationStatus: { fontSize: 12, fontWeight: 'bold' },
    verifyBtn: { backgroundColor: colors.duskBlue, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    verifyBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
    vehicleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.prussianBlue, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, gap: 12 },
    vehicleBtnText: { flex: 1, fontSize: 16, color: colors.white, fontWeight: '500' },
    earningsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.prussianBlue, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, gap: 12 },
    earningsBtnText: { flex: 1, fontSize: 16, color: colors.white, fontWeight: '500' },
    historyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.prussianBlue, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, gap: 12 },
    historyBtnText: { flex: 1, fontSize: 16, color: colors.white, fontWeight: '500' },
    walletBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.prussianBlue, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, gap: 12 },
    walletBtnText: { flex: 1, fontSize: 16, color: colors.white, fontWeight: '500' },
    themeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.prussianBlue, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, gap: 12 },
    themeBtnText: { flex: 1, fontSize: 16, color: colors.white, fontWeight: '500' },
    docBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.prussianBlue, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, gap: 12 },
    docBtnText: { flex: 1, fontSize: 16, color: colors.white, fontWeight: '500' },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.danger,
      marginHorizontal: 16,
      marginBottom: 30,
      padding: 16,
      borderRadius: 16,
      gap: 12
    },
    logoutBtnText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.white
    },
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await driverService.getProfile();
      if (response.data.success) {
        const driverData = response.data.driver;
        setProfile({
          full_name: driverData.full_name || '',
          phone: driverData.phone || '',
          email: driverData.email || '',
          rating: Number(driverData.rating) || 0,
          total_trips: driverData.total_trips || 0,
          total_earnings: Number(driverData.total_earnings) || 0,
          current_balance: Number(driverData.current_balance) || 0,
          identity_verified: driverData.identity_verified === 1,
          license_verified: driverData.license_verified === 1,
          account_status: driverData.account_status || 'pending',
          is_available: driverData.is_available === 1,
          profile_photo: driverData.profile_photo || null
        });
        setEditData({
          phone: driverData.phone || '',
          email: driverData.email || ''
        });
      }
    } catch (error) {
      console.log('Profil yüklenemedi:', error);
      Alert.alert(t('common.error'), t('errors.connection_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/driver/profile', {
        phone: editData.phone,
        email: editData.email || null
      });

      if (response.data.success) {
        setProfile({
          ...profile,
          phone: editData.phone,
          email: editData.email
        });
        setIsEditing(false);
        showToast.success( t('common.success'), t('success.profile_updated'));

        const driverStr = await AsyncStorage.getItem('driver');
        if (driverStr) {
          const driver = JSON.parse(driverStr);
          driver.phone = editData.phone;
          await AsyncStorage.setItem('driver', JSON.stringify(driver));
        }
      }
    } catch (error) {
      showToast.error( t('common.error'), t('errors.connection_error'));
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.warning'), 'Fotoğraf yüklemek için galeri izni gerekiyor');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Resim seçme hatası:', error);
      Alert.alert(t('common.error'), 'Resim seçilemedi');
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const formData = new FormData();

      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: uri,
        name: `profile_${Date.now()}.jpg`,
        type: type,
      });

      const response = await fetch(`${API_URL}/driver/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast.success( t('common.success'), t('success.photo_uploaded'));
        loadProfile();
      } else {
        Alert.alert(t('common.error'), data.error || 'Fotoğraf yüklenemedi');
      }
    } catch (error) {
      console.log('Fotoğraf yükleme hatası:', error);
      Alert.alert(t('common.error'), 'Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const VerificationBadge = ({ verified, label, status }) => {
    if (status) {
      if (status === 'approved') {
        return (
          <View style={styles.verificationItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.verificationText}>{label}</Text>
            <Text style={[styles.verificationStatus, { color: COLORS.success }]}>{t('verification.approved')}</Text>
          </View>
        );
      } else if (status === 'pending') {
        return (
          <View style={styles.verificationItem}>
            <Ionicons name="time" size={24} color={COLORS.warning} />
            <Text style={styles.verificationText}>{label}</Text>
            <Text style={[styles.verificationStatus, { color: COLORS.warning }]}>{t('verification.pending')}</Text>
          </View>
        );
      } else if (status === 'rejected') {
        return (
          <View style={styles.verificationItem}>
            <Ionicons name="close-circle" size={24} color={COLORS.danger} />
            <Text style={styles.verificationText}>{label}</Text>
            <Text style={[styles.verificationStatus, { color: COLORS.danger }]}>{t('verification.rejected')}</Text>
          </View>
        );
      }
    }

    return (
      <View style={styles.verificationItem}>
        <Ionicons name={verified ? 'checkmark-circle' : 'close-circle'} size={24} color={verified ? COLORS.success : COLORS.danger} />
        <Text style={styles.verificationText}>{label}</Text>
        <Text style={[styles.verificationStatus, { color: verified ? COLORS.success : COLORS.danger }]}>
          {verified ? t('verification.approved') : t('verification.pending')}
        </Text>
      </View>
    );
  };

  const getRatingText = () => {
    const ratingValue = parseFloat(profile.rating);
    if (isNaN(ratingValue) || ratingValue === 0) return '5.0';
    return ratingValue.toFixed(1);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            await AsyncStorage.removeItem('driver_token');
            await AsyncStorage.removeItem('driver');
            socketService.disconnect();
            navigation.replace('DriverLogin');
          }
        }
      ]
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />



      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
            <Ionicons name="create-outline" size={24} color={colors.dustyDenim} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} style={styles.editBtn} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={COLORS.success} /> : <Ionicons name="save" size={24} color={COLORS.success} />}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.photoContainer}>
        <TouchableOpacity onPress={pickAndUploadImage} style={styles.photoWrapper} disabled={uploading} activeOpacity={0.7}>
          <View style={styles.photoPlaceholder}>
            {profile.profile_photo ? (
              <Image source={{ uri: `${BASE_URL}${profile.profile_photo}` }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person" size={60} color={colors.dustyDenim} />
            )}
          </View>
          <View style={styles.cameraIcon}>
            {uploading ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="camera" size={20} color={colors.white} />}
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>{t('success.photo_uploaded')}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>{t('auth.full_name')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.full_name')}</Text>
          <Text style={styles.value}>{profile.full_name || '-'}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.phone')}</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editData.phone}
              onChangeText={(text) => setEditData({ ...editData, phone: text })}
              keyboardType="phone-pad"
              placeholderTextColor={colors.dustyDenim}
            />
          ) : (
            <Text style={styles.value}>{profile.phone || '-'}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editData.email}
              onChangeText={(text) => setEditData({ ...editData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.dustyDenim}
            />
          ) : (
            <Text style={styles.value}>{profile.email || t('common.no')}</Text>
          )}
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>{t('driver.total_trips')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getRatingText()}</Text>
            <Text style={styles.statLabel}>⭐ {t('driver.rating')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.total_trips || 0}</Text>
            <Text style={styles.statLabel}>🚕 {t('driver.total_trips')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>€{Math.round(profile.total_earnings || 0)}</Text>
            <Text style={styles.statLabel}>💰 {t('driver.earnings')}</Text>
          </View>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('driver.balance')}</Text>
          <Text style={styles.balanceValue}>€{profile.current_balance.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.verificationSection}>
        <Text style={styles.sectionTitle}>{t('verification.account')}</Text>
        <VerificationBadge verified={profile.identity_verified} label={t('verification.identity')} />
        <VerificationBadge verified={profile.license_verified} label={t('verification.license')} />
        <VerificationBadge status={profile.account_status} label={t('verification.account')} />

        {(!profile.identity_verified || !profile.license_verified || profile.account_status !== 'approved') && (
          <TouchableOpacity style={styles.verifyBtn} onPress={() => navigation.navigate('DriverDocuments')}>
            <Text style={styles.verifyBtnText}>{t('verification.upload_documents')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.docBtn} onPress={() => navigation.navigate('DriverDocuments')}>
        <Ionicons name="document-text-outline" size={24} color={colors.white} />
        <Text style={styles.docBtnText}>{t('driver.documents')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.dustyDenim} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.vehicleBtn} onPress={() => navigation.navigate('DriverVehicle')}>
        <Ionicons name="car-outline" size={24} color={colors.white} />
        <Text style={styles.vehicleBtnText}>{t('driver.my_vehicles')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.dustyDenim} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.earningsBtn} onPress={() => navigation.navigate('DriverEarnings')}>
        <Ionicons name="wallet-outline" size={24} color={colors.white} />
        <Text style={styles.earningsBtnText}>{t('driver.earnings')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.dustyDenim} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('DriverTripHistory')}>
        <Ionicons name="time-outline" size={24} color={colors.white} />
        <Text style={styles.historyBtnText}>{t('driver.trip_history')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.dustyDenim} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('WalletBalance')}>
        <Ionicons name="wallet-outline" size={24} color={colors.white} />
        <Text style={styles.walletBtnText}>{t('driver.my_wallet')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.dustyDenim} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.themeBtn} onPress={() => navigation.navigate('Language')}>
        <Ionicons name="language-outline" size={24} color={colors.white} />
        <Text style={styles.themeBtnText}>{t('driver.lang_selection')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.dustyDenim} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.themeBtn} onPress={() => navigation.navigate('Theme')}>
        <Ionicons name="color-palette-outline" size={24} color={colors.white} />
        <Text style={styles.themeBtnText}>{t('driver.theme_selection')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.dustyDenim} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}