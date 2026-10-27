import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sheet } from './ui';
import { Status, STATUSES } from '../types';
import { statusLabel } from '../utils';
import { colors, statusColor } from '../theme';

export default function StatusSheet({ name, current, onPick, onClose }: {
  name: string | null; current?: Status; onPick: (s: Status) => void; onClose: () => void;
}) {
  return (
    <Sheet visible={!!name} onClose={onClose} title={name ?? ''}>
      <Text style={{ color: colors.muted, marginTop: -8, marginBottom: 12 }}>Set attendance status</Text>
      {STATUSES.map((s) => (
        <TouchableOpacity key={s} onPress={() => onPick(s)} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: statusColor[s] + (current === s ? '33' : '14') }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: statusColor[s], marginRight: 12 }} />
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.navy }}>{statusLabel[s]}</Text>
          {current === s && <Ionicons name="checkmark-circle" size={20} color={statusColor[s]} />}
        </TouchableOpacity>
      ))}
    </Sheet>
  );
}
