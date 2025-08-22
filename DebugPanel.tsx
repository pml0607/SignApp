import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'error' | 'warn';
  tag: string;
  message: string;
  data?: any;
}

class DebugStore {
  private static instance: DebugStore;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  static getInstance(): DebugStore {
    if (!DebugStore.instance) {
      DebugStore.instance = new DebugStore();
    }
    return DebugStore.instance;
  }

  addLog(level: 'log' | 'error' | 'warn', tag: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().split('T')[1].slice(0, -1),
      level,
      tag,
      message,
      data
    };

    this.logs.unshift(entry); // Add to beginning
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100); // Keep only last 100 logs
    }

    this.notifyListeners();
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

// Update the DebugLogger to also store logs in DebugStore
export class DebugLogger {
  private static isEnabled = true;
  private static store = DebugStore.getInstance();

  static log(tag: string, message: string, data?: any) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[${timestamp}] [${tag}] ${message}`, data || '');
    this.store.addLog('log', tag, message, data);
  }

  static error(tag: string, message: string, error?: any) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.error(`[${timestamp}] [${tag}] ERROR: ${message}`, error || '');
    this.store.addLog('error', tag, message, error);
  }

  static warn(tag: string, message: string, data?: any) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.warn(`[${timestamp}] [${tag}] WARNING: ${message}`, data || '');
    this.store.addLog('warn', tag, message, data);
  }
}

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'log' | 'error' | 'warn'>('all');

  useEffect(() => {
    const store = DebugStore.getInstance();
    const unsubscribe = store.subscribe(setLogs);
    setLogs(store.getLogs());
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  const formatData = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return '#EF4444';
      case 'warn': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      default: return 'info';
    }
  };

  return (
    <>
      {/* Floating Debug Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <MaterialIcons name="bug-report" size={24} color="white" />
        {logs.some(log => log.level === 'error') && (
          <View style={styles.errorBadge}>
            <Text style={styles.errorBadgeText}>!</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Debug Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Debug Logs ({logs.length})</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => DebugStore.getInstance().clearLogs()}
              >
                <MaterialIcons name="clear-all" size={20} color="#EF4444" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {(['all', 'log', 'error', 'warn'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterButton,
                  filter === level && styles.filterButtonActive
                ]}
                onPress={() => setFilter(level)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === level && styles.filterButtonTextActive
                ]}>
                  {level.toUpperCase()}
                  {level !== 'all' && ` (${logs.filter(l => l.level === level).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logs List */}
          <ScrollView style={styles.logsList} showsVerticalScrollIndicator={true}>
            {filteredLogs.map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <View style={styles.logMeta}>
                    <MaterialIcons
                      name={getLogIcon(log.level) as any}
                      size={16}
                      color={getLogColor(log.level)}
                    />
                    <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                    <Text style={[styles.logTag, { color: getLogColor(log.level) }]}>
                      [{log.tag}]
                    </Text>
                  </View>
                </View>

                <Text style={styles.logMessage}>{log.message}</Text>

                {log.data && (
                  <View style={styles.logData}>
                    <Text style={styles.logDataText}>{formatData(log.data)}</Text>
                  </View>
                )}
              </View>
            ))}

            {filteredLogs.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="info" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No logs to display</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  errorBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  clearButtonText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  logsList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logHeader: {
    marginBottom: 4,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  logTag: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginVertical: 4,
  },
  logData: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  logDataText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});

export default DebugPanel;