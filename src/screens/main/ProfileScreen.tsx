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
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api/apiService';
import Colors from '@/constants/colors';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import { sharedHeaderStyles } from '@/constants/layout';

interface MerchantProfile {
  id: string;
  email: string;
  business_name: string;
  mobile_number: string;
  mobile_verified: boolean;
  stripe_account_id?: string;
  stripe_onboarding_complete: boolean;
  created_at: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { showAlert, AlertComponent } = useStyledAlert();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await apiService.merchant.getProfile();
      setProfile(response.data);
    } catch (error) {
      showAlert('Error', 'Failed to load profile data', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.dismissAll();
            router.replace('/(auth)/login');
          }
        }
      ],
      'warning'
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getAccountStatus = () => {
    if (!profile) return { text: 'Unknown', color: Colors.text.muted, bg: Colors.background.overlay, icon: 'help-circle' };
    
    if (profile.stripe_onboarding_complete) {
      return { 
        text: 'Active', 
        color: Colors.success, 
        bg: Colors.status.completed,
        icon: 'checkmark-circle'
      };
    } else if (profile.mobile_verified) {
      return { 
        text: 'Setup Required', 
        color: Colors.warning, 
        bg: Colors.status.pending,
        icon: 'warning'
      };
    } else {
      return { 
        text: 'Verification Pending', 
        color: Colors.error, 
        bg: Colors.status.failed,
        icon: 'close-circle'
      };
    }
  };

  const profileSections = [
    {
      title: 'Account Information',
      items: [
        {
          icon: 'business' as const,
          label: 'Business Name',
          value: profile?.business_name || 'Not set',
          action: null,
          status: undefined,
        },
        {
          icon: 'mail',
          label: 'Email Address',
          value: profile?.email || 'Not set',
          action: null,
          status: undefined,
        },
        {
          icon: 'call' as const,
          label: 'Mobile Number',
          value: profile?.mobile_number || 'Not set',
          action: null,
          status: profile?.mobile_verified ? 'verified' : 'pending',
        },
      ],
    },
    {
      title: 'Payment Settings',
      items: [
        {
          icon: 'card' as const,
          label: 'Stripe Account',
          value: profile?.stripe_account_id ? 'Connected' : 'Not connected',
          action: profile?.stripe_onboarding_complete ? null : 'setup',
          status: profile?.stripe_onboarding_complete ? 'verified' : 'pending',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'notifications' as const,
          label: 'Notifications',
          value: 'Enabled',
          action: 'toggle' as const,
          status: undefined,
        },
        {
          icon: 'download' as const,
          label: 'Check for Updates',
          value: 'Tap to check',
          action: 'check-updates' as const,
          status: undefined,
        },
        {
          icon: 'shield-checkmark' as const,
          label: 'Security',
          value: 'Manage',
          action: 'navigate' as const,
          status: undefined,
        },
        {
          icon: 'help-circle' as const,
          label: 'Help & Support',
          value: 'Contact us',
          action: 'navigate' as const,
          status: undefined,
        },
      ],
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accountStatus = getAccountStatus();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={Colors.gradients.header}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          {/* Empty header for profile */}
        </View>
      </LinearGradient>

      {/* User Profile Card - Outside ScrollView to stay fixed and overlap header */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {profile?.business_name?.charAt(0) || 'M'}
          </Text>
        </View>
        <Text style={styles.businessName}>
          {profile?.business_name || 'Merchant'}
        </Text>
        <Text style={styles.emailText}>
          {profile?.email || 'merchant@example.com'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: accountStatus.bg }]}>
          <Ionicons name={accountStatus.icon as any} size={14} color={accountStatus.color} />
          <Text style={[styles.statusText, { color: accountStatus.color }]}>
            {accountStatus.text}
          </Text>
        </View>
      </View>

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

        {/* Account Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Account Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Member Since</Text>
              <Text style={styles.summaryValue}>
                {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Account Type</Text>
              <Text style={styles.summaryValue}>Business</Text>
            </View>
          </View>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.sectionItem,
                    itemIndex === section.items.length - 1 && styles.sectionItemLast
                  ]}
                  onPress={() => {
                    if (item.action === 'setup') {
                      showAlert('Setup Required', 'Complete Stripe onboarding to accept payments', [{ text: 'OK' }], 'info');
                    } else if (item.action === 'navigate') {
                      showAlert('Coming Soon', 'This feature will be available soon', [{ text: 'OK' }], 'info');
                    } else if (item.action === 'toggle') {
                      showAlert('Settings', 'Notification settings will be available soon', [{ text: 'OK' }], 'info');
                    } else if (item.action === 'check-updates') {
                      showAlert('Development Mode', 'Updates are only available in production builds.', [{ text: 'OK' }], 'info');
                    }
                  }}
                  disabled={!item.action}
                >
                  <View style={styles.sectionItemLeft}>
                    <View style={styles.sectionItemIcon}>
                      <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.sectionItemInfo}>
                      <Text style={styles.sectionItemLabel}>{item.label}</Text>
                      <Text style={styles.sectionItemValue}>{item.value}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.sectionItemRight}>
                    {item.status && (
                      <View style={[
                        styles.itemStatusBadge,
                        { backgroundColor: item.status === 'verified' ? Colors.status.completed : Colors.status.pending }
                      ]}>
                        <Text style={[
                          styles.itemStatusText,
                          { color: item.status === 'verified' ? Colors.success : Colors.warning }
                        ]}>
                          {item.status === 'verified' ? 'Verified' : 'Pending'}
                        </Text>
                      </View>
                    )}
                    {item.action && (
                      <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: -75,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.accent.lavender,
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.white,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  summarySection: {
    marginTop: 24,
    marginBottom: 24,
    marginHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    marginHorizontal: 24,
  },
  sectionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionItemLast: {
    borderBottomWidth: 0,
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionItemInfo: {
    flex: 1,
  },
  sectionItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sectionItemValue: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  sectionItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  logoutSection: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  versionSection: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
}); 