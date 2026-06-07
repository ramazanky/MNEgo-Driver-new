// src/screens/WalletBalanceScreen.js - TAM EKSİKSİZ DİL DESTEKLİ
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../services/ThemeContext';
import { COLORS, BASE_URL } from '../config';
import { showToast } from '../services/toast';

export default function WalletBalanceScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState({
    current_balance: 0,
    total_earnings: 0,
    total_trips: 0,
    total_commission: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Dinamik stiller
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inkBlack },
    loadingText: { color: colors.dustyDenim, marginTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    content: { padding: 16, paddingBottom: 40 },
    balanceCard: { backgroundColor: colors.prussianBlue, margin: 16, padding: 24, borderRadius: 20, alignItems: 'center'},
    balanceLabel: { fontSize: 14, color: colors.dustyDenim, marginBottom: 8 },
    balanceAmount: { fontSize: 48, fontWeight: 'bold', color: COLORS.success, marginBottom: 12 },
    balanceWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inkBlack, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    balanceWarningText: { fontSize: 11, color: COLORS.warning },
    statsContainer: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: colors.prussianBlue, padding: 16, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: colors.white },
    statLabel: { fontSize: 11, color: colors.dustyDenim, marginTop: 4, textAlign: 'center' },
    statSubValue: { fontSize: 10, color: COLORS.danger, marginTop: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: 12, marginHorizontal: 16 },
    transactionsSection: { backgroundColor: colors.prussianBlue, margin: 16, padding: 16, borderRadius: 12, marginBottom: 16 },
    emptyContainer: { alignItems: 'center', padding: 40 },
    emptyText: { color: colors.dustyDenim, marginTop: 12 },
    transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.duskBlue },
    transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    transactionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    transactionTitle: { fontSize: 14, fontWeight: '500', color: colors.white },
    transactionDate: { fontSize: 11, color: colors.dustyDenim, marginTop: 2 },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
    transactionCommission: { fontSize: 12, color: COLORS.danger, marginTop: 2 },
    depositBtn: { backgroundColor: colors.duskBlue, marginHorizontal: 16, marginBottom: 30, padding: 16, borderRadius: 12, alignItems: 'center', opacity: 0.5 },
    depositBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.prussianBlue, borderRadius: 20, padding: 24, width: '85%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: 16, textAlign: 'center' },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.duskBlue },
    modalLabel: { fontSize: 14, color: colors.dustyDenim },
    modalValue: { fontSize: 14, color: colors.white, fontWeight: '500' },
    modalCloseBtn: { backgroundColor: COLORS.success, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    modalCloseText: { color: colors.white, fontWeight: 'bold' }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');

      // Profil bilgilerini al
      const profileResponse = await fetch(`${BASE_URL}/api/driver/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileResponse.json();

      if (profileData.success) {
        setWallet({
          current_balance: Number(profileData.driver.current_balance) || 0,
          total_earnings: Number(profileData.driver.total_earnings) || 0,
          total_trips: profileData.driver.total_trips || 0,
          total_commission: 0
        });
      }

      // Yolculuk geçmişini al (komisyon ve net kazanç için)
      const tripsResponse = await fetch(`${BASE_URL}/api/driver/trips?page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tripsData = await tripsResponse.json();

      let totalCommission = 0;
      const transactionList = [];

      if (tripsData.success && tripsData.trips) {
        tripsData.trips.forEach(trip => {
          if (trip.status === 5 && trip.total_fare) {
            const fare = Number(trip.total_fare);
            const commission = Number(trip.commission_amount) || 0;
            const netEarning = fare - commission;
            totalCommission += commission;

            transactionList.push({
              id: trip.id,
              type: 'trip',
              title: 'Yolculuk Tamamlandı',
              amount: netEarning,
              commission: commission,
              date: trip.completed_at || trip.requested_at,
              pickup: trip.pickup_address,
              dropoff: trip.dropoff_address,
              fare: fare
            });
          } else if (trip.status === 0 && trip.driver_id) {
            // İptal edilen yolculuklar için ceza
            transactionList.push({
              id: trip.id,
              type: 'penalty',
              title: t('driver.cancel_trip'),
              amount: -2,
              commission: 0,
              date: trip.requested_at,
              pickup: trip.pickup_address,
              dropoff: trip.dropoff_address,
              fare: 0
            });
          }
        });
      }

      // Tarihe göre sırala (en yeniden en eskiye)
      transactionList.sort((a, b) => new Date(b.date) - new Date(a.date));

      setWallet(prev => ({
        ...prev,
        total_commission: totalCommission
      }));
      setTransactions(transactionList);

    } catch (error) {
      console.log('Cüzdan verileri yüklenemedi:', error);
      showToast.error( t('errors.connection_error'), t('driver.my_wallet'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const showTransactionDetail = (item) => {
    setSelectedTransaction(item);
    setDetailModalVisible(true);
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem} onPress={() => showTransactionDetail(item)}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: item.amount > 0 ? COLORS.success + '20' : COLORS.danger + '20' }]}>
          <Ionicons
            name={item.type === 'trip' ? 'car' : 'alert-circle'}
            size={20}
            color={item.amount > 0 ? COLORS.success : COLORS.danger}
          />
        </View>
        <View>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: item.amount > 0 ? COLORS.success : COLORS.danger }]}>
          {item.amount > 0 ? '+' : ''}€{Math.abs(item.amount).toFixed(2)}
        </Text>
        {item.commission > 0 && (
          <Text style={styles.transactionCommission}>-€{item.commission.toFixed(2)} {t('driver.commission')}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.success]} />}
    >
      <StatusBar style="light" backgroundColor={colors.inkBlack} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('driver.my_wallet')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bakiye Kartı */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('wallet.current_balance')}</Text>
        <Text style={styles.balanceAmount}>€{wallet.current_balance.toFixed(2)}</Text>
        <View style={styles.balanceWarning}>
          <Ionicons name="information-circle" size={16} color={COLORS.warning} />
          <Text style={styles.balanceWarningText}>{t('wallet.min_balance_warning')}</Text>
        </View>
      </View>



      {/* İşlem Geçmişi */}
      <Text style={styles.sectionTitle}>📋 {t('wallet.transaction_history')}</Text>
      <View style={styles.transactionsSection}>
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={50} color={colors.dustyDenim} />
            <Text style={styles.emptyText}>{t('wallet.no_transactions')}</Text>
          </View>
        ) : (
          transactions.map((item, index) => (
            <View key={item.id || index}>
              {renderTransaction({ item })}
            </View>
          ))
        )}
      </View>

      {/* Bakiye Yükleme (Pasif) */}
      <TouchableOpacity style={styles.depositBtn} disabled={true}>
        <Text style={styles.depositBtnText}>{t('wallet.add_balance')} (Yakında)</Text>
      </TouchableOpacity>

      {/* Detay Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTransaction?.title}</Text>
            
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>{t('common.date')}</Text>
              <Text style={styles.modalValue}>{formatDate(selectedTransaction?.date)}</Text>
            </View>
            
            {selectedTransaction?.pickup && (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.pickup')}</Text>
                <Text style={styles.modalValue}>{selectedTransaction.pickup}</Text>
              </View>
            )}
            
            {selectedTransaction?.dropoff && (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.dropoff')}</Text>
                <Text style={styles.modalValue}>{selectedTransaction.dropoff}</Text>
              </View>
            )}
            
            {selectedTransaction?.fare > 0 && (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.estimated_fare')}</Text>
                <Text style={styles.modalValue}>€{selectedTransaction.fare.toFixed(2)}</Text>
              </View>
            )}
            
            {selectedTransaction?.commission > 0 && (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('driver.commission')}</Text>
                <Text style={[styles.modalValue, { color: COLORS.danger }]}>-€{selectedTransaction.commission.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={[styles.modalRow, { borderBottomWidth: 2 }]}>
              <Text style={[styles.modalLabel, { fontWeight: 'bold' }]}>{t('common.amount')}</Text>
              <Text style={[styles.modalValue, { fontWeight: 'bold', color: selectedTransaction?.amount > 0 ? COLORS.success : COLORS.danger }]}>
                {selectedTransaction?.amount > 0 ? '+' : ''}€{Math.abs(selectedTransaction?.amount || 0).toFixed(2)}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailModalVisible(false)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}