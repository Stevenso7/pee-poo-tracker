import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import LogRecordScreen from './src/screens/LogRecordScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AIHistoryScreen from './src/screens/AIHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RecordDetailScreen from './src/screens/RecordDetailScreen';
import { theme } from './src/theme';

export type Screen =
  | { name: 'home' }
  | { name: 'log'; type: 'PEE' | 'POO' }
  | { name: 'history' }
  | { name: 'aiHistory' }
  | { name: 'detail'; id: string }
  | { name: 'settings' };

function MainNavigator() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  const navigate = (next: Screen) => setScreen(next);

  switch (screen.name) {
    case 'log':
      return <LogRecordScreen type={screen.type} navigate={navigate} />;
    case 'history':
      return <HistoryScreen navigate={navigate} />;
    case 'aiHistory':
      return <AIHistoryScreen navigate={navigate} />;
    case 'detail':
      return <RecordDetailScreen id={screen.id} navigate={navigate} />;
    case 'settings':
      return <SettingsScreen navigate={navigate} />;
    case 'home':
    default:
      return <HomeScreen navigate={navigate} />;
  }
}

function Root() {
  const { session, loading, recovering } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!session || recovering) {
    return <AuthScreen />;
  }

  return <MainNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
