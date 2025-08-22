// File: slides/VideoInputSlide.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as Animatable from 'react-native-animatable';
import { MaterialIcons } from '@expo/vector-icons';

interface VideoInputSlideProps {
  onVideoSelected: (uri: string) => void;
  onBack: () => void;
}

const VideoInputSlide = ({ onVideoSelected, onBack }: VideoInputSlideProps) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      if (Platform.OS === 'android') {
        const audioGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (audioGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission required', 'Audio permission is needed to record video.');
        }
      }

      return cameraStatus.status === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request camera permission');
      return false;
    }
  };

  const openCamera = async () => {
    // Check and request permission if needed
    let hasPermission = hasCameraPermission;
    if (!hasPermission) {
      hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to record videos. Please enable it in your device settings.'
        );
        return;
      }
    }

    try {
      setIsRecording(true);

      // Launch camera directly for video recording
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets.length > 0) {
        console.log('Video recorded:', result.assets[0].uri);
        onVideoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera launch failed:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    } finally {
      setIsRecording(false);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        console.log('Video selected:', result.assets[0].uri);
        onVideoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick video error:', error);
      Alert.alert('Error', 'Failed to pick video from gallery');
    }
  };

  return (
    <View style={inputStyles.container}>
      <Animatable.View
        animation="fadeInDown"
        duration={800}
        style={inputStyles.iconContainer}
      >
        <MaterialIcons name="videocam" size={80} color="#3B82F6" />
      </Animatable.View>

      <Animatable.Text animation="fadeInUp" delay={200} style={inputStyles.title}>
        Choose a Video
      </Animatable.Text>

      <Animatable.Text animation="fadeInUp" delay={400} style={inputStyles.subtitle}>
        Record a new video or select one from your gallery to analyze sign language gestures.
      </Animatable.Text>

      <Animatable.View animation="slideInUp" delay={600} style={inputStyles.buttonsContainer}>
        <TouchableOpacity
          style={[inputStyles.primaryButton, isRecording && inputStyles.disabledButton]}
          onPress={openCamera}
          disabled={isRecording}
        >
          <MaterialIcons name="fiber-manual-record" size={24} color="white" />
          <Text style={inputStyles.primaryButtonText}>
            {isRecording ? 'Opening Camera...' : 'Record Video'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[inputStyles.secondaryButton, isRecording && inputStyles.disabledButton]}
          onPress={pickVideo}
          disabled={isRecording}
        >
          <MaterialIcons name="video-library" size={24} color="#3B82F6" />
          <Text style={inputStyles.secondaryButtonText}>Pick from Gallery</Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={800} style={inputStyles.infoContainer}>
        <MaterialIcons name="info-outline" size={20} color="#64748B" />
        <Text style={inputStyles.infoText}>
          Videos should be clear and well-lit for best recognition results
        </Text>
      </Animatable.View>

      <TouchableOpacity onPress={onBack} style={inputStyles.backButton}>
        <MaterialIcons name="arrow-back" size={20} color="#3B82F6" />
        <Text style={inputStyles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VideoInputSlide;

const inputStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    backgroundColor: '#E0F2FE',
    padding: 32,
    borderRadius: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 280,
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 280,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0F2FE',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
});