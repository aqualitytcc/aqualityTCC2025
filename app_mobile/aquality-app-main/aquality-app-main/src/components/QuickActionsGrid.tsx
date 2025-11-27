import React from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { QuickActionsGridProps } from '../types';
import { Settings } from 'lucide-react-native';

type ActionItem = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  route: string;
  useIcon?: boolean;
  icon?: React.ReactNode;
};

const actions: ActionItem[] = [
  {
    title: "Análises",
    subtitle: "Ver histórico",
    image: require('../assets/action-analysis.jpg'),
    route: 'SensorDetails',
  },
  {
    title: "Alertas",
    subtitle: "3 novos alertas",
    image: require('../assets/action-alerts.jpg'),
    route: 'Notifications',
  },
  {
    title: "Dispositivos",
    subtitle: "Configurar sensores",
    image: require('../assets/action-devices.jpg'),
    route: 'Devices',
  },
  {
    title: "Configurações",
    subtitle: "Personalizar app",
    image: require('../assets/action-locations.jpg'),
    route: 'Settings',
    useIcon: true,
    icon: <Settings size={40} color={colors.water.primary} />,
  },
];

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onActionPress }) => {
  const navigation = useNavigation();

  const handlePress = (route: string) => {
    if (onActionPress) {
      onActionPress(route);
    } else {
      // Navegação padrão
      navigation.navigate(route);
    }
  };

  return (
    <View>
      <Text style={styles.title}>Acesso Rápido</Text>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={() => handlePress(action.route)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              {action.useIcon && action.icon ? (
                action.icon
              ) : (
                <Image
                  source={action.image}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    padding: spacing.sm,
    width: '48%',
    marginBottom: spacing.sm,
  },
  imageContainer: {
    height: 80,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.water.secondary,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    color: colors.mutedForeground,
    fontSize: typography.sizes.xs,
  },
});
