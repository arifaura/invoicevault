import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TasksScreen = () => {
  const [tasks] = useState({
    todo: [
      { id: '1', title: 'Create invoice for Client A', priority: 'high' },
      { id: '2', title: 'Follow up on payment', priority: 'medium' },
    ],
    inProgress: [
      { id: '3', title: 'Review project proposal', priority: 'high' },
    ],
    done: [
      { id: '4', title: 'Send monthly report', priority: 'low' },
      { id: '5', title: 'Update customer database', priority: 'medium' },
    ],
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const renderTask = (task) => (
    <TouchableOpacity key={task.id} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
        <Text style={styles.taskTitle}>{task.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kanbanContainer}>
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>To Do</Text>
            <Text style={styles.taskCount}>{tasks.todo.length}</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {tasks.todo.map(renderTask)}
          </ScrollView>
        </View>

        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>In Progress</Text>
            <Text style={styles.taskCount}>{tasks.inProgress.length}</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {tasks.inProgress.map(renderTask)}
          </ScrollView>
        </View>

        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>Done</Text>
            <Text style={styles.taskCount}>{tasks.done.length}</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {tasks.done.map(renderTask)}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kanbanContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  column: {
    width: 280,
    marginRight: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  taskCount: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#64748b',
  },
  columnContent: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
});

export default TasksScreen;