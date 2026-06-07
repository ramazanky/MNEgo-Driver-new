// src/screens/DriverVehicleScreen.js - TAM EKSİKSİZ DİL DESTEKLİ
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, Image, Modal, FlatList, Dimensions,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, COLORS } from '../config';
import { useTheme } from '../services/ThemeContext';
import { showToast } from '../services/toast';

const { width, height } = Dimensions.get('window');

export default function DriverVehicleScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const scrollViewRef = useRef(null);

  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    model: '',
    year: '',
    color: '',
    plate_number: '',
    vehicle_type: 'standard',
    seat_capacity: 4,
    luggage_capacity: 2,
    is_verified: false,
    photo_front: null,
    photo_side: null,
    photo_back: null,
    registration_photo: null,
    insurance_photo: null
  });

  // Dinamik stiller
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inkBlack },
    loadingText: { color: colors.dustyDenim, marginTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    addBtn: { padding: 8 },
    
    vehicleList: { padding: 16, paddingBottom: 350 },
    vehicleCard: { backgroundColor: colors.prussianBlue, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vehicleCardSelected: { borderWidth: 2, borderColor: COLORS.success },
    vehicleCardContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vehicleCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    vehicleTypeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    vehicleCardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.white },
    vehicleCardPlate: { fontSize: 12, color: colors.dustyDenim, marginTop: 2 },
    vehicleCardType: { fontSize: 11, color: colors.dustyDenim, marginTop: 2 },
    vehicleStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    vehicleStatusText: { fontSize: 10, fontWeight: 'bold' },
    vehicleThumb: { width: 60, height: 60, borderRadius: 8, marginLeft: 12 },
    emptyContainer: { alignItems: 'center', padding: 60 },
    emptyText: { color: colors.dustyDenim, marginTop: 16, fontSize: 16 },
    emptyAddBtn: { backgroundColor: colors.duskBlue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
    emptyAddBtnText: { color: colors.white, fontWeight: 'bold' },
    detailPanel: { backgroundColor: colors.prussianBlue, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: height * 0.75 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    detailTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },
    detailHeaderButtons: { flexDirection: 'row', gap: 8 },
    detailCloseBtn: { padding: 4 },
    detailActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    detailEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.duskBlue, padding: 10, borderRadius: 8, gap: 8 },
    detailSaveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success, padding: 10, borderRadius: 8, gap: 8 },
    detailDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, padding: 10, borderRadius: 8, gap: 8 },
    detailActionText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
    photosContainer: { marginBottom: 16 },
    photosTitle: { fontSize: 14, fontWeight: 'bold', color: colors.white, marginBottom: 10 },
    vehiclePhotosRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    vehiclePhotoUploader: { flex: 1, height: 90, backgroundColor: colors.inkBlack, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    vehiclePhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
    vehiclePhotoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    vehiclePhotoLabel: { fontSize: 10, color: colors.dustyDenim, marginTop: 4, fontWeight: 'bold' },
    documentsContainer: { marginBottom: 16 },
    documentsTitle: { fontSize: 14, fontWeight: 'bold', color: colors.white, marginBottom: 10 },
    documentsRow: { flexDirection: 'row', gap: 12 },
    documentPhotoUploader: { flex: 1, height: 80, backgroundColor: colors.inkBlack, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    documentPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
    documentPhotoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    documentPhotoLabel: { fontSize: 10, color: colors.dustyDenim, marginTop: 4 },
    detailInfo: { maxHeight: 220 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    infoLabel: { width: 70, fontSize: 14, color: colors.dustyDenim },
    infoValue: { flex: 1, fontSize: 14, color: colors.white },
    infoInput: { flex: 1, backgroundColor: colors.inkBlack, borderRadius: 8, padding: 10, color: colors.white, fontSize: 14 },
    plateText: { letterSpacing: 1, fontWeight: 'bold' },
    typeSelector: { flex: 1, flexDirection: 'row', gap: 12 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.inkBlack, paddingVertical: 8, borderRadius: 20, gap: 6 },
    typeBtnActive: { backgroundColor: colors.duskBlue },
    typeBtnText: { fontSize: 12, color: colors.dustyDenim },
    typeBtnTextActive: { color: colors.white, fontWeight: 'bold' },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.prussianBlue, borderRadius: 20, width: width * 0.9, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.duskBlue },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    modalForm: { padding: 20 },
    modalInput: { backgroundColor: colors.inkBlack, borderRadius: 8, padding: 12, marginBottom: 12, color: colors.white },
    modalLabel: { fontSize: 14, color: colors.dustyDenim, marginBottom: 8 },
    modalRow: { flexDirection: 'row', gap: 12 },
    modalHalf: { flex: 1 },
    modalTypeSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    modalTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.inkBlack, padding: 12, borderRadius: 12, gap: 8 },
    modalTypeBtnActive: { backgroundColor: colors.duskBlue },
    modalTypeBtnText: { color: colors.dustyDenim },
    modalTypeBtnTextActive: { color: colors.white, fontWeight: 'bold' },
    modalButtons: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: colors.duskBlue },
    modalCancelBtn: { flex: 1, backgroundColor: COLORS.danger, padding: 12, borderRadius: 8, alignItems: 'center' },
    modalCancelText: { color: colors.white, fontWeight: 'bold' },
    modalConfirmBtn: { flex: 1, backgroundColor: COLORS.success, padding: 12, borderRadius: 8, alignItems: 'center' },
    modalConfirmText: { color: colors.white, fontWeight: 'bold' },
    uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    uploadingText: { color: colors.white, marginTop: 12 }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const response = await fetch(`${BASE_URL}/api/driver/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setVehicles(data.vehicles || []);
    } catch (error) {
      console.log('Araçlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.plate_number) {
      Alert.alert(t('common.error'), t('errors.vehicle_required'));
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const response = await fetch(`${BASE_URL}/api/driver/vehicles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVehicle),
      });
      const data = await response.json();

      if (data.success) {
        showToast.success( t('common.success'), t('success.vehicle_added'));
        setModalVisible(false);
        setNewVehicle({
          brand: '',
          model: '',
          year: '',
          color: '',
          plate_number: '',
          vehicle_type: 'standard',
          seat_capacity: 4,
          luggage_capacity: 2,
          is_verified: false,
          photo_front: null,
          photo_side: null,
          photo_back: null,
          registration_photo: null,
          insurance_photo: null
        });
        loadVehicles();
      } else {
        Alert.alert(t('common.error'), data.error || t('errors.vehicle_required'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.vehicle_required'));
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async () => {
    if (!selectedVehicle) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const response = await fetch(`${BASE_URL}/api/driver/vehicles/${selectedVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedVehicle),
      });
      const data = await response.json();

      if (data.success) {
        showToast.success( t('common.success'), t('success.vehicle_updated'));
        setIsEditing(false);
        loadVehicles();
      } else {
        Alert.alert(t('common.error'), data.error || t('errors.vehicle_required'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.vehicle_required'));
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (vehicleId) => {
    Alert.alert(
      t('vehicle.delete_vehicle'),
      t('vehicle.delete_vehicle'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem('driver_token');
              const response = await fetch(`${BASE_URL}/api/driver/vehicles/${vehicleId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              const data = await response.json();

              if (data.success) {
                showToast.success( t('common.success'), t('success.vehicle_deleted'));
                if (selectedVehicle?.id === vehicleId) {
                  setSelectedVehicle(null);
                  setDetailPanelVisible(false);
                  setIsEditing(false);
                }
                loadVehicles();
              } else {
                Alert.alert(t('common.error'), data.error || t('errors.vehicle_required'));
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.vehicle_required'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const pickImage = async (vehicleId, docType) => {
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
        await uploadImage(vehicleId, docType, result.assets[0].uri);
      }
    } catch (error) {
      console.log('Resim seçme hatası:', error);
      Alert.alert(t('common.error'), 'Resim seçilemedi');
    }
  };

  const uploadImage = async (vehicleId, docType, uri) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const formData = new FormData();

      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: uri,
        name: `${docType}_${vehicleId}_${Date.now()}.jpg`,
        type: type,
      });
      formData.append('doc_type', docType);

      const response = await fetch(`${BASE_URL}/api/driver/vehicles/${vehicleId}/upload`, {
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
        loadVehicles();
        if (selectedVehicle?.id === vehicleId) {
          const updatedVehicle = { ...selectedVehicle };
          updatedVehicle[docType] = data.photo_url;
          setSelectedVehicle(updatedVehicle);
        }
      } else {
        Alert.alert(t('common.error'), data.error || 'Fotoğraf yüklenemedi');
      }
    } catch (error) {
      console.log('Yükleme hatası:', error);
      Alert.alert(t('common.error'), 'Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const vehicleTypes = [
    { value: 'standard', label: t('vehicle.standard'), icon: 'car-outline', color: colors.dustyDenim },
    { value: 'luxury', label: t('vehicle.luxury'), icon: 'car-sport', color: COLORS.warning },
  ];

  const VehiclePhotoUploader = ({ vehicleId, docType, photoUrl, label, icon }) => (
    <TouchableOpacity style={styles.vehiclePhotoUploader} onPress={() => pickImage(vehicleId, docType)} disabled={uploading}>
      {photoUrl ? (
        <Image source={{ uri: `${BASE_URL}${photoUrl}` }} style={styles.vehiclePhoto} />
      ) : (
        <View style={styles.vehiclePhotoPlaceholder}>
          <Ionicons name={icon} size={28} color={colors.dustyDenim} />
          <Text style={styles.vehiclePhotoLabel}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const DocumentPhotoUploader = ({ vehicleId, docType, photoUrl, label, icon }) => (
    <TouchableOpacity style={styles.documentPhotoUploader} onPress={() => pickImage(vehicleId, docType)} disabled={uploading}>
      {photoUrl ? (
        <Image source={{ uri: `${BASE_URL}${photoUrl}` }} style={styles.documentPhoto} />
      ) : (
        <View style={styles.documentPhotoPlaceholder}>
          <Ionicons name={icon} size={24} color={colors.dustyDenim} />
          <Text style={styles.documentPhotoLabel}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const VehicleCard = ({ vehicle, onPress, isSelected }) => {
    const statusColor = vehicle.is_verified ? COLORS.success : COLORS.warning;
    const statusText = vehicle.is_verified ? t('verification.approved') : t('verification.pending');
    const statusIcon = vehicle.is_verified ? 'checkmark-circle' : 'time';
    const vehicleType = vehicleTypes.find(t => t.value === vehicle.vehicle_type) || vehicleTypes[0];

    return (
      <TouchableOpacity style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]} onPress={onPress}>
        <View style={styles.vehicleCardContent}>
          <View style={styles.vehicleCardLeft}>
            <View style={[styles.vehicleTypeIcon, { backgroundColor: vehicleType.color + '20' }]}>
              <Ionicons name={vehicleType.icon} size={24} color={vehicleType.color} />
            </View>
            <View>
              <Text style={styles.vehicleCardTitle}>{vehicle.brand} {vehicle.model}</Text>
              <Text style={styles.vehicleCardPlate}>{vehicle.plate_number}</Text>
              <Text style={styles.vehicleCardType}>{vehicleType.label}</Text>
            </View>
          </View>
          <View style={[styles.vehicleStatus, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon} size={12} color={statusColor} />
            <Text style={[styles.vehicleStatusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        {vehicle.photo_front && <Image source={{ uri: `${BASE_URL}${vehicle.photo_front}` }} style={styles.vehicleThumb} />}
      </TouchableOpacity>
    );
  };

  if (loading && vehicles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />



      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('driver.my_vehicles')}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={28} color={colors.dustyDenim} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            isSelected={selectedVehicle?.id === item.id}
            onPress={() => {
              setSelectedVehicle(item);
              setDetailPanelVisible(true);
              setIsEditing(false);
            }}
          />
        )}
        contentContainerStyle={styles.vehicleList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={60} color={colors.dustyDenim} />
            <Text style={styles.emptyText}>{t('vehicle.no_vehicle')}</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyAddBtnText}>+ {t('vehicle.add_vehicle')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {detailPanelVisible && selectedVehicle && (
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}>
          <View style={styles.detailPanel}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedVehicle.brand} {selectedVehicle.model}</Text>
              <View style={styles.detailHeaderButtons}>
                <TouchableOpacity onPress={() => setDetailPanelVisible(false)} style={styles.detailCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.dustyDenim} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.detailActions}>
              {!isEditing ? (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.detailEditBtn}>
                  <Ionicons name="create-outline" size={20} color={colors.white} />
                  <Text style={styles.detailActionText}>{t('vehicle.edit_vehicle')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={updateVehicle} style={styles.detailSaveBtn}>
                  <Ionicons name="save" size={20} color={colors.white} />
                  <Text style={styles.detailActionText}>{t('common.save')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => deleteVehicle(selectedVehicle.id)} style={styles.detailDeleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.white} />
                <Text style={styles.detailActionText}>{t('vehicle.delete_vehicle')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photosContainer}>
              <Text style={styles.photosTitle}>📸 {t('vehicle.photos')}</Text>
              <View style={styles.vehiclePhotosRow}>
                <VehiclePhotoUploader vehicleId={selectedVehicle.id} docType="photo_front" photoUrl={selectedVehicle.photo_front} label={t('vehicle.front_view')} icon="car-outline" />
                <VehiclePhotoUploader vehicleId={selectedVehicle.id} docType="photo_side" photoUrl={selectedVehicle.photo_side} label={t('vehicle.side_view')} icon="swap-horizontal-outline" />
                <VehiclePhotoUploader vehicleId={selectedVehicle.id} docType="photo_back" photoUrl={selectedVehicle.photo_back} label={t('vehicle.back_view')} icon="car-outline" />
              </View>
            </View>

            <View style={styles.documentsContainer}>
              <Text style={styles.documentsTitle}>📄 {t('verification.documents')}</Text>
              <View style={styles.documentsRow}>
                <DocumentPhotoUploader vehicleId={selectedVehicle.id} docType="registration_photo" photoUrl={selectedVehicle.registration_photo} label={t('verification.registration')} icon="document-text-outline" />
                <DocumentPhotoUploader vehicleId={selectedVehicle.id} docType="insurance_photo" photoUrl={selectedVehicle.insurance_photo} label={t('verification.insurance')} icon="shield-outline" />
              </View>
            </View>

            <ScrollView ref={scrollViewRef} style={styles.detailInfo} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('vehicle.brand')}</Text>
                {isEditing ? (
                  <TextInput style={styles.infoInput} value={selectedVehicle.brand} onChangeText={(text) => setSelectedVehicle({ ...selectedVehicle, brand: text })} placeholderTextColor={colors.dustyDenim} />
                ) : (
                  <Text style={styles.infoValue}>{selectedVehicle.brand}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('vehicle.model')}</Text>
                {isEditing ? (
                  <TextInput style={styles.infoInput} value={selectedVehicle.model} onChangeText={(text) => setSelectedVehicle({ ...selectedVehicle, model: text })} placeholderTextColor={colors.dustyDenim} />
                ) : (
                  <Text style={styles.infoValue}>{selectedVehicle.model}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('vehicle.year')}</Text>
                {isEditing ? (
                  <TextInput style={styles.infoInput} value={selectedVehicle.year?.toString()} onChangeText={(text) => setSelectedVehicle({ ...selectedVehicle, year: text })} keyboardType="numeric" placeholderTextColor={colors.dustyDenim} />
                ) : (
                  <Text style={styles.infoValue}>{selectedVehicle.year || '-'}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('vehicle.color')}</Text>
                {isEditing ? (
                  <TextInput style={styles.infoInput} value={selectedVehicle.color} onChangeText={(text) => setSelectedVehicle({ ...selectedVehicle, color: text })} placeholderTextColor={colors.dustyDenim} />
                ) : (
                  <Text style={styles.infoValue}>{selectedVehicle.color || '-'}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('vehicle.plate')}</Text>
                {isEditing ? (
                  <TextInput style={styles.infoInput} value={selectedVehicle.plate_number} onChangeText={(text) => setSelectedVehicle({ ...selectedVehicle, plate_number: text })} autoCapitalize="characters" placeholderTextColor={colors.dustyDenim} />
                ) : (
                  <Text style={[styles.infoValue, styles.plateText]}>{selectedVehicle.plate_number}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('vehicle.vehicle_type')}</Text>
                {isEditing ? (
                  <View style={styles.typeSelector}>
                    {vehicleTypes.map(type => (
                      <TouchableOpacity key={type.value} style={[styles.typeBtn, selectedVehicle.vehicle_type === type.value && styles.typeBtnActive]} onPress={() => setSelectedVehicle({ ...selectedVehicle, vehicle_type: type.value })}>
                        <Ionicons name={type.icon} size={16} color={selectedVehicle.vehicle_type === type.value ? colors.white : colors.dustyDenim} />
                        <Text style={[styles.typeBtnText, selectedVehicle.vehicle_type === type.value && styles.typeBtnTextActive]}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.typeBadge}>
                    <Ionicons name={vehicleTypes.find(t => t.value === selectedVehicle.vehicle_type)?.icon || 'car-outline'} size={16} color={vehicleTypes.find(t => t.value === selectedVehicle.vehicle_type)?.color || colors.dustyDenim} />
                    <Text style={styles.infoValue}>{vehicleTypes.find(t => t.value === selectedVehicle.vehicle_type)?.label || selectedVehicle.vehicle_type}</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('vehicle.seat_capacity')}</Text>
                {isEditing ? (
                  <TextInput style={[styles.infoInput, { width: 80 }]} value={selectedVehicle.seat_capacity?.toString()} onChangeText={(text) => setSelectedVehicle({ ...selectedVehicle, seat_capacity: parseInt(text) || 0 })} keyboardType="numeric" placeholderTextColor={colors.dustyDenim} />
                ) : (
                  <Text style={styles.infoValue}>{selectedVehicle.seat_capacity} kişi</Text>
                )}
              </View>

              <View style={[styles.infoRow, { marginBottom: 30 }]}>
                <Text style={styles.infoLabel}>{t('vehicle.luggage_capacity')}</Text>
                {isEditing ? (
                  <TextInput style={[styles.infoInput, { width: 80 }]} value={selectedVehicle.luggage_capacity?.toString()} onChangeText={(text) => setSelectedVehicle({ ...selectedVehicle, luggage_capacity: parseInt(text) || 0 })} keyboardType="numeric" placeholderTextColor={colors.dustyDenim} />
                ) : (
                  <Text style={styles.infoValue}>{selectedVehicle.luggage_capacity} bavul</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('vehicle.add_vehicle')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.dustyDenim} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={styles.modalInput} placeholder={`${t('vehicle.brand')} *`} placeholderTextColor={colors.dustyDenim} value={newVehicle.brand} onChangeText={(text) => setNewVehicle({ ...newVehicle, brand: text })} />
              <TextInput style={styles.modalInput} placeholder={`${t('vehicle.model')} *`} placeholderTextColor={colors.dustyDenim} value={newVehicle.model} onChangeText={(text) => setNewVehicle({ ...newVehicle, model: text })} />
              <TextInput style={styles.modalInput} placeholder={t('vehicle.year')} placeholderTextColor={colors.dustyDenim} value={newVehicle.year} onChangeText={(text) => setNewVehicle({ ...newVehicle, year: text })} keyboardType="numeric" />
              <TextInput style={styles.modalInput} placeholder={t('vehicle.color')} placeholderTextColor={colors.dustyDenim} value={newVehicle.color} onChangeText={(text) => setNewVehicle({ ...newVehicle, color: text })} />
              <TextInput style={styles.modalInput} placeholder={`${t('vehicle.plate')} *`} placeholderTextColor={colors.dustyDenim} value={newVehicle.plate_number} onChangeText={(text) => setNewVehicle({ ...newVehicle, plate_number: text })} autoCapitalize="characters" />

              <Text style={styles.modalLabel}>{t('vehicle.vehicle_type')}</Text>
              <View style={styles.modalTypeSelector}>
                {vehicleTypes.map(type => (
                  <TouchableOpacity key={type.value} style={[styles.modalTypeBtn, newVehicle.vehicle_type === type.value && styles.modalTypeBtnActive]} onPress={() => setNewVehicle({ ...newVehicle, vehicle_type: type.value })}>
                    <Ionicons name={type.icon} size={20} color={newVehicle.vehicle_type === type.value ? colors.white : colors.dustyDenim} />
                    <Text style={[styles.modalTypeBtnText, newVehicle.vehicle_type === type.value && styles.modalTypeBtnTextActive]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalRow}>
                <View style={styles.modalHalf}>
                  <Text style={styles.modalLabel}>{t('vehicle.seat_capacity')}</Text>
                  <TextInput style={styles.modalInput} value={newVehicle.seat_capacity.toString()} onChangeText={(text) => setNewVehicle({ ...newVehicle, seat_capacity: parseInt(text) || 0 })} keyboardType="numeric" />
                </View>
                <View style={styles.modalHalf}>
                  <Text style={styles.modalLabel}>{t('vehicle.luggage_capacity')}</Text>
                  <TextInput style={styles.modalInput} value={newVehicle.luggage_capacity.toString()} onChangeText={(text) => setNewVehicle({ ...newVehicle, luggage_capacity: parseInt(text) || 0 })} keyboardType="numeric" />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={addVehicle}>
                <Text style={styles.modalConfirmText}>{t('vehicle.add_vehicle')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.success} />
          <Text style={styles.uploadingText}>{t('common.loading')}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}