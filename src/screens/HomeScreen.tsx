import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import styled from 'styled-components/native';

import { RootStackParamList } from '@/navigation/types';
import { theme } from '@/config/theme';

interface HomeScreenProps {}

interface HomeColors {
  background: string;
  text: string;
  buttonBackground: string;
  buttonText: string;
  buttonMutedText: string;
  buttonBorder: string;
  subtitle: string;
  heroBackground: string;
  heroBorder: string;
  heroSubtext: string;
}

interface HomeAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
  isReady?: boolean;
}

interface NavigationProp extends NativeStackNavigationProp<RootStackParamList, 'Home'> {}

function getHomeColors(colorScheme: 'light' | 'dark' | null | undefined): HomeColors {
  if (colorScheme === 'dark') {
    return {
      background: '#0b0b0b',
      text: '#ffffff',
      subtitle: 'rgba(255, 255, 255, 0.72)',
      buttonBackground: '#ffffff',
      buttonText: '#0b0b0b',
      buttonMutedText: 'rgba(11, 11, 11, 0.65)',
      buttonBorder: 'rgba(11, 11, 11, 0.08)',
      heroBackground: '#ffffff',
      heroBorder: 'rgba(11, 11, 11, 0.08)',
      heroSubtext: 'rgba(11, 11, 11, 0.7)',
    };
  }

  return {
    background: '#ffffff',
    text: '#0b0b0b',
    subtitle: 'rgba(11, 11, 11, 0.68)',
    buttonBackground: '#ffffff',
    buttonText: '#0b0b0b',
    buttonMutedText: 'rgba(11, 11, 11, 0.55)',
    buttonBorder: 'rgba(11, 11, 11, 0.08)',
    heroBackground: '#ffffff',
    heroBorder: 'rgba(11, 11, 11, 0.08)',
    heroSubtext: 'rgba(11, 11, 11, 0.7)',
  };
}

function getHomeActions(): HomeAction[] {
  return [
    {
      key: 'inventory',
      label: 'My Inventory',
      icon: 'cube-outline',
      route: 'InventoryList',
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: 'receipt-outline',
      isReady: false,
    },
    {
      key: 'scan',
      label: 'Scan',
      icon: 'scan-outline',
      route: 'BarcodeScanner',
      params: { source: 'list' },
    },
    {
      key: 'pricing',
      label: 'Pricing',
      icon: 'pricetag-outline',
      isReady: false,
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'stats-chart-outline',
      isReady: false,
    },
    {
      key: 'master-inventory',
      label: 'Master Inventory',
      icon: 'layers-outline',
      route: 'MasterInventory',
    },
    {
      key: 'tasks',
      label: 'Promos',
      icon: 'sparkles-outline',
      isReady: false,
    },
    {
      key: 'settings',
      label: 'User',
      icon: 'person-circle-outline',
      route: 'Settings',
    },
  ];
}

function getColumnCount(containerWidth: number, gap: number) {
  const minTileWidth = 150;
  for (const columns of [4, 3, 2, 1]) {
    if (getCardWidth(containerWidth, columns, gap) >= minTileWidth) return columns;
  }
  return 1;
}

function getCardWidth(containerWidth: number, columns: number, gap: number) {
  if (columns <= 1) return containerWidth;
  return Math.floor((containerWidth - gap * (columns - 1)) / columns);
}

function getGridItemMargins(index: number, columns: number, gap: number) {
  const isEndOfRow = (index + 1) % columns === 0;
  return {
    marginRight: columns === 1 || isEndOfRow ? 0 : gap,
    marginBottom: gap,
  };
}

export function HomeScreen(_props: HomeScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const colors = getHomeColors(colorScheme);
  const horizontalPadding = theme.spacing.lg;
  const contentWidth = Math.min(720, Math.max(0, width - horizontalPadding * 2));
  const actions = getHomeActions();
  const gap = theme.spacing.md;
  const columns = getColumnCount(contentWidth, gap);
  const cardWidth = getCardWidth(contentWidth, columns, gap);

  function handleActionPress(action: HomeAction) {
    const isReady = action.isReady ?? Boolean(action.route);
    if (!isReady) {
      Toast.show({
        type: 'info',
        text1: `${action.label} is coming soon`,
        text2: 'Skeleton button only for now.',
      });
      return;
    }
    if (!action.route) return;
    if (action.params) {
      (navigation.navigate as unknown as (screen: string, params: unknown) => void)(
        action.route,
        action.params
      );
      return;
    }
    (navigation.navigate as unknown as (screen: string) => void)(action.route);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScreenContainer style={{ backgroundColor: colors.background }}>
        <ScrollArea
          contentContainerStyle={{
            alignItems: 'center',
            paddingHorizontal: horizontalPadding,
            paddingBottom: theme.spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Header style={{ width: contentWidth }}>
            <Title style={{ color: colors.text }}>Dashboard</Title>
            <Subtitle style={{ color: colors.subtitle }}>
              Manage inventory, orders, pricing, and operations.
            </Subtitle>
          </Header>
          <HeroCard
            style={[
              { width: contentWidth, backgroundColor: colors.heroBackground, borderColor: colors.heroBorder },
              theme.shadows.sm,
            ]}
          >
            <HeroLeft>
              <HeroTitle style={{ color: colors.text }}>Live Orders</HeroTitle>
              <HeroCount style={{ color: colors.text }}>3 active</HeroCount>
              <HeroMeta style={{ color: colors.heroSubtext }}>Next pickup in 12 min</HeroMeta>
            </HeroLeft>
            <HeroButton
              accessibilityRole="button"
              accessibilityLabel="Review live orders"
              onPress={() => (navigation.navigate as unknown as (screen: string) => void)('LiveOrders')}
            >
              <HeroButtonText>Review</HeroButtonText>
            </HeroButton>
          </HeroCard>
          <GridWrap style={{ width: contentWidth }}>
            {actions.map((action, index) => {
              const isReady = action.isReady ?? Boolean(action.route);
              const margins = getGridItemMargins(index, columns, gap);
              return (
                <ActionButton
                  key={action.key}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  accessibilityHint={isReady ? 'Opens this section' : 'Coming soon'}
                  onPress={() => handleActionPress(action)}
                  style={(state: { pressed: boolean }) => [
                    {
                      width: cardWidth,
                      backgroundColor: colors.buttonBackground,
                      borderColor: colors.buttonBorder,
                      borderWidth: isDark ? 1 : 0.5,
                      opacity: state.pressed ? 0.9 : 1,
                    },
                    margins,
                    theme.shadows.sm,
                  ]}
                >
                  <Ionicons name={action.icon} size={20} color={colors.buttonText} />
                  <ActionLabel style={{ color: colors.buttonText }}>{action.label}</ActionLabel>
                  {!isReady && (
                    <ActionMeta style={{ color: colors.buttonMutedText }}>Coming soon</ActionMeta>
                  )}
                </ActionButton>
              );
            })}
          </GridWrap>
        </ScrollArea>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const ScreenContainer = styled(View)`
  flex: 1;
`;

const ScrollArea = styled(ScrollView)`
  flex: 1;
`;

const Header = styled(View)`
  padding-top: ${theme.spacing.lg}px;
  padding-bottom: ${theme.spacing.lg}px;
`;

const Title = styled(Text)`
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 6px;
`;

const Subtitle = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  font-weight: ${theme.typography.body.fontWeight};
  line-height: 22px;
`;

const GridWrap = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  padding-bottom: ${theme.spacing.xl}px;
`;

const HeroCard = styled(View)`
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  padding: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.lg}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.lg}px;
`;

const HeroLeft = styled(View)`
  flex: 1;
`;

const HeroTitle = styled(Text)`
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
`;

const HeroCount = styled(Text)`
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
`;

const HeroMeta = styled(Text)`
  font-size: 13px;
  font-weight: 600;
`;

const HeroButton = styled(Pressable)`
  background-color: #0b0b0b;
  padding-vertical: 10px;
  padding-horizontal: ${theme.spacing.lg}px;
  border-radius: 999px;
`;

const HeroButtonText = styled(Text)`
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const ActionButton = styled(Pressable)`
  border-radius: ${theme.borderRadius.lg}px;
  padding-vertical: ${theme.spacing.lg}px;
  padding-horizontal: ${theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  min-height: 104px;
`;

const ActionLabel = styled(Text)`
  margin-top: ${theme.spacing.sm}px;
  font-size: 16px;
  font-weight: 700;
`;

const ActionMeta = styled(Text)`
  margin-top: 6px;
  font-size: ${theme.typography.small.fontSize}px;
  font-weight: 600;
`;
