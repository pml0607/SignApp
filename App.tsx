import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { StatusBar } from 'expo-status-bar';

import WelcomeSlide from './slides/WelcomeSlide';
import VideoInputSlide from './slides/VideoInputSlide';
import UploadSlide from './slides/UploadSlide';
import ResultSlide from './slides/ResultSlide';
import DebugPanel from './DebugPanel';

const App = () => {
  const pagerRef = useRef<PagerView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    pagerRef.current?.setPage(index);
  };

  const onVideoSelected = (uri: string) => {
    setSelectedVideo(uri);
    goToSlide(2);
    processVideo(uri); // Use real API instead of simulation
  };

  const processVideo = async (videoUri: string) => {
    console.log('=== APP: Starting Video Processing ===');
    console.log('APP: Video URI:', videoUri);

    setIsUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      const { apiService } = await import('./services/ApiService');

      console.log('APP: API Service imported successfully');

      // Test server connection first
      console.log('APP: Testing server connection...');
      const healthCheck = await apiService.checkServerHealth();
      console.log('APP: Health check result:', healthCheck);

      if (!healthCheck.isHealthy) {
        throw new Error(`Server not available: ${healthCheck.error}`);
      }

      console.log('APP: Server is healthy, starting video processing...');
      const finalResult = await apiService.processVideo(
        videoUri,
        (progress) => {
          console.log('APP: Progress update:', progress);
          setUploadProgress(progress);
        },
        (status) => {
          console.log('APP: Status update:', status);
          // Status updates are handled by progress callback
        }
      );

      console.log('APP: Processing complete, final result:', finalResult);
      setIsUploading(false);

      // Handle different result scenarios
      if (finalResult.result) {
        const result = finalResult.result;
        console.log('APP: Processing result details:', result);

        if (result.status === 'completed' && result.prediction?.class_name) {
          // Success case - show the recognized sign language gesture
          console.log('APP: Success! Recognized gesture:', result.prediction.class_name);
          setResult(result.prediction.class_name);
        } else if (result.status === 'error') {
          // Server processing error
          console.log('APP: Server processing error:', result.error);
          setResult(`Processing Error: ${result.error || 'Unknown error'}`);
        } else {
          // Unexpected result format
          console.log('APP: Unexpected result format:', result);
          setResult('No gesture recognized');
        }
      } else {
        // No result in response
        console.log('APP: No result in response');
        setResult('Processing incomplete');
      }

      console.log('APP: Navigating to result slide...');
      goToSlide(3);

    } catch (error) {
      console.error('=== APP: Processing Failed ===');
      console.error('APP: Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      setIsUploading(false);
      setUploadProgress(0);
      setResult(`Connection Error: ${error.message}`);
      goToSlide(3);
    }
  };

  // Reset everything and go back to Welcome slide
  const resetToHome = () => {
    setSelectedVideo(null);
    setUploadProgress(0);
    setIsUploading(false);
    setResult(null);
    goToSlide(0); // Go to Welcome slide
  };

  // Reset for another video but stay in the flow (skip Welcome)
  const tryAnotherVideo = () => {
    setSelectedVideo(null);
    setUploadProgress(0);
    setIsUploading(false);
    setResult(null);
    goToSlide(1); // Go directly to VideoInput slide
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        scrollEnabled={false}
      >
        <View key="0">
          <WelcomeSlide onNext={() => goToSlide(1)} />
        </View>

        <View key="1">
          <VideoInputSlide
            onVideoSelected={onVideoSelected}
            onBack={() => goToSlide(0)}
          />
        </View>

        <View key="2">
          <UploadSlide
            progress={uploadProgress}
            isUploading={isUploading}
            videoUri={selectedVideo}
          />
        </View>

        <View key="3">
          <ResultSlide
            result={result}
            onTryAnother={tryAnotherVideo}  // New: Go to VideoInput
            onBackToHome={resetToHome}     // Optional: Go to Welcome
          />
        </View>
      </PagerView>

      {/* Debug Panel - Always available as floating button */}
      <DebugPanel />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  pager: { flex: 1 },
});

export default App;