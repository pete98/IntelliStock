import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  type BarcodeType,
  type BarcodeScanningResult,
} from 'expo-camera';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/navigation/types';
import { theme } from '@/config/theme';
import { getResponsiveLayout } from '@/utils/layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarcodeScanner'>;
type BarcodeScannerRouteProp = RouteProp<RootStackParamList, 'BarcodeScanner'>;

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BarcodeScannerRouteProp>();
  const { width } = useWindowDimensions();
  const responsiveLayout = getResponsiveLayout(width);
  const { source, itemId } = route.params;
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const hasScannedRef = useRef(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      hasScannedRef.current = false;
    }
  }, [isFocused]);

  const barcodeTypes = useMemo<BarcodeType[]>(
    () => [
      'ean13',
      'ean8',
      'upc_a',
      'upc_e',
      'code39',
      'code93',
      'code128',
      'itf14',
      'codabar',
      'qr',
      'pdf417',
      'aztec',
    ],
    []
  );

  const closeScanner = useCallback(() => {
    hasScannedRef.current = false;
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  useEffect(() => {
    if (!permission && requestPermission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (hasScannedRef.current || !data) {
        return;
      }

      hasScannedRef.current = true;

      if (source === 'form') {
        navigation.replace('ItemForm', {
          itemId,
          scannedBarcode: data,
        });
      } else {
        navigation.replace('InventoryList', {
          scannedBarcode: data,
        });
      }
    },
    [itemId, navigation, source]
  );

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.message}>
            We need your permission to access the camera to scan barcodes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => closeScanner()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleTorch = () => {
    setTorchEnabled(current => !current);
  };

  const scanningWidth = Math.min(Math.max(width * 0.62, 240), 520);
  const scanningHeight = Math.min(Math.max(scanningWidth * 0.55, 140), 280);
  const contentPadding = responsiveLayout.isTablet ? 56 : 40;

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing={facing}
          enableTorch={torchEnabled}
          active={isFocused}
          barcodeScannerSettings={{
            barcodeTypes,
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Overlay */}
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.overlayContent} pointerEvents="auto">
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => closeScanner()}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {source === 'form' ? 'Scan Product Code' : 'Scan Barcode'}
              </Text>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleTorch}
              >
                <Ionicons 
                  name={torchEnabled ? "flash" : "flash-off"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>

            {/* Scanning frame */}
            <View style={styles.scanningFrame}>
              <View style={[styles.scanningArea, { width: scanningWidth, height: scanningHeight }]}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsContainer, { paddingHorizontal: contentPadding }]}>
              <Text style={styles.instructions}>
                Position the barcode within the frame
              </Text>
              <Text style={styles.subInstructions}>
                The barcode will be scanned automatically
              </Text>
            </View>

            {/* Bottom controls */}
            <View style={[styles.bottomControls, { paddingHorizontal: contentPadding }]}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={32} color="white" />
                <Text style={styles.controlButtonText}>Flip</Text>
              </TouchableOpacity>
              
              <View style={styles.scanButtonContainer}>
                <View style={styles.scanButton}>
                  <Ionicons name="scan" size={40} color="white" />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => closeScanner()}
              >
                <Ionicons name="close-circle" size={32} color="white" />
                <Text style={styles.controlButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  scanningFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningArea: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructions: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  scanButtonContainer: {
    alignItems: 'center',
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  message: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#0b0b0b',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
