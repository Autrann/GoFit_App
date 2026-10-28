import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { profileAvatars } from '../../constants/appConstants';
import GoFitBottomSheet from '../common/GoFitBottomSheet';

interface ProfileOptionsModalProps {
  visible: boolean;
  currentAvatarId?: string;
  saving: boolean;
  onClose: () => void;
  onSelectAvatar: (avatarKey: string) => void;
  onLogout: () => void;
}

export default function ProfileOptionsModal({
  visible,
  currentAvatarId,
  saving,
  onClose,
  onSelectAvatar,
  onLogout,
}: ProfileOptionsModalProps) {
  const { isDark, toggleTheme, colors: k, kStyles } = useTheme();
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);

  const handleClose = () => {
    setShowAvatarGrid(false);
    onClose();
  };

  return (
    <GoFitBottomSheet visible={visible} onClose={handleClose}>
      <View style={[kStyles.rowBetween, { marginBottom: 20 }]}>
        <Text style={kStyles.sheetTitle}>
          {showAvatarGrid ? 'ELIGE TU AVATAR' : 'OPCIONES DE PERFIL'}
        </Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close-circle" size={28} color={k.textMuted} />
        </TouchableOpacity>
      </View>

      {!showAvatarGrid ? (
        <>
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: k.surfaceLowest }]}
            onPress={() => setShowAvatarGrid(true)}
          >
            <View style={kStyles.rowAlign}>
              <Ionicons name="images-outline" size={22} color={k.cyan} />
              <Text style={[styles.label, { color: k.textMain }]}>Cambiar foto de perfil</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={k.textMuted} />
          </TouchableOpacity>

          <View style={[styles.optionRow, { backgroundColor: k.surfaceLowest, marginBottom: 20 }]}>
            <View style={kStyles.rowAlign}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={22} color={k.lime} />
              <Text style={[styles.label, { color: k.textMain }]}>Tema</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={26} color={isDark ? k.lime : k.warning} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color={k.danger} />
            <Text style={[styles.logoutText, { color: k.danger }]}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View>
          <View style={styles.avatarGrid}>
            {Object.keys(profileAvatars).map((avatarKey) => {
              const isSelected = currentAvatarId === avatarKey;
              return (
                <TouchableOpacity
                  key={avatarKey}
                  style={[styles.avatarOption, isSelected && { borderColor: k.lime }]}
                  onPress={() => onSelectAvatar(avatarKey)}
                  disabled={saving}
                >
                  <Image source={profileAvatars[avatarKey]} style={styles.avatarImg} />
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: k.bg }]}>
                      <Ionicons name="checkmark-circle" size={24} color={k.lime} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {saving && <ActivityIndicator color={k.lime} style={{ marginTop: 20 }} />}

          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: k.surfaceLowest, marginTop: 24, justifyContent: 'center' }]}
            onPress={() => setShowAvatarGrid(false)}
          >
            <Text style={{ color: k.textMain, fontWeight: '800', fontSize: 13 }}>VOLVER A OPCIONES</Text>
          </TouchableOpacity>
        </View>
      )}
    </GoFitBottomSheet>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  label: { fontSize: 15, fontWeight: '700', marginLeft: 4 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 115, 81, 0.15)',
  },
  logoutText: { fontSize: 14, fontWeight: '900', marginLeft: 8, letterSpacing: 0.6 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 10 },
  avatarOption: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: 'transparent' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 42 },
  checkBadge: { position: 'absolute', bottom: -5, right: -5, borderRadius: 12 },
});