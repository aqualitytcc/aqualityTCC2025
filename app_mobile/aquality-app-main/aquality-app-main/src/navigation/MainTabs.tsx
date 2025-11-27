import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, Smartphone, Settings, BarChart, Bell } from 'lucide-react-native';
import { colors } from '../utils/colors';

// Import pages
import { Home as HomePage } from '../pages/Home';
import { Devices } from '../pages/Devices';
import { Settings as SettingsPage } from '../pages/Settings';
import { Notifications } from '../pages/Notifications';
import { AlertRules } from '../pages/AlertRules';
import { Profile } from '../pages/Profile';
import { EditProfile } from '../pages/EditProfile';
import { SensorDetails } from '../pages/SensorDetails';
import { Help } from '../pages/Help';
import { Privacy } from '../pages/Privacy';
// Import the new Progress page
import { Progress } from '../pages/Progress';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomePage} />
    <Stack.Screen name="Notifications" component={Notifications} />
    <Stack.Screen name="AlertRules" component={AlertRules} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfile} />
    <Stack.Screen name="SensorDetails" component={SensorDetails} />
  </Stack.Navigator>
);

const DevicesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DevicesMain" component={Devices} />
    <Stack.Screen name="SensorDetails" component={SensorDetails} />
  </Stack.Navigator>
);

// Create a new Progress page stack
const ProgressStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProgressMain" component={Progress} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsPage} />
    <Stack.Screen name="Help" component={Help} />
    <Stack.Screen name="Privacy" component={Privacy} />
    <Stack.Screen name="Notifications" component={Notifications} />
    <Stack.Screen name="AlertRules" component={AlertRules} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfile} />
  </Stack.Navigator>
);

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'Home') {
            IconComponent = Home;
          } else if (route.name === 'Devices') {
            IconComponent = Smartphone;
          } else if (route.name === 'Settings') {
            IconComponent = Settings;
          } else if (route.name === 'Progress') {
            IconComponent = BarChart;
          }

          return IconComponent ? <IconComponent size={size} color={color} /> : null;
        },
        tabBarActiveTintColor: colors.water.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <Tab.Screen 
        name="Devices" 
        component={DevicesStack}
        options={{
          tabBarLabel: 'Dispositivos',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressStack}
        options={{
          tabBarLabel: 'Progresso',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{
          tabBarLabel: 'Configurações',
        }}
      />
    </Tab.Navigator>
  );
};