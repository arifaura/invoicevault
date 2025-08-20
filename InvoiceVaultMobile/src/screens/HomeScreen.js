import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="business" size={80} color="white" />
          <Text style={styles.title}>InvoiceVault</Text>
          <Text style={styles.subtitle}>
            Professional Invoice Management & Task Tracking
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="document-text" size={24} color="white" />
            <Text style={styles.featureText}>Invoice Management</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.featureText}>Customer Database</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkbox" size={24} color="white" />
            <Text style={styles.featureText}>Task Tracking</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: 60,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: 'white',
  },
});

export default HomeScreen;