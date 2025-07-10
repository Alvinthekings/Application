import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons, Feather, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
const ReportsScreen = () => {
  const { FLASK_URL } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${FLASK_URL}/get_violations`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        const formattedIncidents = result.violations.map((violation) => {
          const incidentId = `#INC-${violation.id}`; // Use actual DB ID for uniqueness
          const personName = violation.student_name || 'Unknown Individual';
          const violationType = violation.violation_type || 'Unknown Violation';
          const location = 'Camera Scan Point'; // Default
          const dateTime = new Date(violation.date);
          const timeAgo = getTimeAgo(dateTime);
          const status = violation.status || 'Pending';

          let iconName = 'alert-triangle';
          let statusColor = '#fef9c3';
          let statusTextColor = '#854d0e';

          if (status.toLowerCase() === 'new') {
            statusColor = '#fee2e2';
            statusTextColor = '#b91c1c';
            iconName = 'bell';
          } else if (status.toLowerCase() === 'in review') {
            statusColor = '#fef3c7';
            statusTextColor = '#92400e';
            iconName = 'eye';
          } else if (status.toLowerCase() === 'resolved') {
            statusColor = '#dcfce7';
            statusTextColor = '#166534';
            iconName = 'check-circle';
          } else if (status.toLowerCase() === 'pending') {
            statusColor = '#fef9c3';
            statusTextColor = '#854d0e';
            iconName = 'clock';
          }

          if (personName.includes('Unknown')) {
            iconName = 'user-x';
          }

          // Construct the image URL based on the violation ID and the new Flask endpoint
          const faceImageUrl = violation.has_face_image
            ? `${FLASK_URL}/get_violation_face_image/${violation.id}`
            : null; // No image URL if has_face_image is false

          return {
            id: incidentId,
            db_id: violation.id, // Keep for image fetching
            type: violationType,
            person: personName,
            location: location,
            time: timeAgo,
            status: status.toUpperCase(),
            color: statusColor,
            textColor: statusTextColor,
            icon: iconName,
            rawDate: dateTime,
            lrn: violation.student_id,
            grade: violation.grade_level,
            section: violation.section,
            faceImageUrl: faceImageUrl, // Add the image URL here
          };
        });
        setIncidents(formattedIncidents);
      } else {
        setError(result.message || 'Failed to fetch violations.');
      }
    } catch (err) {
      console.error('Error fetching violations:', err);
      setError('Could not load reports. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [FLASK_URL]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchViolations();
  }, [fetchViolations]);

  const getTimeAgo = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + " yr ago";
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + " mo ago";
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + " d ago";
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + " hr ago";
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + " min ago";
    return Math.floor(seconds) + " sec ago";
  };


  const renderItem = ({ item }) => (
    <View style={styles.incidentCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.incidentIconContainer, { backgroundColor: item.color }]}>
          {item.icon === 'user-x' && <Feather name="user-x" size={18} color={item.textColor} />}
          {item.icon === 'bell' && <Feather name="bell" size={18} color={item.textColor} />}
          {item.icon === 'eye' && <Feather name="eye" size={18} color={item.textColor} />}
          {item.icon === 'check-circle' && <Feather name="check-circle" size={18} color={item.textColor} />}
          {item.icon === 'clock' && <Feather name="clock" size={18} color={item.textColor} />}
          {item.icon === 'alert-triangle' && <Feather name="alert-triangle" size={18} color={item.textColor} />}
        </View>
        <Text style={styles.incidentId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.color }]}>
          <Text style={[styles.statusText, { color: item.textColor }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.incidentDetailRow}>
        <Feather name="tag" size={16} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.incidentText}>{item.type}</Text>
      </View>

      <View style={styles.incidentDetailRow}>
        <Feather name="user" size={16} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.incidentText}>{item.person}</Text>
      </View>

      {/* Display the face image here */}
      {item.faceImageUrl && (
        <View style={styles.faceImageContainer}>
          <Image
            source={{ uri: item.faceImageUrl }}
            style={styles.faceImage}
            onError={(e) => console.log("Failed to load image:", item.faceImageUrl, e.nativeEvent.error)}
          />
        </View>
      )}

      {item.grade && item.section && (
        <View style={styles.incidentDetailRow}>
          <MaterialIcons name="class" size={16} color="#6b7280" style={styles.detailIcon} />
          <Text style={styles.incidentText}>Grade {item.grade} - {item.section}</Text>
        </View>
      )}

      {item.lrn && item.lrn !== 'Unknown' && (
        <View style={styles.incidentDetailRow}>
          <MaterialIcons name="fingerprint" size={16} color="#6b7280" style={styles.detailIcon} />
          <Text style={styles.incidentText}>LRN: {item.lrn}</Text>
        </View>
      )}

      <View style={styles.incidentDetailRow}>
        <Feather name="map-pin" size={16} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.incidentText}>{item.location}</Text>
      </View>

      <View style={styles.incidentDetailRow}>
        <Feather name="clock" size={16} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.incidentText}>{item.time}</Text>
      </View>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionText}>Review Incident</Text>
        <AntDesign name="arrowright" size={16} color="#16a34a" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading Reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialIcons name="error-outline" size={50} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchViolations}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#16a34a" />
          <Text style={styles.title}>Security Reports</Text>
        </View>
      </View>

      {/* Search & Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity>
            <Feather name="sliders" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
              <Text style={[styles.filterText, styles.activeFilterText]}>All</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.exportButton}>
            <Feather name="download" size={16} color="#065f46" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Incident List */}
      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <MaterialIcons name="inbox" size={50} color="#9ca3af" />
            <Text style={styles.emptyListText}>No violations recorded yet.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />
        }
      />

      {/* Pagination (Note: this is dummy pagination; real pagination needs backend support) */}
      <View style={styles.pagination}>
        <TouchableOpacity style={styles.paginationButton}>
          <Feather name="chevron-left" size={18} color="#4b5563" />
        </TouchableOpacity>
        <View style={styles.pageNumbers}>
          <TouchableOpacity style={styles.pageButtonActive}>
            <Text style={styles.pageTextActive}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pageButton}>
            <Text style={styles.pageText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pageButton}>
            <Text style={styles.pageText}>3</Text>
          </TouchableOpacity>
          <Text style={styles.pageText}>...</Text>
          <TouchableOpacity style={styles.pageButton}>
            <Text style={styles.pageText}>8</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.paginationButton}>
          <Feather name="chevron-right" size={18} color="#4b5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReportsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4b5563',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 24,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  searchSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  activeFilter: {
    backgroundColor: '#111827',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
    gap: 6,
  },
  exportText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
  },
  listContent: {
    paddingBottom: 20,
  },
  incidentCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  incidentIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  incidentId: {
    flex: 1,
    fontWeight: '600',
    color: '#111827',
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  incidentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 10,
    opacity: 0.7,
  },
  incidentText: {
    fontSize: 14,
    color: '#4b5563',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 6,
  },
  actionText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  paginationButton: {
    padding: 8,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageButtonActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111827',
    borderRadius: 6,
  },
  pageText: {
    fontSize: 14,
    color: '#6b7280',
  },
  pageTextActive: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
  },
  faceImageContainer: {
    alignSelf: 'center', // Center the image horizontally
    marginBottom: 10, // Space below the image
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden', // Ensures image respects borderRadius
  },
  faceImage: {
    width: 80, // Adjust size as needed
    height: 80, // Adjust size as needed
    borderRadius: 8, // Match container for consistent look
  },
});