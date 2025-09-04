// utils/videoUtils.ts

export interface VideoInfo {
  uri: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}

/**
 * Get video information including dimensions
 */
export async function getVideoInfo(videoUri: string): Promise<VideoInfo> {
  return { uri: videoUri };
}

/**
 * Check if video needs resizing based on aspect ratio
 * Target: 640x480 (4:3 aspect ratio)
 */
export function shouldResizeVideo(width?: number, height?: number): boolean {
  if (!width || !height) return false;
  
  const currentAspectRatio = width / height;
  const targetAspectRatio = 640 / 480; // 4:3 = 1.333...
  
  // Allow some tolerance for aspect ratio differences
  const tolerance = 0.1;
  return Math.abs(currentAspectRatio - targetAspectRatio) > tolerance;
}

/**
 * Calculate target dimensions to fit in 640x480 with letterbox/pillarbox
 * This maintains aspect ratio without cropping content
 */
export function calculateTargetDimensions(width: number, height: number): { 
  width: number; 
  height: number; 
  shouldLetterbox: boolean;
  shouldPillarbox: boolean;
} {
  const targetWidth = 640;
  const targetHeight = 480;
  const targetAspectRatio = targetWidth / targetHeight; // 1.333...
  const sourceAspectRatio = width / height;
  
  if (sourceAspectRatio > targetAspectRatio) {
    // Video is wider - need pillarbox (black bars on sides)
    const newHeight = targetWidth / sourceAspectRatio;
    return {
      width: targetWidth,
      height: Math.round(newHeight),
      shouldLetterbox: false,
      shouldPillarbox: newHeight < targetHeight,
    };
  } else {
    // Video is taller - need letterbox (black bars on top/bottom)
    const newWidth = targetHeight * sourceAspectRatio;
    return {
      width: Math.round(newWidth),
      height: targetHeight,
      shouldLetterbox: newWidth < targetWidth,
      shouldPillarbox: false,
    };
  }
}

/**
 * Generate unique filename for processed video
 */
export function generateProcessedVideoFilename(): string {
  const timestamp = Date.now();
  return `processed_video_${timestamp}.mp4`;
}

/**
 * Check if video dimensions are optimal for sign language recognition
 * Optimal: close to 640x480 or 4:3 aspect ratio
 */
export function isOptimalForRecognition(width?: number, height?: number): boolean {
  if (!width || !height) return false;
  
  const aspectRatio = width / height;
  const targetAspectRatio = 4 / 3;
  const tolerance = 0.2; // Increased tolerance to be less strict
  
  // Check if aspect ratio is close to 4:3
  const aspectRatioMatch = Math.abs(aspectRatio - targetAspectRatio) <= tolerance;
  
  // Check if resolution is reasonable (not too high or too low)
  const minResolution = 320 * 240;
  const maxResolution = 1920 * 1080; // Support higher resolution
  const currentResolution = width * height;
  
  const resolutionOk = currentResolution >= minResolution && currentResolution <= maxResolution;
  
  return aspectRatioMatch && resolutionOk;
}

/**
 * Get video processing recommendation
 */
export function getVideoProcessingRecommendation(width?: number, height?: number): {
  isOptimal: boolean;
  message: string;
  action: 'use_as_is' | 'will_resize' | 'recommend_retake';
} {
  if (!width || !height) {
    return {
      isOptimal: false,
      message: 'Cannot determine video dimensions',
      action: 'recommend_retake'
    };
  }

  const aspectRatio = width / height;
  const targetAspectRatio = 4 / 3;
  const resolution = width * height;
  
  if (isOptimalForRecognition(width, height)) {
    return {
      isOptimal: true,
      message: `Video dimensions (${width}x${height}) are optimal for recognition`,
      action: 'use_as_is'
    };
  }

  if (resolution < 320 * 240) {
    return {
      isOptimal: false,
      message: `Video resolution (${width}x${height}) is too low. Minimum recommended: 320x240`,
      action: 'recommend_retake'
    };
  }

  const aspectDiff = Math.abs(aspectRatio - targetAspectRatio);
  if (aspectDiff > 0.5) {
    return {
      isOptimal: false,
      message: `Video aspect ratio (${aspectRatio.toFixed(2)}:1) is very different from optimal (4:3). Video will be resized with letterbox/pillarbox`,
      action: 'will_resize'
    };
  }

  return {
    isOptimal: false,
    message: `Video (${width}x${height}) will be resized to fit 640x480 while preserving content`,
    action: 'will_resize'
  };
}