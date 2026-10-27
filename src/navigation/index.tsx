import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNotifs } from '../context/NotifContext';
import { isFirebaseConfigured } from '../config/firebaseConfig';
import { DEMO_MODE } from '../config/appConfig';
import { colors } from '../theme';
import { ClassDoc, Enrollment, SessionDoc } from '../types';

import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import SetupFirebase from '../screens/auth/SetupFirebase';
import Scan from '../screens/student/Scan';
import Records from '../screens/student/Records';
import StudentClasses from '../screens/student/StudentClasses';
import ClassRecord from '../screens/student/ClassRecord';
import Alerts from '../screens/common/Alerts';
import Profile from '../screens/common/Profile';
import Gaps from '../screens/common/Gaps';
import TeacherClasses from '../screens/teacher/TeacherClasses';
import ClassDashboard from '../screens/teacher/ClassDashboard';
import LiveSession from '../screens/teacher/LiveSession';
import SessionDetail from '../screens/teacher/SessionDetail';

export type RootParams = {
  Login: undefined; Register: undefined;
  StudentTabs: undefined; TeacherTabs: undefined; Gaps: undefined;
  ClassRecord: { enrollment: Enrollment };
  ClassDashboard: { cls: ClassDoc };
  LiveSession: { cls: ClassDoc; sessionId: string; token: string };
  SessionDetail: { cls: ClassDoc; session: SessionDoc };
};

const Stack = createNativeStackNavigator<RootParams>();
const Tab = createBottomTabNavigator();

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.ice, primary: colors.navy } };

function tabOptions(insetsBottom: number) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.navy,
    tabBarInactiveTintColor: '#8FAAC6',
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, height: 58 + insetsBottom, paddingBottom: 6 + insetsBottom, paddingTop: 6 },
  };
}

const icon = (name: keyof typeof Ionicons.glyphMap, focused: string) =>
  ({ color, size, focused: f }: { color: string; size: number; focused: boolean }) =>
    <Ionicons name={(f ? focused : name) as any} size={size} color={color} />;

function StudentTabs() {
  const { unread } = useNotifs();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator initialRouteName={DEMO_MODE ? 'Records' : 'Scan'} screenOptions={tabOptions(insets.bottom)}>
      <Tab.Screen name="Scan" component={Scan} options={{ tabBarIcon: icon('qr-code-outline', 'qr-code') }} />
      <Tab.Screen name="Records" component={Records} options={{ title: 'My Records', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }} />
      <Tab.Screen name="Classes" component={StudentClasses} options={{ tabBarIcon: icon('book-outline', 'book') }} />
      <Tab.Screen name="Alerts" component={Alerts}
        options={{ tabBarIcon: icon('notifications-outline', 'notifications'), tabBarBadge: unread > 0 ? unread : undefined, tabBarBadgeStyle: { backgroundColor: colors.absent } }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarIcon: icon('person-circle-outline', 'person-circle') }} />
    </Tab.Navigator>
  );
}

function TeacherTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabOptions(insets.bottom)}>
      <Tab.Screen name="MyClasses" component={TeacherClasses} options={{ title: 'Classes', tabBarIcon: icon('easel-outline', 'easel') }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarIcon: icon('person-circle-outline', 'person-circle') }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return !isFirebaseConfigured ? <SetupFirebase /> : <AuthedNavigation />;
}

function AuthedNavigation() {
  const { user, profile, loading } = useAuth();
  if (DEMO_MODE) {
    return (
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="StudentTabs" component={StudentTabs} />
          <Stack.Screen name="ClassRecord" component={ClassRecord} />
          <Stack.Screen name="Gaps" component={Gaps} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  if (loading || (user && !profile)) {
    return <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.sky} /></View>;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!profile ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        ) : profile.role === 'student' ? (
          <>
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            <Stack.Screen name="ClassRecord" component={ClassRecord} />
            <Stack.Screen name="Gaps" component={Gaps} />
          </>
        ) : (
          <>
            <Stack.Screen name="TeacherTabs" component={TeacherTabs} />
            <Stack.Screen name="ClassDashboard" component={ClassDashboard} />
            <Stack.Screen name="LiveSession" component={LiveSession} options={{ gestureEnabled: false }} />
            <Stack.Screen name="SessionDetail" component={SessionDetail} />
            <Stack.Screen name="Gaps" component={Gaps} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
