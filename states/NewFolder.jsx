import { useState, useEffect, useRef } from "react";
import {
	StyleSheet,
	Animated,
	TextInput,
	Text,
	Pressable,
	View,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigate } from "react-router-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import { unFormatColor } from "../utils/helpers/formatColor";
import { createNewFolder } from "../utils/api";
import Colors from "../components/Colors";

const NewFolder = ({ setAllData, folder, token, db, darkMode, theme }) => {
	const [color, setColor] = useState("bg-red-300");
	const [title, setTitle] = useState("");
	const [creating, setCreating] = useState(false);

	const navigate = useNavigate();

	const opacityAni = useRef(new Animated.Value(0)).current;
	const scaleAni = useRef(new Animated.Value(0.94)).current;
	const translateYAni = useRef(new Animated.Value(25)).current;

	const accent = theme.on ? theme.color : "#f59e0b";

	const colors = darkMode
		? {
				surface: "#18181b",
				surfaceSecondary: "#202023",
				pressed: "#27272a",

				text: "#f4f4f5",
				secondary: "#a1a1aa",
				muted: "#71717a",

				border: "#27272a",
				input: "#111113",
			}
		: {
				surface: "#ffffff",
				surfaceSecondary: "#f4f4f5",
				pressed: "#e4e4e7",

				text: "#18181b",
				secondary: "#71717a",
				muted: "#a1a1aa",

				border: "#e4e4e7",
				input: "#fafafa",
			};

	useEffect(() => {
		Animated.parallel([
			Animated.timing(opacityAni, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),

			Animated.spring(scaleAni, {
				toValue: 1,
				tension: 160,
				friction: 12,
				useNativeDriver: true,
			}),

			Animated.spring(translateYAni, {
				toValue: 0,
				tension: 160,
				friction: 12,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const close = () => {
		Animated.parallel([
			Animated.timing(opacityAni, {
				toValue: 0,
				duration: 130,
				useNativeDriver: true,
			}),

			Animated.timing(scaleAni, {
				toValue: 0.96,
				duration: 130,
				useNativeDriver: true,
			}),

			Animated.timing(translateYAni, {
				toValue: 20,
				duration: 130,
				useNativeDriver: true,
			}),
		]).start(() => {
			navigate("/");
		});
	};

	const createFolder = () => {
		const cleanTitle = title.trim();

		if (!cleanTitle || creating) {
			return;
		}

		setCreating(true);

		try {
			const tempId = uuidv4();

			const parentFolderId = folder?.folderid ?? null;

			const newFolder = {
				folderid: tempId,
				title: cleanTitle,
				color: unFormatColor(color),
				parentFolderId,
			};

			/*
			 * Optimistically add the folder immediately.
			 */
			setAllData((prevData) => ({
				...prevData,
				folders: [...prevData.folders, newFolder],
			}));

			navigate("/");

			/*
			 * Synchronize with server.
			 */
			createNewFolder(token, newFolder)
				.then(async (res) => {
					const resFolder = res.data.data[0];

					/*
					 * Replace temporary UUID with server ID.
					 */
					setAllData((prevData) => ({
						...prevData,
						folders: prevData.folders.map((aFolder) =>
							aFolder.folderid === tempId
								? {
										...aFolder,
										folderid: resFolder.folderid,
									}
								: aFolder,
						),
					}));

					/*
					 * Store authoritative folder locally.
					 */
					await db.runAsync(
						`
              INSERT INTO folders (
                folderid,
                title,
                color,
                parentFolderId
              )
              VALUES (?, ?, ?, ?);
            `,
						resFolder.folderid,
						cleanTitle,
						unFormatColor(color),
						parentFolderId,
					);
				})
				.catch((err) => {
					console.error("Failed to create folder:", err);
				})
				.finally(() => {
					setCreating(false);
				});
		} catch (err) {
			console.error("Failed to create folder:", err);
			setCreating(false);
		}
	};

	const canCreate = title.trim().length > 0 && !creating;

	return (
		<View style={styles.layer}>
			{/* BACKDROP */}

			<Pressable onPress={close} style={styles.backdrop} />

			<KeyboardAvoidingView
				pointerEvents="box-none"
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.keyboardLayer}
			>
				<Animated.View
					style={[
						styles.container,
						{
							backgroundColor: colors.surface,
							borderColor: colors.border,

							opacity: opacityAni,

							transform: [
								{
									translateY: translateYAni,
								},
								{
									scale: scaleAni,
								},
							],
						},
					]}
				>
					{/* HANDLE */}

					<View
						style={[
							styles.handle,
							{
								backgroundColor: colors.muted,
							},
						]}
					/>

					{/* HEADER */}

					<View style={styles.header}>
						<View
							style={[
								styles.headerIcon,
								{
									backgroundColor: `${accent}18`,
								},
							]}
						>
							<Feather name="folder-plus" size={19} color={accent} />
						</View>

						<View style={styles.headerText}>
							<Text
								style={[
									styles.title,
									{
										color: colors.text,
									},
								]}
							>
								New Folder
							</Text>

							<Text
								numberOfLines={1}
								style={[
									styles.subtitle,
									{
										color: colors.secondary,
									},
								]}
							>
								{folder
									? `Create inside ${folder.title}`
									: "Create a new top-level folder"}
							</Text>
						</View>

						<Pressable
							onPress={close}
							hitSlop={8}
							style={({ pressed }) => [
								styles.closeButton,

								pressed && {
									backgroundColor: colors.surfaceSecondary,
								},
							]}
						>
							<Feather name="x" size={19} color={colors.secondary} />
						</Pressable>
					</View>

					{/* NAME */}

					<View style={styles.section}>
						<Text
							style={[
								styles.label,
								{
									color: colors.muted,
								},
							]}
						>
							FOLDER NAME
						</Text>

						<View
							style={[
								styles.inputContainer,
								{
									backgroundColor: colors.input,
									borderColor: colors.border,
								},
							]}
						>
							<Feather name="folder" size={17} color={colors.secondary} />

							<TextInput
								autoFocus
								value={title}
								onChangeText={setTitle}
								placeholder="Give your folder a title"
								placeholderTextColor={colors.muted}
								returnKeyType="done"
								onSubmitEditing={() => {
									if (canCreate) {
										createFolder();
									}
								}}
								style={[
									styles.input,
									{
										color: colors.text,
									},
								]}
							/>
						</View>
					</View>

					{/* COLOR */}

					<View style={styles.section}>
						<View style={styles.colorHeading}>
							<Text
								style={[
									styles.label,
									{
										color: colors.muted,
									},
								]}
							>
								FOLDER COLOR
							</Text>

							<View
								style={[
									styles.colorPreview,
									{
										backgroundColor: color,
									},
								]}
							/>
						</View>

						<View
							style={[
								styles.colorContainer,
								{
									backgroundColor: colors.surfaceSecondary,
									borderColor: colors.border,
								},
							]}
						>
							<Colors setColor={setColor} selectedColor={color} />
						</View>
					</View>

					{/* ACTIONS */}

					<View style={styles.actions}>
						<Pressable
							onPress={close}
							style={({ pressed }) => [
								styles.cancelButton,
								{
									borderColor: colors.border,
								},

								pressed && {
									backgroundColor: colors.surfaceSecondary,
								},
							]}
						>
							<Text
								style={[
									styles.cancelText,
									{
										color: colors.text,
									},
								]}
							>
								Cancel
							</Text>
						</Pressable>

						<Pressable
							disabled={!canCreate}
							onPress={createFolder}
							style={({ pressed }) => [
								styles.createButton,
								{
									backgroundColor: accent,
								},

								!canCreate && styles.createButtonDisabled,

								pressed && canCreate && styles.createButtonPressed,
							]}
						>
							<Text
								style={[
									styles.createText,
									{
										color: darkMode ? "#18181b" : "#ffffff",
									},
								]}
							>
								{creating ? "Creating..." : "Create folder"}
							</Text>

							{!creating ? (
								<Feather
									name="arrow-right"
									size={16}
									color={darkMode ? "#18181b" : "#ffffff"}
								/>
							) : null}
						</Pressable>
					</View>
				</Animated.View>
			</KeyboardAvoidingView>
		</View>
	);
};

const styles = StyleSheet.create({
	layer: {
		...StyleSheet.absoluteFillObject,

		justifyContent: "flex-end",

		zIndex: 150,
	},

	backdrop: {
		...StyleSheet.absoluteFillObject,

		backgroundColor: "rgba(0, 0, 0, 0.55)",
	},

	keyboardLayer: {
		justifyContent: "flex-end",
	},

	/*
	 * MODAL
	 */

	container: {
		marginHorizontal: 14,
		marginBottom: 18,

		paddingTop: 8,
		paddingHorizontal: 18,
		paddingBottom: 18,

		borderRadius: 22,

		borderWidth: StyleSheet.hairlineWidth,

		elevation: 18,
	},

	handle: {
		width: 36,
		height: 4,

		alignSelf: "center",

		marginBottom: 13,

		borderRadius: 2,

		opacity: 0.45,
	},

	/*
	 * HEADER
	 */

	header: {
		flexDirection: "row",
		alignItems: "center",

		marginBottom: 22,
	},

	headerIcon: {
		width: 42,
		height: 42,

		alignItems: "center",
		justifyContent: "center",

		borderRadius: 13,
	},

	headerText: {
		flex: 1,

		marginLeft: 12,
	},

	title: {
		fontSize: 19,
		fontWeight: "700",

		letterSpacing: -0.25,
	},

	subtitle: {
		marginTop: 3,

		fontSize: 11,
	},

	closeButton: {
		width: 38,
		height: 38,

		alignItems: "center",
		justifyContent: "center",

		marginLeft: 8,

		borderRadius: 19,
	},

	/*
	 * SECTIONS
	 */

	section: {
		marginBottom: 19,
	},

	label: {
		marginBottom: 8,

		fontSize: 9,
		fontWeight: "700",

		letterSpacing: 0.8,
	},

	/*
	 * INPUT
	 */

	inputContainer: {
		height: 52,

		flexDirection: "row",
		alignItems: "center",

		paddingHorizontal: 14,

		borderRadius: 13,

		borderWidth: StyleSheet.hairlineWidth,
	},

	input: {
		flex: 1,

		height: "100%",

		marginLeft: 10,
		paddingVertical: 0,

		fontSize: 15,
		fontWeight: "500",
	},

	/*
	 * COLORS
	 */

	colorHeading: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	colorPreview: {
		width: 22,
		height: 8,

		marginBottom: 8,

		borderRadius: 4,
	},

	colorContainer: {
		paddingHorizontal: 10,
		paddingVertical: 12,

		borderRadius: 13,

		borderWidth: StyleSheet.hairlineWidth,
	},

	/*
	 * ACTIONS
	 */

	actions: {
		flexDirection: "row",

		gap: 10,

		marginTop: 2,
	},

	cancelButton: {
		height: 48,

		alignItems: "center",
		justifyContent: "center",

		paddingHorizontal: 20,

		borderRadius: 13,

		borderWidth: StyleSheet.hairlineWidth,
	},

	cancelText: {
		fontSize: 14,
		fontWeight: "600",
	},

	createButton: {
		flex: 1,
		height: 48,

		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",

		gap: 8,

		borderRadius: 13,

		elevation: 2,
	},

	createButtonDisabled: {
		opacity: 0.35,
	},

	createButtonPressed: {
		opacity: 0.86,

		transform: [
			{
				scale: 0.98,
			},
		],
	},

	createText: {
		fontSize: 14,
		fontWeight: "700",
	},
});

export default NewFolder;
