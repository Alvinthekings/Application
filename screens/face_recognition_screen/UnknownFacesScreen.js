import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const UnknownFacesScreen = () => {
  const { FLASK_URL } = useContext(AuthContext);
  const [unknownFaces, setUnknownFaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnknownFaces = async () => {
      try {
        const response = await fetch(`${FLASK_URL}/get_unknown_faces`);
        const result = await response.json();
        if (result.success) {
          setUnknownFaces(result.unknown_faces);
        }
      } catch (error) {
        console.error('Error fetching unknown faces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnknownFaces();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unknown Faces Detected</Text>
      <FlatList
        data={unknownFaces}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.faceCard}>
            <Image 
              source={{ uri: `${FLASK_URL}/${item.image_path}` }} 
              style={styles.faceImage}
              resizeMode="cover"
            />
            <View style={styles.faceInfo}>
              <Text style={styles.faceDate}>
                Detected: {new Date(item.detection_time).toLocaleString()}
              </Text>
              <Text style={styles.faceLocation}>
                Location: {item.location || 'Unknown'}
              </Text>
              {item.notes && (
                <Text style={styles.faceNotes}>
                  Status: {item.notes}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  faceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  faceImage: {
    width: '100%',
    height: 200,
  },
  faceInfo: {
    padding: 12,
  },
  faceDate: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 4,
  },
  faceLocation: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 4,
  },
  faceNotes: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default UnknownFacesScreen;