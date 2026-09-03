import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-native";
import {
	View,
	TextInput,
	StyleSheet,
	KeyboardAvoidingView,
	Pressable,
	Animated,
	Keyboard,
	TouchableWithoutFeedback,
	BackHandler,
	Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { createNewNote, updateNote } from "../utils/api";
import { FontAwesome5 } from "@expo/vector-icons";
import WebView from "react-native-webview";
import EditorHTML from "../webView/html.js";
import Toolbar from "../components/Toolbar.jsx";

const NewNote = ({
	folder,
	token,
	setAllData,
	note,
	setNote,
	db,
	autoSave,
	theme,
	darkMode,
}) => {
	const [title, setTitle] = useState(note ? note.title : "");
	const [closed, setClosed] = useState(false);
	const [saving, setSaving] = useState(false);

	// Holds a list of format states to update toolbar
	const [formatState, setFormatState] = useState({});

	const navigate = useNavigate();
	const webviewRef = useRef();
	const webviewReady = useRef(false);
	const currentHTML = useRef(note?.htmlText ?? "");
	const lastSavedHTML = useRef(note?.htmlText ?? "");
	const currentTitle = useRef(note?.title ?? "");
	const currentNote = useRef(note ?? null);
	const currentlySaving = useRef(false);

	const opacityAni = useRef(new Animated.Value(0)).current;
	const transYAni = useRef(new Animated.Value(500)).current;

	// BACKHANDLER TAKES PRIORITY WHILE NOTE IS OPEN AND RETURNS POWER TO MAIN
	// BACKHANDLER WHEN DONE
	useEffect(() => {
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				closeNote();
				return true;
			},
		);

		return () => subscription.remove();
	}, [closed, note]);

	useEffect(() => {
		if (!autoSave || !note) return;

		const saveInterval = setInterval(() => {
			saveNote(currentHTML.current);
		}, 10000);

		return () => clearInterval(saveInterval);
	}, [autoSave, note]);

	// THIS EXISTS INCASE USER IS CAPABLE OF TRIGGERING DARKMODE WHILE EDITING NOTE POSSIBLY IN FUTURE REALEASES
	useEffect(() => {
		if (!webviewReady.current) return;

		sendEditorCommand("setTheme", {
			backgroundColor: darkMode ? "#000000" : "#EEEEEE",
			color: darkMode ? "#FFFFFF" : "#000000",
		});
	}, [darkMode]);

	// OPEN NOTE ANIMATION
	useEffect(() => {
		Animated.parallel([
			Animated.timing(opacityAni, {
				delay: 100,
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.spring(transYAni, {
				delay: 100,
				toValue: 0,
				tension: 150,
				friction: 10,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const sendEditorCommand = (command, value) => {
		webviewRef.current?.postMessage(
			JSON.stringify({
				command,
				value,
			}),
		);
	};

	const handleTitleChange = (newTitle) => {
		setTitle(newTitle);
		currentTitle.current = newTitle;
	};

	const initializeEditor = () => {
		webviewReady.current = true;

		setWebViewTheme();

		sendEditorCommand("setHTML", note?.htmlText ?? "");
	};

	const setWebViewTheme = () => {
		sendEditorCommand("setTheme", {
			backgroundColor: darkMode ? "#000000" : "#EEEEEE",
			color: darkMode ? "#FFFFFF" : "#000000",
		});
	};

	const closeNote = () => {
		if (closed) return;

		setClosed(true);

		const htmlToSave = currentHTML.current;

		// CLOSE NOTE ANIMATION BEFORE LOOSING STATE
		Animated.parallel([
			Animated.timing(opacityAni, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.spring(transYAni, {
				toValue: 500,
				tension: 150,
				friction: 10,
				useNativeDriver: true,
			}),
		]).start(async () => {
			navigate("/");
			setNote(null);

			saveNote(htmlToSave);
		});
	};

	const handleLinkClick = async (payload) => {
		try {
			// payload = { href: "",text: "", target: "" };
			await WebBrowser.openBrowserAsync(payload.href);
		} catch (err) {
			console.error("Failed to open link:", err);
		}
	};

	const onMessage = (event) => {
		const receivedData = JSON.parse(event.nativeEvent.data);

		switch (receivedData.type) {
			case "selectionState":
				setFormatState(receivedData.payload);
				break;

			case "contentChanged":
				currentHTML.current = receivedData.payload;
				break;

			case "linkClick":
				handleLinkClick(receivedData.payload);
				break;

			case "ready":
				webviewReady.current = true;

				sendEditorCommand("setTheme", {
					backgroundColor: darkMode ? "#000000" : "#EEEEEE",
					color: darkMode ? "#FFFFFF" : "#000000",
				});

				sendEditorCommand("setHTML", note?.htmlText ?? "");
				break;
		}
	};

	const saveNote = async (content) => {
		if (currentlySaving.current) {
			return;
		}

		const activeNote = currentNote.current;
		const htmlChanged = lastSavedHTML.current !== currentHTML.current;
		const titleChanged = (activeNote?.title ?? "") !== currentTitle.current;

		if (activeNote && !htmlChanged && !titleChanged) {
			return;
		}

		currentlySaving.current = true;
		setSaving(true);

		const titleToSave = currentTitle.current?.trim() || "Untitled Note";

		/*
		 * EXISTING NOTE
		 */
		if (activeNote?.noteid) {
			const previousNote = { ...activeNote };

			const optimisticNote = {
				...activeNote,
				title: titleToSave,
				htmlText: content,
				folderId: folder?.folderid ?? null,
				updated: new Date().toISOString(),
			};

			// -----------------------------------------
			// 1. OPTIMISTICALLY UPDATE UI IMMEDIATELY
			// -----------------------------------------

			setAllData((prev) => ({
				...prev,
				notes: prev.notes.map((item) =>
					item.noteid === activeNote.noteid ? optimisticNote : item,
				),
			}));

			try {
				// -----------------------------------------
				// 2. UPDATE SERVER
				// -----------------------------------------

				const updatedNote = {
					notesId: activeNote.noteid,
					title: titleToSave,
					htmlNotes: content,
					locked: activeNote.locked,
					folderId: folder?.folderid ?? null,
					update: new Date(),
				};

				const res = await updateNote(token, updatedNote);
				const resNote = res.data.data[0];

				// -----------------------------------------
				// 3. SERVER IS SOURCE OF TRUTH
				// -----------------------------------------

				const savedNote = {
					title: resNote.title,
					createdAt: resNote.createdat,
					noteid: resNote.notesid,
					htmlText: resNote.htmlnotes,
					locked: resNote.locked,
					folderId: resNote.folderid,
					updated: resNote.updated,
				};

				currentNote.current = savedNote;
				currentTitle.current = savedNote.title;
				lastSavedHTML.current = savedNote.htmlText;

				setNote(savedNote);

				setAllData((prev) => ({
					...prev,
					notes: prev.notes.map((item) =>
						item.noteid === savedNote.noteid ? savedNote : item,
					),
				}));

				// -----------------------------------------
				// 4. UPDATE LOCAL DATABASE
				// -----------------------------------------

				await db.runAsync(
					`UPDATE notes
         SET title = ?,
             htmlText = ?,
             locked = ?,
             folderId = ?,
             \`updated\` = ?
         WHERE noteid = ?`,
					[
						savedNote.title,
						savedNote.htmlText,
						savedNote.locked,
						savedNote.folderId,
						savedNote.updated,
						savedNote.noteid,
					],
				);
			} catch (err) {
				console.error("Failed to save note:", err);

				// -----------------------------------------
				// SERVER FAILED — REVERT OPTIMISTIC UPDATE
				// -----------------------------------------

				setAllData((prev) => ({
					...prev,
					notes: prev.notes.map((item) =>
						item.noteid === previousNote.noteid ? previousNote : item,
					),
				}));

				throw err;
			} finally {
				currentlySaving.current = false;
				setSaving(false);
			}

			return;
		}

		/*
		 * NEW NOTE
		 */
		try {
			const newNote = {
				folderId: folder?.folderid ?? null,
				title: titleToSave,
				htmlNotes: content,
			};

			const res = await createNewNote(token, newNote);
			const resNote = res.data.data[0];

			const savedNote = {
				title: resNote.title,
				createdAt: resNote.createdat,
				noteid: resNote.notesid,
				htmlText: resNote.htmlnotes,
				locked: resNote.locked,
				folderId: resNote.folderid,
				updated: resNote.updated,
			};

			// -----------------------------------------
			// UPDATE APP STATE
			// -----------------------------------------

			currentNote.current = savedNote;
			currentTitle.current = savedNote.title;
			lastSavedHTML.current = savedNote.htmlText;

			setNote(savedNote);

			setAllData((prev) => ({
				...prev,
				notes: [...prev.notes, savedNote],
			}));

			// -----------------------------------------
			// UPDATE LOCAL DATABASE
			// -----------------------------------------

			await db.runAsync(
				`INSERT INTO notes (
        noteid,
        title,
        locked,
        htmlText,
        folderId,
        createdAt,
        updated,
        trashed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					resNote.notesid,
					resNote.title,
					resNote.locked,
					resNote.htmlnotes,
					resNote.folderid,
					resNote.createdat,
					resNote.updated,
					resNote.trashed,
				],
			);
		} catch (err) {
			console.error("Failed to create note:", err);
			throw err;
		} finally {
			currentlySaving.current = false;
			setSaving(false);
		}
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: opacityAni,
					transform: [{ translateY: transYAni }],
				},
			]}
		>
			<KeyboardAvoidingView
				style={[
					styles.keyboardContainer,
					{ backgroundColor: darkMode ? "#000" : "#eee" },
				]}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={0}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
					<View style={styles.saveInputContainer}>
						<TextInput
							style={[styles.title, { color: darkMode ? "#fff" : "#000" }]}
							placeholder="Title"
							value={title}
							placeholderTextColor="#aaa"
							onChangeText={handleTitleChange}
						/>
						<Pressable
							style={[
								styles.save,
								{
									backgroundColor: theme.on
										? theme.color
										: darkMode
											? "#171717"
											: "#EEEEE",
								},
							]}
							onPress={() => saveNote(currentHTML.current)}
						>
							{saving ? (
								<FontAwesome5
									name="cloud-upload-alt"
									style={[
										styles.saveText,
										{ color: darkMode ? "#f5f5f5" : "#222222" },
									]}
								/>
							) : (
								<FontAwesome5
									name="save"
									style={[
										styles.saveText,
										{ color: darkMode ? "#f5f5f5" : "#222222" },
									]}
								/>
							)}
						</Pressable>
					</View>
				</TouchableWithoutFeedback>
				<WebView
					ref={webviewRef}
					style={[styles.editor, { color: darkMode ? "#fff" : "#000" }]}
					javaScriptEnabled={true}
					source={{ html: EditorHTML }}
					onLoad={() => initializeEditor()}
					onMessage={onMessage}
					onError={(syntheticEvent) => {
						const { nativeEvent } = syntheticEvent;
						console.error("WebView error: ", nativeEvent);
					}}
					originWhitelist={["*"]}
					domStorageEnabled
					textZoom={100}
				/>
				<Toolbar
					webviewRef={webviewRef}
					darkMode={darkMode}
					theme={theme}
					formatState={formatState}
				/>
			</KeyboardAvoidingView>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},

	keyboardContainer: {
		flex: 1,
		paddingTop: 50,
		paddingBottom: 25,
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 25,
		paddingTop: 0,
		paddingBottom: 10,
		color: "#fff",
		maxWidth: "75%",
	},
	saveInputContainer: {
		padding: 5,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	save: {
		justifyContent: "center",
		alignItems: "center",
		minWidth: 40,
		minHeight: 40,
		borderRadius: 10000,
		elevation: 2,
		outlineWidth: 2,
		outlineColor: "#343434",
	},
	saveText: {
		fontSize: 18,
	},
	editor: {
		flex: 1,
		textAlignVertical: "top",
	},
	white: {
		color: "#fff",
		fontSize: 17,
	},
});

export default NewNote;
