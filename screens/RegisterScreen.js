import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, ScrollView, Image } from 'react-native';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import { AuthContext } from '../context/AuthContext';

// Enhanced color palette with better contrast and visual hierarchy
const Colors = {
  primaryGreen: '#00A36C',
  primaryDarkGreen: '#008055',
  lightBackground: '#F8FFF8',
  white: '#FFFFFF',
  lightBorder: '#E0F0E0',
  darkText: '#2D3748',
  mediumText: '#718096',
  accentBackgroundLight: '#E6F4E6',
  accentTextDark: '#00704A',
  redAlert: '#E53E3E',
  buttonShadow: 'rgba(0, 0, 0, 0.1)',
  inputFocus: '#EBF8F2',
};

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const { register } = useContext(AuthContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showCustomAlert = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleRegister = () => {
    if (!username || !email || !password || !confirmPassword) {
      showCustomAlert('Missing Information', 'Please fill in all fields to continue.');
      return;
    }

    if (password !== confirmPassword) {
      showCustomAlert('Password Mismatch', 'The passwords you entered do not match. Please try again.');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      showCustomAlert('Invalid Email', 'Currently we only support @gmail.com addresses.');
      return;
    }

    if (password.length < 6) {
      showCustomAlert('Weak Password', 'Password should be at least 6 characters long.');
      return;
    }

    register(username, email, password, confirmPassword);
  };

  const handleInputFocus = (inputName) => {
    setFocusedInput(inputName);
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../assets/capstone_logo.png')} // Add your logo here
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Join us to get started</Text>
        </View>

        <View style={styles.formContainer}>
          <FormInput
            labelValue={username}
            onChangeText={setUsername}
            onFocus={() => handleInputFocus('username')}
            onBlur={handleInputBlur}
            placeholderText="Username"
            iconType="account"
            autoCapitalize="none"
            autoCorrect={false}
            inputStyle={[
              styles.input,
              focusedInput === 'username' && styles.inputFocused
            ]}
            containerStyle={styles.inputContainer}
            placeholderTextColor={Colors.mediumText}
          />

          <FormInput
            labelValue={email}
            onChangeText={setEmail}
            onFocus={() => handleInputFocus('email')}
            onBlur={handleInputBlur}
            placeholderText="Email (example@gmail.com)"
            iconType="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            inputStyle={[
              styles.input,
              focusedInput === 'email' && styles.inputFocused
            ]}
            containerStyle={styles.inputContainer}
            placeholderTextColor={Colors.mediumText}
          />

          <FormInput
            labelValue={password}
            onChangeText={setPassword}
            onFocus={() => handleInputFocus('password')}
            onBlur={handleInputBlur}
            placeholderText="Password (min 6 characters)"
            iconType="lock"
            secureTextEntry={true}
            inputStyle={[
              styles.input,
              focusedInput === 'password' && styles.inputFocused
            ]}
            containerStyle={styles.inputContainer}
            placeholderTextColor={Colors.mediumText}
          />

          <FormInput
            labelValue={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => handleInputFocus('confirmPassword')}
            onBlur={handleInputBlur}
            placeholderText="Confirm Password"
            iconType="lock"
            secureTextEntry={true}
            inputStyle={[
              styles.input,
              focusedInput === 'confirmPassword' && styles.inputFocused
            ]}
            containerStyle={styles.inputContainer}
            placeholderTextColor={Colors.mediumText}
          />
        </View>

        <FormButton
          buttonTitle="Sign Up"
          onPress={handleRegister}
          buttonStyle={styles.submitButton}
          textStyle={styles.submitButtonText}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Enhanced Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mediumText,
  },
  formContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.darkText,
    height: 52,
  },
  inputFocused: {
    borderColor: Colors.primaryGreen,
    backgroundColor: Colors.inputFocus,
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: Colors.primaryGreen,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: Colors.buttonShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 16,
    color: Colors.mediumText,
    marginRight: 8,
  },
  footerLink: {
    fontSize: 16,
    color: Colors.primaryGreen,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Enhanced Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalView: {
    width: '80%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accentBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryGreen,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: Colors.mediumText,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtonContainer: {
    width: '100%',
  },
  modalButton: {
    backgroundColor: Colors.primaryGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RegisterScreen;