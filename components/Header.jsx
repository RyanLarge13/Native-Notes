import { useEffect, useState, useRef } from "react";

import {
	View,
	Animated,
	Text,
	TextInput,
	StyleSheet,
	Pressable,
	Keyboard,
} from "react-native";

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { useNavigate } from "react-router-native";

const Header = ({
	folder,
	setFolder,
	goBack,
	setNotes,
	allNotes,
	setMenuOpen,
	view,
	setView,
	layoutOptions,
	setLayoutOptions,
	darkMode,
	theme,
}) => {
	const [search, setSearch] = useState(false);

	const [searchText, setSearchText] = useState("");

	const searchInputRef = useRef(null);

	const menuOpacity = useRef(new Animated.Value(0)).current;

	const menuScale = useRef(new Animated.Value(0.92)).current;

	const navigate = useNavigate();

	const accent = theme.on ? theme.color : "#f59e0b";

	const colors = darkMode
		? {
				surface: "#18181b",
				surfacePressed: "#202023",

				text: "#f4f4f5",
				secondary: "#a1a1aa",
				muted: "#71717a",

				border: "#27272a",
			}
		: {
				surface: "#ffffff",
				surfacePressed: "#f4f4f5",

				text: "#18181b",
				secondary: "#71717a",
				muted: "#a1a1aa",

				border: "#e4e4e7",
			};

	/*
	 * SEARCH
	 */

	useEffect(() => {
		if (!folder) {
			if (!searchText.trim()) {
				setNotes([]);
				return;
			}

			showSearchedNotes(allNotes);
			return;
		}

		const folderNotes = allNotes.filter(
			(note) => note.folderId === folder.folderid,
		);

		if (!searchText.trim()) {
			setNotes(folderNotes);
			return;
		}

		showSearchedNotes(folderNotes);
	}, [searchText, folder, allNotes]);

	/*
	 * OPTIONS MENU ANIMATION
	 */

	useEffect(() => {
		if (layoutOptions) {
			Animated.parallel([
				Animated.timing(menuOpacity, {
					toValue: 1,
					duration: 130,
					useNativeDriver: true,
				}),

				Animated.spring(menuScale, {
					toValue: 1,
					tension: 140,
					friction: 12,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(menuOpacity, {
					toValue: 0,
					duration: 100,
					useNativeDriver: true,
				}),

				Animated.timing(menuScale, {
					toValue: 0.92,
					duration: 100,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [layoutOptions]);

	const showSearchedNotes = (source) => {
		const query = searchText.trim().toLowerCase();

		const searchedNotes = source.filter((note) =>
			note.title?.toLowerCase().includes(query),
		);

		setNotes(searchedNotes);
	};

	const openSearch = () => {
		setLayoutOptions(false);
		setSearch(true);

		requestAnimationFrame(() => {
			searchInputRef.current?.focus();
		});
	};

	const closeSearch = () => {
		setSearch(false);
		setSearchText("");

		Keyboard.dismiss();
	};

	/*
	 * SEARCH MODE
	 */

	if (search) {
		return (
			<View style={styles.container}>
				<View
					style={[
						styles.searchBar,
						{
							backgroundColor: colors.surface,
							borderColor: colors.border,
						},
					]}
				>
					<Pressable
						onPress={closeSearch}
						hitSlop={8}
						style={({ pressed }) => [
							styles.iconButton,

							pressed && {
								backgroundColor: colors.surfacePressed,
							},
						]}
					>
						<Feather name="arrow-left" size={19} color={colors.secondary} />
					</Pressable>

					<Feather
						name="search"
						size={17}
						color={colors.muted}
						style={styles.searchBarIcon}
					/>

					<TextInput
						ref={searchInputRef}
						underlineColorAndroid="transparent"
						placeholder={
							folder ? `Search in ${folder.title}` : "Search all notes"
						}
						placeholderTextColor={colors.muted}
						value={searchText}
						onChangeText={setSearchText}
						returnKeyType="search"
						autoCorrect={false}
						selectionColor={accent}
						style={[
							styles.searchInput,
							{
								color: colors.text,
							},
						]}
					/>

					{searchText.length > 0 ? (
						<Pressable
							onPress={() => setSearchText("")}
							hitSlop={8}
							style={({ pressed }) => [
								styles.clearButton,

								pressed && {
									backgroundColor: colors.surfacePressed,
								},
							]}
						>
							<Feather name="x" size={15} color={colors.secondary} />
						</Pressable>
					) : null}
				</View>
			</View>
		);
	}

	/*
	 * NORMAL HEADER
	 */

	return (
		<View style={styles.container}>
			{/* LEFT SIDE */}

			<View style={styles.actionGroup}>
				<HeaderButton
					icon="menu"
					onPress={() => setMenuOpen(true)}
					colors={colors}
					accent={accent}
					primary
				/>

				{folder ? (
					<>
						<HeaderButton icon="arrow-left" onPress={goBack} colors={colors} />

						<HeaderButton
							icon="home"
							onPress={() => setFolder(null)}
							colors={colors}
						/>
					</>
				) : null}
			</View>

			{/* RIGHT SIDE */}

			<View style={styles.actionGroup}>
				<HeaderButton icon="search" onPress={openSearch} colors={colors} />

				<HeaderButton
					icon="more-vertical"
					onPress={() => setLayoutOptions((prev) => !prev)}
					colors={colors}
				/>

				{/* OPTIONS MENU */}

				<Animated.View
					pointerEvents={layoutOptions ? "auto" : "none"}
					style={[
						styles.optionsMenu,

						{
							backgroundColor: colors.surface,

							borderColor: colors.border,

							opacity: menuOpacity,

							transform: [
								{
									scale: menuScale,
								},
							],
						},
					]}
				>
					<MenuItem
						icon={view ? "list" : "grid"}
						title={view ? "List view" : "Grid view"}
						colors={colors}
						onPress={() => {
							setLayoutOptions(false);
							setView((prev) => !prev);
						}}
					/>

					<View
						style={[
							styles.menuDivider,
							{
								backgroundColor: colors.border,
							},
						]}
					/>

					<MenuItem
						icon="folder-plus"
						title="Create folder"
						colors={colors}
						accent={accent}
						onPress={() => {
							setLayoutOptions(false);

							navigate("/newfolder");
						}}
					/>
				</Animated.View>
			</View>
		</View>
	);
};

/*
 * HEADER ICON BUTTON
 */

const HeaderButton = ({ icon, onPress, colors, accent, primary = false }) => {
	return (
		<Pressable
			onPress={onPress}
			hitSlop={6}
			style={({ pressed }) => [
				styles.iconButton,

				primary && {
					backgroundColor: `${accent}14`,
				},

				pressed && {
					backgroundColor: colors.surfacePressed,
				},
			]}
		>
			<Feather
				name={icon}
				size={19}
				color={primary ? accent : colors.secondary}
			/>
		</Pressable>
	);
};

/*
 * OPTIONS MENU ITEM
 */

const MenuItem = ({ icon, title, colors, accent, onPress }) => {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.menuItem,

				pressed && {
					backgroundColor: colors.surfacePressed,
				},
			]}
		>
			<View
				style={[
					styles.menuIcon,

					accent && {
						backgroundColor: `${accent}14`,
					},
				]}
			>
				<Feather
					name={icon}
					size={16}
					color={accent ? accent : colors.secondary}
				/>
			</View>

			<Text
				style={[
					styles.menuItemText,
					{
						color: colors.text,
					},
				]}
			>
				{title}
			</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	/*
	 * HEADER
	 */

	container: {
		width: "100%",
		minHeight: 48,

		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",

		paddingHorizontal: 10,
	},

	actionGroup: {
		flexDirection: "row",
		alignItems: "center",

		gap: 2,

		position: "relative",
	},

	/*
	 * ICON BUTTONS
	 */

	iconButton: {
		width: 40,
		height: 40,

		alignItems: "center",
		justifyContent: "center",

		borderRadius: 12,
	},

	/*
	 * SEARCH
	 */

	searchBar: {
		flex: 1,
		height: 42,

		flexDirection: "row",
		alignItems: "center",

		borderRadius: 13,

		borderWidth: StyleSheet.hairlineWidth,
	},

	searchBarIcon: {
		marginLeft: 2,
		marginRight: 8,
	},

	searchInput: {
		flex: 1,
		height: "100%",

		paddingVertical: 0,
		paddingHorizontal: 0,

		fontSize: 14,
	},

	clearButton: {
		width: 32,
		height: 32,

		alignItems: "center",
		justifyContent: "center",

		marginRight: 4,

		borderRadius: 10,
	},

	/*
	 * OPTIONS MENU
	 */

	optionsMenu: {
		position: "absolute",

		width: 210,

		right: 2,
		top: 46,

		padding: 6,

		borderRadius: 14,

		borderWidth: StyleSheet.hairlineWidth,

		elevation: 12,

		zIndex: 100,
	},

	menuItem: {
		minHeight: 48,

		flexDirection: "row",
		alignItems: "center",

		paddingHorizontal: 8,

		borderRadius: 10,
	},

	menuIcon: {
		width: 32,
		height: 32,

		alignItems: "center",
		justifyContent: "center",

		borderRadius: 9,
	},

	menuItemText: {
		marginLeft: 10,

		fontSize: 14,
		fontWeight: "500",
	},

	menuDivider: {
		height: StyleSheet.hairlineWidth,

		marginVertical: 4,
		marginHorizontal: 8,
	},
});

export default Header;
