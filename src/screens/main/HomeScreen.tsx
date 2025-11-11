import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api/apiService';
import Colors from '@/constants/colors';
import { Linking } from 'react-native';
import { useStyledAlert } from '@/components/ui/StyledAlert';

interface DashboardData {
  todayEarnings: number;
  todayTransactions: number;
  allTimeEarnings?: number; // Optional for debugging
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    customer_name?: string;
    created_at: string;
  }>;
}

export default function HomeScreen() {
  const { user, logout, startMerchantOnboarding, refreshUserProfile, refreshStripeOnboarding } = useAuth();
  const { showAlert, AlertComponent } = useStyledAlert();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.merchant.getTransactions();
      // Transform the transactions data for dashboard display
      const transactions = response.data || [];

      const now = new Date();
      const isSameDay = (a: Date, b: Date) => (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
      );
      
      const todayTransactions = transactions.filter((t: any) => {
        const tDateObj = new Date(t.created_at);
        const isToday = isSameDay(tDateObj, now);
        const statusStr = (t?.status || '').toString().toLowerCase();
        const isSucceeded = statusStr === 'succeeded' || statusStr === 'completed';
        return isToday && isSucceeded;
      });
      
      const todayEarnings = todayTransactions.reduce((sum: number, t: any) => {
        let amount = t.amount || 0;
        // Convert from cents to dollars if amount is in cents (common with payment processors)
        // Check if amount seems to be in cents (typically > 100 for small dollar amounts)
        if (typeof amount === 'number' && amount > 0) {
          // If the amount seems unusually large (likely in cents), convert to dollars
          // This is a heuristic - you might need to adjust based on your backend data format
          if (amount >= 100 && Number.isInteger(amount)) {
            amount = amount / 100;
          }
        }
        return sum + amount;
      }, 0);

      // Calculate all-time earnings as fallback
      const allTimeEarnings = transactions.reduce((sum: number, t: any) => {
        const statusStr = (t?.status || '').toString().toLowerCase();
        const isSucceeded = statusStr === 'succeeded' || statusStr === 'completed';
        if (isSucceeded) {
          let amount = t.amount || 0;
          if (typeof amount === 'number' && amount > 0 && amount >= 100 && Number.isInteger(amount)) {
            amount = amount / 100;
          }
          return sum + amount;
        }
        return sum;
      }, 0);

      setDashboardData({
        todayEarnings,
        todayTransactions: todayTransactions.length,
        allTimeEarnings, // Add this for debugging
        recentTransactions: transactions.slice(0, 5).map((t: any) => {
          let amount = t.amount || 0;
          // Apply same amount conversion logic for consistency
          if (typeof amount === 'number' && amount > 0 && amount >= 100 && Number.isInteger(amount)) {
            amount = amount / 100;
          }
          return {
            id: t.id,
            amount: amount,
            status: t.status || 'pending',
            customer_name: t.customer_name || 'Customer',
            created_at: t.created_at || new Date().toISOString(),
          };
        })
      });
    } catch (error: any) {
      
      // Set default empty state for offline/network error scenarios
      setDashboardData({
        todayEarnings: 0,
        todayTransactions: 0,
        allTimeEarnings: 0,
        recentTransactions: []
      });
      
      // Provide more specific error messaging
      if (error?.response?.status !== undefined) {
        const statusCode = error.response.status;
        let errorMessage = 'Failed to load dashboard data';
        
        if (statusCode === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (statusCode === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (statusCode === 404) {
          errorMessage = 'Transactions endpoint not found.';
        } else if (statusCode >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        showAlert('Error', errorMessage, [{ text: 'OK' }], 'error');
      } else {
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await refreshUserProfile();
    setRefreshing(false);
  };

  const handleStripeOnboarding = async () => {
    try {
      setOnboardingLoading(true);
      let onboardingUrl: string | null = null;
      
      // Use appropriate function based on account status
      if (user?.stripe_account_status === 'INCOMPLETE') {
        // Account exists but incomplete - use refresh to resume
        onboardingUrl = await refreshStripeOnboarding();
      } else {
        // New account or other status - use normal onboarding
        onboardingUrl = await startMerchantOnboarding();
      }
      
      if (onboardingUrl) {
        // Open Stripe onboarding in browser
        await Linking.openURL(onboardingUrl);
      } else {
        showAlert('Error', 'Failed to start onboarding process. Please try again.', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to start onboarding process. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setOnboardingLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh when Stripe status is pending verification
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (user?.stripe_account_status === 'PENDING_VERIFICATION') {
      // Check every 30 seconds when pending verification
      interval = setInterval(async () => {
        await refreshUserProfile();
      }, 30000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user?.stripe_account_status]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.background.overlay;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.header}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.merchantName}>{user?.business_name || 'Merchant'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={Colors.text.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
        {/* Stripe Onboarding Banner */}
        {user && user.stripe_account_status !== 'COMPLETE' && (
          <View style={styles.onboardingBanner}>
            <LinearGradient
              colors={[Colors.warning, '#F59E0B']}
              style={styles.onboardingGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.onboardingContent}>
                <View style={styles.onboardingLeft}>
                  <Ionicons name="warning" size={24} color={Colors.text.white} />
                  <View style={styles.onboardingText}>
                    <Text style={styles.onboardingTitle}>
                      {user.stripe_account_status === 'PENDING_VERIFICATION' ? 'Under Review' :
                       user.stripe_account_status === 'ACTIVE_WITH_REQUIREMENTS' ? 'Action Required' :
                       user.stripe_account_status === 'INCOMPLETE' ? 'Continue Setup' : 'Setup Required'}
                    </Text>
                    <Text style={styles.onboardingSubtitle}>
                      {user.stripe_account_status === 'PENDING_VERIFICATION' ? 
                        'Stripe is reviewing your account. This usually takes 1-2 business days.' :
                       user.stripe_account_status === 'ACTIVE_WITH_REQUIREMENTS' ? 
                        'Additional information needed to complete your account setup.' :
                       user.stripe_account_status === 'INCOMPLETE' ? 
                        'Continue your Stripe setup where you left off.' :
                        'Complete Stripe onboarding to start accepting payments'}
                    </Text>
                    <Text style={styles.statusDebug}>
                      Status: {user.stripe_account_status}
                    </Text>
                  </View>
                </View>
                <View style={styles.onboardingButtons}>
                  <TouchableOpacity
                    style={[styles.onboardingButton, styles.refreshButton]}
                    onPress={onRefresh}
                    disabled={refreshing}
                  >
                    <Ionicons name="refresh" size={16} color={Colors.text.white} />
                  </TouchableOpacity>
                  {user.stripe_account_status !== 'PENDING_VERIFICATION' && (
                    <TouchableOpacity
                      style={styles.onboardingButton}
                      onPress={handleStripeOnboarding}
                      disabled={onboardingLoading}
                    >
                      <Text style={styles.onboardingButtonText}>
                        {onboardingLoading ? 'Loading...' : 
                         user.stripe_account_status === 'INCOMPLETE' ? 'Continue' : 'Setup Now'}
                      </Text>
                      {!onboardingLoading && (
                        <Ionicons name="arrow-forward" size={16} color={Colors.text.white} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
        {/* Today's Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <TouchableOpacity 
              onPress={() => fetchDashboardData()} 
              style={styles.summaryRefreshButton}
              disabled={loading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={loading ? Colors.text.muted : Colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryGrid}>
            {/* Earnings Card */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={[Colors.success, '#059669']}
                style={styles.summaryCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="trending-up" size={24} color={Colors.text.white} />
                <Text style={styles.summaryAmount}>
                  {formatCurrency(dashboardData?.todayEarnings || 0)}
                </Text>
                <Text style={styles.summaryLabel}>Earnings</Text>
              </LinearGradient>
            </View>

            {/* Transactions Card */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.summaryCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="card" size={24} color={Colors.text.white} />
                <Text style={styles.summaryAmount}>
                  {dashboardData?.todayTransactions || 0}
                </Text>
                <Text style={styles.summaryLabel}>Transactions</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Payout Status Card */}
          {user && (
            <View style={styles.payoutCard}>
              <LinearGradient
                colors={user.payout_enabled ? [Colors.success, '#059669'] : [Colors.warning, '#F59E0B']}
                style={styles.payoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.payoutHeaderRow}>
                  <View style={styles.payoutIconWrap}>
                    <Ionicons
                      name={user.payout_enabled ? 'wallet' : 'wallet-outline'}
                      size={20}
                      color={Colors.text.white}
                    />
                  </View>
                  <View style={styles.payoutTextWrap}>
                    <Text style={styles.payoutTitle}>Payout Status</Text>
                    <View style={styles.payoutBadge}>
                      <Text style={styles.payoutBadgeText}>
                        {user.payout_enabled ? 'Enabled' : 'Setup Required'}
                      </Text>
                    </View>
                  </View>
                  {!user.payout_enabled && (
                    <TouchableOpacity
                      style={styles.payoutCta}
                      onPress={handleStripeOnboarding}
                      disabled={onboardingLoading}
                    >
                      <Text style={styles.payoutCtaText}>
                        {onboardingLoading ? 'Loading...' : 'Enable'}
                      </Text>
                      {!onboardingLoading && (
                        <Ionicons name="arrow-forward" size={14} color={Colors.text.white} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.payoutStatusText}>
                  {user.payout_enabled
                    ? 'Automatic payouts enabled'
                    : 'Complete Stripe setup to enable payouts'}
                </Text>
                {user.payout_enabled && (
                  <Text style={styles.payoutHint}>
                    Funds are automatically transferred to your bank account within 2 business days
                  </Text>
                )}
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/history')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {dashboardData?.recentTransactions?.length ? (
            <View style={styles.transactionsList}>
              {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: getStatusBg(transaction.status) }
                    ]}>
                      <Ionicons 
                        name="card-outline" 
                        size={18} 
                        color={getStatusColor(transaction.status)} 
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionCustomer}>
                        {transaction.customer_name || 'Customer'}
                      </Text>
                      <Text style={styles.transactionTime}>
                        {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
              <Ionicons name="receipt-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.emptyStateText}>No transactions today</Text>
              <Text style={styles.emptyStateSubtext}>Your recent transactions will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Styled Alert Component */}
      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.white,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  onboardingBanner: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  onboardingGradient: {
    padding: 20,
  },
  onboardingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onboardingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  onboardingText: {
    marginLeft: 12,
    flex: 1,
  },
  onboardingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.white,
    marginBottom: 2,
  },
  onboardingSubtitle: {
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.9,
  },
  statusDebug: {
    fontSize: 12,
    color: Colors.text.white,
    opacity: 0.8,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  onboardingButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onboardingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 12,
  },
  refreshButton: {
    paddingHorizontal: 12,
  },
  onboardingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.white,
    marginRight: 6,
  },
  summarySection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summaryRefreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
    elevation: 1,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.white,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.9,
  },
  payoutCard: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: 'transparent',
    elevation: 3,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  payoutGradient: {
    borderRadius: 16,
    padding: 20,
  },
  payoutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  payoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  payoutTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  payoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.white,
    marginBottom: 4,
  },
  payoutBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  payoutBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.white,
    letterSpacing: 0.2,
  },
  payoutCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  payoutCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.white,
    marginRight: 6,
  },
  payoutStatusText: {
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.95,
    marginBottom: 6,
  },
  payoutHint: {
    fontSize: 12,
    color: Colors.text.white,
    opacity: 0.85,
  },
  transactionsSection: {
    marginBottom: 32,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  transactionsList: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  transactionTime: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
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
    paddingVertical: 48,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
