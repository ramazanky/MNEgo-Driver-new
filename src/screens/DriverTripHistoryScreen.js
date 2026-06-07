// src/screens/DriverTripHistoryScreen.js - TAM EKSİKSİZ DİL DESTEKLİ
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../services/ThemeContext';
import { COLORS, BASE_URL } from '../config';
import { showToast } from '../services/toast';

export default function DriverTripHistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Dinamik stiller
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inkBlack },
    loadingText: { color: colors.dustyDenim, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginLeft: 12 },
    
    listContent: { padding: 16, paddingBottom: 40 },
    tripCard: { backgroundColor: colors.prussianBlue, borderRadius: 12, padding: 16, marginBottom: 12 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tripDate: { fontSize: 12, color: colors.dustyDenim },
    tripStatus: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden' },
    tripLocations: { marginBottom: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    locationText: { fontSize: 13, color: colors.white, marginLeft: 8, flex: 1 },
    tripFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.duskBlue, paddingTop: 10 },
    tripFare: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
    tripCommission: { fontSize: 12, color: COLORS.danger },
    riderName: { fontSize: 12, color: colors.dustyDenim },
    emptyContainer: { alignItems: 'center', padding: 60 },
    emptyText: { color: colors.dustyDenim, marginTop: 12, fontSize: 16 },
    footer: { paddingVertical: 20, alignItems: 'center' },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.prussianBlue, borderRadius: 20, padding: 24, width: '90%', maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginBottom: 16, textAlign: 'center' },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.duskBlue },
    modalLabel: { fontSize: 14, color: colors.dustyDenim },
    modalValue: { fontSize: 14, color: colors.white, fontWeight: '500', flex: 1, textAlign: 'right' },
    modalCloseBtn: { backgroundColor: COLORS.success, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    modalCloseText: { color: colors.white, fontWeight: 'bold' }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const getStatusText = (status) => {
    switch(status) {
      case 5: return { text: t('driver.trip_completed'), color: COLORS.success };
      case 0: return { text: t('driver.trip_cancelled'), color: COLORS.danger };
      case 1: return { text: t('driver.waiting_for_trip'), color: COLORS.warning };
      case 2: return { text: t('driver.driver_on_the_way'), color: COLORS.warning };
      case 3: return { text: t('driver.verify_code'), color: COLORS.warning };
      case 4: return { text: t('driver.trip_in_progress'), color: COLORS.warning };
      default: return { text: t('common.no'), color: colors.dustyDenim };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const loadTrips = async (pageNum = 1, append = false) => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const response = await fetch(`${BASE_URL}/api/driver/trips?page=${pageNum}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const newTrips = data.trips || [];
        if (append) {
          setTrips(prev => [...prev, ...newTrips]);
        } else {
          setTrips(newTrips);
        }
        setHasMore(data.has_more || false);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.log('Yolculuklar yüklenemedi:', error);
      showToast.error( t('errors.connection_error'), t('driver.trip_history'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadTrips(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTrips(nextPage, true);
    }
  };

  const showTripDetail = (trip) => {
    setSelectedTrip(trip);
    setDetailModalVisible(true);
  };

  const renderTripItem = ({ item }) => {
    const status = getStatusText(item.status);
    const netEarning = item.total_fare && item.commission_amount ? 
      (Number(item.total_fare) - Number(item.commission_amount)).toFixed(2) : 
      (item.total_fare ? Number(item.total_fare).toFixed(2) : '0');

    return (
      <TouchableOpacity style={styles.tripCard} onPress={() => showTripDetail(item)}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripDate}>{formatDate(item.requested_at)}</Text>
          <View style={[styles.tripStatus, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.tripStatus, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>
        
        <View style={styles.tripLocations}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={COLORS.success} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickup_address || t('driver.pickup')}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={16} color={COLORS.danger} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoff_address || t('driver.dropoff')}
            </Text>
          </View>
        </View>
        
        <View style={styles.tripFooter}>
          <View>
            <Text style={styles.tripFare}>€{netEarning}</Text>
            {item.commission_amount > 0 && (
              <Text style={styles.tripCommission}>-€{Number(item.commission_amount).toFixed(2)} {t('driver.commission')}</Text>
            )}
          </View>
          <Text style={styles.riderName}>
            {item.rider_name ? `${t('chat.with_rider')}: ${item.rider_name}` : t('chat.with_rider')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && trips.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />



      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('driver.trip_history')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={60} color={colors.dustyDenim} />
          <Text style={styles.emptyText}>{t('wallet.no_transactions')}</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.success]} />
          }
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.dustyDenim} />
                <Text style={[styles.loadingText, { marginTop: 8 }]}>{t('common.loading')}</Text>
              </View>
            ) : trips.length > 0 ? (
              <View style={styles.footer}>
                <Text style={[styles.loadingText, { color: colors.dustyDenim }]}>
                  {total} {t('driver.total_trips')}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Detay Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('driver.trip_history')}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('common.date')}</Text>
                <Text style={styles.modalValue}>{formatDate(selectedTrip?.requested_at)}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('common.status')}</Text>
                <Text style={[styles.modalValue, { color: getStatusText(selectedTrip?.status).color }]}>
                  {getStatusText(selectedTrip?.status).text}
                </Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.pickup')}</Text>
                <Text style={styles.modalValue}>{selectedTrip?.pickup_address || '-'}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.dropoff')}</Text>
                <Text style={styles.modalValue}>{selectedTrip?.dropoff_address || '-'}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.estimated_fare')}</Text>
                <Text style={styles.modalValue}>€{Number(selectedTrip?.estimated_fare || 0).toFixed(2)}</Text>
              </View>
              
              {selectedTrip?.total_fare > 0 && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{t('driver.complete_trip')}</Text>
                  <Text style={styles.modalValue}>€{Number(selectedTrip?.total_fare).toFixed(2)}</Text>
                </View>
              )}
              
              {selectedTrip?.commission_amount > 0 && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{t('driver.commission')}</Text>
                  <Text style={[styles.modalValue, { color: COLORS.danger }]}>
                    -€{Number(selectedTrip?.commission_amount).toFixed(2)}
                  </Text>
                </View>
              )}
              
              {selectedTrip?.total_fare > 0 && (
                <View style={[styles.modalRow, { borderBottomWidth: 2 }]}>
                  <Text style={[styles.modalLabel, { fontWeight: 'bold' }]}>{t('driver.net_earning')}</Text>
                  <Text style={[styles.modalValue, { fontWeight: 'bold', color: COLORS.success }]}>
                    €{(Number(selectedTrip?.total_fare || 0) - Number(selectedTrip?.commission_amount || 0)).toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.rating')}</Text>
                <Text style={styles.modalValue}>
                  {selectedTrip?.rider_rating ? `⭐ ${selectedTrip.rider_rating}/5` : t('common.no')}
                </Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailModalVisible(false)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}