import Toast from 'react-native-toast-message';

export const showToast = {
  success: (title, message) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  error: (title, message) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  info: (title, message) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  warning: (title, message) => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  chat: (message, senderName) => {
    Toast.show({
      type: 'info',
      text1: `📩 ${senderName}`,
      text2: message,
      position: 'top',
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
    });
  },
};