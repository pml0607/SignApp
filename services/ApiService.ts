// services/ApiService.ts

// Debug logger utility
class DebugLogger {
  private static isEnabled = true; // Set to false to disable debug logs

  static log(tag: string, message: string, data?: any) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[${timestamp}] [${tag}] ${message}`, data || '');
  }

  static error(tag: string, message: string, error?: any) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.error(`[${timestamp}] [${tag}] ERROR: ${message}`, error || '');
  }

  static warn(tag: string, message: string, data?: any) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.warn(`[${timestamp}] [${tag}] WARNING: ${message}`, data || '');
  }
}

export interface UploadResponse {
  status: string;
  video_id: string;
}

export interface ProcessingResult {
  id: string;
  status: 'completed' | 'error';
  prediction?: {
    class_id: number;
    class_name: string;
  };
  processing_time?: number;
  timestamp?: number;
  video_tensor_file?: string;
  landmark_file?: string;
  landmark_shape?: number[];
  error?: string;
}

export interface ProcessingStatus {
  status: 'processing' | 'done' | 'timeout' | 'error';
  video_id?: string;
  result?: ProcessingResult;
}

class ApiService {
  private baseUrl: string;
  private wsUrl: string;

  constructor(baseUrl?: string) {
    // Import config dynamically to avoid circular dependencies
    this.baseUrl = baseUrl || 'https://boulevard-thorough-lives-cuts.trycloudflare.com';
    this.wsUrl = this.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    DebugLogger.log('API', '=== API Service Initialized ===');
    DebugLogger.log('API', `Base URL: ${this.baseUrl}`);
    DebugLogger.log('API', `WebSocket URL: ${this.wsUrl}`);
    DebugLogger.log('API', `User Agent: ${navigator.userAgent || 'N/A'}`);
  }

  /**
   * Upload video file to server
   */
  async uploadVideo(videoUri: string): Promise<UploadResponse> {
    const uploadUrl = `${this.baseUrl}/upload/`;
    
    try {
      DebugLogger.log('UPLOAD', '=== Starting Video Upload ===');
      DebugLogger.log('UPLOAD', `Video URI: ${videoUri}`);
      DebugLogger.log('UPLOAD', `Upload URL: ${uploadUrl}`);
      DebugLogger.log('UPLOAD', `Method: POST`);
      
      const formData = new FormData();
      
      // Create file object from URI - React Native specific format
      const fileName = `video_${Date.now()}.mp4`;
      const fileInfo = {
        uri: videoUri,
        type: 'video/mp4',
        name: fileName,
      } as any;

      formData.append('file', fileInfo);
      
      DebugLogger.log('UPLOAD', `File Info:`, {
        name: fileName,
        type: 'video/mp4',
        uri: videoUri.substring(0, 50) + '...'
      });

      const requestHeaders = {
        'Accept': 'application/json',
        // Don't set Content-Type for multipart/form-data
        // React Native will handle it automatically
      };

      DebugLogger.log('UPLOAD', `Request Headers:`, requestHeaders);
      DebugLogger.log('UPLOAD', `Sending request...`);

      const startTime = Date.now();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
      });

      const requestTime = Date.now() - startTime;
      
      DebugLogger.log('UPLOAD', `Response received in ${requestTime}ms`);
      DebugLogger.log('UPLOAD', `Response Status: ${response.status} ${response.statusText}`);
      DebugLogger.log('UPLOAD', `Response Headers:`, {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
        'server': response.headers.get('server')
      });

      if (!response.ok) {
        const errorText = await response.text();
        DebugLogger.error('UPLOAD', `HTTP Error Response:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: UploadResponse = await response.json();
      DebugLogger.log('UPLOAD', `Upload Success:`, result);
      
      return result;
    } catch (error) {
      DebugLogger.error('UPLOAD', `Upload Failed:`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3),
        url: uploadUrl
      });
      
      // More specific error messages
      if (error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please check your internet connection and server address.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Upload timed out. Please try again with a smaller video file.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Connect to WebSocket for real-time processing updates
   */
  connectToProcessing(
    videoId: string,
    onStatusUpdate: (status: ProcessingStatus) => void,
    onError: (error: Error) => void
  ): () => void {
    const wsUrl = `${this.wsUrl}/ws/${videoId}`;
    
    DebugLogger.log('WS', '=== Starting WebSocket Connection ===');
    DebugLogger.log('WS', `Video ID: ${videoId}`);
    DebugLogger.log('WS', `WebSocket URL: ${wsUrl}`);
    
    let ws: WebSocket | null = null;
    let isConnected = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let messageCount = 0;

    const connect = () => {
      try {
        DebugLogger.log('WS', `Connection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts + 1}`);
        
        ws = new WebSocket(wsUrl);

        ws.onopen = (event) => {
          DebugLogger.log('WS', `Connection opened successfully`);
          DebugLogger.log('WS', `Connection event:`, {
            readyState: ws?.readyState,
            protocol: ws?.protocol,
            extensions: ws?.extensions
          });
          isConnected = true;
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          messageCount++;
          
          try {
            DebugLogger.log('WS', `Message #${messageCount} received:`, {
              data: event.data,
              timestamp: new Date().toISOString(),
              size: event.data?.length || 0
            });

            const data: ProcessingStatus = JSON.parse(event.data);
            
            DebugLogger.log('WS', `Parsed message:`, data);
            onStatusUpdate(data);

            // Close connection if processing is complete
            if (data.status === 'done' || data.status === 'timeout' || data.status === 'error') {
              DebugLogger.log('WS', `Processing complete, closing connection. Final status: ${data.status}`);
              ws?.close(1000, 'Processing complete');
            }
          } catch (parseError) {
            DebugLogger.error('WS', `Failed to parse message:`, {
              error: parseError.message,
              rawData: event.data
            });
            onError(new Error('Failed to parse server response'));
          }
        };

        ws.onerror = (error) => {
          DebugLogger.error('WS', `WebSocket error:`, {
            error: error,
            readyState: ws?.readyState,
            isConnected: isConnected
          });
          onError(new Error('WebSocket connection error'));
        };

        ws.onclose = (event) => {
          DebugLogger.log('WS', `Connection closed:`, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            isConnected: isConnected,
            messageCount: messageCount
          });
          
          isConnected = false;

          // Attempt to reconnect if not intentionally closed
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const retryDelay = 2000 * reconnectAttempts;
            DebugLogger.warn('WS', `Reconnecting in ${retryDelay}ms... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
            setTimeout(connect, retryDelay);
          } else if (event.code !== 1000) {
            DebugLogger.error('WS', `Max reconnection attempts reached. Connection failed.`);
            onError(new Error('WebSocket connection failed after multiple attempts'));
          }
        };

      } catch (connectionError) {
        DebugLogger.error('WS', `Failed to create WebSocket:`, connectionError);
        onError(new Error('Failed to establish WebSocket connection'));
      }
    };

    // Initial connection
    connect();

    // Return cleanup function
    return () => {
      if (ws && isConnected) {
        DebugLogger.log('WS', `Manually closing connection`);
        ws.close(1000, 'Manual disconnect');
      }
    };
  }

  /**
   * Complete upload and processing workflow
   */
  async processVideo(
    videoUri: string,
    onProgress: (progress: number) => void,
    onStatusUpdate: (status: string) => void
  ): Promise<ProcessingStatus> {
    return new Promise(async (resolve, reject) => {
      let wsCleanup: (() => void) | null = null;
      const timeoutId = setTimeout(() => {
        DebugLogger.error('PROCESS', 'Overall processing timeout (3 minutes)');
        reject(new Error('Overall processing timeout (3 minutes)'));
      }, 180000); // 3 minutes total timeout
      
      try {
        DebugLogger.log('PROCESS', '=== Starting Video Processing Workflow ===');
        DebugLogger.log('PROCESS', `Video URI: ${videoUri.substring(0, 50)}...`);
        
        // Step 1: Upload video with longer timeout
        onStatusUpdate('Uploading video...');
        onProgress(10);
        
        DebugLogger.log('PROCESS', 'Step 1: Starting upload...');
        const uploadResult = await Promise.race([
          this.uploadVideo(videoUri),
          new Promise<never>((_, reject) => 
            setTimeout(() => {
              DebugLogger.error('PROCESS', 'Upload timeout after 2 minutes');
              reject(new Error('Upload timeout after 2 minutes'));
            }, 120000)
          )
        ]) as UploadResponse;
        
        if (uploadResult.status !== 'received') {
          throw new Error(`Upload failed with status: ${uploadResult.status}`);
        }

        DebugLogger.log('PROCESS', `Step 1 Complete: Video uploaded with ID ${uploadResult.video_id}`);
        onProgress(30);
        onStatusUpdate('Video uploaded, starting analysis...');

        // Step 2: Connect to WebSocket with better error handling
        DebugLogger.log('PROCESS', 'Step 2: Starting WebSocket connection...');
        wsCleanup = this.connectToProcessing(
          uploadResult.video_id,
          (status) => {
            DebugLogger.log('PROCESS', `WebSocket status update:`, status);
            
            switch (status.status) {
              case 'processing':
                const currentProgress = Math.min(90, 40 + Math.random() * 30);
                onProgress(currentProgress);
                onStatusUpdate('Processing landmarks and analyzing gestures...');
                break;
                
              case 'done':
                DebugLogger.log('PROCESS', '=== Processing Complete Successfully ===');
                clearTimeout(timeoutId);
                onProgress(100);
                onStatusUpdate('Analysis complete!');
                resolve(status);
                break;
                
              case 'timeout':
                DebugLogger.error('PROCESS', 'Server processing timed out');
                clearTimeout(timeoutId);
                onProgress(100);
                onStatusUpdate('Processing timeout');
                reject(new Error('Server processing timed out'));
                break;
                
              case 'error':
                DebugLogger.error('PROCESS', 'Server processing error', status);
                clearTimeout(timeoutId);
                onProgress(100);
                onStatusUpdate('Processing failed');
                reject(new Error('Server processing error'));
                break;
            }
          },
          (error) => {
            DebugLogger.error('PROCESS', 'WebSocket error', error);
            clearTimeout(timeoutId);
            reject(error);
          }
        );

      } catch (error) {
        DebugLogger.error('PROCESS', '=== Processing Failed ===', {
          error: error.message,
          videoUri: videoUri.substring(0, 50) + '...'
        });
        
        clearTimeout(timeoutId);
        if (wsCleanup) {
          wsCleanup();
        }
        reject(error);
      }
    });
  }

  /**
   * Health check endpoint
   */
  async checkServerHealth(): Promise<{ isHealthy: boolean; error?: string }> {
    const healthUrl = `${this.baseUrl}/health`;
    
    try {
      DebugLogger.log('HEALTH', '=== Health Check Started ===');
      DebugLogger.log('HEALTH', `Health URL: ${healthUrl}`);
      
      const startTime = Date.now();
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const responseTime = Date.now() - startTime;
      
      DebugLogger.log('HEALTH', `Health check response (${responseTime}ms):`, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': response.headers.get('content-type'),
          'server': response.headers.get('server'),
          'date': response.headers.get('date')
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        DebugLogger.log('HEALTH', `Health check SUCCESS:`, data);
        return { isHealthy: true };
      } else {
        const errorText = await response.text();
        DebugLogger.error('HEALTH', `Health check FAILED:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return { 
          isHealthy: false, 
          error: `Server returned ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      DebugLogger.error('HEALTH', `Health check ERROR:`, {
        message: error.message,
        name: error.name,
        url: healthUrl
      });
      return { 
        isHealthy: false, 
        error: error.message || 'Connection failed' 
      };
    }
  }
}

// Singleton instance
export const apiService = new ApiService();

// Export types
export default ApiService;