import { COLORS } from '../config';
import { View, Text } from 'react-native';

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={{
      backgroundColor: COLORS.success,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginTop: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>✓ {text1}</Text>
      {text2 && <Text style={{ color: '#fff', fontSize: 12 }}>{text2}</Text>}
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View style={{
      backgroundColor: COLORS.danger,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginTop: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>✕ {text1}</Text>
      {text2 && <Text style={{ color: '#fff', fontSize: 12 }}>{text2}</Text>}
    </View>
  ),

  info: ({ text1, text2 }) => (
    <View style={{
      backgroundColor: COLORS.duskBlue,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginTop: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>ℹ {text1}</Text>
      {text2 && <Text style={{ color: '#fff', fontSize: 12 }}>{text2}</Text>}
    </View>
  ),

  warning: ({ text1, text2 }) => (
    <View style={{
      backgroundColor: COLORS.warning,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginTop: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>⚠ {text1}</Text>
      {text2 && <Text style={{ color: '#fff', fontSize: 12 }}>{text2}</Text>}
    </View>
  ),
};