import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

interface ResultSlideProps {
  result: string | null;
  onTryAnother: () => void; // Go directly to VideoInput
  onBackToHome?: () => void; // Optional prop to go back to welcome
}

const ResultSlide = ({ result, onTryAnother, onBackToHome }: ResultSlideProps) => {
  // Determine if result is an error - handle both string and non-string results
  const resultString = typeof result === 'string' ? result : String(result || '');
  const isError = resultString.includes('Error:') || resultString.includes('Processing incomplete') || result === null;
  const isSuccess = result && !isError;

  return (
    <View style={resultStyles.container}>
      <Animatable.View animation="zoomIn" delay={200} style={resultStyles.iconBox}>
        <FontAwesome5
          name={isError ? "exclamation-triangle" : "hands-helping"}
          size={64}
          color={isError ? "#EF4444" : "#10B981"}
        />
      </Animatable.View>

      <Animatable.Text animation="fadeInUp" delay={400} style={[
        resultStyles.resultText,
        { color: isError ? "#EF4444" : "#10B981" }
      ]}>
        {isSuccess ? `"${resultString}"` : (resultString || 'No result')}
      </Animatable.Text>

      <Animatable.Text animation="fadeInUp" delay={600} style={resultStyles.subtitle}>
        {isSuccess 
          ? 'The gesture has been recognized successfully.'
          : isError 
            ? 'There was an issue processing your video. Please try again.'
            : 'Processing could not be completed.'
        }
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={800} style={resultStyles.buttonsContainer}>
        <TouchableOpacity style={resultStyles.primaryButton} onPress={onTryAnother}>
          <MaterialIcons name="videocam" size={20} color="white" />
          <Text style={resultStyles.primaryButtonText}>Try Another Video</Text>
        </TouchableOpacity>

        {onBackToHome && (
          <TouchableOpacity style={resultStyles.secondaryButton} onPress={onBackToHome}>
            <MaterialIcons name="home" size={20} color="#64748B" />
            <Text style={resultStyles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        )}
      </Animatable.View>
    </View>
  );
};

export default ResultSlide;

const resultStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconBox: {
    backgroundColor: '#ECFDF5',
    padding: 24,
    borderRadius: 60,
    marginBottom: 24,
  },
  resultText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonsContainer: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 200,
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});