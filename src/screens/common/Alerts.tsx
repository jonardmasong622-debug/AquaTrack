import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Empty } from '../../components/ui';
import { useNotifs } from '../../context/NotifContext';
import { deleteNotification, markAllRead, markNotificationRead } from '../../services/db';
import { fmtDateTime } from '../../utils';
import { colors } from '../../theme';

export default function Alerts() {
  const { items, unread } = useNotifs();
  return (
    <Screen header={
      <Header title="Alerts" subtitle={unread ? `${unread} unread` : 'You’re all caught up'}
        right={unread > 0 ? (
          <TouchableOpacity onPress={() => markAllRead(items).catch(() => {})}>
            <Text style={{ color: colors.skySoft, fontWeight: '700' }}>Mark all read</Text>
          </TouchableOpacity>) : undefined} />
    }>
      {items.length === 0 ? (
        <Empty icon="notifications-outline" title="No alerts" text="You’ll be told right away if you’re marked absent, and warned if you reach your absence limit." />
      ) : items.map((n) => {
        const warn = n.type === 'warning';
        const c = warn ? colors.late : colors.absent;
        return (
          <TouchableOpacity key={n.id} activeOpacity={0.85}
            onPress={() => !n.read && markNotificationRead(n.id).catch(() => {})}
            onLongPress={() => Alert.alert('Delete alert?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(n.id).catch(() => {}) },
            ])}>
            <Card style={{ flexDirection: 'row', borderLeftWidth: 4, borderLeftColor: n.read ? colors.border : c }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name={warn ? 'warning' : 'close-circle'} size={20} color={c} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: n.read ? '600' : '800', color: colors.navy, fontSize: 15 }}>{n.title}</Text>
                <Text style={{ color: colors.text, marginTop: 4, lineHeight: 19 }}>{n.body}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{fmtDateTime(n.createdAt)}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
    </Screen>
  );
}
