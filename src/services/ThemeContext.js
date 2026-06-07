// src/services/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ========== TEMA PALETLERİ ==========
// Tüm renkler WCAG 2.1 kontrast standartlarına uygun şekilde düzenlenmiştir
export const THEMES = {
  // Koyu tema - Yüksek kontrast
  default: {
    id: 'default',
    name: 'Deep Sea',
    colors: {
      inkBlack: '#0a0e1a',      // Çok koyu lacivert (arkaplan)
      prussianBlue: '#1a2335',   // Koyu mavi (ikincil arkaplan)
      duskBlue: '#2d3e6e',      // Orta mavi (hover/aktif)
      dustyDenim: '#5b7db3',    // Açık mavi (vurgu)
      white: '#e8edf5',         // Açık gri-beyaz (ana metin)
      deepTeal: '#3d8f8c',      // Teal (vurgu rengi)
      danger: '#ff6b6b',        // Parlak kırmızı (hata)
      success: '#51cf66',       // Parlak yeşil (başarı)
      warning: '#ffd43b',       // Parlak sarı (uyarı)
    }
  },

  // Yeşil doğa teması - Yüksek kontrastlı
  green: {
    id: 'green',
    name: 'Green Nature',
    colors: {
      inkBlack: '#0a1f0a',      // Çok koyu yeşil-siyah
      prussianBlue: '#143014',   // Koyu yeşil
      duskBlue: '#2d5a2d',      // Orta yeşil
      dustyDenim: '#6f9e6f',    // Açık yeşil-gri
      white: '#e8f5e8',         // Açık yeşil-beyaz (metin)
      deepTeal: '#2e8b57',      // Deniz yosunu yeşili
      danger: '#ff6b6b',        // Parlak kırmızı
      success: '#6fbf6f',       // Parlak yeşil
      warning: '#ffd93d',       // Parlak sarı
    }
  },

  // Altın teması - Yüksek kontrastlı
  gold: {
    id: 'gold',
    name: 'Gold Elegance',
    colors: {
      inkBlack: '#1a1a1a',      // Neredeyse siyah
      prussianBlue: '#2d2d2d',   // Koyu gri
      duskBlue: '#b8860b',      // Koyu altın (vurgu)
      dustyDenim: '#d4af37',    // Altın sarısı
      white: '#ffffff',         // Beyaz (metin)
      deepTeal: '#b8860b',      // Altın rengi
      danger: '#dc143c',        // Koyu kırmızı
      success: '#daa520',       // Altın sarısı
      warning: '#ffb347',       // Turuncu-altın
    }
  },

  // Monochrome teması - Yüksek kontrastlı
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome Beach',
    colors: {
      inkBlack: '#1a1a1a',      // Koyu gri
      prussianBlue: '#2b2b2b',   // Orta koyu gri
      duskBlue: '#4a4a4a',      // Orta gri
      dustyDenim: '#8a8a8a',    // Açık gri
      white: '#f5f5f5',         // Beyaz (metin)
      deepTeal: '#3a6b6b',      // Teal-gri
      danger: '#ff6b6b',        // Parlak kırmızı
      success: '#6b6b6b',       // Gri (kontrast için)
      warning: '#ffb347',       // Turuncu
    }
  },

  // Pastel teması - Yüksek kontrastlı
  pastel: {
    id: 'pastel',
    name: 'Pastel Rainbow',
    colors: {
      inkBlack: '#2d2d69',      // Koyu mor (metin için koyu)
      prussianBlue: '#4a4a8a',   // Orta mor
      duskBlue: '#b8a9e8',      // Açık lavanta
      dustyDenim: '#d8c8f8',    // Çok açık lavanta
      white: '#ffffff',         // Beyaz (arkaplan)
      deepTeal: '#6c9ebf',      // Pastel mavi
      danger: '#ff8a8a',        // Pastel kırmızı
      success: '#8bc8a8',       // Pastel yeşil
      warning: '#ffe08a',       // Pastel sarı
    }
  },

  // Silver teması - Yüksek kontrastlı
  silver: {
    id: 'silver',
    name: 'Silver Lining',
    colors: {
      inkBlack: '#2a2a2a',      // Koyu gri (arkaplan)
      prussianBlue: '#3d3d3d',   // Orta koyu gri
      duskBlue: '#6b6b6b',      // Orta gri
      dustyDenim: '#a0a0a0',    // Açık gri
      white: '#f0f0f0',         // Açık gri-beyaz (metin)
      deepTeal: '#5a8a8a',      // Gri-teal
      danger: '#ff6b6b',        // Parlak kırmızı
      success: '#8a8a5a',       // Zeytin yeşili
      warning: '#ffb347',       // Turuncu
    }
  },

  // ========== YENİ EKLENEN TEMALAR ==========

  // Okyanus Mavisi Teması
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      inkBlack: '#001524',      // Derin okyanus mavisi
      prussianBlue: '#001e2d',   // Koyu mavi
      duskBlue: '#005f73',      // Turkuaz-mavi
      dustyDenim: '#0a9396',    // Açık turkuaz
      white: '#e9ecef',         // Açık gri (metin)
      deepTeal: '#94d2bd',      // Açık teal
      danger: '#ee6c4d',        // Mercan kırmızısı
      success: '#2a9d8f',       // Teal yeşili
      warning: '#e9c46a',       // Kum sarısı
    }
  },

  // Koyu Mor Teması
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    colors: {
      inkBlack: '#1a0b2e',      // Koyu mor
      prussianBlue: '#2d1b4e',   // Orta koyu mor
      duskBlue: '#4a2c6d',      // Mor
      dustyDenim: '#7b4f9e',    // Açık mor
      white: '#f3e8ff',         // Açık mor-beyaz (metin)
      deepTeal: '#6b4e9e',      // Mor-mavi
      danger: '#ff6b8b',        // Pembe-kırmızı
      success: '#9b6bcf',       // Açık mor
      warning: '#ffd93d',       // Sarı
    }
  },

  // Sıcak Turuncu Teması
  warm: {
    id: 'warm',
    name: 'Warm Sunset',
    colors: {
      inkBlack: '#2b1a10',      // Koyu kahve
      prussianBlue: '#4a2c1a',   // Kahve
      duskBlue: '#cc6b2c',      // Turuncu-kahve
      dustyDenim: '#e8985a',    // Açık turuncu
      white: '#fff4e8',         // Krem (metin)
      deepTeal: '#cc6b2c',      // Turuncu
      danger: '#ff6b6b',        // Kırmızı
      success: '#8b8b3a',       // Zeytin
      warning: '#ffb347',       // Turuncu
    }
  },

  // Siyah-Beyaz Teması (Maksimum kontrast)
  mono: {
    id: 'mono',
    name: 'Pure Contrast',
    colors: {
      inkBlack: '#000000',      // Siyah (arkaplan)
      prussianBlue: '#1a1a1a',   // Koyu gri
      duskBlue: '#333333',      // Orta gri
      dustyDenim: '#666666',    // Açık gri
      white: '#ffffff',         // Beyaz (metin)
      deepTeal: '#555555',      // Gri
      danger: '#ff0000',        // Kırmızı
      success: '#00ff00',       // Yeşil
      warning: '#ffff00',       // Sarı
    }
  },

  // Kiraz Kırmızısı Teması
  cherry: {
    id: 'cherry',
    name: 'Cherry Blossom',
    colors: {
      inkBlack: '#2d0a13',      // Koyu bordo
      prussianBlue: '#4a1020',   // Bordo
      duskBlue: '#8b2c3a',      // Kiraz kırmızısı
      dustyDenim: '#c44d5c',    // Açık kırmızı
      white: '#fff0f2',         // Açık pembe (metin)
      deepTeal: '#8b2c3a',      // Kiraz kırmızısı
      danger: '#ff2a2a',        // Parlak kırmızı
      success: '#6b8b3a',       // Zeytin yeşili
      warning: '#ffb347',       // Turuncu
    }
  },


// Varsayılan Açık Tema - Arkaplan için düzenlendi
light: {
  id: 'light',
  name: 'Aydınlık',
  colors: {
    inkBlack: '#f8f9fa',      // Açık gri (arkaplan) - Beyaza yakın
    prussianBlue: '#ffffff',   // Beyaz (kartlar için)
    duskBlue: '#e9ecef',      // Çok açık gri (border/ayrıcı)
    dustyDenim: '#6c757d',    // Orta gri (metinler için)
    white: '#212529',         // Koyu gri (ana metin)
    deepTeal: '#20c997',      // Açık teal (vurgu)
    danger: '#dc3545',        // Kırmızı
    success: '#28a745',       // Yeşil
    warning: '#ffc107',       // Sarı
  }
},

  // Soft Pastel
  softPastel: {
    id: 'softPastel',
    name: 'Yumuşak Pastel',
    colors: {
      inkBlack: '#2d2d4a',      // Koyu mor (metin)
      prussianBlue: '#4a4a6a',   // Mor-gri
      duskBlue: '#b8a9e8',      // Lavanta
      dustyDenim: '#d8c8f8',    // Açık lavanta
      white: '#faf5ff',         // Açık mor beyaz (arkaplan)
      deepTeal: '#6c9ebf',      // Pastel mavi
      danger: '#ff8a8a',        // Pastel kırmızı
      success: '#8bc8a8',       // Pastel yeşil
      warning: '#ffe08a',       // Pastel sarı
    }
  },

  // Rose Gold
  roseGold: {
    id: 'roseGold',
    name: 'Rose Gold',
    colors: {
      inkBlack: '#4a2c3a',      // Koyu pembe-gri (metin)
      prussianBlue: '#6b4357',   // Orta pembe
      duskBlue: '#e8b4c8',      // Açık pembe
      dustyDenim: '#f8d4e4',    // Çok açık pembe
      white: '#fff5f8',         // Beyaz-pembe (arkaplan)
      deepTeal: '#c97b8a',      // Gül kurusu
      danger: '#e84a5f',        // Kırmızı-pembe
      success: '#8bb87a',       // Açık yeşil
      warning: '#f5a65b',       // Şeftali
    }
  },

  // Mint Fresh
  mintFresh: {
    id: 'mintFresh',
    name: 'Nane Yeşili',
    colors: {
      inkBlack: '#1a4a3a',      // Koyu nane (metin)
      prussianBlue: '#2d6a4f',   // Orta nane
      duskBlue: '#74c69d',      // Açık nane
      dustyDenim: '#b7e4c7',    // Çok açık nane
      white: '#f0fdf4',         // Açık yeşil-beyaz (arkaplan)
      deepTeal: '#52b788',      // Nane yeşili
      danger: '#e85d5d',        // Kırmızı
      success: '#40916c',       // Koyu nane
      warning: '#ffb74d',       // Turuncu
    }
  },

  // Sky Blue
  skyBlue: {
    id: 'skyBlue',
    name: 'Gökyüzü Mavisi',
    colors: {
      inkBlack: '#0c4a6e',      // Koyu mavi (metin)
      prussianBlue: '#1e3a8a',   // Lacivert
      duskBlue: '#7dd3fc',      // Açık mavi
      dustyDenim: '#bae6fd',    // Çok açık mavi
      white: '#f0f9ff',         // Beyaz-mavi (arkaplan)
      deepTeal: '#0284c7',      // Okyanus mavisi
      danger: '#ef4444',        // Kırmızı
      success: '#10b981',       // Yeşil
      warning: '#f59e0b',       // Turuncu
    }
  },

  // Lavender Field
  lavenderField: {
    id: 'lavenderField',
    name: 'Lavanta Tarlası',
    colors: {
      inkBlack: '#2d1b4e',      // Koyu mor (metin)
      prussianBlue: '#4a2c6d',   // Mor
      duskBlue: '#a78bfa',      // Açık lavanta
      dustyDenim: '#c4b5fd',    // Çok açık lavanta
      white: '#f5f3ff',         // Beyaz-mor (arkaplan)
      deepTeal: '#7c3aed',      // Koyu lavanta
      danger: '#f43f5e',        // Pembe-kırmızı
      success: '#84cc16',       // Açık yeşil
      warning: '#fbbf24',       // Altın sarısı
    }
  },

  // Peach Blossom
  peachBlossom: {
    id: 'peachBlossom',
    name: 'Şeftali Çiçeği',
    colors: {
      inkBlack: '#4a2a1a',      // Koyu kahve (metin)
      prussianBlue: '#6b3a2a',   // Kahve
      duskBlue: '#fecdd3',      // Açık şeftali
      dustyDenim: '#fed7aa',    // Çok açık şeftali
      white: '#fff7ed',         // Krem (arkaplan)
      deepTeal: '#ea6a47',      // Şeftali
      danger: '#dc2626',        // Kırmızı
      success: '#65a30d',       // Yeşil
      warning: '#f97316',       // Turuncu
    }
  },

  // Ice Crystal
  iceCrystal: {
    id: 'iceCrystal',
    name: 'Buz Kristali',
    colors: {
      inkBlack: '#1e3a8a',      // Koyu mavi (metin)
      prussianBlue: '#2563eb',   // Parlak mavi
      duskBlue: '#b0e0e6',      // Buz mavisi
      dustyDenim: '#e0f2fe',    // Çok açık buz
      white: '#ffffff',         // Saf beyaz (arkaplan)
      deepTeal: '#22d3ee',      // Turkuaz
      danger: '#e11d48',        // Kırmızı
      success: '#22c55e',       // Yeşil
      warning: '#fbbf24',       // Sarı
    }
  },

  // Vanilla Cream
  vanillaCream: {
    id: 'vanillaCream',
    name: 'Vanilya Kreması',
    colors: {
      inkBlack: '#5c3d2e',      // Koyu kahve (metin)
      prussianBlue: '#8b5e3c',   // Kahve
      duskBlue: '#fde68a',      // Vanilya sarısı
      dustyDenim: '#fef9c3',    // Açık krema
      white: '#fefcea',         // Krem (arkaplan)
      deepTeal: '#d97706',      // Altın turuncu
      danger: '#ef4444',        // Kırmızı
      success: '#84cc16',       // Açık yeşil
      warning: '#f97316',       // Turuncu
    }
  },

  // Coral Reef
  coralReef: {
    id: 'coralReef',
    name: 'Mercan Kayalığı',
    colors: {
      inkBlack: '#4a1a2a',      // Koyu bordo (metin)
      prussianBlue: '#7a2a4a',   // Koyu pembe
      duskBlue: '#fecdd3',      // Açık mercan
      dustyDenim: '#ffe4e6',    // Çok açık mercan
      white: '#fff1f2',         // Pembe-beyaz (arkaplan)
      deepTeal: '#f43f5e',      // Mercan kırmızısı
      danger: '#be123c',        // Koyu kırmızı
      success: '#10b981',       // Yeşil
      warning: '#fb923c',       // Turuncu
    }
  },

  // Honeycomb
  honeycomb: {
    id: 'honeycomb',
    name: 'Bal Peteği',
    colors: {
      inkBlack: '#4a3a1a',      // Koyu kahve (metin)
      prussianBlue: '#6b5a2a',   // Zeytin
      duskBlue: '#fde047',      // Bal sarısı
      dustyDenim: '#fef08a',    // Açık sarı
      white: '#fefce8',         // Krem-sarı (arkaplan)
      deepTeal: '#eab308',      // Altın sarısı
      danger: '#ef4444',        // Kırmızı
      success: '#16a34a',       // Yeşil
      warning: '#d97706',       // Turuncu
    }
  },

  // ========== KOYU RENK TEMALAR ==========

  // Koyu tema - Yüksek kontrast
  dark: {
    id: 'dark',
    name: 'Koyu Gece',
    colors: {
      inkBlack: '#0a0e1a',      // Çok koyu lacivert
      prussianBlue: '#1a2335',   // Koyu mavi
      duskBlue: '#2d3e6e',      // Orta mavi
      dustyDenim: '#5b7db3',    // Açık mavi
      white: '#e8edf5',         // Açık gri-beyaz
      deepTeal: '#3d8f8c',      // Teal
      danger: '#ff6b6b',        // Parlak kırmızı
      success: '#51cf66',       // Parlak yeşil
      warning: '#ffd43b',       // Parlak sarı
    }
  },

  // Orman Yeşili - Koyu
  forestDark: {
    id: 'forestDark',
    name: 'Koyu Orman',
    colors: {
      inkBlack: '#0a1f0a',      // Çok koyu yeşil
      prussianBlue: '#143014',   // Koyu yeşil
      duskBlue: '#2d5a2d',      // Orta yeşil
      dustyDenim: '#6f9e6f',    // Açık yeşil
      white: '#e8f5e8',         // Açık yeşil-beyaz
      deepTeal: '#2e8b57',      // Deniz yosunu
      danger: '#ff6b6b',        // Kırmızı
      success: '#6fbf6f',       // Açık yeşil
      warning: '#ffd93d',       // Sarı
    }
  },

  // Gece Mavisi
  midnightBlue: {
    id: 'midnightBlue',
    name: 'Gece Mavisi',
    colors: {
      inkBlack: '#000b1a',      // Siyah-mavi
      prussianBlue: '#001524',   // Derin mavi
      duskBlue: '#003366',      // Lacivert
      dustyDenim: '#004080',    // Açık lacivert
      white: '#d9e6f2',         // Açık mavi-beyaz
      deepTeal: '#006666',      // Teal
      danger: '#ff4444',        // Kırmızı
      success: '#33cc33',       // Yeşil
      warning: '#ffcc00',       // Sarı
    }
  },

  // Mor Gece
  purpleNight: {
    id: 'purpleNight',
    name: 'Mor Gece',
    colors: {
      inkBlack: '#1a0b2e',      // Koyu mor
      prussianBlue: '#2d1b4e',   // Orta mor
      duskBlue: '#4a2c6d',      // Mor
      dustyDenim: '#7b4f9e',    // Açık mor
      white: '#f3e8ff',         // Açık mor-beyaz
      deepTeal: '#9b6bcf',      // Açık mor
      danger: '#ff6b8b',        // Pembe-kırmızı
      success: '#a8e6cf',       // Açık yeşil
      warning: '#ffd93d',       // Sarı
    }
  },

  // Kömür Gri
  charcoal: {
    id: 'charcoal',
    name: 'Kömür Gri',
    colors: {
      inkBlack: '#1a1a1a',      // Neredeyse siyah
      prussianBlue: '#2d2d2d',   // Koyu gri
      duskBlue: '#404040',      // Orta gri
      dustyDenim: '#666666',    // Açık gri
      white: '#f0f0f0',         // Beyaz (metin)
      deepTeal: '#4a6a6a',      // Gri-teal
      danger: '#ff6666',        // Kırmızı
      success: '#66cc66',       // Yeşil
      warning: '#ffcc66',       // Sarı
    }
  },

  // ========== TARAFSIZ (NÖTR) TEMALAR ==========

  // Toprak Tonları
  earth: {
    id: 'earth',
    name: 'Toprak Tonları',
    colors: {
      inkBlack: '#2c1e16',      // Koyu kahve (metin)
      prussianBlue: '#4a3528',   // Kahve
      duskBlue: '#8c6b4a',      // Açık kahve
      dustyDenim: '#b8956e',    // Çok açık kahve
      white: '#faf0e6',         // Krem (arkaplan)
      deepTeal: '#6b8a7a',      // Gri-yeşil
      danger: '#c44a2c',        // Kırmızı-kahve
      success: '#6b8a5a',       // Zeytin
      warning: '#d4a02a',       // Hardal
    }
  },

  // Mavi Gri
  blueGray: {
    id: 'blueGray',
    name: 'Mavi Gri',
    colors: {
      inkBlack: '#1e293b',      // Koyu lacivert-gri (metin)
      prussianBlue: '#334155',   // Mavi-gri
      duskBlue: '#64748b',      // Açık mavi-gri
      dustyDenim: '#94a3b8',    // Çok açık gri
      white: '#f8fafc',         // Beyaz (arkaplan)
      deepTeal: '#475569',      // Koyu gri
      danger: '#ef4444',        // Kırmızı
      success: '#10b981',       // Yeşil
      warning: '#f59e0b',       // Turuncu
    }
  },

  // Gül Kurusu
  dustyRose: {
    id: 'dustyRose',
    name: 'Gül Kurusu',
    colors: {
      inkBlack: '#4a3a3a',      // Koyu gri-pembe (metin)
      prussianBlue: '#6b4a4a',   // Kahve-pembe
      duskBlue: '#c8a0a0',      // Toz pembe
      dustyDenim: '#e0c0c0',    // Açık pembe-gri
      white: '#fff5f5',         // Beyaz-pembe (arkaplan)
      deepTeal: '#a06a6a',      // Koyu pembe
      danger: '#e85d5d',        // Kırmızı
      success: '#7a9a6a',       // Açık yeşil
      warning: '#e8a05a',       // Turuncu
    }
  },

  // Fildişi
  ivory: {
    id: 'ivory',
    name: 'Fildişi',
    colors: {
      inkBlack: '#3d2b1f',      // Koyu kahve (metin)
      prussianBlue: '#5c4033',   // Kahve
      duskBlue: '#d4c4a8',      // Fildişi
      dustyDenim: '#e8dccc',    // Açık fildişi
      white: '#fffaf0',         // Beyaz-fildişi (arkaplan)
      deepTeal: '#8a7a6a',      // Gri-kahve
      danger: '#d9534f',        // Kırmızı
      success: '#5cb85c',       // Yeşil
      warning: '#f0ad4e',       // Turuncu
    }
  }
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
      }
    } catch (error) {
      console.log('Tema yüklenemedi:', error);
    }
  };

  const changeTheme = async (themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(themeId);
      await AsyncStorage.setItem('app_theme', themeId);
    }
  };

  const colors = THEMES[currentTheme].colors;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, colors, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};