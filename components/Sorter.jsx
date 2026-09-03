import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Pressable } from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";

const Sorter = ({
	filter,
	setFilter,
	order,
	setOrder,
	sortOptions,
	setSortOptions,
	darkMode,
	theme,
}) => {
	const opacityAni = useRef(new Animated.Value(0)).current;
	const scaleAni = useRef(new Animated.Value(0.92)).current;
	const translateYAni = useRef(new Animated.Value(-8)).current;

	const accent = theme.on ? theme.color : "#fcd34d";

	const foreground = darkMode ? "#f5f5f5" : "#171717";
	const secondary = darkMode ? "#a3a3a3" : "#737373";
	const surface = darkMode ? "#171717" : "#ffffff";
	const elevatedSurface = darkMode ? "#1c1c1c" : "#ffffff";
	const border = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

	useEffect(() => {
		if (sortOptions) {
			Animated.parallel([
				Animated.timing(opacityAni, {
					toValue: 1,
					duration: 140,
					useNativeDriver: true,
				}),

				Animated.spring(scaleAni, {
					toValue: 1,
					tension: 180,
					friction: 14,
					useNativeDriver: true,
				}),

				Animated.spring(translateYAni, {
					toValue: 0,
					tension: 180,
					friction: 14,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(opacityAni, {
					toValue: 0,
					duration: 100,
					useNativeDriver: true,
				}),

				Animated.timing(scaleAni, {
					toValue: 0.92,
					duration: 100,
					useNativeDriver: true,
				}),

				Animated.timing(translateYAni, {
					toValue: -8,
					duration: 100,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [sortOptions]);

	const selectSort = (value) => {
		setFilter(value);
		setSortOptions(false);
	};

	const sortOptionsList = [
		{
			value: "Title",
			label: "Title",
			icon: "type",
		},
		{
			value: "Date",
			label: "Date created",
			icon: "calendar",
		},
		{
			value: "Update",
			label: "Last updated",
			icon: "clock",
		},
	];

	return (
		<View style={styles.container}>
			{/* SORT CONTROL */}

			<View
				style={[
					styles.sortControl,
					{
						backgroundColor: surface,
						borderColor: border,
					},
				]}
			>
				<Pressable
					onPress={() => setSortOptions((prev) => !prev)}
					style={({ pressed }) => [styles.sortType, pressed && styles.pressed]}
				>
					<FontAwesome
						name="sort-amount-desc"
						style={[
							styles.sortIcon,
							{
								color: accent,
							},
						]}
					/>

					<View>
						<Text
							style={[
								styles.label,
								{
									color: secondary,
								},
							]}
						>
							Sort by
						</Text>

						<Text
							style={[
								styles.name,
								{
									color: foreground,
								},
							]}
						>
							{filter === "Update" ? "Updated" : filter}
						</Text>
					</View>

					<Feather
						name={sortOptions ? "chevron-up" : "chevron-down"}
						style={[
							styles.chevron,
							{
								color: secondary,
							},
						]}
					/>
				</Pressable>

				<View
					style={[
						styles.divider,
						{
							backgroundColor: border,
						},
					]}
				/>

				{/* ASCENDING / DESCENDING */}

				<Pressable
					onPress={() => setOrder((prev) => !prev)}
					style={({ pressed }) => [
						styles.orderButton,
						pressed && styles.pressed,
					]}
				>
					<FontAwesome
						name={order ? "long-arrow-up" : "long-arrow-down"}
						style={[
							styles.orderIcon,
							{
								color: accent,
							},
						]}
					/>
				</Pressable>
			</View>

			{/* DROPDOWN */}

			<Animated.View
				pointerEvents={sortOptions ? "auto" : "none"}
				style={[
					styles.options,
					{
						backgroundColor: elevatedSurface,
						borderColor: border,
						opacity: opacityAni,
						transform: [
							{
								scale: scaleAni,
							},
							{
								translateY: translateYAni,
							},
						],
					},
				]}
			>
				<Text
					style={[
						styles.optionsHeading,
						{
							color: secondary,
						},
					]}
				>
					SORT NOTES BY
				</Text>

				{sortOptionsList.map((option) => {
					const active = filter === option.value;

					return (
						<Pressable
							key={option.value}
							onPress={() => selectSort(option.value)}
							style={({ pressed }) => [
								styles.typeBtn,

								active && {
									backgroundColor: darkMode
										? "rgba(255,255,255,0.07)"
										: "rgba(0,0,0,0.05)",
								},

								pressed && styles.pressed,
							]}
						>
							<View style={styles.optionLeft}>
								<View
									style={[
										styles.optionIconContainer,
										{
											backgroundColor: active ? `${accent}18` : "transparent",
										},
									]}
								>
									<Feather
										name={option.icon}
										style={[
											styles.optionIcon,
											{
												color: active ? accent : secondary,
											},
										]}
									/>
								</View>

								<Text
									style={[
										styles.optionText,
										{
											color: foreground,
										},
									]}
								>
									{option.label}
								</Text>
							</View>

							{active && (
								<Feather
									name="check"
									style={[
										styles.check,
										{
											color: accent,
										},
									]}
								/>
							)}
						</Pressable>
					);
				})}
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: "relative",
		width: "100%",
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
		marginTop: 18,
		marginBottom: 8,
	},

	/*
	 * MAIN SORT PILL
	 */

	sortControl: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 14,
		borderWidth: 1,
		overflow: "hidden",

		elevation: 2,

		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},

	sortType: {
		minHeight: 48,
		paddingLeft: 14,
		paddingRight: 12,

		flexDirection: "row",
		alignItems: "center",

		gap: 10,
	},

	sortIcon: {
		fontSize: 15,
	},

	label: {
		fontSize: 9,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.6,
		marginBottom: 1,
	},

	name: {
		fontSize: 13,
		fontWeight: "600",
	},

	chevron: {
		fontSize: 14,
		marginLeft: 3,
	},

	divider: {
		width: 1,
		height: 26,
	},

	orderButton: {
		width: 45,
		minHeight: 48,

		justifyContent: "center",
		alignItems: "center",
	},

	orderIcon: {
		fontSize: 17,
	},

	/*
	 * DROPDOWN
	 */

	options: {
		position: "absolute",

		width: 220,

		right: 0,
		top: 58,

		borderRadius: 16,

		borderWidth: 1,

		padding: 7,

		elevation: 12,

		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 6,
		},
		shadowOpacity: 0.2,
		shadowRadius: 12,

		zIndex: 100,
	},

	optionsHeading: {
		fontSize: 9,
		fontWeight: "700",
		letterSpacing: 1,

		marginTop: 7,
		marginBottom: 6,
		marginHorizontal: 10,
	},

	typeBtn: {
		minHeight: 48,

		borderRadius: 11,

		paddingHorizontal: 10,

		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	optionLeft: {
		flexDirection: "row",
		alignItems: "center",

		gap: 10,
	},

	optionIconContainer: {
		width: 30,
		height: 30,

		borderRadius: 9,

		justifyContent: "center",
		alignItems: "center",
	},

	optionIcon: {
		fontSize: 15,
	},

	optionText: {
		fontSize: 13,
		fontWeight: "500",
	},

	check: {
		fontSize: 16,
		marginRight: 4,
	},

	pressed: {
		opacity: 0.65,
	},
});

export default Sorter;
