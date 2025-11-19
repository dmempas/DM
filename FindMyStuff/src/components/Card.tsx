import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import Colors from '../constants/colors';
import Spacing from '../constants/spacing';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: boolean;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  margin?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  shadow = true,
  elevated = false,
  padding = 'md',
  margin = 'none',
  ...props
}) => {
  const cardStyle = [
    styles.card,
    shadow && styles.shadow,
    elevated && styles.elevated,
    styles[padding],
    styles[`margin${margin.charAt(0).toUpperCase() + margin.slice(1)}`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius.lg,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  elevated: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  none: {
    padding: 0,
  },
  sm: {
    padding: Spacing.padding.sm,
  },
  md: {
    padding: Spacing.padding.md,
  },
  lg: {
    padding: Spacing.padding.lg,
  },
  marginnone: {
    margin: 0,
  },
  marginsm: {
    margin: Spacing.margin.sm,
  },
  marginmd: {
    margin: Spacing.margin.md,
  },
  marginlg: {
    margin: Spacing.margin.lg,
  },
});

export default Card;