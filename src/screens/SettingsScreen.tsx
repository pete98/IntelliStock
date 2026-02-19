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
  useWindowDimensions,
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';

import { useDocs } from '@/hooks/useInventory';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
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
import { getResponsiveLayout } from '@/utils/layout';

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const responsiveLayout = getResponsiveLayout(width);
  const isTabletGrid = width >= 980;

  const [inventoryBaseUrl, setInventoryBaseUrl] = useState('');
  const [userBaseUrl, setUserBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, clearSession } = useAuth0();

  const { data: docs, isLoading: isLoadingDocs, error: docsError } = useDocs();

  useEffect(() => {
    void loadBaseUrl();
  }, []);

  async function loadBaseUrl() {
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
  }

  async function handleSaveBaseUrl() {
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
    } catch {
      Alert.alert('Error', 'Failed to save base URL');
    }
  }

  async function handleResetBaseUrl() {
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
    } catch {
      Alert.alert('Error', 'Failed to reset base URL');
    }
  }

  async function handleOpenLink(url: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Error', 'Cannot open this URL');
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open URL');
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await clearSession();
      await clearAccessToken();
    } catch {
      Alert.alert('Error', 'Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) return <LoadingSpinner text="Loading settings..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: responsiveLayout.horizontalPadding,
        paddingTop: 20,
        paddingBottom: 40,
      }}
    >
      <View style={{ width: responsiveLayout.contentWidth }}>
        <View style={styles.header}>
          <Text style={styles.title}>User Settings</Text>
          <Text style={styles.subtitle}>Manage account access, service endpoints, and docs.</Text>
        </View>

        <View style={[styles.grid, isTabletGrid && styles.gridTablet]}>
          <View style={[styles.column, isTabletGrid && styles.columnTablet]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.accountRow}>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName}>{user?.name || 'Signed in user'}</Text>
                  {!!user?.email ? <Text style={styles.accountEmail}>{user.email}</Text> : null}
                </View>
                <TouchableOpacity
                  style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                  accessibilityRole="button"
                  accessibilityLabel="Log out"
                >
                  <Text style={styles.logoutButtonText}>{isLoggingOut ? 'Signing out...' : 'Log out'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>
                IntelliStock v1.0.0{`\n`}
                Inventory Management App{`\n`}
                Built with Expo SDK 54
              </Text>
            </View>
          </View>

          <View style={[styles.column, isTabletGrid && styles.columnTablet]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>API Configuration</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Inventory Service Base URL</Text>
                <TextInput
                  style={styles.input}
                  value={inventoryBaseUrl}
                  onChangeText={setInventoryBaseUrl}
                  placeholder="https://8816-2600-4041-41f3-f300-d954-a29a-e130-5fb0.ngrok-free.app"
                  placeholderTextColor="rgba(11, 11, 11, 0.45)"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.helpText}>Used for inventory and store endpoints.</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>User Service Base URL</Text>
                <TextInput
                  style={styles.input}
                  value={userBaseUrl}
                  onChangeText={setUserBaseUrl}
                  placeholder="https://8816-2600-4041-41f3-f300-d954-a29a-e130-5fb0.ngrok-free.app"
                  placeholderTextColor="rgba(11, 11, 11, 0.45)"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.helpText}>Used for user identity lookup endpoints.</Text>
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
                    <TouchableOpacity key={index} style={styles.linkItem} onPress={() => handleOpenLink(link.url)}>
                      <Text style={styles.linkText}>{link.name}</Text>
                      <Text style={styles.linkUrl}>{link.url}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noLinksText}>No documentation links available</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0b0b0b',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: 'rgba(11, 11, 11, 0.62)',
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
  },
  gridTablet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  column: {
    width: '100%',
    gap: 12,
  },
  columnTablet: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b0b0b',
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b0b0b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#ffffff',
    color: '#0b0b0b',
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.58)',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#0b0b0b',
    fontSize: 14,
    fontWeight: '700',
  },
  linksContainer: {
    gap: 8,
  },
  linkItem: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.1)',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b0b0b',
    marginBottom: 3,
  },
  linkUrl: {
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.6)',
  },
  noLinksText: {
    fontSize: 14,
    color: 'rgba(11, 11, 11, 0.55)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: 14,
    color: 'rgba(11, 11, 11, 0.65)',
    lineHeight: 22,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b0b0b',
  },
  accountEmail: {
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.58)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#0b0b0b',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
