/**
 * app/admin/settings.tsx — App Settings
 *
 * Reads and writes the app_settings table (key-value JSONB).
 * Sections:
 *   - Feature Flags (toggles)
 *   - Message of the Day (free-text)
 *   - App Configuration (min version, maintenance mode)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Switch,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { AdminShell, AdminSection } from './components/AdminShell';

type SettingsMap = Record<string, any>;

const BOOL_FEATURES: { key: string; label: string; description: string }[] = [
  { key: 'feature_premium',     label: 'Premium Subscriptions',  description: 'Enable paywall and RevenueCat purchasing.' },
  { key: 'feature_audio',       label: 'Audio Playback',         description: 'Show audio player and clips in the reader.' },
  { key: 'feature_highlights',  label: 'Highlights',             description: 'Allow users to highlight text passages.' },
  { key: 'feature_word_notes',  label: 'Word Notes',             description: 'Allow users to tap words for definitions/notes.' },
  { key: 'feature_promo_codes', label: 'Promo Codes',            description: 'Enable promo code redemption on the profile screen.' },
  { key: 'maintenance_mode',    label: 'Maintenance Mode',       description: 'Shows a maintenance banner; blocks purchases.' },
];

export default function AdminSettings() {
  const [settings, setSettings]   = useState<SettingsMap>({});
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState<string | null>(null); // key being saved

  // Editable text state
  const [motd,        setMotd]        = useState('');
  const [motdTitle,   setMotdTitle]   = useState('');
  const [minVersion,  setMinVersion]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('app_settings').select('key, value');
    if (data) {
      const map: SettingsMap = {};
      data.forEach(row => {
        // JSONB values: strings come back with surrounding quotes stripped by Supabase client
        map[row.key] = row.value;
      });
      setSettings(map);
      setMotd(typeof map.motd === 'string' ? map.motd : '');
      setMotdTitle(typeof map.motd_title === 'string' ? map.motd_title : '');
      setMinVersion(typeof map.min_app_version === 'string' ? map.min_app_version : '1.0.0');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  async function saveSetting(key: string, value: unknown) {
    setSaving(key);
    const { error } = await supabase
      .from('app_settings')
      .update({ value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) Alert.alert('Error', error.message);
    else setSettings(prev => ({ ...prev, [key]: value }));
    setSaving(null);
  }

  async function saveText(key: string, raw: string) {
    // Store as JSON string (will be a JSON string value in the JSONB column)
    const value = raw.trim() || null;
    setSaving(key);
    const { error } = await supabase
      .from('app_settings')
      .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) Alert.alert('Error', error.message);
    else setSettings(prev => ({ ...prev, [key]: value }));
    setSaving(null);
  }

  if (loading) {
    return (
      <AdminShell title="Settings">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
          <ActivityIndicator size="large" color={Palette.goldBright} />
        </View>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Settings" back="/admin">
      {/* Feature Flags */}
      <AdminSection title="Feature Flags" />
      <View style={s.card}>
        {BOOL_FEATURES.map((f, i) => {
          const isOn = settings[f.key] === true || settings[f.key] === 'true';
          const isSaving = saving === f.key;
          return (
            <View
              key={f.key}
              style={[s.flagRow, i < BOOL_FEATURES.length - 1 && s.flagRowBorder]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.flagLabel}>{f.label}</Text>
                <Text style={s.flagDesc}>{f.description}</Text>
              </View>
              {isSaving
                ? <ActivityIndicator size="small" color={Palette.goldBright} style={{ marginLeft: 12 }} />
                : (
                  <Switch
                    value={isOn}
                    onValueChange={v => saveSetting(f.key, v)}
                    trackColor={{ false: '#2A3450', true: f.key === 'maintenance_mode' ? '#4A1010' : '#2A4020' }}
                    thumbColor={isOn ? (f.key === 'maintenance_mode' ? '#E05050' : '#66BB6A') : '#5A5040'}
                  />
                )
              }
            </View>
          );
        })}
      </View>

      {/* Message of the Day */}
      <AdminSection title="Message of the Day" />
      <View style={s.card}>
        <Text style={s.label}>Title (optional)</Text>
        <TextInput
          style={s.input}
          value={motdTitle}
          onChangeText={setMotdTitle}
          placeholder="e.g. Shabbat Shalom"
          placeholderTextColor="#3A3028"
        />

        <Text style={[s.label, { marginTop: Space[3] }]}>Message</Text>
        <TextInput
          style={[s.input, s.multiline]}
          value={motd}
          onChangeText={setMotd}
          placeholder="Enter a message shown to all users on the home screen. Leave blank to hide."
          placeholderTextColor="#3A3028"
          multiline
          textAlignVertical="top"
        />

        <Pressable
          style={[s.saveBtn, saving === 'motd' && s.saveBtnDisabled]}
          onPress={async () => {
            await saveText('motd_title', motdTitle);
            await saveText('motd', motd);
          }}
          disabled={saving === 'motd' || saving === 'motd_title'}
        >
          {(saving === 'motd' || saving === 'motd_title')
            ? <ActivityIndicator color={Palette.navyDeep} />
            : <Text style={s.saveBtnText}>Save MOTD</Text>
          }
        </Pressable>

        <Text style={s.hint}>Set to blank to remove the message from the app.</Text>
      </View>

      {/* App Configuration */}
      <AdminSection title="App Configuration" />
      <View style={s.card}>
        <Text style={s.label}>Minimum Required App Version</Text>
        <TextInput
          style={s.input}
          value={minVersion}
          onChangeText={setMinVersion}
          placeholder="1.0.0"
          placeholderTextColor="#3A3028"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={s.hint}>Users on older versions will see an update prompt.</Text>

        <Pressable
          style={[s.saveBtn, saving === 'min_app_version' && s.saveBtnDisabled, { marginTop: Space[4] }]}
          onPress={() => saveText('min_app_version', minVersion)}
          disabled={!!saving}
        >
          {saving === 'min_app_version'
            ? <ActivityIndicator color={Palette.navyDeep} />
            : <Text style={s.saveBtnText}>Save Min Version</Text>
          }
        </Pressable>
      </View>

      {/* Danger zone */}
      <AdminSection title="Danger Zone" />
      <View style={[s.card, s.dangerCard]}>
        <Text style={s.dangerText}>
          Enabling maintenance mode will show a banner to all users and block new purchases.
          Use during deployments or incident response. Toggle above in Feature Flags.
        </Text>
        <View style={s.dangerState}>
          <Text style={s.dangerStateLabel}>Current status:</Text>
          <Text style={[s.dangerStateBadge,
            (settings.maintenance_mode === true || settings.maintenance_mode === 'true')
              ? s.dangerOn : s.dangerOff
          ]}>
            {(settings.maintenance_mode === true || settings.maintenance_mode === 'true')
              ? 'MAINTENANCE MODE ON' : 'Normal Operation'}
          </Text>
        </View>
      </View>

      <View style={{ height: 80 }} />
    </AdminShell>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    padding:         Space[4],
    borderWidth:     1,
    borderColor:     '#1E2A40',
    marginBottom:    Space[5],
    gap:             Space[2],
  },
  dangerCard: {
    borderColor:     '#3A1010',
    backgroundColor: '#0F0808',
  },

  flagRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: Space[3] },
  flagRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1A2340' },
  flagLabel:     { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#C0B090' },
  flagDesc:      { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040', marginTop: 2, lineHeight: 18 },

  label: { fontFamily: Fonts.sansMedium, fontSize: 11, color: '#5A5040', letterSpacing: 0.8 },
  input: {
    backgroundColor:   '#0A1020',
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       '#1E2A40',
    paddingHorizontal: Space[4],
    paddingVertical:   10,
    fontFamily:        Fonts.sansRegular,
    fontSize:          14,
    color:             '#EDE8DD',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top', lineHeight: 20 },
  hint: { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#3A3028', lineHeight: 16 },

  saveBtn: {
    backgroundColor: Palette.goldBright,
    borderRadius:    Radius.pill,
    paddingVertical: 12,
    alignItems:      'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontFamily: Fonts.sansBold, fontSize: 14, color: Palette.navyDeep },

  dangerText:      { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#8B5050', lineHeight: 20 },
  dangerState:     { flexDirection: 'row', alignItems: 'center', gap: Space[3], marginTop: Space[2] },
  dangerStateLabel:{ fontFamily: Fonts.sansRegular, fontSize: 13, color: '#5A5040' },
  dangerStateBadge:{ fontFamily: Fonts.sansMedium, fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md },
  dangerOn:        { color: '#E05050', backgroundColor: '#200808' },
  dangerOff:       { color: '#66BB6A', backgroundColor: '#0A2010' },
});
