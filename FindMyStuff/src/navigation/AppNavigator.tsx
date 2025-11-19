import React, {useContext} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {AuthContext} from '../store/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import PostItemScreen from '../screens/main/PostItemScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import ReportItemScreen from '../screens/items/ReportItemScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ItemDetail: {itemId: string; itemType: 'lost' | 'found'};
  Chat: {matchId: string; userName: string};
  ReportItem: {itemType: 'lost' | 'found'};
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Post: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Search':
              iconName = 'search';
              break;
            case 'Post':
              iconName = 'add-circle';
              break;
            case 'Messages':
              iconName = 'message';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostItemScreen}
        options={{
          tabBarLabel: 'Post',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const {user, loading} = useContext(AuthContext);

  if (loading) {
    // Return loading screen here
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="ItemDetail"
            component={ItemDetailScreen}
            options={{
              headerShown: true,
              title: 'Item Details',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              title: 'Chat',
            }}
          />
          <Stack.Screen
            name="ReportItem"
            component={ReportItemScreen}
            options={{
              headerShown: true,
              title: 'Report Item',
              presentation: 'modal',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;