import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { router } from 'expo-router';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

function TabIcon({ label, hebrew, focused }: { label: string; hebrew: string; focused: boolean }) {
  return (
    <Text style={{
      fontFamily: Fonts.hebrewMedium,
      fontSize:   focused ? 24 : 20,
      color:      focused ? Palette.goldBright : Palette.navyLight,
    }}>
      {hebrew}
    </Text>
  );
}

export default function TabLayout() {
  const hasSeenOnboarding = useSubscriptionStore(s => s.hasSeenOnboarding);

  // Redirect new users to onboarding
  useEffect(() => {
    if (!hasSeenOnboarding) {
      router.replace('/onboarding');
    }
  }, [hasSeenOnboarding]);

  return (
    <Tabs
      screenOptions={{
        headerShown:          false,
        tabBarStyle: {
          backgroundColor:     Palette.navyDeep,
          borderTopColor:      Palette.goldMid + '25',
          borderTopWidth:      1,
          height:              Platform.OS === 'ios' ? 88 : 64,
          paddingBottom:       Platform.OS === 'ios' ? 24 : 8,
          paddingTop:          8,
        },
        tabBarActiveTintColor:   Palette.goldBright,
        tabBarInactiveTintColor: '#3A4560',
        tabBarLabelStyle: {
          fontFamily:   Fonts.sansMedium,
          fontSize:     10,
          letterSpacing:0.4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:         'Home',
          tabBarIcon:    ({ focused }) => <TabIcon label="Home"    hebrew="בית"   focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title:         'Library',
          tabBarIcon:    ({ focused }) => <TabIcon label="Library" hebrew="ספרים" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title:         'Explore',
          tabBarIcon:    ({ focused }) => <TabIcon label="Explore" hebrew="חיפוש" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title:         'Profile',
          tabBarIcon:    ({ focused }) => <TabIcon label="Profile" hebrew="אני"   focused={focused} />,
        }}
      />
    </Tabs>
  );
}
