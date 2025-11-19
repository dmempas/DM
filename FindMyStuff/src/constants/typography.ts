import {TextStyle} from 'react-native';

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
  },

  // Font weights
  fontWeight: {
    light: '300' as TextStyle['fontWeight'],
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Predefined text styles
  headline: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: '#333333',
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '500' as TextStyle['fontWeight'],
    color: '#333333',
    lineHeight: 24,
  },
  body: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: '#333333',
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: '#757575',
    lineHeight: 18,
  },
  button: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    color: '#ffffff',
    lineHeight: 20,
  },
  small: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: '#757575',
    lineHeight: 16,
  },
};

export default Typography;