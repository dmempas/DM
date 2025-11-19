import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './store/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import {StatusBar} from 'react-native';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;