import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: Spacing.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      minWidth: 120,
    };

    // Size styles
    const sizeStyles = {
      small: {
        height: 36,
        paddingHorizontal: Spacing.padding.md,
        ...Typography.caption,
        fontSize: Typography.fontSize.sm,
      },
      medium: {
        height: Spacing.button,
        paddingHorizontal: Spacing.padding.lg,
        ...Typography.button,
      },
      large: {
        height: 56,
        paddingHorizontal: Spacing.padding.xl,
        ...Typography.button,
        fontSize: Typography.fontSize.lg,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? Colors.neutralLight : Colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? Colors.neutralLight : Colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? Colors.neutralLight : Colors.primary,
      },
      danger: {
        backgroundColor: disabled ? Colors.neutralLight : Colors.error,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: Typography.fontWeight.medium,
    };

    const textVariantStyles = {
      primary: {
        color: Colors.background,
      },
      secondary: {
        color: Colors.background,
      },
      outline: {
        color: disabled ? Colors.neutralLight : Colors.primary,
      },
      danger: {
        color: Colors.background,
      },
      ghost: {
        color: disabled ? Colors.neutralLight : Colors.primary,
      },
    };

    return {
      ...baseTextStyle,
      ...textVariantStyles[variant],
      ...textStyle,
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost'
              ? Colors.primary
              : Colors.background
          }
        />
      );
    }

    const textElement = (
      <Text style={[getTextStyle(), icon && {marginHorizontal: Spacing.sm}]}>
        {title}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    if (iconPosition === 'right') {
      return (
        <View style={styles.iconContainer}>
          {textElement}
          {icon}
        </View>
      );
    }

    return (
      <View style={styles.iconContainer}>
        {icon}
        {textElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;