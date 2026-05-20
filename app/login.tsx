import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { api } from '@/src/api';
import { normalizeAuthUser, useAuth } from '@/src/auth-context';

export default function LoginScreen() {
	const router = useRouter();
	const { refreshUser, setAuthenticated, setUser } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const isReady = useMemo(
		() => email.trim().length > 0 && password.length > 0,
		[email, password],
	);

	const handleLogin = async () => {
		if (!isReady || isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const response = await api.login({
				email: email.trim(),
				password,
			});
			const parsedUser = normalizeAuthUser(response);
			setUser(parsedUser);
			setAuthenticated();
			if (!parsedUser) {
				try {
					await refreshUser();
				} catch {
				}
			}
			router.replace('/(tabs)');
		} catch (error) {
			const message = error instanceof Error && error.message.trim()
				? error.message
				: 'Login gagal. Coba lagi.';
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRegister = () => {
		router.push('/register');
	};

	const handleForgot = () => {
		alert('Reset kata sandi belum tersedia.');
	};

	return (
		<ThemedView style={styles.screen}>
			<SafeAreaView edges={['top']} style={styles.safe}>
				<View style={styles.background} pointerEvents="none">
					<View style={[styles.bgCircle, styles.bgCircleOne]} />
					<View style={[styles.bgCircle, styles.bgCircleTwo]} />
					<View style={[styles.bgCircle, styles.bgCircleThree]} />
				</View>
				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.heroCard}>
						<View style={styles.heroGlow} />
						<View style={styles.heroBadge}>
							<MaterialIcons name="opacity" size={16} color="#FFFFFF" />
							<ThemedText style={styles.heroBadgeText}>AquaChain</ThemedText>
						</View>
						<ThemedText style={styles.heroTitle}>Selamat Datang</ThemedText>
						<ThemedText style={styles.heroSubtitle}>
							Masuk untuk mengelola kolam ikan dan monitoring harian.
						</ThemedText>
					</View>

					<View style={styles.formCard}>
						<View style={styles.formHeader}>
							<ThemedText style={styles.formTitle}>Masuk ke Akun</ThemedText>
							<View style={styles.formBadge}>
								<MaterialIcons name="shield" size={14} color="#0C6F98" />
								<ThemedText style={styles.formBadgeText}>Aman</ThemedText>
							</View>
						</View>

						<View style={styles.fieldGroup}>
							<ThemedText style={styles.fieldLabel}>Email</ThemedText>
							<View style={styles.inputWrap}>
								<MaterialIcons name="mail" size={20} color="#0C6F98" />
								<TextInput
									value={email}
									onChangeText={setEmail}
									placeholder="nama@email.com"
									placeholderTextColor="#9AA3AF"
									keyboardType="email-address"
									autoCapitalize="none"
									autoComplete="email"
									style={styles.inputText}
								/>
							</View>
						</View>

						<View style={styles.fieldGroup}>
							<ThemedText style={styles.fieldLabel}>Kata Sandi</ThemedText>
							<View style={styles.inputWrap}>
								<MaterialIcons name="lock" size={20} color="#0C6F98" />
								<TextInput
									value={password}
									onChangeText={setPassword}
									placeholder="Masukkan kata sandi"
									placeholderTextColor="#9AA3AF"
									secureTextEntry={!showPassword}
									autoCapitalize="none"
									autoComplete="password"
									style={styles.inputText}
								/>
								<Pressable
									accessibilityRole="button"
									onPress={() => setShowPassword((prev) => !prev)}
									style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
								>
									<MaterialIcons
										name={showPassword ? 'visibility-off' : 'visibility'}
										size={20}
										color="#6B7280"
									/>
								</Pressable>
							</View>
						</View>

						<View style={styles.helperRow}>
							<Pressable
								accessibilityRole="checkbox"
								onPress={() => setRememberMe((prev) => !prev)}
								style={({ pressed }) => [styles.rememberRow, pressed && styles.pressed]}
							>
								<View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
									{rememberMe ? (
										<MaterialIcons name="check" size={14} color="#FFFFFF" />
									) : null}
								</View>
								<ThemedText style={styles.rememberText}>Ingat saya</ThemedText>
							</Pressable>
							<Pressable accessibilityRole="button" onPress={handleForgot}>
								<ThemedText style={styles.forgotText}>Lupa kata sandi?</ThemedText>
							</Pressable>
						</View>

						{errorMessage ? (
							<View style={styles.errorRow}>
								<MaterialIcons name="error-outline" size={16} color="#B91C1C" />
								<ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
							</View>
						) : null}

						<Pressable
							accessibilityRole="button"
							onPress={handleLogin}
							disabled={!isReady || isSubmitting}
							style={({ pressed }) => [
								styles.primaryButton,
								(!isReady || isSubmitting) && styles.primaryButtonDisabled,
								pressed && isReady && !isSubmitting && styles.buttonPressed,
							]}
						>
							<ThemedText style={styles.primaryButtonText}>
								{isSubmitting ? 'Memproses...' : 'Masuk'}
							</ThemedText>
						</Pressable>

						<View style={styles.divider} />

						<View style={styles.linkRow}>
							<ThemedText style={styles.linkText}>Belum punya akun?</ThemedText>
							<Pressable accessibilityRole="button" onPress={handleRegister}>
								<ThemedText style={styles.linkAction}>Daftar</ThemedText>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: '#F3F7FB',
	},
	safe: {
		flex: 1,
	},
	background: {
		...StyleSheet.absoluteFillObject,
	},
	bgCircle: {
		position: 'absolute',
		borderRadius: 999,
		opacity: 0.35,
	},
	bgCircleOne: {
		width: 220,
		height: 220,
		backgroundColor: '#D5ECFF',
		top: -90,
		left: -70,
	},
	bgCircleTwo: {
		width: 160,
		height: 160,
		backgroundColor: '#C3FFE6',
		bottom: 160,
		right: -60,
	},
	bgCircleThree: {
		width: 120,
		height: 120,
		backgroundColor: '#FFE9C9',
		top: 260,
		right: -20,
	},
	content: {
		paddingHorizontal: 20,
		paddingBottom: 28,
		gap: 18,
	},
	heroCard: {
		marginTop: 12,
		backgroundColor: '#0C6F98',
		borderRadius: 26,
		padding: 20,
		overflow: 'hidden',
		shadowColor: '#0C6F98',
		shadowOpacity: 0.22,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: 12 },
		elevation: 6,
	},
	heroGlow: {
		position: 'absolute',
		width: 180,
		height: 180,
		borderRadius: 90,
		right: -40,
		top: -50,
		backgroundColor: '#2DA3CF',
		opacity: 0.4,
	},
	heroBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		alignSelf: 'flex-start',
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	heroBadgeText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	heroTitle: {
		marginTop: 12,
		fontSize: 24,
		lineHeight: 30,
		fontWeight: '700',
		color: '#FFFFFF',
		fontFamily: Fonts.rounded,
	},
	heroSubtitle: {
		marginTop: 8,
		fontSize: 13,
		lineHeight: 20,
		color: '#D8F3FF',
		fontFamily: Fonts.sans,
	},
	formCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		padding: 20,
		shadowColor: '#0C6F98',
		shadowOpacity: 0.08,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 2,
	},
	formHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	formTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0F172A',
		fontFamily: Fonts.rounded,
	},
	formBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
		backgroundColor: '#E6F4FF',
	},
	formBadgeText: {
		fontSize: 11,
		fontWeight: '700',
		color: '#0C6F98',
	},
	fieldGroup: {
		marginTop: 14,
	},
	fieldLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#0F172A',
		marginBottom: 8,
	},
	inputWrap: {
		borderWidth: 1.5,
		borderColor: '#CFE0FF',
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	inputText: {
		flex: 1,
		fontSize: 14,
		color: '#0F172A',
		fontFamily: Fonts.sans,
	},
	iconButton: {
		padding: 4,
	},
	helperRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 12,
	},
	rememberRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 6,
		borderWidth: 1.5,
		borderColor: '#7AA7D9',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFFFFF',
	},
	checkboxActive: {
		backgroundColor: '#0C6F98',
		borderColor: '#0C6F98',
	},
	rememberText: {
		fontSize: 12,
		color: '#4B5563',
	},
	forgotText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#0C6F98',
	},
	errorRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 12,
	},
	errorText: {
		fontSize: 12,
		color: '#B91C1C',
		flex: 1,
	},
	primaryButton: {
		marginTop: 18,
		backgroundColor: '#0C6F98',
		borderRadius: 18,
		paddingVertical: 14,
		alignItems: 'center',
		shadowColor: '#0C6F98',
		shadowOpacity: 0.25,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 4,
	},
	primaryButtonDisabled: {
		backgroundColor: '#9BB7C9',
		shadowOpacity: 0,
		elevation: 0,
	},
	primaryButtonText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	buttonPressed: {
		transform: [{ scale: 0.98 }],
	},
	divider: {
		height: 1,
		backgroundColor: '#E2E8F0',
		marginVertical: 16,
	},
	linkRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	linkText: {
		fontSize: 12,
		color: '#6B7280',
	},
	linkAction: {
		fontSize: 12,
		fontWeight: '700',
		color: '#0C6F98',
	},
	pressed: {
		opacity: 0.85,
	},
});
