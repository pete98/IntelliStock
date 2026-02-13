export interface ResponsiveLayout {
  isTablet: boolean;
  isLargeTablet: boolean;
  horizontalPadding: number;
  contentWidth: number;
}

export function getResponsiveLayout(screenWidth: number): ResponsiveLayout {
  const isTablet = screenWidth >= 768;
  const isLargeTablet = screenWidth >= 1024;
  const horizontalPadding = isLargeTablet ? 40 : isTablet ? 28 : 20;
  const maxContentWidth = isLargeTablet ? 1120 : isTablet ? 920 : screenWidth;
  const contentWidth = Math.max(0, Math.min(maxContentWidth, screenWidth - horizontalPadding * 2));

  return {
    isTablet,
    isLargeTablet,
    horizontalPadding,
    contentWidth,
  };
}
