import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import Button from '../../components/Button';
import Colors from '../../constants/colors';
import Typography from '../../constants/typography';
import Spacing from '../../constants/spacing';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';

type PostItemNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const PostItemScreen = () => {
  const navigation = useNavigation<PostItemNavigationProp>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Report an Item</Text>
        <Text style={styles.subtitle}>Help reunite lost items or report found items</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Report Lost Item"
          onPress={() => navigation.navigate('ReportItem', {itemType: 'lost'})}
          size="large"
          style={styles.button}
        />

        <Button
          title="Report Found Item"
          onPress={() => navigation.navigate('ReportItem', {itemType: 'found'})}
          variant="secondary"
          size="large"
          style={styles.button}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoItem}>• Provide detailed information about the item</Text>
        <Text style={styles.infoItem}>• Include photos for better identification</Text>
        <Text style={styles.infoItem}>• Specify the location where it was lost/found</Text>
        <Text style={styles.infoItem}>• Our algorithm will match you with potential finds/reports</Text>
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
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.headline,
    fontSize: Typography.fontSize.xl,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    marginBottom: Spacing.xxl,
  },
  button: {
    marginBottom: Spacing.md,
  },
  info: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
  },
  infoTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoItem: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
});

export default PostItemScreen;