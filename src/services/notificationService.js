// services/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim handler'ı
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Bildirim izni iste
export const requestNotificationPermissions = async () => {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.log('❌ Bildirim izni alınamadı');
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

        console.log('✅ Bildirim izni alındı');
        return true;
    } catch (error) {
        console.log('❌ Bildirim izni hatası:', error);
        return false;
    }
};

// Bildirim gönder (genel)
export const sendNotification = async (title, body, channel = 'active-trip', data = {}) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                channelId: channel,
            },
            trigger: null,
        });
        console.log('✅ Bildirim gönderildi:', title);
        return true;
    } catch (error) {
        console.log('❌ Bildirim hatası:', error);
        return false;
    }
};

// Arka plana alındığında bildirim
export const sendBackgroundTripNotification = async (tripDetails) => {
    return sendNotification(
        '🚖 Aktif Yolculuğunuz Var',
        `Yolculuk devam ediyor: ${tripDetails?.pickup?.address?.substring(0, 50) || 'Alış adresi'}\nUygulamaya geri dönün!`,
        'active-trip',
        { type: 'background_warning', tripId: tripDetails?.tripId }
    );
};

// Uygulama kapatıldığında uyarı bildirimi
export const sendTripExpiryWarning = async (tripDetails) => {
    return sendNotification(
        '⚠️ YOLCULUK İPTAL OLACAK!',
        `2 dakika içinde uygulamaya geri dönmezseniz yolculuk iptal edilecek ve 2€ ceza kesilecektir!`,
        'trip-warning',
        { type: 'expiry_warning', tripId: tripDetails?.tripId }
    );
};

// Sürüş iptal edildi bildirimi
export const sendTripCancelledNotification = async (penaltyAmount) => {
    return sendNotification(
        '❌ Yolculuk İptal Edildi',
        `Süresi içinde uygulamaya dönmediğiniz için yolculuk iptal edildi. ${penaltyAmount}€ ceza kesildi.`,
        'trip-warning',
        { type: 'trip_cancelled' }
    );
};