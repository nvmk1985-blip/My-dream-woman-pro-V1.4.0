import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(Math.round(SCREEN_WIDTH * 0.88), 340);
const TILE_GAP = 10;
const TILE_WIDTH = (SCREEN_WIDTH - 32 - TILE_GAP * 2) / 3;
const TILE_HEIGHT = Math.max(120, Math.min(138, TILE_WIDTH * 1.25));
const DEFAULT_SERVER_URL = 'https://my-dream-woman-pro-v1-4-0.onrender.com';

type HomeAction = 'image' | 'group' | 'script' | 'swap' | 'cloud' | 'disabled';
type HomeTile = {
  key: string;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  action: HomeAction;
};

const TILES: HomeTile[] = [
  { key: 'text-image', label: 'Text to Image', subtitle: 'Create Images', icon: 'message-image', color: '#e43bff', action: 'image' },
  { key: 'characters', label: 'AI Characters', subtitle: 'Coming later', icon: 'account-outline', color: '#16d9ff', action: 'disabled' },
  { key: 'group-chat', label: 'Group Chat', subtitle: 'Chat Together', icon: 'account-group', color: '#2af580', action: 'group' },
  { key: 'image-script', label: 'Image to Script', subtitle: 'Create Prompts', icon: 'file-image-outline', color: '#ffc52d', action: 'script' },
  { key: 'face-swap', label: 'Face Swap', subtitle: 'Cloud', icon: 'swap-horizontal', color: '#e43bff', action: 'swap' },
  { key: 'cloud', label: 'Cloud', subtitle: 'Your Gallery', icon: 'cloud-outline', color: '#14cfff', action: 'cloud' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [serverStatus, setServerStatus] = useState<'unknown' | 'ok' | 'sleeping'>('unknown');
  const [wakingServer, setWakingServer] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.4.0';
  const buildNumber = Constants.expoConfig?.android?.versionCode;

  const checkServer = useCallback(async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const savedUrl = await AsyncStorage.getItem('custom_server_url').catch(() => null);
      const serverUrl = (savedUrl || DEFAULT_SERVER_URL).replace(/\/+$/, '');
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(serverUrl + '/api/healthz', { signal: controller.signal });
      setServerStatus(response.ok ? 'ok' : 'sleeping');
    } catch {
      setServerStatus('sleeping');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    void checkServer();
  }, [checkServer]);

  const wakeServer = async () => {
    if (wakingServer) return;
    setWakingServer(true);
    await checkServer();
    setWakingServer(false);
  };

  const openTile = (action: HomeAction) => {
    switch (action) {
      case 'image':
        router.push('/prompt-image' as any);
        return;
      case 'group':
        router.push({ pathname: '/ai-girls', params: { action: 'group' } } as any);
        return;
      case 'script':
        router.push({ pathname: '/ai-girls', params: { action: 'script' } } as any);
        return;
      case 'swap':
        router.push('/face-swap' as any);
        return;
      case 'cloud':
        router.push('/home' as any);
        return;
      case 'disabled':
        return;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar backgroundColor="#05091b" barStyle="light-content" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <View style={s.header}>
            <Image source={require('../assets/images/pro-app-icon.png')} style={s.logo} resizeMode="contain" />
            <View style={s.brand}>
              <Text style={s.brandTitle} numberOfLines={1}>
                My Dream Woman <Text style={s.brandPro}>Pro</Text>
              </Text>
              <Text style={s.brandSub} numberOfLines={1}>
                {'your dream companion · V' + version + (buildNumber ? ' (' + buildNumber + ')' : '')}
              </Text>
            </View>
            <TouchableOpacity
              style={s.settingsButton}
              onPress={() => router.push('/settings' as any)}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <MaterialCommunityIcons name="cog-outline" size={27} color="#f2f7ff" />
            </TouchableOpacity>
          </View>

          <View style={s.heroShadow}>
            <View style={[s.heroCard, { height: HERO_HEIGHT }]}>
              <Image
                source={require('../assets/images/home-hero.jpg')}
                style={s.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(4,8,26,0.02)', 'rgba(4,8,26,0.16)', 'rgba(4,8,26,0.96)']}
                locations={[0, 0.48, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={s.heroStatusRow}>
                <View style={s.onlinePill}>
                  <View style={s.onlineDot} />
                  <Text style={s.onlineText}>Online</Text>
                </View>
                <TouchableOpacity style={s.wakePill} onPress={wakeServer} disabled={wakingServer} accessibilityRole="button">
                  {wakingServer
                    ? <ActivityIndicator size="small" color="#d9f7ff" />
                    : <Text style={s.wakeText}>{serverStatus === 'ok' ? 'Ready' : 'Wake'}</Text>}
                </TouchableOpacity>
              </View>
              <View style={s.heroContent}>
                <Text style={s.heroTitle}>Your Dream.</Text>
                <Text style={s.heroScript}>Our Creation.</Text>
                <Text style={s.heroOverline}>CREATE  ·  CHAT  ·  EXPLORE</Text>
                <Text style={s.heroCaption}>Your perfect AI partner</Text>
                <TouchableOpacity
                  style={s.startButton}
                  onPress={() => router.push('/ai-girls' as any)}
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  accessibilityLabel="Start Chat"
                >
                  <LinearGradient colors={['#df28ff', '#7d42ff', '#078bff']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.startGradient}>
                    <MaterialCommunityIcons name="message-text" size={18} color="#fff" />
                    <Text style={s.startText} numberOfLines={1}>Start Chat</Text>
                    <MaterialCommunityIcons name="arrow-right" size={17} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={s.grid}>
            {TILES.map((tile) => {
              const disabled = tile.action === 'disabled';
              return (
                <TouchableOpacity
                  key={tile.key}
                  style={[s.tile, { width: TILE_WIDTH, height: TILE_HEIGHT, borderColor: tile.color, shadowColor: tile.color }, disabled && s.tileDisabled]}
                  onPress={() => openTile(tile.action)}
                  disabled={disabled}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityLabel={tile.label}
                  accessibilityState={{ disabled }}
                  accessibilityHint={disabled ? 'இந்த வசதி பின்னர் செயல்படுத்தப்படும்' : undefined}
                >
                  <View style={[s.tileIconRing, { borderColor: tile.color, shadowColor: tile.color }]}>
                    <MaterialCommunityIcons name={tile.icon} size={27} color={tile.color} />
                  </View>
                  <Text style={s.tileLabel} numberOfLines={1} adjustsFontSizeToFit>{tile.label}</Text>
                  <Text style={s.tileSubtitle} numberOfLines={1} adjustsFontSizeToFit>{tile.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05091b' },
  scroll: { paddingBottom: 18 },
  header: { minHeight: 62, paddingHorizontal: 16, paddingTop: 3, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 14 },
  brand: { flex: 1, minWidth: 0 },
  brandTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.1 },
  brandPro: { color: '#ed45ff' },
  brandSub: { color: '#a6c8f2', fontSize: 11, marginTop: 2 },
  settingsButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(185,214,255,0.25)', backgroundColor: 'rgba(255,255,255,0.05)' },
  heroShadow: { marginHorizontal: 14, borderRadius: 25, shadowColor: '#18aaff', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  heroCard: { position: 'relative', borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#31dfff', backgroundColor: '#09142b' },
  heroImage: { position: 'absolute', left: 0, top: 0, width: '63%', height: '100%' },
  heroStatusRow: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlinePill: { minHeight: 32, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#1af0b2', backgroundColor: 'rgba(5,31,37,0.88)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#20f4b5' },
  onlineText: { color: '#d9fff4', fontSize: 11, fontWeight: '700' },
  wakePill: { minWidth: 57, minHeight: 32, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#5baaff', backgroundColor: 'rgba(7,24,47,0.9)', justifyContent: 'center', alignItems: 'center' },
  wakeText: { color: '#e6f2ff', fontSize: 11, fontWeight: '700' },
  heroContent: { position: 'absolute', right: 11, bottom: 15, width: '45%', alignItems: 'flex-end' },
  heroTitle: { color: '#fff', fontSize: 20, lineHeight: 24, fontWeight: '800', textAlign: 'right', textShadowColor: '#fa48dd', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
  heroScript: { color: '#65e7ff', fontSize: 17, lineHeight: 21, fontWeight: '700', fontStyle: 'italic', textAlign: 'right', textShadowColor: '#2d78ff', textShadowRadius: 9, textShadowOffset: { width: 0, height: 0 } },
  heroOverline: { marginTop: 13, color: '#f2eaff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3, textAlign: 'right' },
  heroCaption: { marginTop: 3, marginBottom: 11, color: '#b8d9ff', fontSize: 10, textAlign: 'right' },
  startButton: { width: '100%', borderRadius: 20, overflow: 'hidden', shadowColor: '#d82aff', shadowOpacity: 0.55, shadowRadius: 11, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  startGradient: { minHeight: 42, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  startText: { color: '#fff', fontSize: 12, fontWeight: '800', flexShrink: 1 },
  grid: { marginHorizontal: 16, marginTop: 17, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: TILE_GAP },
  tile: { borderRadius: 18, borderWidth: 1.5, backgroundColor: '#080d20', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, paddingVertical: 10, shadowOpacity: 0.32, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  tileDisabled: { opacity: 0.43, shadowOpacity: 0.08, elevation: 1 },
  tileIconRing: { width: 53, height: 53, borderRadius: 27, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 7, shadowOpacity: 0.34, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
  tileLabel: { color: '#fff', fontSize: 11.5, lineHeight: 15, fontWeight: '700', textAlign: 'center', width: '100%' },
  tileSubtitle: { color: '#a8d8ff', fontSize: 10, lineHeight: 13, textAlign: 'center', marginTop: 2, width: '100%' },
});
