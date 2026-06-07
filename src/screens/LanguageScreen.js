// src/screens/LanguageScreen.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../services/i18n';
import { useTheme } from '../services/ThemeContext';
import { COLORS } from '../config';

export default function LanguageScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const languages = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'srp', label: 'Srpski', flag: '🇷🇸' }
  ];

  const handleLanguageChange = async (langCode) => {
    console.log('🔄 Dil değiştiriliyor:', langCode);
    await changeLanguage(langCode);

    const token = await AsyncStorage.getItem('driver_token');
    if (token) {
      navigation.replace('DriverHome');
    } else {
      navigation.replace('DriverLogin');
    }
  };

  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginLeft: 12 },
    content: { padding: 20, flex: 1, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.white, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.dustyDenim, textAlign: 'center', marginBottom: 40 },
    langBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.prussianBlue, padding: 16, borderRadius: 12, marginBottom: 12, gap: 12 },
    langFlag: { fontSize: 32 },
    langLabel: { fontSize: 18, fontWeight: '500', color: colors.white, flex: 1 },
    checkIcon: { color: COLORS.success }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.inkBlack} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('common.back')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>🌍 {t('common.welcome')}</Text>
        <Text style={styles.subtitle}>Lütfen bir dil seçin</Text>

        {languages.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={styles.langBtn}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={styles.langLabel}>{lang.label}</Text>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}