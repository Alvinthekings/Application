import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const SearchScreen = () => {
  const { userInfo, BASE_URL } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState('student_name');

  const searchViolations = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/search_violation.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          type: searchType,
          guard_id: userInfo.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }

      if (data.success) {
        setSearchResults(data.violations);
      } else {
        Alert.alert('Error', data.message || 'No violations found');
        setSearchResults([]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not connect to server');
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSearchType = () => {
    setSearchType(prev => prev === 'student_name' ? 'violation_type' : 'student_name');
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderViolationItem = ({ item }) => (
    <View style={styles.violationCard}>
      <View style={styles.studentHeader}>
        <Text style={styles.studentName}>{item.student_name}</Text>
        <Text style={styles.studentDetails}>
          ID: {item.student_id} • Grade {item.grade_level}-{item.section}
        </Text>
      </View>
      
      <View style={styles.violationDetails}>
        <Text style={styles.violationType}>{item.violation_type}</Text>
        <Text style={styles.violationDate}>{item.date_formatted}</Text>
        {item.confidence && (
          <Text style={styles.confidenceText}>
            Confidence: {item.confidence}%
          </Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'resolved' ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.reportedBy}>
            Reported by: {item.reported_by}
          </Text>
        </View>
        
        {item.evidence_image && (
          <TouchableOpacity style={styles.viewEvidenceBtn}>
            <Text style={styles.viewEvidenceText}>View Evidence</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Violation Search</Text>
        <Text style={styles.guardInfo}>Logged in as: {userInfo.username}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.searchTypeButton}
          onPress={toggleSearchType}
        >
          <Text style={styles.searchTypeText}>
            Search by: {searchType === 'student_name' ? 'Student Name' : 'Violation Type'}
          </Text>
          <MaterialIcons 
            name="swap-vert" 
            size={20} 
            color="#2E8B57" 
            style={styles.swapIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchType === 'student_name' ? 'Enter student name...' : 'Enter violation type...'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchViolations}
        />
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={searchViolations}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="search" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Searching violations...</Text>
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderViolationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsContainer}
        />
      ) : (
        <View style={styles.initialState}>
          <MaterialIcons 
            name="search" 
            size={50} 
            color="#2E8B57" 
          />
          <Text style={styles.initialStateText}>
            {searchType === 'student_name' 
              ? 'Search for students by name' 
              : 'Search for violations by type'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#2E8B57',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  guardInfo: {
    color: '#e0f7e0',
    fontSize: 14,
    marginTop: 5,
  },
  controlsContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  searchTypeButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
  },
  searchTypeText: {
    color: '#2E8B57',
    fontWeight: '500',
    marginRight: 5,
  },
  swapIcon: {
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2E8B57',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultsContainer: {
    padding: 15,
  },
  violationCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  violationDetails: {
    marginBottom: 10,
  },
  violationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  violationDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  confidenceText: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportedBy: {
    fontSize: 12,
    color: '#666',
  },
  viewEvidenceBtn: {
    padding: 5,
  },
  viewEvidenceText: {
    color: '#2E8B57',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  initialStateText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SearchScreen;