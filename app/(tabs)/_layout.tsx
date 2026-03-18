import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name:     IoniconsName;
  focused:  boolean;
  badge?:   number;
}

function TabIcon({ name, focused, badge }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name={name}
        size={focused ? 26 : 23}
        color={focused ? Palette.goldBright : '#3A4560'}
      />
      {badge !== undefined && badge > 0 && (
        <View style={{
          position:        'absolute',
          top:             -3,
          right:           -7,
          backgroundColor: Palette.goldBright,
          borderRadius:    8,
          minWidth:        16,
          height:          16,
          alignItems:      'center',
          justifyContent:  'center',
          paddingHorizontal: 3,
        }}>
        </View>
      )}
    </View>
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
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Palette.navyDeep,
          borderTopColor:  Palette.goldMid + '20',
          borderTopWidth:  1,
          height:          Platform.OS === 'ios' ? 88 : 64,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 8,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   Palette.goldBright,
        tabBarInactiveTintColor: '#3A4560',
        tabBarLabelStyle: {
          fontFamily:    Fonts.sansMedium,
          fontSize:      10,
          letterSpacing: 0.4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:      'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title:      'Library',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'library' : 'library-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title:      'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title:      'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
