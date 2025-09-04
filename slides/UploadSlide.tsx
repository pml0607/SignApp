import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import * as Animatable from 'react-native-animatable';

interface UploadSlideProps {
  progress: number;
  isUploading: boolean;
  videoUri: string | null;
}

const UploadSlide = ({ progress, isUploading, videoUri }: UploadSlideProps) => {
  const isComplete = progress >= 100 && !isUploading;

  return (
    <View style={uploadStyles.container}>
      <Animatable.View animation="fadeIn" delay={100} style={uploadStyles.headerContainer}>
        <Text style={uploadStyles.title}>
          {isComplete ? 'Processing Complete!' : 'Processing Video...'}
        </Text>
        <Text style={uploadStyles.subtitle}>
          {isComplete ? 'Your video has been analyzed' : 'Please wait while we analyze your sign language'}
        </Text>
      </Animatable.View>

      {videoUri && (
        <Animatable.View animation="fadeIn" delay={200} style={uploadStyles.videoContainer}>
          <Video
            source={{ uri: videoUri }}
            style={uploadStyles.video}
            shouldPlay={true}
            isLooping={true}
            isMuted={true}
            resizeMode="contain"
          />
          <Text style={uploadStyles.videoLabel}>Your uploaded video</Text>
        </Animatable.View>
      )}

      {isUploading && (
        <Animatable.View animation="pulse" iterationCount="infinite" style={uploadStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={uploadStyles.loadingText}>Analyzing sign language gestures...</Text>
          <View style={uploadStyles.dotContainer}>
            <Animatable.Text animation="bounce" iterationDelay={0} iterationCount="infinite" style={uploadStyles.dot}>●</Animatable.Text>
            <Animatable.Text animation="bounce" iterationDelay={200} iterationCount="infinite" style={uploadStyles.dot}>●</Animatable.Text>
            <Animatable.Text animation="bounce" iterationDelay={400} iterationCount="infinite" style={uploadStyles.dot}>●</Animatable.Text>
          </View>
        </Animatable.View>
      )}

      {isComplete && (
        <Animatable.View animation="fadeInUp" delay={300} style={uploadStyles.completeContainer}>
          <Text style={uploadStyles.successEmoji}>✅</Text>
          <Text style={uploadStyles.completeText}>
            Analysis completed successfully!
          </Text>
          <Text style={uploadStyles.completeSubtext}>
            Redirecting to results...
          </Text>
        </Animatable.View>
      )}
    </View>
  );
};

export default UploadSlide;

const uploadStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  videoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  video: {
    width: 240,
    height: 180, // 4:3 aspect ratio (240x180 = 4:3)
    borderRadius: 12,
    backgroundColor: '#000',
  },
  videoLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    fontSize: 20,
    color: '#3B82F6',
  },
  completeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  completeSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  completeText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
});