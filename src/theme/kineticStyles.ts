import { StyleSheet } from 'react-native';
import { ThemeColors } from './colors';

export const createKineticStyles = (k: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: k.bg },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: k.bg },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115, gap: 16 },

    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowAlign: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    // Editorial Headers & Pills
    intelPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: k.surfaceHigh,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    intelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: k.cyan },
    intelPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.4, color: k.cyan, textTransform: 'uppercase' },
    mainHeadline: {
      fontSize: 28,
      fontWeight: '900',
      fontStyle: 'italic',
      letterSpacing: -0.8,
      color: k.textMain,
      textTransform: 'uppercase',
    },
    kickerLime: { fontSize: 10, fontWeight: '900', color: k.lime, letterSpacing: 1.3, textTransform: 'uppercase' },
    kickerCyan: { fontSize: 9, fontWeight: '900', color: k.cyan, letterSpacing: 1.4, textTransform: 'uppercase' },
    kickerMuted: { fontSize: 10, fontWeight: '900', color: k.textMuted, letterSpacing: 1.1, textTransform: 'uppercase' },

    // Cards & Notches
    card: {
      backgroundColor: k.surfaceHigh,
      borderRadius: 20,
      padding: 18,
      position: 'relative',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 12,
      elevation: 4,
    },
    surfaceCard: {
      backgroundColor: k.surface,
      borderRadius: 16,
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    leftNotch: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: k.cyan,
    },
    cardTitleItalic: {
      fontSize: 22,
      fontWeight: '900',
      fontStyle: 'italic',
      color: k.textMain,
      textTransform: 'uppercase',
    },
    bodyMuted: { fontSize: 12, color: k.textMuted, lineHeight: 18 },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(72,72,71,0.25)' : k.outline,
      marginVertical: 14,
    },

    // Inputs
    kineticInput: {
      backgroundColor: k.surfaceLowest,
      color: k.textMain,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      fontSize: 15,
      fontWeight: '700',
      borderWidth: 1,
      borderColor: k.outline,
    },

    // Bottom Sheet Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
    sheetContent: {
      backgroundColor: k.surfaceHigh,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 36,
      maxHeight: '92%',
    },
    dragHandle: {
      width: 42,
      height: 5,
      backgroundColor: k.outline,
      borderRadius: 3,
      alignSelf: 'center',
      marginBottom: 14,
    },
    sheetTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', color: k.textMain, textTransform: 'uppercase' },
  });