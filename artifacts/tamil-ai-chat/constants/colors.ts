const palette = {
  // Surfaces
  bgPrimary: '#080B0D',
  bgSecondary: '#0C1215',
  bgTertiary: '#111A1E',
  bgElevated: '#162126',
  bgDeep: '#050708',
  leatherBlack: '#101416',
  leatherCharcoal: '#1A2022',
  panelDark: '#0D171B',
  card: '#11191C',
  cardSecondary: '#172226',
  cardElevated: '#1B292E',

  // Royal gold
  goldPrimary: '#D4AF6A',
  goldBright: '#F4D58D',
  goldLight: '#FFE8B0',
  goldDark: '#9B773A',
  goldDeep: '#705327',
  goldBorder: '#B89555',
  goldMuted: '#8D774E',
  goldGlow: 'rgba(212, 175, 106, 0.24)',

  // Sky blue and cyan
  cyanPrimary: '#55DDF5',
  cyanBright: '#80EEFF',
  cyanLight: '#B6F5FF',
  cyanDark: '#168FA8',
  skyBlue: '#63BFF2',
  cyanBorder: '#278EA3',
  cyanGlow: 'rgba(85, 221, 245, 0.24)',
  cyanSoft: 'rgba(85, 221, 245, 0.10)',

  // Text
  textPrimary: '#F5F1E8',
  textSecondary: '#C8D0D1',
  textTertiary: '#96A5A8',
  textMuted: '#718084',
  textDisabled: '#505B5E',
  textGold: '#F4D58D',
  textCyan: '#80EEFF',
  textOnGold: '#15120B',
  textOnCyan: '#061014',

  // Borders and glass
  border: '#29373B',
  borderSubtle: '#1C292D',
  borderGold: '#B89555',
  borderCyan: '#278EA3',
  glassBackground: 'rgba(17, 26, 30, 0.88)',
  glassGoldBorder: 'rgba(212, 175, 106, 0.42)',
  glassCyanBorder: 'rgba(85, 221, 245, 0.32)',
  overlay: 'rgba(0, 0, 0, 0.76)',

  // Buttons
  buttonGold: '#D4AF6A',
  buttonGoldHover: '#F4D58D',
  buttonGoldPressed: '#B89555',
  buttonGoldText: '#15120B',
  buttonCyan: '#55DDF5',
  buttonCyanHover: '#80EEFF',
  buttonCyanPressed: '#168FA8',
  buttonCyanText: '#061014',
  buttonSecondary: '#172226',
  buttonSecondaryHover: '#223237',
  buttonSecondaryText: '#F5F1E8',
  buttonDisabled: '#293034',

  // Inputs and forms
  inputBackground: '#0B1215',
  inputBorder: '#35464B',
  inputFocus: '#55DDF5',
  inputText: '#F5F1E8',
  inputPlaceholder: '#829196',
  inputLabel: '#C8D0D1',

  // Chat
  chatBackground: '#080D10',
  chatUserBubble: '#153D46',
  chatUserText: '#F5FCFF',
  chatAiBubble: '#172126',
  chatAiText: '#F5F1E8',
  chatDivider: '#29373B',
  chatTimestamp: '#96A5A8',
  chatOnline: '#55DDF5',

  // Status
  success: '#55D6A0',
  warning: '#F2C66D',
  error: '#FF7D86',
  info: '#63BFF2',
} as const;

const paletteWithCompatibilityAliases = {
  ...palette,
  // Keep the existing hook API stable while screens migrate by phase.
  text: palette.textPrimary,
  tint: palette.cyanPrimary,
  background: palette.bgPrimary,
  foreground: palette.textPrimary,
  cardForeground: palette.textPrimary,
  primary: palette.goldPrimary,
  primaryForeground: palette.textOnGold,
  secondary: palette.buttonSecondary,
  secondaryForeground: palette.buttonSecondaryText,
  muted: palette.leatherCharcoal,
  mutedForeground: palette.textTertiary,
  accent: palette.cyanPrimary,
  accentForeground: palette.textOnCyan,
  destructive: palette.error,
  destructiveForeground: palette.textPrimary,
  input: palette.inputBorder,
} as const;

const colors = {
  // This product uses one fixed dark luxury palette in either system scheme.
  light: paletteWithCompatibilityAliases,
  dark: paletteWithCompatibilityAliases,
  radius: 10,
  spacing: {
    space1: 4,
    space2: 8,
    space3: 12,
    space4: 16,
    space5: 20,
    space6: 24,
    space8: 32,
  },
  typography: {
    // Inter is already loaded by app/_layout.tsx. Leave Tamil glyphs to the
    // platform fallback when Inter does not provide a glyph.
    fontFamily: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
      decorativeSerif: 'serif',
      mono: 'monospace',
    },
    fontSize: {
      pageTitle: 26,
      sectionHeading: 20,
      cardTitle: 17,
      body: 15,
      supporting: 13,
      button: 15,
      metadata: 12,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      pageTitle: 36,
      sectionHeading: 28,
      cardTitle: 24,
      body: 22,
      supporting: 19,
      button: 21,
      metadata: 17,
    },
  },
  gradients: {
    royalGold: ['#8D6A32', '#D4AF6A', '#FFE8B0', '#B89555'],
    skyBlueNeon: ['#168FA8', '#55DDF5', '#B6F5FF'],
    premiumDarkGlass: [
      'rgba(28, 41, 46, 0.96)',
      'rgba(8, 11, 13, 0.96)',
    ],
  },
  effects: {
    goldGlow: {
      shadowColor: palette.goldPrimary,
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 3,
    },
    cyanGlow: {
      shadowColor: palette.cyanPrimary,
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 },
      elevation: 4,
    },
  },
} as const;

export default colors;
