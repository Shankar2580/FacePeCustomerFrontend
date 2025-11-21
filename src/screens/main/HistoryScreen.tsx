import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api/apiService';
import Colors from '@/constants/colors';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import { sharedHeaderStyles } from '@/constants/layout';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  customer_name?: string;
  created_at: string;
  description?: string;
}

type FilterType = 'all' | 'completed' | 'pending' | 'failed' | 'expired';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useStyledAlert();
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchTransactions = async (statusFilter?: string, targetFilter?: FilterType) => {
    try {
      // Fetch with status filter for better performance, but for "all" case don't pass filter
      const response = await apiService.merchant.getTransactions(statusFilter);
      const transactionData = response.data || [];
      
      if (!statusFilter) {
        // When fetching all transactions (no filter), store all and apply the target filter
        setTransactions(transactionData);
        const filterToApply = targetFilter || activeFilter;
        filterTransactions(transactionData, filterToApply);
      } else {
        // When fetching with specific filter, set both full list and filtered list
        setTransactions(transactionData);
        setFilteredTransactions(transactionData);
      }
    } catch (error) {
      showAlert('Error', 'Failed to load transaction history', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeFilter === 'all') {
      await fetchTransactions(undefined, activeFilter);
    } else {
      await fetchTransactions(activeFilter);
    }
    setRefreshing(false);
  };

  const filterTransactions = (transactionList: Transaction[], filter: FilterType) => {
    if (filter === 'all') {
      setFilteredTransactions(transactionList);
    } else {
      const filtered = transactionList.filter(t => 
        t.status.toLowerCase() === filter.toLowerCase()
      );
      setFilteredTransactions(filtered);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    // Fix: For "all" filter, fetch all transactions, for others fetch with specific filter
    if (filter === 'all') {
      fetchTransactions(undefined, filter); // Pass the target filter to ensure correct filtering
    } else {
      fetchTransactions(filter);
    }
  };

  useEffect(() => {
    fetchTransactions(); // Fetch all transactions initially
  }, []);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      case 'expired':
        return '#9CA3AF';
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.status.completed;
      case 'pending':
        return Colors.status.pending;
      case 'failed':
        return Colors.status.failed;
      case 'expired':
        return '#F3F4F6';
      default:
        return Colors.background.overlay;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      case 'expired':
        return 'time-outline';
      default:
        return 'help-circle';
    }
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'expired', label: 'Expired' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={Colors.gradients.header}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Transaction History</Text>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.filterTabActive
              ]}
              onPress={() => handleFilterChange(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryIntro}>
          <Text style={styles.summaryTitle}>Payment activity</Text>
          <Text style={styles.summarySubtitle}>
            Filter by status to quickly review transactions.
          </Text>
        </View>

        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: getStatusBg(transaction.status) }
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(transaction.status)} 
                      size={20} 
                      color={getStatusColor(transaction.status)} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCustomer}>
                      {transaction.customer_name || 'Customer'}
                    </Text>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || 'Payment transaction'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.created_at)} • {formatTime(transaction.created_at)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBg(transaction.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(transaction.status) }
                    ]}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.text.muted} />
            <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
            <Text style={styles.emptyStateText}>
              {activeFilter === 'all' 
                ? 'You haven\'t made any transactions yet'
                : `No ${activeFilter} transactions found`
              }
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Styled Alert Component */}
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filtersContainer: {
    paddingVertical: 16,
    backgroundColor: '#F8F7FF',
    marginTop: -8,
  },
  filtersContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterTabTextActive: {
    color: Colors.text.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  summaryIntro: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  transactionsList: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 4,
    marginTop: 8,
    elevation: 2,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: Colors.text.muted,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 