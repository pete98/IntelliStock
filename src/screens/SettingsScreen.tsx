import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth0 } from 'react-native-auth0';
import { RootStackParamList } from '@/navigation/types';
import { useDocs } from '@/hooks/useInventory';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { theme } from '@/config/theme';
import {
  getInventoryServiceBaseUrl,
  getUserServiceBaseUrl,
  setInventoryServiceBaseUrl,
  setUserServiceBaseUrl,
  resetInventoryServiceBaseUrl,
  resetUserServiceBaseUrl,
} from '@/utils/storage';
import { updateApiClientBaseUrl } from '@/config/api';
import { clearAccessToken } from '@/utils/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [inventoryBaseUrl, setInventoryBaseUrl] = useState('');
  const [userBaseUrl, setUserBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, clearSession } = useAuth0();

  const { data: docs, isLoading: isLoadingDocs, error: docsError } = useDocs();

  useEffect(() => {
    loadBaseUrl();
  }, []);

  const loadBaseUrl = async () => {
    try {
      const [inventoryUrl, userUrl] = await Promise.all([
        getInventoryServiceBaseUrl(),
        getUserServiceBaseUrl(),
      ]);
      setInventoryBaseUrl(inventoryUrl);
      setUserBaseUrl(userUrl);
    } catch (error) {
      console.error('Failed to load base URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBaseUrl = async () => {
    try {
      await Promise.all([
        setInventoryServiceBaseUrl(inventoryBaseUrl),
        setUserServiceBaseUrl(userBaseUrl),
      ]);
      await Promise.all([
        updateApiClientBaseUrl('inventory'),
        updateApiClientBaseUrl('user'),
      ]);
      Alert.alert('Success', 'Service base URLs updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save base URL');
    }
  };

  const handleResetBaseUrl = async () => {
    try {
      await Promise.all([
        resetInventoryServiceBaseUrl(),
        resetUserServiceBaseUrl(),
      ]);
      const [defaultInventoryUrl, defaultUserUrl] = await Promise.all([
        getInventoryServiceBaseUrl(),
        getUserServiceBaseUrl(),
      ]);
      setInventoryBaseUrl(defaultInventoryUrl);
      setUserBaseUrl(defaultUserUrl);
      await Promise.all([
        updateApiClientBaseUrl('inventory'),
        updateApiClientBaseUrl('user'),
      ]);
      Alert.alert('Success', 'Service base URLs reset to default');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset base URL');
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await clearSession();
      await clearAccessToken();
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading settings..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountRow}>
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>{user?.name || 'Signed in user'}</Text>
              {!!user?.email && <Text style={styles.accountEmail}>{user.email}</Text>}
            </View>
            <TouchableOpacity
              style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Text style={styles.logoutButtonText}>
                {isLoggingOut ? 'Signing out...' : 'Log out'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Inventory Service Base URL</Text>
            <TextInput
              style={styles.input}
              value={inventoryBaseUrl}
              onChangeText={setInventoryBaseUrl}
              placeholder="http://localhost:8080"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helpText}>
              Used for inventory and store endpoints.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>User Service Base URL</Text>
            <TextInput
              style={styles.input}
              value={userBaseUrl}
              onChangeText={setUserBaseUrl}
              placeholder="http://localhost:8081"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helpText}>
              Used for user identity lookup endpoints.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveBaseUrl}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={handleResetBaseUrl}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentation</Text>
          
          {isLoadingDocs ? (
            <LoadingSpinner text="Loading documentation..." />
          ) : docsError ? (
            <ErrorView error={docsError} />
          ) : docs?.links && docs.links.length > 0 ? (
            <View style={styles.linksContainer}>
              {docs.links.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.linkItem}
                  onPress={() => handleOpenLink(link.url)}
                >
                  <Text style={styles.linkText}>{link.name}</Text>
                  <Text style={styles.linkUrl}>{link.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noLinksText}>No documentation links available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            IntelliStock v1.0.0{'\n'}
            Inventory Management App{'\n'}
            Built with Expo SDK 54
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  helpText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  resetButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  linksContainer: {
    gap: theme.spacing.sm,
  },
  linkItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  linkText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  linkUrl: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
  },
  noLinksText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  accountEmail: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
});
