import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Colors = {
  primary: '#0B8457',
  primaryLight: '#E8F5E9',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  darkGray: '#333333',
  mediumGray: '#666666',
  alertRed: '#E53935',
  border: '#E0E0E0'
};

const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout, BASE_URL } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    address: '',
    contact_number: '',
    profile_photo: null
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${BASE_URL}/get_profile.php`, {
          id: userInfo.id
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          setProfileData({
            full_name: response.data.profile.full_name || '',
            email: response.data.profile.email || userInfo.email || '',
            address: response.data.profile.address || '',
            contact_number: response.data.profile.contact_number || '',
            profile_photo: response.data.profile.profile_photo
              ? `${BASE_URL}/${response.data.profile.profile_photo}`
              : null
          });
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        Alert.alert('Error', 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userInfo.id, BASE_URL, userInfo.email]);

  const pickImage = async () => {
  try {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to change your profile picture');
      return;
    }

    // Launch image picker with correct mediaTypes syntax
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Updated this line
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileData(prev => ({ 
        ...prev, 
        profile_photo: result.assets[0].uri 
      }));
    }
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert('Error', 'Failed to pick image');
  }
};
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('id', userInfo.id);
      formData.append('full_name', profileData.full_name);
      formData.append('email', profileData.email);
      formData.append('address', profileData.address);
      formData.append('contact_number', profileData.contact_number);
      
      if (profileData.profile_photo?.startsWith('file://')) {
        formData.append('profile_photo', {
          uri: profileData.profile_photo,
          name: 'profile.jpg',
          type: 'image/jpeg'
        });
      }

      if (password) {
        formData.append('password', password);
      }

      console.log('Sending update request...');
      const response = await axios.post(`${BASE_URL}/update_profile.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        Alert.alert('Success', 'Profile updated successfully');
        if (response.data.profile_photo) {
          setProfileData(prev => ({
            ...prev,
            profile_photo: `${BASE_URL}/${response.data.profile_photo}`
          }));
        }
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      let errorMessage = error.message;
      
      if (error.response) {
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error - no response from server';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profileData.profile_photo ? (
              <Image source={{ uri: profileData.profile_photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={50} color={Colors.white} />
              </View>
            )}
            <View style={styles.editIcon}>
              <Feather name="edit-2" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        
          <View style={styles.userInfo}>
            <Text style={styles.username}>{userInfo.username}</Text>
            <Text style={styles.userRole}>Security Officer</Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.mediumGray}
              value={profileData.full_name}
              onChangeText={(text) => setProfileData({...profileData, full_name: text})}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Colors.mediumGray}
              value={profileData.email}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Feather name="home" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor={Colors.mediumGray}
              value={profileData.address}
              onChangeText={(text) => setProfileData({...profileData, address: text})}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Feather name="phone" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contact Number"
              placeholderTextColor={Colors.mediumGray}
              value={profileData.contact_number}
              onChangeText={(text) => setProfileData({...profileData, contact_number: text})}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="New Password (leave blank to keep current)"
              placeholderTextColor={Colors.mediumGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={Colors.mediumGray}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Feather name="save" size={20} color={Colors.white} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            logout();
          }}
        >
          <Feather name="log-out" size={20} color={Colors.alertRed} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: Colors.alertRed }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: Colors.mediumGray,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkGray,
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 30,
    marginHorizontal: 20,
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.alertRed,
    marginHorizontal: 20,
    marginTop: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ProfileScreen;