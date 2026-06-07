// src/screens/DriverDocumentsScreen.js - TAM EKSİKSİZ DİL DESTEKLİ
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, Modal, TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../services/ThemeContext';
import { COLORS, BASE_URL } from '../config';
import { showToast } from '../services/toast';

export default function DriverDocumentsScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionDocType, setRejectionDocType] = useState('');
  const [rejectionSide, setRejectionSide] = useState('');

  const [documents, setDocuments] = useState({
    identity: {
      front: { uri: null, verified: false, rejection_reason: null },
      back: { uri: null, verified: false, rejection_reason: null },
      verified: false
    },
    license: {
      front: { uri: null, verified: false, rejection_reason: null },
      back: { uri: null, verified: false, rejection_reason: null },
      verified: false
    },
    insurance: {
      uri: null,
      verified: false,
      rejection_reason: null
    },
    registration: {
      uri: null,
      verified: false,
      rejection_reason: null
    }
  });

  const [expiryDates, setExpiryDates] = useState({
    identity: '',
    license: '',
    insurance: '',
    registration: ''
  });

  // Dinamik stiller
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inkBlack },
    loadingText: { color: colors.dustyDenim, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginLeft: 12 },

    content: { padding: 16, paddingBottom: 40 },
    infoCard: { backgroundColor: colors.prussianBlue, padding: 16, borderRadius: 12, marginBottom: 20 },
    infoText: { fontSize: 14, color: colors.dustyDenim, textAlign: 'center', lineHeight: 20 },
    docSection: { backgroundColor: colors.prussianBlue, borderRadius: 12, padding: 16, marginBottom: 16 },
    docTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: 12 },
    docStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.duskBlue },
    docStatusText: { fontSize: 14, color: colors.dustyDenim, flex: 1 },
    rejectionText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
    photoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
    photoBox: { flex: 1, alignItems: 'center' },
    photoLabel: { fontSize: 12, color: colors.dustyDenim, marginBottom: 8 },
    photoButton: { width: '100%', height: 120, backgroundColor: colors.inkBlack, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.duskBlue, overflow: 'hidden' },
    photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    retakeBtn: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 4 },
    uploadSingle: { height: 120, backgroundColor: colors.inkBlack, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.duskBlue, marginBottom: 12 },
    expiryInput: { backgroundColor: colors.inkBlack, borderRadius: 8, padding: 12, color: colors.white, fontSize: 14, marginTop: 8, borderWidth: 1, borderColor: colors.duskBlue },
    submitBtn: { backgroundColor: COLORS.success, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
    disabledBtn: { opacity: 0.5 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.prussianBlue, borderRadius: 20, padding: 24, width: '85%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: 12 },
    modalText: { fontSize: 14, color: colors.dustyDenim, marginBottom: 16 },
    modalInput: { backgroundColor: colors.inkBlack, borderRadius: 8, padding: 12, color: colors.white, fontSize: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.duskBlue },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: { flex: 1, backgroundColor: COLORS.danger, padding: 12, borderRadius: 8, alignItems: 'center' },
    modalCancelText: { color: colors.white, fontWeight: 'bold' },
    modalConfirmBtn: { flex: 1, backgroundColor: COLORS.success, padding: 12, borderRadius: 8, alignItems: 'center' },
    modalConfirmText: { color: colors.white, fontWeight: 'bold' }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const response = await fetch(`${BASE_URL}/api/driver/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.documents) {
        const docs = data.documents;
        setDocuments({
          identity: {
            front: { uri: docs.identity_front || null, verified: docs.identity_front_verified || false, rejection_reason: docs.identity_front_rejection || null },
            back: { uri: docs.identity_back || null, verified: docs.identity_back_verified || false, rejection_reason: docs.identity_back_rejection || null },
            verified: docs.identity_verified || false
          },
          license: {
            front: { uri: docs.license_front || null, verified: docs.license_front_verified || false, rejection_reason: docs.license_front_rejection || null },
            back: { uri: docs.license_back || null, verified: docs.license_back_verified || false, rejection_reason: docs.license_back_rejection || null },
            verified: docs.license_verified || false
          },
          insurance: {
            uri: docs.insurance_photo || null,
            verified: docs.insurance_verified || false,
            rejection_reason: docs.insurance_rejection || null
          },
          registration: {
            uri: docs.registration_photo || null,
            verified: docs.registration_verified || false,
            rejection_reason: docs.registration_rejection || null
          }
        });
        setExpiryDates({
          identity: docs.identity_expiry || '',
          license: docs.license_expiry || '',
          insurance: docs.insurance_expiry || '',
          registration: docs.registration_expiry || ''
        });
      }
    } catch (error) {
      console.log('Belgeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type, side = null) => {
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
        await uploadImage(type, side, result.assets[0].uri);
      }
    } catch (error) {
      console.log('Resim seçme hatası:', error);
      Alert.alert(t('common.error'), 'Resim seçilemedi');
    }
  };


  const uploadImage = async (type, side, uri) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const formData = new FormData();

      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: uri,
        name: `${type}_${side}_${Date.now()}.jpg`,
        type: mimeType,
      });
      formData.append('document_type', type);
      if (side) formData.append('side', side);

      const response = await fetch(`${BASE_URL}/api/driver/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast.success(t('common.success'), t('success.photo_uploaded'));

        // 🔥 HEMEN state'i güncelle (beklemeden)
        if (type === 'identity') {
          if (side === 'front') {
            setDocuments(prev => ({
              ...prev,
              identity: {
                ...prev.identity,
                front: { ...prev.identity.front, uri: data.photo_url }
              }
            }));
          } else if (side === 'back') {
            setDocuments(prev => ({
              ...prev,
              identity: {
                ...prev.identity,
                back: { ...prev.identity.back, uri: data.photo_url }
              }
            }));
          }
        } else if (type === 'license') {
          if (side === 'front') {
            setDocuments(prev => ({
              ...prev,
              license: {
                ...prev.license,
                front: { ...prev.license.front, uri: data.photo_url }
              }
            }));
          } else if (side === 'back') {
            setDocuments(prev => ({
              ...prev,
              license: {
                ...prev.license,
                back: { ...prev.license.back, uri: data.photo_url }
              }
            }));
          }
        } else if (type === 'insurance') {
          setDocuments(prev => ({
            ...prev,
            insurance: { ...prev.insurance, uri: data.photo_url }
          }));
        } else if (type === 'registration') {
          setDocuments(prev => ({
            ...prev,
            registration: { ...prev.registration, uri: data.photo_url }
          }));
        }

        // loadDocuments(); // Bunu kaldır veya async yap
      } else {
        if (data.rejection_reason) {
          setRejectionDocType(type);
          setRejectionSide(side);
          setRejectionReason(data.rejection_reason);
          setRejectionModalVisible(true);
        } else {
          Alert.alert(t('common.error'), data.error || 'Fotoğraf yüklenemedi');
        }
      }
    } catch (error) {
      console.log('Yükleme hatası:', error);
      Alert.alert(t('common.error'), 'Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
    }
  };


  const updateExpiryDate = async (type, date) => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const response = await fetch(`${BASE_URL}/api/driver/documents/expiry`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_type: type, expiry_date: date })
      });
      const data = await response.json();
      if (data.success) {
        setExpiryDates({ ...expiryDates, [type]: date });
        showToast.success( t('common.success'), t('success.profile_updated'));
      }
    } catch (error) {
      console.log('Tarih güncelleme hatası:', error);
    }
  };

  const submitDocuments = async () => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const response = await fetch(`${BASE_URL}/api/driver/documents/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity_front: documents.identity.front.uri,
          identity_back: documents.identity.back.uri,
          license_front: documents.license.front.uri,
          license_back: documents.license.back.uri,
          insurance_photo: documents.insurance.uri,
          registration_photo: documents.registration.uri,
          identity_expiry: expiryDates.identity,
          license_expiry: expiryDates.license,
          insurance_expiry: expiryDates.insurance,
          registration_expiry: expiryDates.registration
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast.success( t('common.success'), t('success.documents_submitted'));
        navigation.goBack();
      } else {
        Alert.alert(t('common.error'), data.error || 'Gönderilemedi');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const DocumentCard = ({ title, type, data, isDoubleSide = true, showExpiry = true }) => {
    const isVerified = data.verified;
    const bothUploaded = isDoubleSide ? (data.front?.uri && data.back?.uri) : (data.uri);

    return (
      <View style={styles.docSection}>
        <View style={styles.docStatus}>
          <Ionicons name={isVerified ? 'checkmark-circle' : (bothUploaded ? 'time' : 'close-circle')} size={20} color={isVerified ? COLORS.success : (bothUploaded ? COLORS.warning : COLORS.danger)} />
          <Text style={styles.docStatusText}>
            {isVerified ? t('verification.approved') : (bothUploaded ? t('verification.pending') : t('common.no'))}
          </Text>
        </View>

        <Text style={styles.docTitle}>{title}</Text>

        {isDoubleSide ? (
          <View style={styles.photoRow}>
            <View style={styles.photoBox}>
              <Text style={styles.photoLabel}>{t('verification.front_view')}</Text>
              <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(type, 'front')} disabled={uploading}>
                {data.front?.uri ? (
                  <>
                    <Image source={{ uri: `${BASE_URL}${data.front.uri}` }} style={styles.photoImage} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => pickImage(type, 'front')}>
                      <Ionicons name="refresh" size={16} color={colors.white} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Ionicons name="camera" size={40} color={colors.dustyDenim} />
                )}
              </TouchableOpacity>
              {data.front?.rejection_reason && (
                <Text style={styles.rejectionText}>{t('verification.document_rejected')}: {data.front.rejection_reason}</Text>
              )}
            </View>
            <View style={styles.photoBox}>
              <Text style={styles.photoLabel}>{t('verification.back_view')}</Text>
              <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(type, 'back')} disabled={uploading}>
                {data.back?.uri ? (
                  <>
                    <Image source={{ uri: `${BASE_URL}${data.back.uri}` }} style={styles.photoImage} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => pickImage(type, 'back')}>
                      <Ionicons name="refresh" size={16} color={colors.white} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Ionicons name="camera" size={40} color={colors.dustyDenim} />
                )}
              </TouchableOpacity>
              {data.back?.rejection_reason && (
                <Text style={styles.rejectionText}>{t('verification.document_rejected')}: {data.back.rejection_reason}</Text>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadSingle} onPress={() => pickImage(type)} disabled={uploading}>
            {data.uri ? (
              <>
                <Image source={{ uri: `${BASE_URL}${data.uri}` }} style={styles.photoImage} />
                <TouchableOpacity style={styles.retakeBtn} onPress={() => pickImage(type)}>
                  <Ionicons name="refresh" size={16} color={colors.white} />
                </TouchableOpacity>
              </>
            ) : (
              <Ionicons name="camera" size={40} color={colors.dustyDenim} />
            )}
          </TouchableOpacity>
        )}

        {data.rejection_reason && !isDoubleSide && (
          <Text style={styles.rejectionText}>{t('verification.document_rejected')}: {data.rejection_reason}</Text>
        )}

        {showExpiry && bothUploaded && (
          <TextInput
            style={styles.expiryInput}
            placeholder={t('verification.expiry_date') + " (YYYY-MM-DD)"}
            placeholderTextColor={colors.dustyDenim}
            value={expiryDates[type]}
            onChangeText={(text) => updateExpiryDate(type, text)}
          />
        )}
      </View>
    );
  };

  const allDocumentsUploaded = () => {
    return documents.identity.front.uri && documents.identity.back.uri &&
      documents.license.front.uri && documents.license.back.uri &&
      documents.insurance.uri && documents.registration.uri;
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
        <Text style={styles.headerTitle}>{t('verification.upload_documents')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {t('verification.identity')}, {t('verification.license')}, {t('verification.insurance')} ve {t('verification.registration')} belgelerinizi yükleyin.
            Belgeleriniz onaylandıktan sonra yolcu almaya başlayabilirsiniz.
          </Text>
        </View>

        <DocumentCard title={t('verification.identity')} type="identity" data={documents.identity} isDoubleSide={true} showExpiry={true} />
        <DocumentCard title={t('verification.license')} type="license" data={documents.license} isDoubleSide={true} showExpiry={true} />
        <DocumentCard title={t('verification.insurance')} type="insurance" data={documents.insurance} isDoubleSide={false} showExpiry={true} />
        <DocumentCard title={t('verification.registration')} type="registration" data={documents.registration} isDoubleSide={false} showExpiry={true} />

        <TouchableOpacity
          style={[styles.submitBtn, (!allDocumentsUploaded() || submitting) && styles.disabledBtn]}
          onPress={submitDocuments}
          disabled={!allDocumentsUploaded() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>{t('verification.upload_documents')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={rejectionModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('verification.document_rejected')}</Text>
            <Text style={styles.modalText}>
              {rejectionDocType} {t('verification.document_rejected')}:
            </Text>
            <Text style={[styles.modalText, { color: COLORS.danger }]}>{rejectionReason}</Text>
            <Text style={styles.modalText}>{t('verification.document_rejected')}</Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setRejectionModalVisible(false)}>
              <Text style={styles.modalConfirmText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}