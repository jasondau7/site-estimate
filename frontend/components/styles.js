import { StyleSheet } from 'react-native';

import theme from "../assets/themes/SiteEstimate_theme";
const lightColors = theme.schemes.light;
const themeColors = theme.palettes;


// Consistent color palette for the app
export const colors = {
  primary: themeColors.primary[70], 
  secondary: themeColors.secondary, 
  background: "#FFFF",
  card: '#FFFFFF',
  text: '#000000ff',
  inputText: '#4c4c4cff',
  textDark: '#000000ff',
  textSecondary: '#ffffffff',
  border: '#DDDDDD',
  error: '#D9534F',
  success: '#5CB85C',
};

// Global styles for consistent layout
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  headerDarkText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 15,
  },
  bodyText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  errorText: {
    color: colors.error,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    color: colors.success,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
});