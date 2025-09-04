import { labelMap } from '../config/labelMap';

class GestureMapService {
  private static instance: GestureMapService;

  private constructor() {}

  public static getInstance(): GestureMapService {
    if (!GestureMapService.instance) {
      GestureMapService.instance = new GestureMapService();
    }
    return GestureMapService.instance;
  }

  public getGestureName(gestureCode: string | number): string {
    // Convert to number if it's a string
    const code = typeof gestureCode === 'string' 
      ? parseInt(gestureCode.replace('A', ''), 10) 
      : gestureCode;
    
    // Return the label if found, otherwise return the original code
    return labelMap[code] || gestureCode.toString();
  }
}

export default GestureMapService;
