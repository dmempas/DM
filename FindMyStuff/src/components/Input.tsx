import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const inputContainerStyle = [
    styles.inputContainer,
    error && styles.inputError,
    props.editable === false && styles.inputDisabled,
    style,
  ];

  const renderInput = () => (
    <View style={inputContainerStyle}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <TextInput
        style={[
          styles.input,
          leftIcon && styles.inputWithLeftIcon,
          rightIcon && styles.inputWithRightIcon,
        ]}
        placeholderTextColor={Colors.textDisabled}
        editable={props.editable !== false}
        {...props}
      />
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {renderInput()}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Spacing.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.neutralLight,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.padding.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.padding.sm,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.padding.sm,
  },
  leftIcon: {
    paddingLeft: Spacing.padding.md,
  },
  rightIcon: {
    paddingRight: Spacing.padding.md,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default Input;