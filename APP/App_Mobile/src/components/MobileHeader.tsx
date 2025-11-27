import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';
import { MobileHeaderProps } from '../types';

const { width } = Dimensions.get('window');

export const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  userName 
}) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const displayName = userName || user?.name || "Usuário";

  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications' as never);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleProfilePress}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {getInitials(displayName)}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.userText}>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
          <Bell size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: colors.water.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: 50, // Espaço para status bar
    shadowColor: colors.water.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: width,
    alignSelf: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryForeground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.water.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userText: {
    flex: 1,
    minWidth: 0, // Permite que o texto seja cortado corretamente
  },
  greeting: {
    color: colors.primaryForeground,
    opacity: 0.9,
    fontSize: typography.sizes.sm,
  },
  userName: {
    color: colors.primaryForeground,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md, // Reduzido para evitar corte
    lineHeight: 18,
    flexShrink: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    flexShrink: 0, // Evita que o botão seja comprimido
  },
});
