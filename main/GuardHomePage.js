import React, { useContext, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

// Enhanced color palette for security interface
const Colors = {
  primary: '#0B8457', // Darker green for better contrast
  primaryLight: '#E8F5E9',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  darkGray: '#333333',
  mediumGray: '#666666',
  alertRed: '#E53935',
  warningOrange: '#FF8F00',
  successGreen: '#2E7D32',
  infoBlue: '#0288D1',
  border: '#E0E0E0',
  // New color for a subtle background
  background: '#F9F9F9',
  // New color for slightly darker text
  textDark: '#2C3E50',
};

const GuardHomePage = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Sample incident data
  const incidents = [
    {
      id: '#INC-4582',
      type: 'Unauthorized Access',
      person: 'Unknown Male',
      location: 'Main Entrance',
      time: '2 min ago',
      status: 'NEW',
      priority: 'high',
      icon: 'alert-circle',
    },
    {
      id: '#INC-4581',
      type: 'Restricted Area',
      person: 'Jane Smith (Staff)',
      location: 'Server Room',
      time: '15 min ago',
      status: 'IN REVIEW',
      priority: 'medium',
      icon: 'alert-octagon',
    },
    {
      id: '#INC-4580',
      type: 'Loitering',
      person: 'Unknown Individual',
      location: 'West Wing',
      time: '32 min ago',
      status: 'PENDING',
      priority: 'low',
      icon: 'user-x',
    },
    {
      id: '#INC-4579',
      type: 'Suspicious Activity',
      person: 'Unknown Female',
      location: 'Loading Dock',
      time: '1 hr ago',
      status: 'NEW',
      priority: 'high',
      icon: 'eye',
    },
    {
      id: '#INC-4578',
      type: 'Lost Item',
      person: 'John Doe (Visitor)',
      location: 'Lobby',
      time: '2 hrs ago',
      status: 'RESOLVED',
      priority: 'low',
      icon: 'package',
    },
  ];

  const filteredIncidents = incidents.filter((incident) => {
    if (activeFilter === 'all') {
      return true;
    }
    // Check if the active filter matches status or priority
    return (
      incident.status.toLowerCase().replace(' ', '') === activeFilter ||
      incident.priority.toLowerCase() === activeFilter
    );
  });

  const renderIncidentItem = ({ item }) => {
    let statusColor, bgColor;

    switch (item.priority) {
      case 'high':
        statusColor = Colors.alertRed;
        bgColor = '#FFEBEE';
        break;
      case 'medium':
        statusColor = Colors.warningOrange;
        bgColor = '#FFF3E0';
        break;
      default:
        statusColor = Colors.infoBlue;
        bgColor = '#E3F2FD';
    }

    return (
      <TouchableOpacity
        style={[styles.incidentCard, { borderLeftWidth: 5, borderLeftColor: statusColor }]}
        onPress={() => navigation.navigate('IncidentDetail', { incident: item })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.incidentIconContainer, { backgroundColor: bgColor }]}>
            <Feather name={item.icon} size={20} color={statusColor} />
          </View>
          <Text style={styles.incidentId}>{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.incidentDetailRow}>
          <Feather name="alert-triangle" size={18} color={Colors.darkGray} style={styles.detailIcon} />
          <Text style={styles.incidentText}>{item.type}</Text>
        </View>

        <View style={styles.incidentDetailRow}>
          <Feather name="user" size={18} color={Colors.darkGray} style={styles.detailIcon} />
          <Text style={styles.incidentText}>{item.person}</Text>
        </View>

        <View style={styles.incidentDetailRow}>
          <Feather name="map-pin" size={18} color={Colors.darkGray} style={styles.detailIcon} />
          <Text style={styles.incidentText}>{item.location}</Text>
        </View>

        <View style={styles.incidentDetailRow}>
          <Feather name="clock" size={18} color={Colors.darkGray} style={styles.detailIcon} />
          <Text style={styles.incidentText}>{item.time}</Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('IncidentDetail', { incident: item })}
        >
          <Text style={styles.actionText}>Review Incident</Text>
          <AntDesign name="arrowright" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome, {userInfo?.username || 'Officer'}!</Text>
            <Text style={styles.tagline}>Security Dashboard</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {/* Replace with actual user avatar */}
            <Image
              source={{
                uri: 'https://via.placeholder.com/40/0B8457/FFFFFF?text=JD',
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('AutoDetect')}
            >
              <View style={[styles.iconCircle, { backgroundColor: Colors.primaryLight }]}>
                <MaterialIcons name="camera-alt" size={30} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>Auto Detect</Text>
              <Text style={styles.quickActionSubtitle}>Scan for violations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('RegisterFace')}
            >
              <View style={[styles.iconCircle, { backgroundColor: Colors.primaryLight }]}>
                <MaterialIcons name="person-add" size={30} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>Register Face</Text>
              <Text style={styles.quickActionSubtitle}>Add new person</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alert Banner */}
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('Incidents')}
        >
          <View style={styles.alertIcon}>
            <Ionicons name="warning" size={26} color={Colors.white} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>3 Active Incidents</Text>
            <Text style={styles.alertSubtitle}>2 high priority - Tap to review</Text>
          </View>
          <MaterialIcons name="chevron-right" size={26} color={Colors.white} />
        </TouchableOpacity>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Incidents Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Incidents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithButton}>
            <Text style={styles.sectionTitle}>Recent Incidents</Text>
            <TouchableOpacity
              style={styles.filterButtonOutline}
              onPress={() => setFilterModalVisible(true)}
            >
              <Feather name="filter" size={18} color={Colors.primary} />
              <Text style={styles.filterButtonTextOutline}>Filter</Text>
            </TouchableOpacity>
          </View>
          {filteredIncidents.length > 0 ? (
            <FlatList
              data={filteredIncidents}
              renderItem={renderIncidentItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // To allow ScrollView to handle overall scrolling
              contentContainerStyle={styles.incidentsList}
            />
          ) : (
            <View style={styles.noIncidentsContainer}>
              <Feather name="check-circle" size={50} color={Colors.mediumGray} />
              <Text style={styles.noIncidentsText}>No incidents found for the selected filter.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        animationType="fade" // Changed to fade for a smoother transition
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.filterModal}>
          <Text style={styles.modalTitle}>Filter Incidents</Text>

          <View style={styles.filterOption}>
            <Text style={styles.filterOptionLabel}>Status</Text>
            <View style={styles.filterButtons}>
              {['all', 'new', 'in review', 'pending', 'resolved'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    activeFilter === filter.replace(' ', '') && styles.activeFilterButton,
                  ]}
                  onPress={() => setActiveFilter(filter.replace(' ', ''))}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      activeFilter === filter.replace(' ', '') && styles.activeFilterButtonText,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterOption}>
            <Text style={styles.filterOptionLabel}>Priority</Text>
            <View style={styles.filterButtons}>
              {['all', 'high', 'medium', 'low'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterButton,
                    activeFilter === priority && styles.activeFilterButton,
                  ]}
                  onPress={() => setActiveFilter(priority)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      activeFilter === priority && styles.activeFilterButtonText,
                    ]}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setFilterModalVisible(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Use new background color
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 15,
  },
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  filterButtonTextOutline: {
    marginLeft: 8,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '48%', // Approx half width minus gap
    marginBottom: 15,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: Colors.mediumGray,
    textAlign: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.alertRed, // Use alertRed for a prominent warning
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: Colors.alertRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  alertIcon: {
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.mediumGray,
    textAlign: 'center',
  },
  incidentsList: {
    paddingHorizontal: 0, // No horizontal padding here, handled by section
  },
  incidentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  incidentIconContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  incidentId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  incidentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 10,
    width: 20, // Fixed width for alignment
  },
  incidentText: {
    fontSize: 15,
    color: Colors.darkGray,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  actionText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: Colors.white,
    width: '90%',
    borderRadius: 15,
    padding: 25,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 25,
    textAlign: 'center',
  },
  filterOption: {
    marginBottom: 20,
  },
  filterOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, // Modern way to add space between wrapped items
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.darkGray,
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  noIncidentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  noIncidentsText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.mediumGray,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default GuardHomePage;