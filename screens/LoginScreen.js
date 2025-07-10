import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Green and white color theme
const Colors = {
  primaryGreen: '#00A36C',
  lightBackground: '#F8FFF8',
  white: '#FFFFFF',
  lightBorder: '#E0F0E0',
  darkText: '#333333',
  mediumText: '#666666',
  accentBackgroundLight: '#E6F4E6',
  accentTextDark: '#00704A',
  redAlert: '#d9534f',
  buttonShadow: 'rgba(0, 0, 0, 0.1)',
};

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useContext(AuthContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showCustomAlert = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  React.useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('username');
        const savedPassword = await AsyncStorage.getItem('password');
        if (savedUsername && savedPassword) {
          setUsername(savedUsername);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Error loading credentials', error);
        showCustomAlert('Error', 'Failed to load saved credentials.');
      }
    };
    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      showCustomAlert('Error', 'Please enter both username and password.');
      return;
    }

    if (rememberMe) {
      try {
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('password', password);
      } catch (error) {
        console.log('Error saving credentials', error);
        showCustomAlert('Error', 'Failed to save credentials.');
      }
    } else {
      try {
        await AsyncStorage.removeItem('username');
        await AsyncStorage.removeItem('password');
      } catch (error) {
        console.log('Error removing credentials', error);
        showCustomAlert('Error', 'Failed to remove credentials.');
      }
    }

    try {
      await login(username, password);
      navigation.replace('GuardHomePage');
    } catch (error) {
      console.error('Login or navigation error:', error);
      showCustomAlert('Login Failed', error.message || 'An unexpected error occurred during login.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        {/* New Welcome Text */}
        <Text style={styles.welcomeText}>Welcome to Nicolites Portal</Text>
        {/* --- */}
        <FormInput
          labelValue={username}
          onChangeText={(text) => setUsername(text)}
          placeholderText="Username"
          iconType="account"
          autoCapitalize="none"
          autoCorrect={false}
          inputStyle={styles.input}
          placeholderTextColor={Colors.mediumText}
        />
        <FormInput
          labelValue={password}
          onChangeText={(text) => setPassword(text)}
          placeholderText="Password"
          iconType="lock"
          secureTextEntry={true}
          inputStyle={styles.input}
          placeholderTextColor={Colors.mediumText}
        />

        <View style={styles.rememberForgotContainer}>
          <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.checkboxTouchArea}>
            <View style={styles.checkboxContainer}>
              <View style={rememberMe ? styles.checkboxChecked : styles.checkbox}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.label}>Remember me</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotButton}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <FormButton
          buttonTitle="Sign In"
          onPress={handleLogin}
          buttonStyle={styles.submitButton}
          textStyle={styles.submitButtonText}
        />

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.navButtonText}>Don't have an account? Create here</Text>
        </TouchableOpacity>
      </View>

      {/* Alert Modal */}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.lightBackground,
    paddingTop: 50,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    marginBottom: 20,
    alignItems: 'center',
    ...Platform.select({
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
  // New style for the welcome text
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryGreen,
    marginBottom: 30,
    textAlign: 'center',
  },
  // ---
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.darkText,
    marginBottom: 15,
    width: '100%',
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  checkboxTouchArea: {
    paddingVertical: 5,
    paddingRight: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: Colors.primaryGreen,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: Colors.primaryGreen,
    backgroundColor: Colors.primaryGreen,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    color: Colors.mediumText,
    fontSize: 14,
  },
  forgotButton: {
    color: Colors.primaryGreen,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: Colors.primaryGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    ...Platform.select({
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
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButton: {
    marginTop: 20,
    paddingVertical: 5,
  },
  navButtonText: {
    fontSize: 16,
    color: Colors.primaryGreen,
    textDecorationLine: 'underline',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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

export default LoginScreen;