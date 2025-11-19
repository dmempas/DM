import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'security',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      onPress: () => navigation.navigate('PrivacySettings'),
    },
    {
      icon: 'help-outline',
      title: 'Help & Support',
      subtitle: 'Get help with the app',
      onPress: () => navigation.navigate('Help'),
    },
    {
      icon: 'info-outline',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => navigation.navigate('About'),
    },
  ];

  if (isAdmin) {
    menuItems.splice(1, 0, {
      icon: 'admin-panel-settings',
      title: 'Admin Panel',
      subtitle: 'Manage items and claims',
      onPress: () => navigation.navigate('AdminPanel'),
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Icon name="person" size={48} color="#666" />
          </View>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {user?.user_type?.charAt(0).toUpperCase() + user?.user_type?.slice(1) || 'Student'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="search-off" size={24} color="#ff6b6b" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Lost Items</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="find-in-page" size={24} color="#51cf66" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Found Items</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="gavel" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Claims</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Icon name={item.icon} size={24} color="#2196F3" />
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#ff4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Lost & Found App v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Lost & Found Team</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  userTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userTypeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4444',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#ccc',
  },
});

export default ProfileScreen;