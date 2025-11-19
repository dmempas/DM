import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Colors from '../../constants/colors';
import Typography from '../../constants/typography';
import Spacing from '../../constants/spacing';
import {useAuth} from '../../store/AuthContext';

const ProfileScreen = () => {
  const {user} = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        {user ? (
          <>
            <Text style={styles.welcome}>Welcome, {user.displayName}!</Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        ) : (
          <Text style={styles.placeholder}>Profile information coming soon</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.screen.horizontal,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.headline,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  welcome: {
    ...Typography.body,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  placeholder: {
    ...Typography.body,
    color: Colors.textDisabled,
    fontStyle: 'italic',
  },
});

export default ProfileScreen;