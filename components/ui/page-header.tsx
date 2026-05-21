import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth-context';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  rightIconColor?: string;
  rightActionLabel?: string;
  onPressRightAction?: () => void;
  onPressRightIcon?: () => void;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  rightIcon = 'refresh',
  rightIconColor = '#FFFFFF',
  rightActionLabel,
  onPressRightAction,
  onPressRightIcon,
  children,
}: PageHeaderProps) {
  const router = useRouter();
  const { clearAuth } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.logout();
    } catch (error) {
      console.warn('Logout failed', error);
    } finally {
      clearAuth();
      setIsLoggingOut(false);
      router.replace('/login');
    }
  }, [clearAuth, isLoggingOut, router]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.glow} />
        <View style={styles.body}>
          <View style={styles.row}>
            <View style={styles.textWrap}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
            </View>
            <View style={styles.rightArea}>
              {rightActionLabel ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onPressRightAction}
                  disabled={!onPressRightAction}
                  style={({ pressed }) => [
                    styles.actionPill,
                    pressed && onPressRightAction ? styles.actionPressed : null,
                  ]}>
                  <ThemedText style={styles.actionPillText}>{rightActionLabel}</ThemedText>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Logout"
                onPress={handleLogout}
                disabled={isLoggingOut}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.logoutButton,
                  pressed && !isLoggingOut ? styles.actionPressed : null,
                ]}>
                <MaterialIcons name="logout" size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onPressRightIcon}
                disabled={!onPressRightIcon}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && onPressRightIcon ? styles.actionPressed : null,
                ]}>
                <MaterialIcons name={rightIcon} size={22} color={rightIconColor} />
              </Pressable>
            </View>
          </View>
          {children ? <View style={styles.childrenWrap}>{children}</View> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#0C6F98',
  },
  header: {
    backgroundColor: '#0C6F98',
    height: 170,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2DA3CF',
    opacity: 0.35,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
    paddingTop: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#D8F3FF',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#DFF6FF',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    borderColor: 'rgba(255, 205, 205, 0.9)',
  },
  actionPill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  childrenWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
