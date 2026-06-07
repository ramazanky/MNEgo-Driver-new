// src/screens/ChatScreen.js - KLAVYE DÜZGÜN ÇALIŞIR
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripService } from '../services/api';
import socketService from '../services/socket';
import { useTheme } from '../services/ThemeContext';
import { COLORS } from '../config';
import { showToast } from '../services/toast';

export default function ChatScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { tripId, otherPartyName } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const flatListRef = useRef(null);

  // Dinamik stiller
  const styles = {
    container: { flex: 1, backgroundColor: colors.inkBlack },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: colors.prussianBlue },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginLeft: 12, flex: 1 },
    tripIdText: { fontSize: 12, color: colors.dustyDenim },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messagesList: { padding: 16, paddingBottom: 20 },
    messageRow: { marginBottom: 12 },
    myMessageRow: { alignItems: 'flex-end' },
    otherMessageRow: { alignItems: 'flex-start' },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
    myBubble: { backgroundColor: COLORS.success, borderBottomRightRadius: 4 },
    otherBubble: { backgroundColor: colors.prussianBlue, borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15 },
    myText: { color: colors.white },
    otherText: { color: colors.white },
    messageTime: { fontSize: 10, marginTop: 4 },
    myTime: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
    otherTime: { color: colors.dustyDenim },
    inputContainer: { 
      flexDirection: 'row', 
      padding: 12, 
      backgroundColor: colors.prussianBlue, 
      borderTopWidth: 1, 
      borderTopColor: colors.duskBlue 
    },
    input: { flex: 1, backgroundColor: colors.inkBlack, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.white, maxHeight: 100 },
    sendBtn: { justifyContent: 'center', alignItems: 'center', width: 50, marginLeft: 8 },
    sendBtnDisabled: { opacity: 0.5 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { color: colors.dustyDenim, marginTop: 12, textAlign: 'center' }
  };

  useEffect(() => {
    const getUserInfo = async () => {
      let token = await AsyncStorage.getItem('driver_token');
      if (token) {
        setUserRole('driver');
        const driver = await AsyncStorage.getItem('driver');
        if (driver) {
          const parsed = JSON.parse(driver);
          setUserId(parsed.id);
        }
      } else {
        token = await AsyncStorage.getItem('rider_token');
        if (token) {
          setUserRole('rider');
          const rider = await AsyncStorage.getItem('rider');
          if (rider) {
            const parsed = JSON.parse(rider);
            setUserId(parsed.id);
          }
        }
      }
    };
    
    getUserInfo();
    loadMessages();

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageSent(handleMessageSent);

    return () => {
      socketService.removeListeners();
    };
  }, [tripId]);

  const loadMessages = async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const res = await tripService.getMessages(tripId);
      if (res.data.success) {
        setMessages(res.data.messages || []);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      }
    } catch (error) {
      console.log('Mesajlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (String(data.tripId) === String(tripId)) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        sender_type: data.senderType,
        created_at: data.createdAt || new Date().toISOString()
      }]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const handleMessageSent = (data) => {
    if (String(data.tripId) === String(tripId)) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        sender_type: data.senderType,
        created_at: data.createdAt || new Date().toISOString()
      }]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    if (!tripId) {
      showToast.error( t('errors.connection_error'), t('chat.title'));
      return;
    }
    if (!userId || !userRole) {
      showToast.error( t('errors.connection_error'), 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    setSending(true);
    try {
      socketService.sendMessage(tripId, inputText.trim(), userId, userRole);
      setInputText('');
      // Mesaj gönderildikten sonra scroll yap
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      console.log('Mesaj gönderme hatası:', error);
      showToast.error( t('errors.connection_error'), t('chat.send'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_type === userRole;
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isMe ? styles.myTime : styles.otherTime]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.inkBlack }]}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.emptyText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!tripId) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.inkBlack }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={60} color={colors.dustyDenim} />
        <Text style={styles.emptyText}>{t('chat.title')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="light" backgroundColor={colors.inkBlack} />



      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{otherPartyName || t('chat.with_rider')}</Text>
          <Text style={styles.tripIdText}>#{tripId}</Text>
        </View>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={50} color={colors.dustyDenim} />
          <Text style={styles.emptyText}>{t('chat.title')}</Text>
          <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>Mesaj göndererek sohbeti başlatın</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.dustyDenim}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]} 
          onPress={sendMessage} 
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={24} color={inputText.trim() ? COLORS.success : colors.dustyDenim} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}