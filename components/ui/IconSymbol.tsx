// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'heart.fill': 'favorite',
  'magnifyingglass': 'search',
  'calendar': 'calendar-today',
  'person.fill': 'person',
  'gearshape.fill': 'settings',
  'ellipsis': 'more-vert',
  'plus': 'add',
  'trash': 'delete',
  'star.fill': 'star',
  'star.slash.fill': 'star-outline',
  'checkmark': 'check',
  'xmark': 'close',
  'arrow.right': 'arrow-forward',
  'arrow.left': 'arrow-back',
  'arrow.up': 'arrow-upward',
  'video.fill': 'video-library',
  'binoculars.fill': 'search',
  // Show status icons
  'tv.fill': 'tv',
  'play.circle.fill': 'play-circle-filled',
  'clock.fill': 'schedule',
  'flag.checkered.fill': 'flag',
  'question.circle.fill': 'help',
  'film.fill': 'movie',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
