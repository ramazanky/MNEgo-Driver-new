// src/screens/ThemeScreen.js
import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, THEMES } from '../services/ThemeContext.js';


export default function ThemeScreen({ navigation }) {
    const { theme: currentTheme, colors, changeTheme } = useTheme();

    const ThemeCard = ({ themeId, theme }) => {
        const isActive = currentTheme === themeId;
        const themeColors = theme.colors;

        return (
            <TouchableOpacity
                style={[
                    styles.themeCard,
                    { backgroundColor: themeColors.prussianBlue },
                    isActive && { borderWidth: 2, borderColor: themeColors.success }
                ]}
                onPress={() => changeTheme(themeId)}
            >
                <View style={styles.themePreview}>
                    <View style={[styles.previewBar, { backgroundColor: themeColors.inkBlack }]} />
                    <View style={styles.previewColors}>
                        <View style={[styles.previewColor, { backgroundColor: themeColors.duskBlue }]} />
                        <View style={[styles.previewColor, { backgroundColor: themeColors.dustyDenim }]} />
                        <View style={[styles.previewColor, { backgroundColor: themeColors.success }]} />
                        <View style={[styles.previewColor, { backgroundColor: themeColors.danger }]} />
                    </View>
                </View>
                <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: themeColors.white }]}>{theme.name}</Text>
                    {isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: themeColors.success }]}>
                            <Ionicons name="checkmark" size={14} color={themeColors.inkBlack} />
                            <Text style={[styles.activeText, { color: themeColors.inkBlack }]}>Aktif</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.inkBlack }]}>
            <StatusBar style="light" />

            <View style={[styles.header, { backgroundColor: colors.prussianBlue }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.white }]}>Tema Seçimi</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.description, { color: colors.dustyDenim }]}>
                    Uygulamanın görünümünü özelleştirin. Seçtiğiniz tema otomatik olarak kaydedilecektir.
                </Text>

                {Object.entries(THEMES).map(([themeId, theme]) => (
                    <ThemeCard key={themeId} themeId={themeId} theme={theme} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 16 },
    description: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    themeCard: { borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
    themePreview: { height: 80, flexDirection: 'row' },
    previewBar: { width: 8, height: '100%' },
    previewColors: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 16 },
    previewColor: { width: 40, height: 40, borderRadius: 20 },
    themeInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    themeName: { fontSize: 16, fontWeight: 'bold' },
    activeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
    activeText: { fontSize: 12, fontWeight: 'bold' },
});