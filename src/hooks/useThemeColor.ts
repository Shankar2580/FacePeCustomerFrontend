/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import Colors from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Return primary color as fallback since we don't have theme structure
    return Colors.primary;
  }
}
