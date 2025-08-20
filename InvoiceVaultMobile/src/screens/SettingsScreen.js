import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person', title: 'Profile', subtitle: 'Manage your account' },
        { icon: 'shield-checkmark', title: 'Security', subtitle: 'Password and privacy' },
        { icon: 'card', title: 'Billing', subtitle: 'Subscription and payments' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications', title: 'Notifications', subtitle: 'Manage notifications', type: 'switch', value: notifications, onValueChange: setNotifications },
        { icon: 'moon', title: 'Dark Mode', subtitle: 'Toggle dark theme', type: 'switch', value: darkMode, onValueChange: setDarkMode },
        { icon: 'language', title: 'Language', subtitle: 'English' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle', title: 'Help Center', subtitle: 'Get help and support' },
        { icon: 'document-text', title: 'Terms of Service', subtitle: 'Read our terms' },
        { icon: 'shield', title: 'Privacy Policy', subtitle: 'Your privacy matters' },
      ],
    },
  ];

  const renderSettingItem = (item, index) => (
    <TouchableOpacity key={index} style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={item.icon} size={20} color="#6366f1" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      {item.type === 'switch' ? (
        <Switch
          value={item.value}
          onValueChange={item.onValueChange}
          trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
          thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#64748b" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
          </View>
        </View>
      ))}

      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});

export default SettingsScreen;