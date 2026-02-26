import React from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { PlannerScreen } from '../../features/planner/screens/PlannerScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { MainTabParamList } from './types';
import { colors } from '../theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIconByRoute: Record<keyof MainTabParamList, IoniconName> = {
  DashboardTab: 'grid-outline',
  PlannerTab: 'calendar-outline',
  ProfileTab: 'person-circle-outline',
};

function renderTabIcon(routeName: keyof MainTabParamList) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={tabIconByRoute[routeName]} color={color} size={size} />
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
        },
        tabBarIcon: renderTabIcon(route.name),
      })}>
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="PlannerTab" component={PlannerScreen} options={{ title: 'Planner' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
