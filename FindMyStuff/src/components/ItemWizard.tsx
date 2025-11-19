import React, {useState, ReactNode} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

interface Step {
  id: string;
  title: string;
  component: ReactNode;
  isValid: boolean;
}

interface ItemWizardProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  isSubmitting?: boolean;
}

const ItemWizard: React.FC<ItemWizardProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  isSubmitting = false,
}) => {
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStepData.isValid) {
      if (currentStep === steps.length - 1) {
        onComplete();
      } else {
        onStepChange(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepPress = (index: number) => {
    // Only allow navigation to completed steps or current step
    if (index <= currentStep) {
      onStepChange(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isAccessible = index <= currentStep;

          return (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepIndicator,
                isCompleted && styles.completedStep,
                isCurrent && styles.currentStep,
              ]}
              onPress={() => handleStepPress(index)}
              disabled={!isAccessible}>
              <View
                style={[
                  styles.stepDot,
                  isCompleted && styles.completedDot,
                  isCurrent && styles.currentDot,
                ]}>
                {isCompleted ? (
                  <Text style={styles.checkMark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isCurrent && styles.currentStepNumber,
                    ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepTitle,
                  isCompleted && styles.completedTitle,
                  isCurrent && styles.currentTitle,
                ]}
                numberOfLines={1}>
                {step.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Step Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>{currentStepData.title}</Text>
        {currentStepData.component}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.previousButton]}
          onPress={handlePrevious}
          disabled={currentStep === 0 || isSubmitting}>
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>

        {currentStep === steps.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.button,
              styles.completeButton,
              !currentStepData.isValid && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!currentStepData.isValid || isSubmitting}>
            <Text style={styles.completeButtonText}>
              {isSubmitting ? 'Submitting...' : 'Complete'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              styles.nextButton,
              !currentStepData.isValid && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!currentStepData.isValid || isSubmitting}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  completedStep: {},
  completedDot: {
    backgroundColor: Colors.secondary,
  },
  currentStep: {},
  currentDot: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  stepNumber: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  currentStepNumber: {
    color: Colors.background,
  },
  checkMark: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
  },
  completedTitle: {
    color: Colors.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  currentTitle: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.screen.horizontal,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    height: Spacing.button,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.md,
    marginHorizontal: Spacing.sm,
  },
  previousButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previousButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  nextButtonText: {
    ...Typography.button,
    color: Colors.background,
  },
  completeButton: {
    backgroundColor: Colors.secondary,
  },
  completeButtonText: {
    ...Typography.button,
    color: Colors.background,
  },
  disabledButton: {
    backgroundColor: Colors.neutralLight,
    borderWidth: 0,
  },
});

export default ItemWizard;