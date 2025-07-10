import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const SearchScreen = () => {
  const { userInfo, BASE_URL, isLoading: authLoading } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [searchType, setSearchType] = useState('student_name');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef(null);

  // Debounced function to fetch suggestions from backend
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);
        
        const response = await fetch(`${BASE_URL}/get_search_suggestions.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            query: query,
            type: searchType
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 300); // 300ms debounce delay
  };

  const handleInputChange = (text) => {
    setSearchQuery(text);
    fetchSuggestions(text);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    searchViolations(suggestion);
  };

  const searchViolations = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setShowSuggestions(false);
    setIsSearching(true);

    try {
      const response = await fetch(`${BASE_URL}/search_violation.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          type: searchType
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Search failed');
      }

      setSearchResults(data.violations || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', error.message || 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSearchType = () => {
    setSearchType(prev => prev === 'student_name' ? 'violation_type' : 'student_name');
    setSearchQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Render functions
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
          <Text style={styles.confidenceText}>Confidence: {item.confidence}%</Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'resolved' ? '#4CAF50' : '#FF9800' }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.reportedBy}>
          Reported by: {item.reported_by || 'System'}
        </Text>
      </View>
    </View>
  );

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <MaterialIcons name="search" size={20} color="#888" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Violation Search</Text>
        <Text style={styles.guardInfo}>Logged in as: {userInfo.username}</Text>
      </View>

      <View style={styles.searchControls}>
        <TouchableOpacity 
          style={styles.searchTypeButton}
          onPress={toggleSearchType}
        >
          <Text style={styles.searchTypeText}>
            {searchType === 'student_name' ? 'Search by: Student Name' : 'Search by: Violation Type'}
          </Text>
          <MaterialIcons 
            name="swap-vert" 
            size={20} 
            color="#2E8B57" 
            style={styles.swapIcon}
          />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchType === 'student_name' ? 'Enter student name...' : 'Enter violation type...'}
            value={searchQuery}
            onChangeText={handleInputChange}
            onSubmitEditing={() => searchViolations()}
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={() => searchViolations()}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="search" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggestions dropdown */}
      {showSuggestions && searchQuery.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {isFetchingSuggestions ? (
            <ActivityIndicator size="small" color="#2E8B57" style={styles.suggestionLoading} />
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item, index) => index.toString()}
              keyboardShouldPersistTaps="always"
            />
          ) : (
            <View style={styles.noSuggestions}>
              <Text style={styles.noSuggestionsText}>No suggestions found</Text>
            </View>
          )}
        </View>
      )}

      {/* Search results */}
      {isSearching ? (
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
          <MaterialIcons name="search" size={50} color="#2E8B57" />
          <Text style={styles.initialStateText}>
            {searchQuery 
              ? 'No results found. Try a different search term.'
              : searchType === 'student_name' 
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
  searchControls: {
    padding: 15,
  },
  searchTypeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#e8f5e9',
    marginBottom: 10,
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
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2E8B57',
    padding: 15,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
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
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
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
  // New styles for suggestions
  suggestionsContainer: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 5,
    marginHorizontal: 15,
    marginTop: -10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  suggestionLoading: {
    padding: 15,
  },
  noSuggestions: {
    padding: 15,
    alignItems: 'center',
  },
  noSuggestionsText: {
    color: '#888',
    fontSize: 14,
  },
});

export default SearchScreen;