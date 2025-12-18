import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { colors } from './styles';

/**
 * A reusable, styled TextInput component for forms.
 */
export default function StyledTextInput({ style, ...props }) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={colors.inputText}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.inputText,
    marginBottom: 12,
  },
});