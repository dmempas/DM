import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import Colors from '../../constants/colors';
import Typography from '../../constants/typography';
import Spacing from '../../constants/spacing';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>FindMyStuff</Text>
        <Text style={styles.subtitle}>Help reunite lost items with their owners</Text>
      </View>

      <View style={styles.actionCards}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {/* Action cards will be implemented here */}
        <Text style={styles.placeholder}>Action Cards Coming Soon</Text>
      </View>

      <View style={styles.nearbyActivity}>
        <Text style={styles.sectionTitle}>Nearby Activity</Text>
        {/* Nearby items will be listed here */}
        <Text style={styles.placeholder}>No items nearby yet</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screen.horizontal,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.headline,
    fontSize: Typography.fontSize.xxxl,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionCards: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  nearbyActivity: {
    marginBottom: Spacing.xl,
  },
  placeholder: {
    ...Typography.body,
    color: Colors.textDisabled,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeScreen;