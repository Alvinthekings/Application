import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import your screens
import GuardHomePage from '../main/GuardHomePage';
import ReportsScreen from '../main/ReportsScreen';
import SearchScreen from '../main/SearchScreen';
import ProfileScreen from '../main/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Reports':
              iconName = 'insert-drive-file';
              break;
            case 'Search':
              iconName = 'search';
              break;
            case 'Account':
              iconName = 'account-circle';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E8B57',
        tabBarInactiveTintColor: 'gray',
        headerShown: false
      })}
    >
      {/* Only Screen components as direct children */}
      <Tab.Screen name="Home" component={GuardHomePage} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
