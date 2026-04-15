/**
 * React Error Boundary
 *
 * Catches render errors in the component tree and shows a graceful
 * fallback UI instead of a blank white crash screen.
 */

import React from 'react';
import {
  View, Text, StyleSheet, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts } from '@/constants/Typography';
import { Palette } from '@/constants/Colors';
import { Space, Radius } from '@/constants/Spacing';
import { captureException } from '@/utils/sentry';

interface Props {
  children:    React.ReactNode;
  fallback?:   React.ReactNode;
  onError?:    (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info);
    }
    captureException(error, { componentStack: info.componentStack ?? '' });
  }

  recover = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <View style={s.root}>
          <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />
          <View style={s.card}>
            <Text style={s.icon}>⚠️</Text>
            <Text style={s.title}>Something went wrong</Text>
            <Text style={s.body}>
              Albert encountered an unexpected error. Your reading progress has been saved.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={s.devError}>{this.state.error.message}</Text>
            )}
            <Pressable style={s.btn} onPress={this.recover}>
              <Text style={s.btnText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// ─── Lightweight inline fallback for small sections ───────────────────────

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={ie.wrap}>
      <Text style={ie.text}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text style={ie.retry}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Space[5],
  },
  card: {
    width:           '100%',
    maxWidth:        400,
    backgroundColor: '#141B30',
    borderRadius:    Radius.xl,
    padding:         Space[7],
    alignItems:      'center',
    gap:             Space[4],
    borderWidth:     1,
    borderColor:     '#1E2A40',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   22,
    color:      '#EDE8DD',
    textAlign:  'center',
  },
  body: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#8B8070',
    textAlign:  'center',
    lineHeight: 22,
  },
  devError: {
    fontFamily:      'monospace',
    fontSize:        11,
    color:           '#E05050',
    backgroundColor: '#1A0808',
    padding:         Space[3],
    borderRadius:    Radius.sm,
    width:           '100%',
  },
  btn: {
    backgroundColor:  Palette.goldBright,
    paddingHorizontal:Space[7],
    paddingVertical:  12,
    borderRadius:     Radius.pill,
    marginTop:        Space[2],
  },
  btnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   15,
    color:      Palette.navyDeep,
  },
});

const ie = StyleSheet.create({
  wrap: {
    padding:    Space[5],
    alignItems: 'center',
    gap:        Space[2],
  },
  text: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#5A5040',
    textAlign:  'center',
  },
  retry: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      Palette.goldMid,
  },
});
