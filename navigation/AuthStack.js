import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../main/ProfileScreen';
import CameraScreen from '../screens/face_recognition_screen/AutoDetectScreen';
import RegisterFaceScreen from '../screens/RegisterFaceScreen';
import GuardHomePage from '../main/GuardHomePage';
const Stack = createStackNavigator();

const AuthStack = () => {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="AutoDetect" component={CameraScreen} />
          <Stack.Screen name="RegisterFace" component={RegisterFaceScreen} />
          


        </>
      ) : (
        <>
        <Stack.Screen name='Login' component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="GuardHomePage" component={GuardHomePage} />

        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthStack;
