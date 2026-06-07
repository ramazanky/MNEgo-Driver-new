// src/screens/DriverEarningsScreen.js - trips tablosundan hesaplar
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../services/ThemeContext';
import { COLORS, BASE_URL } from '../config';
import { showToast } from '../services/toast';

export default function DriverEarningsScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_earnings: 0,      // Toplam net kazanç (total_fare - commission)
    total_commission: 0,    // Toplam kesilen komisyon
    total_fare: 0,          // Toplam yolculuk ücreti
    total_trips: 0,
    average_earning: 0,
    this_month: 0,
    last_month: 0
  });
  const [dailyEarnings, setDailyEarnings] = useState([]);

  // Dinamik stiller
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inkBlack },
    loadingText: { color: colors.dustyDenim, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginLeft: 12 },
    
    content: { padding: 16, paddingBottom: 40 },
    statsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.prussianBlue, padding: 16, borderRadius: 16, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.success },
    statLabel: { fontSize: 12, color: colors.dustyDenim, marginTop: 4, textAlign: 'center' },
    statSubValue: { fontSize: 12, color: COLORS.warning, marginTop: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: 12 },
    dayCard: { backgroundColor: colors.prussianBlue, padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayDate: { fontSize: 14, fontWeight: '500', color: colors.white },
    dayEarnings: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
    dayCommission: { fontSize: 12, color: COLORS.danger, marginTop: 2 },
    emptyContainer: { alignItems: 'center', padding: 40 },
    emptyText: { color: colors.dustyDenim, marginTop: 12 },
    commissionBadge: { backgroundColor: COLORS.danger + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
    commissionText: { fontSize: 10, color: COLORS.danger }
  };

  useEffect(() => {
    loadEarnings();
  }, []);


  const loadEarnings = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');

      // Yolculuk geçmişini al (trips tablosundan)
      const tripsResponse = await fetch(`${BASE_URL}/api/driver/trips?page=1&limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tripsData = await tripsResponse.json();

      if (tripsData.success && tripsData.trips) {
        let totalNetEarning = 0;
        let totalCommission = 0;
        let totalFare = 0;
        let totalTrips = 0;
        let thisMonthTotal = 0;
        let lastMonthTotal = 0;

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const dailyMap = new Map();

        tripsData.trips.forEach(trip => {
          // 🔥 FIX: status 5 veya status = "Tamamlandı" kontrolü
          const isCompleted = trip.status === 5 || trip.status === "Tamamlandı";

          if (isCompleted) {
            // 🔥 FIX: total_fare NULL ise estimated_fare kullan
            const fare = Number(trip.total_fare) || Number(trip.estimated_fare) || 0;
            const commission = Number(trip.commission_amount) || 0;
            const netEarning = fare - commission;

            if (fare === 0) {
              console.log('⚠️ Ücret 0 olan yolculuk:', trip.id, 'total_fare:', trip.total_fare, 'estimated_fare:', trip.estimated_fare);
            }

            totalNetEarning += netEarning;
            totalCommission += commission;
            totalFare += fare;
            totalTrips++;

            const date = new Date(trip.completed_at || trip.requested_at);
            const dateStr = date.toLocaleDateString('tr-TR');
            const existing = dailyMap.get(dateStr) || { netTotal: 0, commissionTotal: 0, fareTotal: 0, count: 0 };
            existing.netTotal += netEarning;
            existing.commissionTotal += commission;
            existing.fareTotal += fare;
            existing.count++;
            dailyMap.set(dateStr, existing);

            if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
              thisMonthTotal += netEarning;
            }
            if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
              lastMonthTotal += netEarning;
            }
          }
        });

        const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
          date,
          amount: data.netTotal,
          commission: data.commissionTotal,
          fare: data.fareTotal,
          count: data.count
        }));
        daily.sort((a, b) => new Date(b.date.split('.').reverse().join('-')) - new Date(a.date.split('.').reverse().join('-')));

        setDailyEarnings(daily.slice(0, 30));
        setStats({
          total_earnings: totalNetEarning,
          total_commission: totalCommission,
          total_fare: totalFare,
          total_trips: totalTrips,
          average_earning: totalTrips > 0 ? totalNetEarning / totalTrips : 0,
          this_month: thisMonthTotal,
          last_month: lastMonthTotal
        });

        console.log('📊 Kazanç hesaplama tamamlandı:', {
          totalNetEarning,
          totalCommission,
          totalFare,
          totalTrips,
          thisMonthTotal,
          lastMonthTotal
        });
      }
    } catch (error) {
      console.log('Kazançlar yüklenemedi:', error);
      showToast.error(t('errors.connection_error'), t('driver.earnings'));
    } finally {
      setLoading(false);
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
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
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.success]} />}
    >
      <StatusBar style="light" backgroundColor={colors.inkBlack} />



      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('driver.earnings')}</Text>
      </View>

      <View style={styles.content}>
        {/* İstatistik Kartları */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>€{stats.total_earnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>{t('driver.earnings')}</Text>
            <View style={styles.commissionBadge}>
              <Text style={styles.commissionText}>-€{stats.total_commission.toFixed(2)} {t('driver.commission')}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_trips}</Text>
            <Text style={styles.statLabel}>{t('driver.total_trips')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>€{stats.average_earning.toFixed(2)}</Text>
            <Text style={styles.statLabel}>{t('wallet.average_earning')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>€{stats.this_month.toFixed(2)}</Text>
            <Text style={styles.statLabel}>{t('wallet.this_month')}</Text>
            <Text style={styles.statSubValue}>€{stats.last_month.toFixed(2)} {t('wallet.last_month')}</Text>
          </View>
        </View>

        {/* Toplam Brüt Bilgi */}
        <View style={[styles.statCard, { marginBottom: 16, backgroundColor: colors.prussianBlue + '80' }]}>
          <Text style={[styles.statLabel, { color: colors.dustyDenim }]}>Toplam Brüt</Text>
          <Text style={[styles.statValue, { fontSize: 18 }]}>€{stats.total_fare.toFixed(2)}</Text>
        </View>

        {/* Günlük Kazançlar */}
        <Text style={styles.sectionTitle}>📊 {t('wallet.transaction_history')}</Text>
        {dailyEarnings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={50} color={colors.dustyDenim} />
            <Text style={styles.emptyText}>{t('wallet.no_transactions')}</Text>
          </View>
        ) : (
          dailyEarnings.map((item, index) => (
            <View key={index} style={styles.dayCard}>
              <View>
                <Text style={styles.dayDate}>{item.date}</Text>
                <Text style={styles.dayCommission}>{item.count} {t('driver.total_trips')}</Text>
                {item.commission > 0 && (
                  <Text style={styles.commissionText}>-€{item.commission.toFixed(2)} {t('driver.commission')}</Text>
                )}
              </View>
              <Text style={styles.dayEarnings}>+€{item.amount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}