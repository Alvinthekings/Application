import React, { useState, useRef, useEffect, useContext } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ActivityIndicator, Dimensions, Modal,
  FlatList, Animated, Easing, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function MultiFaceDetectScreen() {
  const { FLASK_URL } = useContext(AuthContext);
  const [permission, requestPermission] = useCameraPermissions();
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [cameraFacing, setCameraFacing] = useState('front');
  const cameraRef = useRef(null);
  const [frameCounter, setFrameCounter] = useState(0);
  const processingInterval = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isScanning, setIsScanning] = useState(true);
  const [noFacesDetected, setNoFacesDetected] = useState(false);
  const [reportedUnknownFaces, setReportedUnknownFaces] = useState(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [detectedFaces]);

  useEffect(() => {
    if (permission?.granted && isScanning) {
      processingInterval.current = setInterval(() => {
        setFrameCounter(prev => prev + 1);
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2000);
    }
    return () => {
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
      }
    };
  }, [permission, isScanning]);

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'torch' : 'off'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCameraFacing = () => {
    setCameraFacing(current => (current === 'front' ? 'back' : 'front'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const reportUnknownFace = async (faceData, imageUri) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'unknown_face.jpg',
        type: 'image/jpeg',
      });
      formData.append('violation_type', 'Unknown Person Detected');
      formData.append('location', 'Camera Scan Point');
      
      const response = await fetch(`${FLASK_URL}/submit_unknown_violation`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true };
      } else {
        console.error('Failed to report unknown face:', result.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Error reporting unknown face:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  };

  const captureAndRecognize = async () => {
    if (cameraRef.current && !isProcessing && isScanning) {
      try {
        setIsProcessing(true);
        setNoFacesDetected(false);
        setReportedUnknownFaces(0);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
          exif: false,
          base64: true
        });

        const formData = new FormData();
        formData.append('image', {
          uri: photo.uri,
          name: 'frame.jpg',
          type: 'image/jpeg',
        });

        const response = await fetch(`${FLASK_URL}/recognize`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          const newFaces = result.recognitions || [];
          setDetectedFaces(newFaces);
          
          // Automatically report unknown faces
          const unknownFaces = newFaces.filter(face => face.name === 'Unknown');
          if (unknownFaces.length > 0) {
            const reportResults = await Promise.all(unknownFaces.map(face => 
              reportUnknownFace(face, photo.uri)
            ));
            const successfulReports = reportResults.filter(r => r.success).length;
            setReportedUnknownFaces(successfulReports);
            
            if (successfulReports > 0) {
              Alert.alert(
                'Unknown Faces Reported',
                `Successfully reported ${successfulReports} unknown face(s) to security.`,
                [{ text: 'OK' }]
              );
            }
          }

          if (newFaces.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsScanning(false);
            setNoFacesDetected(false);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setNoFacesDetected(true);
            setIsScanning(false);
          }
        } else {
          setDetectedFaces([]);
          setNoFacesDetected(true);
          setIsScanning(false);
        }
      } catch (error) {
        console.error('Recognition error:', error);
        setDetectedFaces([]);
        setNoFacesDetected(true);
        setIsScanning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    captureAndRecognize();
  }, [frameCounter]);

  const submitViolation = async () => {
    if (!selectedViolation) {
      Alert.alert('Missing Information', 'Please select a violation type');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!selectedStudent) {
      Alert.alert('Missing Information', 'Please select a student');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      const response = await fetch(`${FLASK_URL}/submit_violation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.lrn,
          student_name: selectedStudent.name,
          grade_level: selectedStudent.grade,
          section: selectedStudent.section,
          violation_type: selectedViolation,
          date: new Date().toISOString(),
          status: 'Pending'
        }),
      });

      const result = await response.json();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit violation');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit violation. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Submission error:', error);
    }
  };

  const reset = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDetectedFaces([]);
      setSelectedStudent(null);
      setSelectedViolation('');
      setShowSuccessModal(false);
      setIsScanning(true);
      setNoFacesDetected(false);
      setReportedUnknownFaces(0);
    });
    Haptics.selectionAsync();
  };

  if (!permission) return <View style={styles.loadingContainer} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <MaterialIcons name="camera" size={80} color="#4CAF50" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            To recognize students, we need access to your camera
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
            <MaterialIcons name="chevron-right" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {detectedFaces.length > 0 ? (
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
          <Text style={styles.resultHeader}>
            <Ionicons name="people" size={24} color="#4CAF50" />
            {detectedFaces.length} {detectedFaces.length === 1 ? 'PERSON' : 'PEOPLE'} DETECTED
          </Text>

          {reportedUnknownFaces > 0 && (
            <View style={styles.notification}>
              <Text style={styles.notificationText}>
                <MaterialIcons name="security" size={16} color="#4CAF50" />{' '}
                Reported {reportedUnknownFaces} unknown face(s)
              </Text>
            </View>
          )}

          <FlatList
            data={detectedFaces}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.resultCard,
                  selectedStudent?.lrn === item.lrn && styles.selectedCard,
                  item.name === 'Unknown' && styles.unknownCard
                ]}
                onPress={() => {
                  setSelectedStudent(item);
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.cardHeader}>
                  {item.name !== 'Unknown' ? (
                    <FontAwesome name="user-circle" size={24} color="#4CAF50" />
                  ) : (
                    <MaterialIcons name="person-outline" size={24} color="#757575" />
                  )}
                  <Text style={[
                    styles.cardTitle,
                    item.name === 'Unknown' && styles.unknownTitle
                  ]}>
                    {item.name}
                  </Text>
                  {item.confidence > 0 && (
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {item.confidence.toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>

                {item.grade && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="class" size={18} color="#616161" />
                    <Text style={styles.detailText}>Grade {item.grade} - {item.section}</Text>
                  </View>
                )}

                {item.lrn && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="fingerprint" size={18} color="#616161" />
                    <Text style={styles.detailText}>LRN: {item.lrn}</Text>
                  </View>
                )}

                {item.name === 'Unknown' && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="warning" size={18} color="#F44336" />
                    <Text style={[styles.detailText, { color: '#F44336' }]}>
                      Unknown person - reported to security
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />

          {selectedStudent && selectedStudent.name !== 'Unknown' && (
            <Animated.View style={[styles.violationContainer, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>SELECT VIOLATION</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedViolation}
                  onValueChange={(value) => {
                    setSelectedViolation(value);
                    Haptics.selectionAsync();
                  }}
                  style={styles.picker}
                  dropdownIconColor="#4CAF50"
                >
                  <Picker.Item label="Choose violation type..." value="" />
                  <Picker.Item label="🚫 Uniform Violation" value="Uniform Violation" />
                  <Picker.Item label="⏰ Tardiness" value="Tardiness" />
                  <Picker.Item label="🤼 Bullying" value="Bullying" />
                  <Picker.Item label="💬 Disruptive Behavior" value="Disruptive Behavior" />
                  <Picker.Item label="📝 Cheating" value="Cheating" />
                  <Picker.Item label="❔ Other" value="Other" />
                </Picker>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitViolation}
                disabled={!selectedViolation}
              >
                <Text style={styles.buttonText}>
                  <MaterialIcons name="warning" size={20} color="white" /> {' '}
                  REPORT VIOLATION
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={reset}
          >
            <Text style={styles.buttonText}>
              <MaterialIcons name="refresh" size={20} color="white" /> {' '}
              SCAN AGAIN
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          <CameraView
            style={styles.camera}
            ref={cameraRef}
            facing={cameraFacing}
            flash={flashMode}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Text style={styles.scanText}>Align face within frame</Text>
              </View>

              <TouchableOpacity
                style={styles.flashButton}
                onPress={toggleFlash}
              >
                <MaterialIcons
                  name={flashMode === 'off' ? 'flash-off' : 'flash-on'}
                  size={28}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cameraSwitchButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons
                  name="camera-reverse"
                  size={28}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.processingText}>DETECTING FACES...</Text>
              </View>
            )}

            {noFacesDetected && !isProcessing && (
              <View style={styles.noFacesContainer}>
                <Text style={styles.noFacesText}>No faces detected</Text>
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={() => {
                    setIsScanning(true);
                    setNoFacesDetected(false);
                  }}
                >
                  <Text style={styles.buttonText}>
                    <MaterialIcons name="refresh" size={20} color="white" /> {' '}
                    TRY AGAIN
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </CameraView>
        </Animated.View>
      )}

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>VIOLATION RECORDED</Text>
            <Text style={styles.modalSubtitle}>
              For {selectedStudent?.name}
            </Text>
            <Text style={styles.modalDetail}>
              {selectedViolation} • {new Date().toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={reset}
            >
              <Text style={styles.buttonText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  camera: {
    flex: 1
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  corner: {
    width: 30,
    height: 30,
    position: 'absolute',
    borderColor: '#4CAF50',
    borderWidth: 0
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20
  },
  scanText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  flashButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraSwitchButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  processingText: {
    color: 'white',
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold'
  },
  noFacesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  noFacesText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center'
  },
  tryAgainButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  permissionContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  permissionTitle: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center'
  },
  permissionText: {
    color: '#616161',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  resultContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white'
  },
  resultHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1
  },
  notification: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notificationText: {
    color: '#4CAF50',
    fontWeight: '500'
  },
  listContainer: {
    paddingBottom: 20
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  selectedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#E8F5E9'
  },
  unknownCard: {
    borderColor: '#F44336',
    borderWidth: 1,
    backgroundColor: '#FFEBEE'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#212121'
  },
  unknownTitle: {
    color: '#757575'
  },
  confidenceBadge: {
    marginLeft: 'auto',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  confidenceText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5
  },
  detailText: {
    fontSize: 14,
    color: '#616161',
    marginLeft: 8
  },
  violationContainer: {
    marginTop: 10,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 8,
    letterSpacing: 1
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15
  },
  picker: {
    backgroundColor: 'white',
    height: 50
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  scanAgainButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10
  },
  successIcon: {
    marginBottom: 15
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 5,
    textAlign: 'center'
  },
  modalDetail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  }
});