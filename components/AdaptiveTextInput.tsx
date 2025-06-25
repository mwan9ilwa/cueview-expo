import { useAdaptiveTheme } from '@/contexts/AdaptiveThemeContext';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TextStyle } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';

interface AdaptiveTextInputProps extends Omit<TextInputProps, 'style' | 'selectionColor'> {
  label?: string;
  error?: string;
  disabled?: boolean;
  style?: TextStyle;
  textStyle?: TextStyle;
  variant?: 'outlined' | 'filled';
  mode?: 'flat' | 'outlined';
}

export default function AdaptiveTextInput({
  label,
  error,
  disabled = false,
  style,
  textStyle,
  variant = 'outlined',
  mode,
  ...textInputProps
}: AdaptiveTextInputProps) {
  const { isAndroid, materialTheme, colors } = useAdaptiveTheme();

  if (isAndroid && materialTheme) {
    // Use Material Design 3 TextInput for Android
    const inputMode = mode || (variant === 'filled' ? 'flat' : 'outlined');
    
    // Extract only compatible props for PaperTextInput
    const {
      value,
      onChangeText,
      placeholder,
      multiline,
      secureTextEntry,
      autoCapitalize,
      autoCorrect,
      autoComplete,
      keyboardType,
      returnKeyType,
      onSubmitEditing,
      onFocus,
      onBlur,
      maxLength,
      editable,
    } = textInputProps;
    
    return (
      <PaperTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        label={label}
        error={!!error}
        disabled={disabled}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={maxLength}
        editable={editable}
        mode={inputMode}
        style={[styles.androidInput, style]}
        contentStyle={textStyle}
        theme={materialTheme}
        right={error ? <PaperTextInput.Icon icon="alert-circle" /> : undefined}
      />
    );
  }

  // Use iOS-style TextInput for iOS
  const getIOSInputStyle = () => {
    const baseStyle = [styles.iosInput];
    
    switch (variant) {
      case 'filled':
        return [
          ...baseStyle,
          {
            backgroundColor: colors.surfaceVariant || 'rgba(0,0,0,0.05)',
            borderWidth: 0,
          }
        ];
      case 'outlined':
      default:
        return [
          ...baseStyle,
          {
            backgroundColor: colors.surface || colors.background,
            borderWidth: 1,
            borderColor: error ? '#FF3B30' : colors.outline || 'rgba(0,0,0,0.12)',
          }
        ];
    }
  };

  return (
    <TextInput
      {...textInputProps}
      placeholderTextColor={colors.onSurfaceVariant || 'rgba(0,0,0,0.6)'}
      editable={!disabled}
      style={[
        getIOSInputStyle(),
        {
          color: colors.onSurface || colors.text,
        },
        textStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  androidInput: {
    marginVertical: 4,
  },
  iosInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
});
