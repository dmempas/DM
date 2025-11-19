import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, claimsAPI } from '../services/api';

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('lost');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (reset = false) => {
    try {
      if (reset) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let response;
      if (activeTab === 'claims') {
        response = await claimsAPI.getMyClaims();
        setData(response.data.data.claims);
      } else {
        const params = {
          reporter_id: user.id,
          item_type: activeTab,
        };
        response = await itemsAPI.getItems(params);
        setData(response.data.data.items);
      }
    } catch (error) {
      console.error('Load history error:', error);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleItemPress = (item) => {
    if (activeTab === 'claims') {
      navigation.navigate('ItemDetails', { itemId: item.item_id });
    } else {
      navigation.navigate('ItemDetails', { itemId: item.id });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unclaimed': return '#51cf66';
      case 'pending_verification': return '#ffd43b';
      case 'pending': return '#ffd43b';
      case 'claimed': return '#339af0';
      case 'approved': return '#339af0';
      case 'rejected': return '#ff6b6b';
      case 'verified': return '#845ef7';
      default: return '#868e96';
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderHistoryItem = ({ item }) => {
    if (activeTab === 'claims') {
      return (
        <TouchableOpacity style={styles.itemCard} onPress={() => handleItemPress(item)}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.claimed_at)}</Text>
          </View>

          <Text style={styles.itemTitle}>{item.item_title}</Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.item_description}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.categoryText}>{item.item_category?.replace('_', ' ') || 'Unknown'}</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.itemCard} onPress={() => handleItemPress(item)}>
        <View style={styles.cardHeader}>
          <View style={[styles.itemTypeBadge, { backgroundColor: activeTab === 'lost' ? '#ff6b6b' : '#51cf66' }]}>
            <Text style={styles.itemTypeText}>{activeTab.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>

        {item.last_location && (
          <View style={styles.locationRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>{item.last_location}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.categoryText}>{item.category.replace('_', ' ')}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs = [
    { key: 'lost', label: 'Lost Items', icon: 'search-off' },
    { key: 'found', label: 'Found Items', icon: 'find-in-page' },
    { key: 'claims', label: 'My Claims', icon: 'gavel' },
  ];

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? '#2196F3' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      <FlatList
        data={data}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => activeTab === 'claims' ? item.id : item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="history" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No {activeTab === 'claims' ? 'claims' : activeTab} items yet
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'lost' && 'Report lost items to see them here'}
              {activeTab === 'found' && 'Report found items to see them here'}
              {activeTab === 'claims' && 'Claim items to see them here'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default HistoryScreen;