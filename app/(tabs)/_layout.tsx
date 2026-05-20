import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/src/auth-context';

export default function TabLayout() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const tabActive = '#0B5A75';
  const tabInactive = '#8B8B8B';
  const tabBackground = '#FFFFFF';

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/register" />;
  }

  function TabBarIcon({
    focused,
    icon,
  }: {
    focused: boolean;
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
  }) {
    return (
      <View style={[styles.iconWrap, focused && { backgroundColor: tabActive }]}>
        <MaterialIcons
          name={icon}
          size={focused ? 28 : 30}
          color={focused ? '#FFFFFF' : tabInactive}
        />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabActive,
        tabBarInactiveTintColor: tabInactive,
        tabBarButton: HapticTab,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.tabBar, { backgroundColor: tabBackground }],
      }}>
      <Tabs.Screen
        name="register"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="home" />,
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="desktop-windows" />,
        }}
      />
      <Tabs.Screen
        name="jadwal"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="access-time" />,
        }}
      />
      <Tabs.Screen
        name="notifikasi"
        options={{
          title: 'Notifikasi',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="notifications" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 92,
    borderTopWidth: 0,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 10,
    elevation: 0,
    shadowOpacity: 0,
  },
  item: {
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  iconWrap: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
