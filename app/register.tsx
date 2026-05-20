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

const FEATURE_ITEMS = [
	{
		id: 'monitor',
		label: 'Pantau kualitas air secara real time.',
		icon: 'visibility' as const,
	},
	{
		id: 'log',
		label: 'Catat jadwal pakan otomatis.',
		icon: 'schedule' as const,
	},
	{
		id: 'secure',
		label: 'Data operasional tersimpan aman.',
		icon: 'security' as const,
	},
];

export default function RegisterScreen() {
	const router = useRouter();
	const { refreshUser, setAuthenticated, setUser } = useAuth();
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [isAgreed, setIsAgreed] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const passwordMatch = password.length > 0 && password === confirmPassword;

	const isReady = useMemo(() => {
		return (
			fullName.trim().length > 0 &&
			email.trim().length > 0 &&
			password.length >= 8 &&
			passwordMatch &&
			isAgreed
		);
	}, [confirmPassword, email, fullName, isAgreed, password, passwordMatch]);

	const helperText = password.length === 0
		? 'Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.'
		: passwordMatch
			? 'Konfirmasi kata sandi sudah cocok.'
			: 'Konfirmasi kata sandi belum cocok.';

	const handleRegister = async () => {
		if (!isReady || isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const response = await api.register({
				name: fullName.trim(),
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
				: 'Registrasi gagal. Coba lagi.';
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLogin = () => {
		router.push('/login');
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
						<View style={styles.heroGlowSmall} />
						<View style={styles.heroBadge}>
							<MaterialIcons name="opacity" size={16} color="#FFFFFF" />
							<ThemedText style={styles.heroBadgeText}>AquaChain</ThemedText>
						</View>
						<ThemedText style={styles.heroTitle}>Buat Akun Baru</ThemedText>
						<ThemedText style={styles.heroSubtitle}>
							Mulai pantau kolam ikan dan pengelolaan pakan dari satu aplikasi.
						</ThemedText>
						<View style={styles.featureList}>
							{FEATURE_ITEMS.map((item) => (
								<View key={item.id} style={styles.featureRow}>
									<View style={styles.featureIconWrap}>
										<MaterialIcons name={item.icon} size={16} color="#0C6F98" />
									</View>
									<ThemedText style={styles.featureText}>{item.label}</ThemedText>
								</View>
							))}
						</View>
					</View>

					<View style={styles.formCard}>
						<View style={styles.formHeader}>
							<ThemedText style={styles.formTitle}>Informasi Akun</ThemedText>
							<View style={styles.formBadge}>
								<MaterialIcons name="verified-user" size={14} color="#0C6F98" />
								<ThemedText style={styles.formBadgeText}>Versi Beta</ThemedText>
							</View>
						</View>

						<View style={styles.fieldGroup}>
							<ThemedText style={styles.fieldLabel}>Nama Lengkap</ThemedText>
							<View style={styles.inputWrap}>
								<MaterialIcons name="person" size={20} color="#0C6F98" />
								<TextInput
									value={fullName}
									onChangeText={setFullName}
									placeholder="Contoh: Andi Wijaya"
									placeholderTextColor="#9AA3AF"
									autoCapitalize="words"
									autoComplete="name"
									style={styles.inputText}
								/>
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
									placeholder="Minimal 8 karakter"
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

						<View style={styles.fieldGroup}>
							<ThemedText style={styles.fieldLabel}>Konfirmasi Kata Sandi</ThemedText>
							<View style={styles.inputWrap}>
								<MaterialIcons name="lock-outline" size={20} color="#0C6F98" />
								<TextInput
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									placeholder="Ulangi kata sandi"
									placeholderTextColor="#9AA3AF"
									secureTextEntry={!showConfirm}
									autoCapitalize="none"
									autoComplete="password"
									style={styles.inputText}
								/>
								<Pressable
									accessibilityRole="button"
									onPress={() => setShowConfirm((prev) => !prev)}
									style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
								>
									<MaterialIcons
										name={showConfirm ? 'visibility-off' : 'visibility'}
										size={20}
										color="#6B7280"
									/>
								</Pressable>
							</View>
						</View>

						<View style={styles.helperRow}>
							<MaterialIcons
								name={passwordMatch ? 'check-circle' : 'info'}
								size={16}
								color={passwordMatch ? '#1D7A3B' : '#6B7280'}
							/>
							<ThemedText style={styles.helperText}>{helperText}</ThemedText>
						</View>

						{errorMessage ? (
							<View style={styles.errorRow}>
								<MaterialIcons name="error-outline" size={16} color="#B91C1C" />
								<ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
							</View>
						) : null}

						<Pressable
							accessibilityRole="checkbox"
							onPress={() => setIsAgreed((prev) => !prev)}
							style={({ pressed }) => [styles.agreementRow, pressed && styles.pressed]}
						>
							<View style={[styles.checkbox, isAgreed && styles.checkboxActive]}>
								{isAgreed ? (
									<MaterialIcons name="check" size={14} color="#FFFFFF" />
								) : null}
							</View>
							<ThemedText style={styles.agreementText}>
								Saya setuju dengan syarat dan kebijakan privasi.
							</ThemedText>
						</Pressable>

						<Pressable
							accessibilityRole="button"
							onPress={handleRegister}
							disabled={!isReady || isSubmitting}
							style={({ pressed }) => [
								styles.primaryButton,
								(!isReady || isSubmitting) && styles.primaryButtonDisabled,
								pressed && isReady && !isSubmitting && styles.buttonPressed,
							]}
						>
							<ThemedText style={styles.primaryButtonText}>
								{isSubmitting ? 'Memproses...' : 'Daftar Akun'}
							</ThemedText>
						</Pressable>

						<View style={styles.divider} />

						<View style={styles.linkRow}>
							<ThemedText style={styles.linkText}>Sudah punya akun?</ThemedText>
							<Pressable accessibilityRole="button" onPress={handleLogin}>
								<ThemedText style={styles.linkAction}>Masuk</ThemedText>
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
	heroGlowSmall: {
		position: 'absolute',
		width: 120,
		height: 120,
		borderRadius: 60,
		left: -30,
		bottom: -40,
		backgroundColor: '#1B9EC1',
		opacity: 0.25,
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
	featureList: {
		marginTop: 14,
		gap: 10,
	},
	featureRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	featureIconWrap: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#DFF6FF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	featureText: {
		color: '#E8F7FF',
		fontSize: 12,
		fontWeight: '600',
		flex: 1,
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
		gap: 8,
		marginTop: 12,
	},
	helperText: {
		fontSize: 12,
		color: '#6B7280',
		flex: 1,
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
	agreementRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginTop: 16,
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
	agreementText: {
		fontSize: 12,
		color: '#4B5563',
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
