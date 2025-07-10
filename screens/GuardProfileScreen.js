// GuardProfileScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Image, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';

const GuardProfileScreen = () => {
  const { userInfo, BASE_URL } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [stationName, setStationName] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [dateHired, setDateHired] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (userInfo) {
      setFullName(userInfo.full_name || '');
      setStationName(userInfo.station_name || '');
      setShiftStart(userInfo.shift_start || '');
      setShiftEnd(userInfo.shift_end || '');
      setContactNumber(userInfo.contact_number || '');
      setDateHired(userInfo.date_hired || '');
      setProfileImage(userInfo.profile_photo ? `${BASE_URL}/${userInfo.profile_photo}` : null);
    }
  }, [userInfo]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('id', userInfo.id);
    formData.append('full_name', fullName);
    formData.append('station_name', stationName);
    formData.append('shift_start', shiftStart);
    formData.append('shift_end', shiftEnd);
    formData.append('contact_number', contactNumber);
    formData.append('date_hired', dateHired);

    if (profileImage && !profileImage.includes(BASE_URL)) {
      const uriParts = profileImage.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('profile_photo', {
        uri: profileImage,
        name: `profile_${userInfo.id}.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    try {
      const response = await fetch(`${BASE_URL}/update_profile.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      Alert.alert(data.success ? 'Success' : 'Error', data.message);
    } catch (error) {
      console.error('Profile update failed:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}><Text>Pick Photo</Text></View>
        )}
      </TouchableOpacity>

      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full Name" />
      <TextInput style={styles.input} value={stationName} onChangeText={setStationName} placeholder="Station Name" />
      <TextInput style={styles.input} value={shiftStart} onChangeText={setShiftStart} placeholder="Shift Start (HH:MM)" />
      <TextInput style={styles.input} value={shiftEnd} onChangeText={setShiftEnd} placeholder="Shift End (HH:MM)" />
      <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} placeholder="Contact Number" keyboardType="phone-pad" />
      <TextInput style={styles.input} value={dateHired} onChangeText={setDateHired} placeholder="Date Hired (YYYY-MM-DD)" />

      <Button title="Save Changes" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});

export default GuardProfileScreen;
