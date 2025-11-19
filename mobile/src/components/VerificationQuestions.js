import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal as RNModal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const VerificationQuestions = ({ questions, onQuestionsChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    expected_answer: '',
    question_type: 'text',
  });

  const questionTypes = [
    { key: 'text', label: 'Text Answer', icon: 'text-fields' },
    { key: 'photo', label: 'Photo Proof', icon: 'photo-camera' },
    { key: 'multiple_choice', label: 'Multiple Choice', icon: 'radio-button-checked' },
  ];

  const addQuestion = () => {
    if (!newQuestion.question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    const questionData = {
      question: newQuestion.question.trim(),
      expected_answer: newQuestion.expected_answer.trim(),
      question_type: newQuestion.question_type,
    };

    let updatedQuestions;
    if (editingIndex !== null) {
      updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = questionData;
    } else {
      updatedQuestions = [...questions, questionData];
    }

    if (updatedQuestions.length > 3) {
      Alert.alert('Error', 'Maximum 3 verification questions allowed');
      return;
    }

    onQuestionsChange(updatedQuestions);
    resetForm();
  };

  const editQuestion = (index) => {
    const question = questions[index];
    setNewQuestion({
      question: question.question,
      expected_answer: question.expected_answer || '',
      question_type: question.question_type,
    });
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const deleteQuestion = (index) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this verification question?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          const updatedQuestions = questions.filter((_, i) => i !== index);
          onQuestionsChange(updatedQuestions);
        }},
      ]
    );
  };

  const resetForm = () => {
    setNewQuestion({
      question: '',
      expected_answer: '',
      question_type: 'text',
    });
    setEditingIndex(null);
    setShowAddModal(false);
  };

  const getQuestionTypeDisplay = (type) => {
    const typeInfo = questionTypes.find(t => t.key === type);
    return typeInfo ? typeInfo.label : type;
  };

  const getQuestionTypeIcon = (type) => {
    const typeInfo = questionTypes.find(t => t.key === type);
    return typeInfo ? typeInfo.icon : 'help';
  };

  return (
    <View style={styles.container}>
      <View style={styles.questionsContainer}>
        {questions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="help-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              Add verification questions that only the true owner can answer
            </Text>
            <Text style={styles.emptySubtext}>
              Examples: "What color is the item?", "What brand is it?", "Are there any unique marks?"
            </Text>
          </View>
        ) : (
          questions.map((question, index) => (
            <View key={index} style={styles.questionItem}>
              <View style={styles.questionHeader}>
                <View style={styles.questionTypeBadge}>
                  <Icon
                    name={getQuestionTypeIcon(question.question_type)}
                    size={14}
                    color="#666"
                  />
                  <Text style={styles.questionTypeText}>
                    {getQuestionTypeDisplay(question.question_type)}
                  </Text>
                </View>
                <View style={styles.questionActions}>
                  <TouchableOpacity
                    onPress={() => editQuestion(index)}
                    style={styles.actionButton}
                  >
                    <Icon name="edit" size={18} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteQuestion(index)}
                    style={styles.actionButton}
                  >
                    <Icon name="delete" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.questionText}>{question.question}</Text>
              {question.expected_answer && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerLabel}>Expected Answer:</Text>
                  <Text style={styles.answerText}>{question.expected_answer}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Add Question Button */}
      {questions.length < 3 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="add" size={20} color="#2196F3" />
          <Text style={styles.addButtonText}>Add Verification Question</Text>
        </TouchableOpacity>
      )}

      {/* Question Limit Helper */}
      <Text style={styles.helperText}>
        {questions.length}/3 questions (Recommended: 2-3 questions for better security)
      </Text>

      {/* Add/Edit Question Modal */}
      <RNModal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetForm}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetForm} style={styles.modalCloseButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? 'Edit Question' : 'Add Verification Question'}
            </Text>
            <TouchableOpacity onPress={addQuestion} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Question Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Question *</Text>
              <TextInput
                style={styles.textInput}
                value={newQuestion.question}
                onChangeText={(text) => setNewQuestion(prev => ({ ...prev, question: text }))}
                placeholder="Enter your verification question..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Question Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Answer Type</Text>
              <View style={styles.typeContainer}>
                {questionTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      newQuestion.question_type === type.key && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewQuestion(prev => ({ ...prev, question_type: type.key }))}
                  >
                    <Icon
                      name={type.icon}
                      size={16}
                      color={newQuestion.question_type === type.key ? '#fff' : '#666'}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        newQuestion.question_type === type.key && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Expected Answer (for text and multiple choice) */}
            {newQuestion.question_type !== 'photo' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {newQuestion.question_type === 'text' ? 'Expected Answer (Optional)' : 'Correct Answer (Optional)'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={newQuestion.expected_answer}
                  onChangeText={(text) => setNewQuestion(prev => ({ ...prev, expected_answer: text }))}
                  placeholder={
                    newQuestion.question_type === 'text'
                      ? 'What should the correct answer be? (Helps with verification)'
                      : 'Enter the correct option or answer'
                  }
                  multiline
                />
              </View>
            )}

            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Text style={styles.helperTitle}>💡 Tips for Good Questions:</Text>
              <Text style={styles.helperBullet}>• Ask about specific details only the owner would know</Text>
              <Text style={styles.helperBullet}>• Include questions about color, brand, size, or unique marks</Text>
              <Text style={styles.helperBullet}>• Avoid questions with obvious answers</Text>
              <Text style={styles.helperBullet}>• Make questions specific but not too obscure</Text>
            </View>
          </ScrollView>
        </View>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  questionsContainer: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  questionItem: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  questionActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  answerContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  answerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  answerText: {
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  helperContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helperBullet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 4,
  },
});

export default VerificationQuestions;