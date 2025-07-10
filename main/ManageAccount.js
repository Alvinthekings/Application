// main/ManageAccount.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';

const ManageAccount = () => {
  const accountOptions = [
    { icon: 'user', name: 'Personal Information', action: 'Edit' },
    { icon: 'lock', name: 'Password', action: 'Change' },
    { icon: 'creditcard', name: 'Payment Methods', action: 'Manage' },
    { icon: 'mail', name: 'Email Address', action: 'Update' },
    { icon: 'bell', name: 'Notification Preferences', action: 'Configure' },
    { icon: 'shield', name: 'Privacy Settings', action: 'Adjust' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
        <Text style={styles.subtitle}>Manage your account preferences</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="account-circle" size={80} color="#2E8B57" />
        </View>
        <Text style={styles.userName}>John Doe</Text>
        <Text style={styles.userEmail}>john.doe@example.com</Text>
      </View>

      <View style={styles.optionsContainer}>
        {accountOptions.map((option, index) => (
          <TouchableOpacity key={index} style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <Feather name={option.icon} size={24} color="#2E8B57" />
              <Text style={styles.optionText}>{option.name}</Text>
            </View>
            <View style={styles.optionRight}>
              <Text style={styles.actionText}>{option.action}</Text>
              <AntDesign name="right" size={16} color="#888" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ManageAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  optionsContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  actionText: {
    fontSize: 14,
    marginRight: 10,
    color: '#888',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9534f',
    alignItems: 'center',
  },
  logoutText: {
    color: '#d9534f',
    fontSize: 16,
    fontWeight: '600',
  },
});