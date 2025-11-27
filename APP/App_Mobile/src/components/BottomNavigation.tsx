import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Home, Smartphone, Settings } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../utils/colors';
import { BottomNavigationProps } from '../types';

const { width } = Dimensions.get('window');

const navItems = [
  {
    icon: 'Home',
    label: "Início",
    path: "Home",
  },
  {
    icon: 'Smartphone',
    label: "Dispositivos",
    path: "Devices",
  },
  {
    icon: 'Settings',
    label: "Configurações",
    path: "Settings",
  },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentRoute = 'Home',
  onNavigate 
}) => {
  const navigation = useNavigation();
  
  const getIcon = (iconName: string, isActive: boolean) => {
    const iconProps = {
      size: 20,
      color: isActive ? colors.water.primary : colors.mutedForeground,
    };

    switch (iconName) {
      case 'Home':
        return <Home {...iconProps} />;
      case 'Smartphone':
        return <Smartphone {...iconProps} />;
      case 'Settings':
        return <Settings {...iconProps} />;
      default:
        return <Home {...iconProps} />;
    }
  };

  const handlePress = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Usar navegação direta quando onNavigate não for fornecido
      navigation.navigate(path as never);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {navItems.map((item) => {
          const isActive = currentRoute === item.path;
          return (
            <TouchableOpacity
              key={item.path}
              style={[
                styles.navItem,
                isActive && styles.activeNavItem,
              ]}
              onPress={() => handlePress(item.path)}
              activeOpacity={0.7}
            >
              {getIcon(item.icon, isActive)}
              <Text style={[
                styles.label,
                isActive && styles.activeLabel,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: 20, // Espaço para safe area
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: width,
    alignSelf: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    minWidth: 0, // Permite compressão adequada
  },
  activeNavItem: {
    backgroundColor: `${colors.water.primary}10`,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.mutedForeground,
    textAlign: 'center',
    maxWidth: '100%',
  },
  activeLabel: {
    color: colors.water.primary,
  },
});
