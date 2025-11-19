import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Colors from '../../constants/colors';
import Typography from '../../constants/typography';
import Spacing from '../../constants/spacing';

const MessagesScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.placeholder}>Your conversations will appear here</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screen.horizontal,
  },
  title: {
    ...Typography.headline,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  placeholder: {
    ...Typography.body,
    color: Colors.textDisabled,
    fontStyle: 'italic',
  },
});

export default MessagesScreen;