import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, StyleSheet, Image, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Added MaterialIcons for consistency
import { AuthContext } from '../context/AuthContext';

// Define a color palette based on the requested green and white design
const Colors = {
  primaryGreen: '#00A36C', // Main accent green
  lightBackground: '#F8FFF8', // Very light green/off-white for main background
  white: '#FFFFFF', // Pure white for cards and header
  lightBorder: '#E0F0E0', // Light green border for cards/inputs
  darkText: '#333333', // Dark gray for primary text
  mediumText: '#666666', // Medium gray for secondary text
  accentBackgroundLight: '#E6F4E6', // Lighter green for icon circles and alert background
  accentTextDark: '#00704A', // Darker green for alert text and strong accents
  redAlert: '#d9534f', // Keeping the red for alerts/new badges (for warning/new indicators)
  buttonShadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow for buttons
};

export default function RegisterFaceScreen() {
  const { BASE_URL } = useContext(AuthContext);
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState('');
  const [LRN, setLRN] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert('Permission Denied', 'Camera access is required to take photos.');
      }
    })();
  }, []);

  // Custom Alert Function
  const showCustomAlert = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showCustomAlert('Camera Error', error.message);
    }
  };

  const handleUpload = async () => {
    if (!BASE_URL) {
      showCustomAlert('Error', 'Server URL is not configured');
      return;
    }

    if (!photo) return showCustomAlert('Error', 'Please take a photo first');
    if (!name || !LRN || !grade || !section) {
      return showCustomAlert('Error', 'All fields are required');
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('LRN', LRN);
    formData.append('Grade_level', grade);
    formData.append('section', section);
    formData.append('image', {
      uri: photo.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await fetch(`${BASE_URL}/register_face.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid server response');
      }

      if (result.success) {
        showCustomAlert('Success', result.message);
        setName('');
        setLRN('');
        setGrade('');
        setSection('');
        setPhoto(null);
      } else {
        showCustomAlert('Error', result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showCustomAlert('Error', error.message || 'Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Student Registration</Text>

        {photo ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <TouchableOpacity style={styles.retakeButton} onPress={pickImage}>
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Ionicons name="camera" size={32} color={Colors.white} />
            <Text style={styles.cameraButtonText}>Take Photo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            placeholder="Enter full name"
            placeholderTextColor={Colors.mediumText}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>LRN</Text>
          <TextInput
            placeholder="Enter LRN"
            placeholderTextColor={Colors.mediumText}
            value={LRN}
            onChangeText={setLRN}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Grade Level</Text>
          <TextInput
            placeholder="Enter grade level"
            placeholderTextColor={Colors.mediumText}
            value={grade}
            onChangeText={setGrade}
            style={styles.input}
          />

          <Text style={styles.label}>Section</Text>
          <TextInput
            placeholder="Enter section"
            placeholderTextColor={Colors.mediumText}
            value={section}
            onChangeText={setSection}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleUpload}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Register Student'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.primaryGreen }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  scrollContainer: {
    padding: 25,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26, // Slightly larger title
    fontWeight: 'bold',
    color: Colors.primaryGreen,
    marginBottom: 25, // Increased margin
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
    backgroundColor: Colors.white, // White background for form fields block
    borderRadius: 12, // Rounded corners for the block
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    ...Platform.select({ // Subtle shadow
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  label: {
    fontSize: 14,
    color: Colors.darkText,
    marginBottom: 5,
    marginTop: 10,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.darkText, // Ensure input text is dark
    marginBottom: 5,
  },
  cameraButton: {
    backgroundColor: Colors.primaryGreen,
    padding: 15,
    borderRadius: 12, // More rounded button
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 15,
    ...Platform.select({ // Subtle shadow for button
      ios: {
        shadowColor: Colors.buttonShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cameraButtonText: {
    color: Colors.white,
    fontSize: 18, // Slightly larger text
    fontWeight: 'bold',
    marginLeft: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: Colors.white, // White background for image container
    borderRadius: 12,
    padding: 10, // Padding around the image
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    ...Platform.select({ // Subtle shadow
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  preview: {
    width: '100%',
    height: 250,
    borderRadius: 8, // Slightly less rounded than container
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: Colors.lightBorder,
  },
  retakeButton: {
    marginTop: 15, // Increased margin
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.accentBackgroundLight, // Light green background
  },
  retakeButtonText: {
    color: Colors.accentTextDark, // Darker green text
    fontWeight: 'bold',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: Colors.primaryGreen,
    padding: 16,
    borderRadius: 12, // More rounded button
    alignItems: 'center',
    marginTop: 20, // Increased margin
    ...Platform.select({ // Subtle shadow for button
      ios: {
        shadowColor: Colors.buttonShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7', // Lighter green when disabled
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18, // Slightly larger text
    fontWeight: 'bold',
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black background
  },
  modalView: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.mediumText,
  },
  modalButton: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
