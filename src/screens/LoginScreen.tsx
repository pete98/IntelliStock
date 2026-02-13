import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useAuth0 } from 'react-native-auth0';

import { auth0Config } from '@/config/auth0';
import { theme } from '@/config/theme';
import { setAccessToken } from '@/utils/auth';

interface LoginColors {
  background: string;
  panel: string;
  text: string;
  muted: string;
  border: string;
  button: string;
  buttonText: string;
  pillBackground: string;
  pillText: string;
}

function getLoginColors(colorScheme: 'light' | 'dark' | null | undefined): LoginColors {
  if (colorScheme === 'dark') {
    return {
      background: '#050505',
      panel: '#111827',
      text: '#f9fafb',
      muted: 'rgba(249, 250, 251, 0.72)',
      border: 'rgba(148, 163, 184, 0.2)',
      button: '#f9fafb',
      buttonText: '#0b0b0b',
      pillBackground: 'rgba(248, 250, 252, 0.1)',
      pillText: '#e2e8f0',
    };
  }

  return {
    background: '#f8fafc',
    panel: '#ffffff',
    text: '#0f172a',
    muted: 'rgba(15, 23, 42, 0.62)',
    border: 'rgba(148, 163, 184, 0.3)',
    button: '#0f172a',
    buttonText: '#ffffff',
    pillBackground: 'rgba(15, 23, 42, 0.06)',
    pillText: '#0f172a',
  };
}

export function LoginScreen() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const colors = useMemo(() => getLoginColors(colorScheme), [colorScheme]);
  const { authorize, getCredentials, hasValidCredentials, isLoading, error } = useAuth0();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [canUnlock, setCanUnlock] = useState<boolean | null>(null);

  const cardWidth = Math.min(width - theme.spacing.xl * 2, 420);
  const isBusy = isSubmitting || isUnlocking || isLoading;

  useEffect(() => {
    let isMounted = true;

    async function checkUnlock() {
      try {
        const hasCredentials = await hasValidCredentials();
        if (isMounted) setCanUnlock(hasCredentials);
      } catch (unlockError) {
        console.warn('Failed to check stored credentials:', unlockError);
        if (isMounted) setCanUnlock(false);
      }
    }

    checkUnlock();

    return () => {
      isMounted = false;
    };
  }, [hasValidCredentials]);

  const handleLogin = async () => {
    if (!auth0Config.domain || !auth0Config.clientId) {
      setAuthError('Auth0 configuration is missing.');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    try {
      await authorize({
        audience: auth0Config.audience,
        scope: 'openid profile email offline_access',
      });
      const credentials = await getCredentials();

      if (credentials?.accessToken) {
        await setAccessToken(credentials.accessToken);
      }
    } catch (loginError) {
      console.warn('Auth0 login failed:', loginError);
      setAuthError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async () => {
    if (canUnlock === false) {
      setAuthError('No saved session yet. Please sign in first.');
      return;
    }

    setAuthError(null);
    setIsUnlocking(true);

    try {
      const credentials = await getCredentials();
      if (credentials?.accessToken) await setAccessToken(credentials.accessToken);
    } catch (unlockError) {
      console.warn('Auth0 unlock failed:', unlockError);
      setAuthError('Unlock failed. Please sign in.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Screen background={colors.background} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Content>
          <Header>
            <Title style={{ color: colors.text }}>IntelliStock</Title>
            <Subtitle style={{ color: colors.muted }}>
              Inventory clarity for fast-moving teams.
            </Subtitle>
          </Header>

          <PillRow>
            <Pill style={{ backgroundColor: colors.pillBackground }}>
              <PillText style={{ color: colors.pillText }}>Live stock</PillText>
            </Pill>
            <Pill style={{ backgroundColor: colors.pillBackground }}>
              <PillText style={{ color: colors.pillText }}>Barcode ready</PillText>
            </Pill>
            <Pill style={{ backgroundColor: colors.pillBackground }}>
              <PillText style={{ color: colors.pillText }}>Approval flow</PillText>
            </Pill>
          </PillRow>

          <Card
            style={{
              width: cardWidth,
              backgroundColor: colors.panel,
              borderColor: colors.border,
            }}
          >
            <CardTitle style={{ color: colors.text }}>
              Sign in to continue
            </CardTitle>
            <CardSubtitle style={{ color: colors.muted }}>
              Use your Auth0 account to access inventory, orders, and analytics.
            </CardSubtitle>

            {!!(authError || error) && (
              <ErrorText style={{ color: colors.muted }}>
                {authError || error?.message}
              </ErrorText>
            )}

            <Pressable
              onPress={handleUnlock}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Unlock with Face ID"
              style={({ pressed }) => [
                {
                  opacity: pressed || isBusy ? 0.8 : 1,
                },
              ]}
            >
              <SecondaryButton style={{ borderColor: colors.border }}>
                {isUnlocking ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <SecondaryButtonText style={{ color: colors.text }}>
                    Unlock with Face ID
                  </SecondaryButtonText>
                )}
              </SecondaryButton>
            </Pressable>

            {canUnlock === false && (
              <HelperText style={{ color: colors.muted }}>
                Sign in once to enable Face ID unlock.
              </HelperText>
            )}

            <Pressable
              onPress={handleLogin}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Auth0"
              style={({ pressed }) => [
                {
                  opacity: pressed || isBusy ? 0.8 : 1,
                },
              ]}
            >
              <PrimaryButton style={{ backgroundColor: colors.button }}>
                {isBusy ? (
                  <ActivityIndicator color={colors.buttonText} />
                ) : (
                  <PrimaryButtonText style={{ color: colors.buttonText }}>
                    Sign in with Auth0
                  </PrimaryButtonText>
                )}
              </PrimaryButton>
            </Pressable>

            <FooterText style={{ color: colors.muted }}>
              Secure login powered by Auth0.
            </FooterText>
          </Card>
        </Content>
      </ScrollView>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)<{ background: string }>`
  flex: 1;
  background-color: ${(props: { background: string }) => props.background};
`;

const Content = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
  gap: ${theme.spacing.xl}px;
`;

const Header = styled(View)`
  align-items: center;
  gap: ${theme.spacing.sm}px;
`;

const Title = styled(Text)`
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.4px;
`;

const Subtitle = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  text-align: center;
  max-width: 320px;
`;

const PillRow = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm}px;
  justify-content: center;
`;

const Pill = styled(View)`
  padding: 6px 12px;
  border-radius: ${theme.borderRadius.xl}px;
`;

const PillText = styled(Text)`
  font-size: ${theme.typography.small.fontSize}px;
  font-weight: 600;
`;

const Card = styled(View)`
  border-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.lg}px;
  border-width: 1px;
  gap: ${theme.spacing.md}px;
`;

const CardTitle = styled(Text)`
  font-size: ${theme.typography.h2.fontSize}px;
  font-weight: ${theme.typography.h2.fontWeight};
`;

const CardSubtitle = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
`;

const ErrorText = styled(Text)`
  font-size: ${theme.typography.small.fontSize}px;
`;

const PrimaryButton = styled(View)`
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.md}px;
  align-items: center;
  justify-content: center;
  min-height: 48px;
`;

const PrimaryButtonText = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  font-weight: 600;
`;

const SecondaryButton = styled(View)`
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.md}px;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-width: 1px;
`;

const SecondaryButtonText = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  font-weight: 600;
`;

const HelperText = styled(Text)`
  font-size: ${theme.typography.small.fontSize}px;
  text-align: center;
`;

const FooterText = styled(Text)`
  font-size: ${theme.typography.small.fontSize}px;
  text-align: center;
`;
