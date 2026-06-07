// src/screens/DriverHomeScreen.js - TAM DÜZELTİLMİŞ
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert,
  ScrollView, Switch, AppState, Modal, Linking, Platform, ActivityIndicator, Animated, PanResponder
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverService } from '../services/api';
import socketService from '../services/socket';
import soundService from '../services/soundService';
import { useTheme } from '../services/ThemeContext';
import { COLORS, BASE_URL } from '../config';
import { showToast } from '../services/toast';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width, height } = Dimensions.get('window');

export default function DriverHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // ========== STATE'LER ==========
  const [driver, setDriver] = useState(null);
  const [location, setLocation] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripStatus, setTripStatus] = useState(null);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [appStateStatus, setAppStateStatus] = useState('active');
  const [isProcessingTrip, setIsProcessingTrip] = useState(false);
  const [codeInputModalVisible, setCodeInputModalVisible] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [currentTripId, setCurrentTripId] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [completedTripId, setCompletedTripId] = useState(null);
  const [backgroundTimer, setBackgroundTimer] = useState(null);
  const [isWarningSent, setIsWarningSent] = useState(false);

  // ========== PANEL HEIGHT ==========
  const panelHeight = useRef(new Animated.Value(height * 0.25)).current;
  const MIN_PANEL_HEIGHT = height * 0.25;
  const MAX_PANEL_HEIGHT = height * 0.75;

  // ========== REF'LER ==========
  const mapRef = useRef(null);
  const locationInterval = useRef(null);
  const countdownInterval = useRef(null);
  const isAvailableRef = useRef(false);
  const locationRef = useRef(null);
  const appState = useRef('active');
  const isProcessingRef = useRef(false);
  const currentTripRef = useRef(null);
  const pendingTripRef = useRef(null);
  const backgroundTimerRef = useRef(null);
  const isWarningSentRef = useRef(false);

  // ========== COMPUTED ==========
  const isTripActive = useMemo(() => {
    return currentTrip !== null || pendingTrip !== null;
  }, [currentTrip, pendingTrip]);

  const isSwitchDisabled = useMemo(() => {
    return isTripActive ||
      currentBalance < 10 ||
      appStateStatus !== 'active' ||
      driver?.account_status !== 'approved' ||
      !socketConnected;
  }, [isTripActive, currentBalance, appStateStatus, driver?.account_status, socketConnected]);

  // Profil butonu disabled (sadece switch AÇIKKEN değil, aktif yolculuk varken de)
  const isProfileDisabled = useMemo(() => {
    return isTripActive || isAvailable;
  }, [isTripActive, isAvailable]);

  // ========== PAN RESPONDER ==========
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(MAX_PANEL_HEIGHT, height * 0.15 - gestureState.dy));
        panelHeight.setValue(newHeight);
      },
      onPanResponderRelease: () => {
        const currentHeight = panelHeight._value;
        const snapPoint1 = height * 0.25;
        const snapPoint2 = height * 0.70;
        const targetHeight = Math.abs(currentHeight - snapPoint1) < Math.abs(currentHeight - snapPoint2) ? snapPoint1 : snapPoint2;
        Animated.spring(panelHeight, { toValue: targetHeight, useNativeDriver: false }).start();
      },
    })
  ).current;

  // ========== DİNAMİK STYLES ==========
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    topBar: { position: 'absolute', top: 48, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.prussianBlue, padding: 12, borderRadius: 20, zIndex: 10 },
    driverName: { fontSize: 18, fontWeight: 'bold', color: colors.white },
    driverStats: { fontSize: 12, color: colors.dustyDenim, marginTop: 2 },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    balanceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inkBlack, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
    balanceText: { fontSize: 14, fontWeight: 'bold' },
    profileBtn: { padding: 4 },
    profileBtnDisabled: { opacity: 0.5 },
    statusBar: { position: 'absolute', top: 110, left: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, zIndex: 10 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 10, color: colors.white },
    map: { flex: 1 },
    driverMarker: { alignItems: 'center' },
    pickupMarker: { alignItems: 'center', backgroundColor: COLORS.success, padding: 4, borderRadius: 20 },
    dropoffMarker: { alignItems: 'center', backgroundColor: COLORS.danger, padding: 4, borderRadius: 20 },
    markerText: { fontSize: 10, fontWeight: 'bold', color: colors.white },
    locationBtn: { position: 'absolute', bottom: height * 0.45, right: 16, backgroundColor: colors.prussianBlue, borderRadius: 40, padding: 14, elevation: 5, zIndex: 10 },
    availabilityPanel: { position: 'absolute', top: 110, right: 16, backgroundColor: colors.prussianBlue, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 10 },
    availabilityLabel: { fontSize: 14, fontWeight: 'bold', color: colors.white },
    disabledText: { fontSize: 9, color: COLORS.danger, marginTop: 2, maxWidth: 120 },
    panel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.prussianBlue, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10, overflow: 'hidden' },
    dragHandle: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
    handleBarLine: { width: 48, height: 4, backgroundColor: colors.dustyDenim, borderRadius: 2 },
    panelScroll: { flex: 1 },
    panelContent: { padding: 16, paddingBottom: 30 },
    pendingCard: { backgroundColor: colors.duskBlue, padding: 16, borderRadius: 12, marginBottom: 12 },
    pendingTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: 8 },
    pendingInfo: { fontSize: 14, color: colors.white, marginBottom: 4 },
    addressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
    addressLabel: { fontSize: 12, fontWeight: 'bold', color: colors.white, marginLeft: 4, marginRight: 4 },
    addressText: { fontSize: 12, color: colors.white, flex: 1 },
    countdownBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, marginTop: 8, marginBottom: 4, overflow: 'hidden' },
    countdownFill: { height: '100%', backgroundColor: colors.white, borderRadius: 3 },
    countdownText: { fontSize: 12, color: colors.white, marginBottom: 12 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    rejectBtn: { flex: 1, backgroundColor: COLORS.danger, padding: 12, borderRadius: 8, alignItems: 'center' },
    acceptBtn: { flex: 1, backgroundColor: COLORS.success, padding: 12, borderRadius: 8, alignItems: 'center' },
    btnText: { color: colors.white, fontWeight: 'bold' },
    chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.duskBlue, padding: 12, borderRadius: 8, gap: 8, marginBottom: 12 },
    chatText: { color: colors.white, fontWeight: 'bold' },
    tripStatusText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginVertical: 12, color: colors.white },
    tripInfoCard: { backgroundColor: colors.inkBlack, padding: 16, borderRadius: 12, marginBottom: 12 },
    addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
    addressIconContainer: { flexDirection: 'row', alignItems: 'center', width: 60 },
    tripLabel: { fontSize: 12, color: colors.dustyDenim, marginLeft: 4 },
    tripAddress: { fontSize: 14, fontWeight: '500', color: colors.white, flex: 1, marginRight: 8 },
    tripFare: { fontSize: 16, fontWeight: 'bold', color: COLORS.success, marginTop: 8, textAlign: 'center' },
    arrivedBtn: { backgroundColor: COLORS.success, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
    arrivedBtnText: { color: colors.white, fontWeight: 'bold' },
    completeBtn: { backgroundColor: colors.duskBlue, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
    completeBtnText: { color: colors.white, fontWeight: 'bold' },
    cancelTripBtn: { backgroundColor: COLORS.danger, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
    cancelTripBtnText: { color: colors.white, fontWeight: 'bold' },
    waitingContainer: { alignItems: 'center', padding: 20 },
    waitingText: { fontSize: 18, fontWeight: 'bold', marginTop: 12, color: colors.white },
    waitingSubText: { fontSize: 14, color: colors.dustyDenim, marginTop: 4 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.prussianBlue, borderRadius: 20, padding: 24, width: width * 0.8, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: colors.white },
    codeInput: { borderWidth: 1, borderColor: colors.duskBlue, borderRadius: 12, padding: 16, fontSize: 24, width: '100%', marginBottom: 20, textAlign: 'center', backgroundColor: colors.inkBlack, color: colors.white },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    modalCancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.danger, marginRight: 8, alignItems: 'center' },
    modalCancelText: { color: colors.white, fontWeight: 'bold' },
    modalConfirmBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.success, alignItems: 'center' },
    modalConfirmText: { color: colors.white, fontWeight: 'bold' },
    starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 8 },
    languageBtn: { position: 'absolute', top: 60, right: 20, backgroundColor: colors.prussianBlue, padding: 10, borderRadius: 30, zIndex: 10 }
  };

  // ========== REF SENKRONİZASYON ==========
  useEffect(() => {
    currentTripRef.current = currentTrip;
    pendingTripRef.current = pendingTrip;
  }, [currentTrip, pendingTrip]);

  useEffect(() => {
    isAvailableRef.current = isAvailable;
  }, [isAvailable]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    isProcessingRef.current = isProcessingTrip;
  }, [isProcessingTrip]);

  // ========== BİLDİRİM İZİNLERİ ==========
  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Bildirim izni alınamadı');
        return false;
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('active-trip', {
          name: 'Aktif Yolculuklar',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#52796f',
        });
        await Notifications.setNotificationChannelAsync('trip-warning', {
          name: 'Yolculuk Uyarıları',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#e76f51',
        });
      }
      return true;
    } catch (error) {
      console.log('Bildirim hatası:', error);
      return false;
    }
  };

  // ========== SESLER ==========
  useEffect(() => {
    soundService.loadSounds();
    requestNotificationPermissions();

    return () => {
      soundService.unloadSounds();
    };
  }, []);

  // ========== SOCKET BAĞLANTISI ==========
  useEffect(() => {
    const initSocket = async () => {
      socketService.connect();
      socketService.onAcceptFailed((data) => {
        showToast.info(t('common.warning'), data.message || t('driver.cancel_trip'));
        setPendingTrip(null);
        setIsProcessingTrip(false);
        isProcessingRef.current = false;
        clearInterval(countdownInterval.current);
      });
    };
    initSocket();

    const interval = setInterval(() => {
      setSocketConnected(socketService.isConnected());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ========== SÜRÜCÜ KAYDI ==========
  useEffect(() => {
    if (driver?.id) {
      socketService.setDriverId(driver.id);
      socketService.registerDriver(driver.id);
    }
  }, [driver?.id]);

  // ========== APPSTATE YÖNETİMİ ==========
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    };
  }, [driver?.id, isTripActive]);

  const autoCancelTripDueToInactivity = async () => {
    const tripToCancel = currentTripRef.current || pendingTripRef.current;
    if (!tripToCancel) return;

    try {
      const response = await driverService.cancelTrip(tripToCancel.tripId);
      if (response.data.success) {
        setCurrentTrip(null);
        setPendingTrip(null);
        setTripStatus(null);
        setRouteCoords([]);
        setIsProcessingTrip(false);
        await loadData();
        showToast.error(t('driver.cancel_trip'), t('errors.connection_error'));
      }
    } catch (error) {
      console.log('Otomatik iptal hatası:', error);
    }
  };

  const handleAppStateChange = async (nextAppState) => {
    const prevAppState = appState.current;
    appState.current = nextAppState;
    setAppStateStatus(nextAppState);

    if (prevAppState === 'active' && nextAppState === 'background') {
      if (isTripActive && (currentTripRef.current || pendingTripRef.current)) {
        const activeTrip = currentTripRef.current || pendingTripRef.current;

        if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
        backgroundTimerRef.current = setTimeout(async () => {
          if (appState.current !== 'active' && isTripActive) {
            isWarningSentRef.current = true;
            setTimeout(async () => {
              if (appState.current !== 'active' && isTripActive) {
                await autoCancelTripDueToInactivity();
              }
            }, 2 * 60 * 1000);
          }
        }, 2 * 60 * 1000);
      }

      if (isAvailableRef.current && !isTripActive) {
        setIsAvailable(false);
        isAvailableRef.current = false;
        await driverService.updateAvailability(0);
      }

      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
    }

    if (prevAppState !== 'active' && nextAppState === 'active') {
      if (backgroundTimerRef.current) {
        clearTimeout(backgroundTimerRef.current);
        backgroundTimerRef.current = null;
      }
      if (isWarningSentRef.current) {
        isWarningSentRef.current = false;
        showToast.success(t('common.welcome'), t('success.profile_updated'));
      }
      await loadData();
      if (!socketService.isConnected()) {
        socketService.connect();
        if (driver?.id) setTimeout(() => socketService.registerDriver(driver.id), 1000);
      }
      if (!locationInterval.current && isAvailableRef.current) startLocationUpdates();
      if (isTripActive) showToast.info(t('driver.waiting_for_trip'), t('driver.new_trip_request'));
    }
  };

  // ========== VERİ YÜKLEME ==========
  const loadData = async () => {
    try {
      const res = await driverService.getProfile();
      if (res.data.success) {
        setDriver(res.data.driver);
        setIsAvailable(res.data.driver.is_available === 1);
        isAvailableRef.current = res.data.driver.is_available === 1;
        setCurrentBalance(Number(res.data.driver.current_balance) || 0);
      }
      const token = await AsyncStorage.getItem('driver_token');
      const vehiclesRes = await fetch(`${BASE_URL}/api/driver/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vData = await vehiclesRes.json();
      if (vData.success) setVehicles(vData.vehicles || []);
    } catch (error) {
      console.log(error);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  // ========== KONUM ==========
  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      locationRef.current = loc.coords;
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 100);
      startLocationUpdates();
    }
  };

  const startLocationUpdates = () => {
    if (locationInterval.current) clearInterval(locationInterval.current);
    locationInterval.current = setInterval(async () => {
      try {
        const newLoc = await Location.getCurrentPositionAsync({});
        setLocation(newLoc.coords);
        locationRef.current = newLoc.coords;
        if (isAvailableRef.current && driver && socketService.isConnected()) {
          socketService.updateLocation(driver.id, newLoc.coords.latitude, newLoc.coords.longitude);
        }
      } catch (error) { }
    }, 3000);
  };

  // ========== ROTA ==========
  const fetchRoute = async (destLat, destLng) => {
    if (!locationRef.current) return;
    try {
      const response = await fetch(`${BASE_URL}/api/directions?origin_lat=${locationRef.current.latitude}&origin_lng=${locationRef.current.longitude}&dest_lat=${destLat}&dest_lng=${destLng}`);
      const data = await response.json();
      if (data.status === 'OK') {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        if (points.length && mapRef.current) {
          const lats = points.map(p => p.latitude);
          const lngs = points.map(p => p.longitude);
          mapRef.current.animateToRegion({
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            latitudeDelta: (Math.max(...lats) - Math.min(...lats)) * 1.5,
            longitudeDelta: (Math.max(...lngs) - Math.min(...lngs)) * 1.5
          }, 500);
        }
      }
    } catch (error) { }
  };

  const decodePolyline = (encoded) => {
    let points = [], index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0; result = 0;
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  // ========== SOCKET LİSTENER'LAR ==========
  useEffect(() => {
    const handleTripAssigned = (data) => {
      soundService.playSwitchOff();
      setCurrentTrip(data);
      setTripStatus('accepted');
      setPendingTrip(null);
      setIsProcessingTrip(false);
      clearInterval(countdownInterval.current);
      setTimeout(() => {
        if (data.pickup?.lat && data.pickup?.lng) {
          fetchRoute(data.pickup.lat, data.pickup.lng);
        }
      }, 500);
    };

    const handleTripCompleted = (data) => {
      setCompletedTripId(data.tripId);
      setRatingModalVisible(true);
      setCurrentTrip(null);
      setTripStatus(null);
      setRouteCoords([]);
      setIsProcessingTrip(false);
      setIsAvailable(false);
      isAvailableRef.current = false;
      loadData();
      showToast.success(t('driver.complete_trip'), t('success.trip_completed'));
    };

    const handleTripCancelled = (data) => {
      console.log('❌ İPTAL BİLDİRİMİ:', data);
      setCurrentTrip(null);
      setPendingTrip(null);
      setTripStatus(null);
      setRouteCoords([]);
      setIsProcessingTrip(false);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      setIsAvailable(false);
      isAvailableRef.current = false;
      loadData();
      showToast.info(t('driver.cancel_trip'), data.message || t('driver.trip_cancelled'));
    };

    const handleTripRejected = (data) => {
      console.log('❌ RED BİLDİRİMİ:', data);
      setPendingTrip(null);
      setIsProcessingTrip(false);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      showToast.info(t('driver.reject'), data.message || t('driver.reject'));
    };

    const handleNewTrip = (data) => {
      if (!isAvailableRef.current || currentTrip !== null || pendingTrip !== null) {
        console.log('Sürücü uygun değil, talep alınmadı');
        return;
      }

      setIsProcessingTrip(true);
      soundService.playNewRide();
      setPendingTrip(data);
      setCountdown(30);

      if (countdownInterval.current) clearInterval(countdownInterval.current);
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            if (pendingTripRef.current && !isProcessingRef.current) {
              socketService.rejectTrip(pendingTripRef.current.tripId, driver?.id);
              setPendingTrip(null);
              setIsProcessingTrip(false);
              showToast.error(t('driver.reject'), t('driver.reject'));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    socketService.onTripCancelled(handleTripCancelled);
    socketService.onTripRejected(handleTripRejected);
    socketService.onNewTripRequest(handleNewTrip);
    socketService.onTripAssigned(handleTripAssigned);
    socketService.onTripCompleted(handleTripCompleted);
    socketService.onAcceptFailed((data) => {
      showToast.info(t('errors.connection_error'), data.message || t('driver.cancel_trip'));
      setPendingTrip(null);
      setIsProcessingTrip(false);
      clearInterval(countdownInterval.current);
    });

    return () => {
      socketService.removeListeners();
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [driver?.id, isAvailable]);

  // ========== BUTON AKSİYONLARI ==========
  const acceptTrip = () => {
    if (!pendingTrip || isProcessingRef.current === false) return;
    const tripId = pendingTrip.tripId;
    setPendingTrip(null);
    setIsProcessingTrip(false);
    clearInterval(countdownInterval.current);
    socketService.acceptTrip(tripId, driver?.id);
  };

  const rejectTrip = () => {
    if (!pendingTrip) return;
    soundService.playRideRejected();
    clearInterval(countdownInterval.current);
    setPendingTrip(null);
    setIsProcessingTrip(false);
    socketService.rejectTrip(pendingTrip.tripId, driver?.id);
    showToast.error(t('driver.reject'), t('driver.reject'));
  };

  const arrivedAndRequestCode = () => {
    socketService.requestVerificationCode(currentTrip.tripId, driver?.id);
    showToast.info(t('driver.verify_code'), t('driver.arrived'));
    setCurrentTripId(currentTrip.tripId);
    setCodeInputModalVisible(true);
  };

  const submitVerificationCode = async () => {
    if (!verificationCodeInput || verificationCodeInput.length !== 4) {
      showToast.error(t('errors.connection_error'), t('errors.invalid_code'));
      return;
    }

    try {
      const response = await driverService.verifyCode(currentTripId, verificationCodeInput);
      if (response.data.success) {
        showToast.success(t('driver.verify_code'), `${t('success.code_verified')} ${t('driver.commission')}: ${response.data.commission}€`);

        setCodeInputModalVisible(false);
        setVerificationCodeInput('');
        setTripStatus('started');
        setCurrentBalance(response.data.new_balance);

        if (currentTrip?.dropoff) {
          setTimeout(() => fetchRoute(currentTrip.dropoff.lat, currentTrip.dropoff.lng), 500);
        }
      }
    } catch (error) {
      showToast.error(t('errors.connection_error'), error.response?.data?.error || t('errors.invalid_code'));
    }
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip || !currentTrip.tripId) {
      showToast.error(t('errors.connection_error'), t('driver.complete_trip'));
      return;
    }

    try {
      showToast.info(t('driver.complete_trip'), t('common.loading'));

      let actualDistance = 5.2;
      let actualDuration = 15;
      let totalFare = currentTrip?.estimatedFare || 25;

      if (locationRef.current && currentTrip.dropoff) {
        try {
          const response = await fetch(`${BASE_URL}/api/directions?origin_lat=${locationRef.current.latitude}&origin_lng=${locationRef.current.longitude}&dest_lat=${currentTrip.dropoff.lat}&dest_lng=${currentTrip.dropoff.lng}`);
          const data = await response.json();
          if (data.status === 'OK' && data.routes[0]) {
            actualDistance = (data.routes[0].legs[0].distance.value / 1000).toFixed(1);
            actualDuration = (data.routes[0].legs[0].duration.value / 60).toFixed(0);
          }
        } catch (err) {
          console.log('Rota hesaplama hatası, varsayılan değerler kullanılacak');
        }
      }

      const completeResponse = await driverService.completeTrip(
        currentTrip.tripId,
        actualDistance,
        actualDuration,
        totalFare
      );

      if (completeResponse.data.success) {
        socketService.completeTrip(
          currentTrip.tripId,
          driver?.id,
          actualDistance,
          actualDuration,
          totalFare
        );

        setCompletedTripId(currentTrip.tripId);
        setRatingModalVisible(true);
        setCurrentTrip(null);
        setTripStatus(null);
        setRouteCoords([]);
        setIsProcessingTrip(false);
        setIsAvailable(false);
        isAvailableRef.current = false;

        await loadData();
        showToast.success(t('driver.complete_trip'), t('success.trip_completed'));
      }
    } catch (error) {
      console.error('Complete trip error:', error);
      showToast.error(t('errors.connection_error'), error.response?.data?.error || t('driver.complete_trip'));
    }
  };

  const handleCancelTrip = async () => {
    Alert.alert(
      t('driver.cancel_trip'),
      `${t('driver.cancel_trip')}? ${t('driver.penalty')} 2€`,
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await driverService.cancelTrip(currentTrip.tripId);
              if (response.data.success) {
                showToast.error(t('driver.cancel_trip'), `${t('driver.cancel_trip')}, ${t('wallet.current_balance')}: ${response.data.new_balance}€`);
                socketService.cancelTrip(currentTrip.tripId, driver?.id);
                setCurrentTrip(null);
                setTripStatus(null);
                setRouteCoords([]);
                setIsProcessingTrip(false);
                loadData();
              }
            } catch (error) {
              showToast.error(t('errors.connection_error'), error.response?.data?.error || t('driver.cancel_trip'));
            }
          }
        }
      ]
    );
  };

  const submitRating = async () => {
    try {
      await driverService.rateRider(completedTripId, selectedRating);
      setRatingModalVisible(false);
      setSelectedRating(5);
      setCompletedTripId(null);
      showToast.success(t('driver.rating'), t('success.profile_updated'));
    } catch (error) {
      showToast.error(t('errors.connection_error'), t('driver.rating'));
    }
  };

  const openNavigation = (lat, lng, address) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}(${encodeURIComponent(address)})`,
      android: `google.navigation:q=${lat},${lng}`
    });
    Linking.openURL(url).catch(() => showToast.error(t('errors.connection_error'), t('driver.pickup')));
  };

  const checkRequirements = () => {
    const missing = [];
    if (currentBalance < 10) missing.push(`• ${t('driver.balance')} minimum 10€`);
    if (driver?.account_status !== 'approved') missing.push(`• ${t('verification.account')} ${t('verification.pending')}`);
    if (!driver?.identity_verified) missing.push(`• ${t('verification.identity')} ${t('verification.pending')}`);
    if (!driver?.license_verified) missing.push(`• ${t('verification.license')} ${t('verification.pending')}`);
    if (!vehicles.some(v => v.is_verified === 1)) missing.push(`• ${t('errors.vehicle_required')}`);
    return missing;
  };

  const toggleAvailability = async () => {
    if (isTripActive) {
      showToast.info(t('driver.available'), t('driver.waiting_for_trip'));
      return;
    }
    if (appState.current !== 'active') {
      showToast.info(t('driver.available'), t('errors.connection_error'));
      return;
    }
    const missing = checkRequirements();
    if (missing.length > 0 && !isAvailable) {
      showToast.info(t('driver.unavailable'), missing.join('\n'));
      return;
    }
    const newStatus = !isAvailable;
    if (newStatus && currentBalance < 10) {
      showToast.error(t('errors.insufficient_balance'), `${t('driver.balance')} ${currentBalance}€. Minimum 10€!`);
      return;
    }
    if (newStatus) await soundService.playSwitchOn();
    else await soundService.playSwitchOff();

    setIsAvailable(newStatus);
    isAvailableRef.current = newStatus;
    await driverService.updateAvailability(newStatus ? 1 : 0);

    if (newStatus && driver?.id && locationRef.current) {
      socketService.updateLocation(driver.id, locationRef.current.latitude, locationRef.current.longitude);
    }
    showToast.success(t('driver.available'), newStatus ? t('driver.available') : t('driver.unavailable'));
  };

  // Çıkış yap butonu
  const handleLogout = async () => {
    Alert.alert(
      t('common.logout'),
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: async () => {
            await AsyncStorage.removeItem('driver_token');
            socketService.disconnect();
            navigation.replace('DriverLogin');
          }
        }
      ]
    );
  };

  // ========== İLK YÜKLEME ==========
  useEffect(() => {
    const init = async () => {
      await setupLocation();
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) {
        navigation.replace('DriverLogin');
        return;
      }
      await loadData();
    };
    init();
  }, []);

  // ========== RENDER ==========
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />



      <View style={styles.topBar}>
        <View>
          <Text style={styles.driverName}>{driver?.full_name || t('driver.available')}</Text>
          <Text style={styles.driverStats}>⭐ {driver?.rating || '5.0'} | {driver?.total_trips || 0} {t('driver.total_trips')}</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.balanceBox}>
            <Ionicons name="wallet-outline" size={18} color={currentBalance >= 10 ? COLORS.success : COLORS.danger} />
            <Text style={[styles.balanceText, { color: currentBalance >= 10 ? COLORS.success : COLORS.danger }]}>€{currentBalance.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileBtn, isProfileDisabled && styles.profileBtnDisabled]}
            onPress={() => {
              if (isProfileDisabled) {
                showToast.info(t('driver.available'), t('driver.waiting_for_trip'));
                return;
              }
              navigation.navigate('DriverProfile');
            }}
            disabled={isProfileDisabled}
          >
            <Ionicons name="person-circle-outline" size={28} color={isProfileDisabled ? colors.dustyDenim : colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: socketConnected ? COLORS.success : COLORS.danger }]} />
        <Text style={styles.statusText}>{socketConnected ? 'Socket Bağlı' : 'Socket Yok'}</Text>
        <View style={[styles.statusDot, { backgroundColor: isAvailable ? COLORS.success : COLORS.danger, marginLeft: 12 }]} />
        <Text style={styles.statusText}>{isAvailable ? t('driver.available') : t('driver.unavailable')}</Text>
        {appStateStatus !== 'active' && (<><View style={[styles.statusDot, { backgroundColor: COLORS.warning, marginLeft: 12 }]} /><Text style={styles.statusText}>Arka Planda</Text></>)}
        {driver?.account_status !== 'approved' && (<><View style={[styles.statusDot, { backgroundColor: COLORS.warning, marginLeft: 12 }]} /><Text style={styles.statusText}>{t('verification.pending')}</Text></>)}
      </View>

      <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE} showsUserLocation showsMyLocationButton={false}>
        {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeColor={colors.duskBlue} strokeWidth={4} />}
        {location && (
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
            <View style={styles.driverMarker}><Ionicons name="car" size={30} color={colors.duskBlue} /></View>
          </Marker>
        )}
        {currentTrip?.pickup && tripStatus === 'accepted' && (
          <Marker coordinate={{ latitude: currentTrip.pickup.lat, longitude: currentTrip.pickup.lng }}>
            <View style={styles.pickupMarker}><Ionicons name="location" size={24} color={COLORS.success} /><Text style={styles.markerText}>{t('driver.pickup')}</Text></View>
          </Marker>
        )}
        {currentTrip?.dropoff && tripStatus === 'started' && (
          <Marker coordinate={{ latitude: currentTrip.dropoff.lat, longitude: currentTrip.dropoff.lng }}>
            <View style={styles.dropoffMarker}><Ionicons name="flag" size={24} color={COLORS.danger} /><Text style={styles.markerText}>{t('driver.dropoff')}</Text></View>
          </Marker>
        )}
      </MapView>

      <TouchableOpacity style={styles.locationBtn} onPress={() => location && mapRef.current?.animateToRegion({ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300)}>
        <Ionicons name="navigate" size={24} color={colors.white} />
      </TouchableOpacity>

      <View style={styles.availabilityPanel}>
        <View>
          <Text style={styles.availabilityLabel}>{t('driver.available')}</Text>
          {isSwitchDisabled && !isTripActive && (
            <Text style={styles.disabledText}>
              {!socketConnected ? 'Socket bağlı değil' : currentBalance < 10 ? t('errors.insufficient_balance') : appStateStatus !== 'active' ? t('errors.connection_error') : driver?.account_status !== 'approved' ? t('verification.pending') : ''}
            </Text>
          )}
          {isTripActive && <Text style={styles.disabledText}>{t('driver.waiting_for_trip')}</Text>}
        </View>
        <Switch value={isAvailable} onValueChange={toggleAvailability} trackColor={{ false: colors.dustyDenim, true: COLORS.success }} thumbColor={colors.white} disabled={isSwitchDisabled} />
      </View>

      <Animated.View style={[styles.panel, { height: panelHeight }]} {...panResponder.panHandlers}>
        <View style={styles.dragHandle}>
          <View style={styles.handleBarLine} />
        </View>
        <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelContent}>
          {pendingTrip && (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>⏳ {t('driver.new_trip_request')}</Text>
              <Text style={styles.pendingInfo}>{t('driver.distance')}: {pendingTrip.distance} km</Text>
              <Text style={styles.pendingInfo}>{t('driver.estimated_fare')}: €{pendingTrip.estimatedFare}</Text>
              <View style={styles.addressContainer}>
                <Ionicons name="location" size={16} color={COLORS.success} />
                <Text style={styles.addressLabel}>{t('driver.pickup')}:</Text>
                <Text style={styles.addressText}>{pendingTrip.pickup?.address || t('driver.pickup')}</Text>
              </View>
              <View style={styles.addressContainer}>
                <Ionicons name="flag" size={16} color={COLORS.danger} />
                <Text style={styles.addressLabel}>{t('driver.dropoff')}:</Text>
                <Text style={styles.addressText}>{pendingTrip.dropoff?.address || t('driver.dropoff')}</Text>
              </View>
              <View style={styles.countdownBar}><View style={[styles.countdownFill, { width: `${(countdown / 30) * 100}%` }]} /></View>
              <Text style={styles.countdownText}>{countdown} saniye</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={rejectTrip}><Text style={styles.btnText}>{t('driver.reject')}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={acceptTrip}><Text style={styles.btnText}>{t('driver.accept')}</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {currentTrip && (
            <View>
              <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { tripId: currentTrip.tripId, otherPartyName: t('chat.with_rider') })}>
                <Ionicons name="chatbubble-ellipses" size={24} color={colors.white} />
                <Text style={styles.chatText}>{t('chat.with_rider')}</Text>
              </TouchableOpacity>
              <Text style={styles.tripStatusText}>{tripStatus === 'accepted' ? '🚕 ' + t('driver.driver_on_the_way') : tripStatus === 'started' ? '🚗 ' + t('driver.trip_in_progress') : ''}</Text>
              <View style={styles.tripInfoCard}>
                <View style={styles.addressRow}>
                  <View style={styles.addressIconContainer}>
                    <Ionicons name="location" size={20} color={COLORS.success} />
                    <Text style={styles.tripLabel}>{t('driver.pickup')}</Text>
                  </View>
                  <Text style={styles.tripAddress}>{currentTrip.pickup?.address || t('driver.pickup')}</Text>
                  <TouchableOpacity onPress={() => openNavigation(currentTrip.pickup.lat, currentTrip.pickup.lng, currentTrip.pickup?.address)}>
                    <Ionicons name="navigate-circle-outline" size={28} color={colors.duskBlue} />
                  </TouchableOpacity>
                </View>
                <View style={styles.addressRow}>
                  <View style={styles.addressIconContainer}>
                    <Ionicons name="flag" size={20} color={COLORS.danger} />
                    <Text style={styles.tripLabel}>{t('driver.dropoff')}</Text>
                  </View>
                  <Text style={styles.tripAddress}>{currentTrip.dropoff?.address || t('driver.dropoff')}</Text>
                  <TouchableOpacity onPress={() => openNavigation(currentTrip.dropoff.lat, currentTrip.dropoff.lng, currentTrip.dropoff?.address)}>
                    <Ionicons name="navigate-circle-outline" size={28} color={colors.duskBlue} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.tripFare}>{t('driver.estimated_fare')}: €{currentTrip.estimatedFare || 25}</Text>
              </View>
              {tripStatus === 'accepted' && (
                <>
                  <TouchableOpacity style={styles.arrivedBtn} onPress={arrivedAndRequestCode}>
                    <Text style={styles.arrivedBtnText}>{t('driver.arrived')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelTripBtn} onPress={handleCancelTrip}>
                    <Text style={styles.cancelTripBtnText}>{t('driver.cancel_trip')} (2€)</Text>
                  </TouchableOpacity>
                </>
              )}
              {tripStatus === 'started' && (
                <TouchableOpacity style={styles.completeBtn} onPress={() => Alert.alert(t('driver.complete_trip'), t('driver.complete_trip'), [
                  { text: t('common.no'), style: 'cancel' },
                  { text: t('common.yes'), onPress: handleCompleteTrip }
                ])}>
                  <Text style={styles.completeBtnText}>{t('driver.complete_trip')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!pendingTrip && !currentTrip && (
            <View style={styles.waitingContainer}>
              <Ionicons name="car-sport" size={60} color={colors.dustyDenim} />
              <Text style={styles.waitingText}>{!isAvailable ? t('driver.unavailable') : isProcessingTrip ? t('common.loading') : t('driver.waiting_for_trip')}</Text>
              <Text style={styles.waitingSubText}>{!isAvailable ? t('driver.available') : t('driver.waiting_for_trip')}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* MODALS */}
      <Modal visible={codeInputModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('driver.verify_code')}</Text>
            <TextInput style={styles.codeInput} value={verificationCodeInput} onChangeText={setVerificationCodeInput} keyboardType="number-pad" maxLength={4} placeholder="0000" textAlign="center" placeholderTextColor={colors.dustyDenim} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCodeInputModalVisible(false)}><Text style={styles.modalCancelText}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={submitVerificationCode}><Text style={styles.modalConfirmText}>{t('common.confirm')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={ratingModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('rider.rate_driver')}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Ionicons name={star <= selectedRating ? "star" : "star-outline"} size={40} color="#ffd700" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={submitRating}>
              <Text style={styles.modalConfirmText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}