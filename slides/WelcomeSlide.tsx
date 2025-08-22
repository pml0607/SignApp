import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface WelcomeSlideProps {
  onNext: () => void;
}

const WelcomeSlide = ({ onNext }: WelcomeSlideProps) => {
  return (
    <View style={styles.container}>
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={styles.iconBox}
      >
        <FontAwesome5 name="sign-language" size={64} color="white" />
      </Animatable.View>

      <Animatable.Text animation="fadeInUp" delay={300} style={styles.title}>
        Sign Language Recognition
      </Animatable.Text>

      <Animatable.Text animation="fadeInUp" delay={500} style={styles.subtitle}>
        Record or upload a video to recognize sign language gestures instantly.
      </Animatable.Text>

      <Animatable.View animation="zoomIn" delay={800}>
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
};

export default WelcomeSlide;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 24,
    borderRadius: 60,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
  },
  buttonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
});


