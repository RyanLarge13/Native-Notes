import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Pressable,
  View,
  Text,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Outlet, useLocation, useNavigate } from "react-router-native";
import { BackHandler } from "react-native";
import Header from "../components/Header";
import Sorter from "../components/Sorter";
import Folder from "../components/Folder";
import Icon from "react-native-vector-icons/Feather";
import Note from "../components/Note";

const Account = ({
  mainTitle,
  folders,
  notes,
  setNotes,
  folder,
  setFolder,
  goBack,
  setOpen,
  pickFolder,
  open,
  menuOpen,
  options,
  setOptions,
  note,
  setNote,
  allNotes,
  setMenuOpen,
  systemFolder,
  layoutOptions,
  setLayoutOptions,
  userSettingsOpen,
  view,
  setView,
  order,
  setOrder,
  sort,
  setSort,
  db,
}) => {
  const [notesToRender, setNotesToRender] = useState([]);
  const [sortOptions, setSortOptions] = useState(false);

  const scrollRef = useRef(null);
  const titleRef = useRef(null);

  const infoOpacity = useRef(new Animated.Value(1)).current;
  const miniTitleOpac = useRef(new Animated.Value(0)).current;

  const navigate = useNavigate();
  const location = useLocation();
  const { width } = useWindowDimensions();

  const nestedGoBack = () => {
    if (location.pathname !== "/") {
      navigate("/");
      if (note) {
        setNote(null);
      }
      return true;
    }
    if (sortOptions) {
      setSortOptions(false);
      return true;
    }
    return goBack();
  };

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", nestedGoBack);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", nestedGoBack);
    };
  }, [
    folder,
    note,
    pickFolder,
    open,
    menuOpen,
    options,
    mainTitle,
    systemFolder,
    location,
    layoutOptions,
    sortOptions,
    userSettingsOpen,
  ]);

  useEffect(() => {
    sortAndFilterNotes();
  }, [order, notes, sort]);

  const sortAndFilterNotes = () => {
    let copyOfNotes;
    if (mainTitle === "Trashed") {
      copyOfNotes = notes.filter((aNote) => aNote.trashed);
    } else {
      copyOfNotes = notes.filter((aNote) => !aNote.trashed);
    }
    if (order) {
      copyOfNotes.sort((a, b) =>
        sort === "Title"
          ? a.title.localeCompare(b.title)
          : sort === "Date"
          ? +new Date(a.createdAt) - +new Date(b.createdAt)
          : +new Date(a.updated) - +new Date(b.updated)
      );
    }
    if (!order) {
      copyOfNotes.sort((a, b) =>
        sort === "Title"
          ? b.title.localeCompare(a.title)
          : sort === "Date"
          ? +new Date(b.createdAt) - +new Date(a.createdAt)
          : +new Date(b.updated) - +new Date(a.updated)
      );
    }
    setNotesToRender(copyOfNotes);
  };

  const opacInfo = (diff) => {
    if (diff < 0) {
      return;
    }
    if (diff > 150) {
      return;
    }
    const opacity = diff / 150;
    Animated.timing(infoOpacity, {
      toValue: opacity,
      duration: 1,
      useNativeDriver: true,
    }).start();
  };

  const opacMiniTitle = (diff) => {
    if (diff > 0) {
      return;
    }
    if (diff < -150) {
      return;
    }
    const opacity = Math.abs(diff) / 150;
    Animated.timing(miniTitleOpac, {
      toValue: opacity,
      duration: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = (e) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    if (titleRef.current) {
      titleRef.current.measureLayout(
        scrollRef.current,
        (x, y, width, height) => {
          const diff = Math.floor(y - scrollY);
          opacInfo(diff);
          opacMiniTitle(diff);
        }
      );
    }
  };

  const toggleOptions = () => {
    setOptions((prev) => !prev);
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        <Animated.View
          ref={titleRef}
          style={[styles.mainTitleContainer, { opacity: infoOpacity }]}
        >
          <Text style={styles.mainTitle}>{mainTitle}</Text>
          <Text style={styles.folderLen}>
            {folders.length} {folders.length === 1 ? "folder" : "folders"}{" "}
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Text>
        </Animated.View>
        <View style={styles.headerContainer}>
          <Animated.View style={{ opacity: miniTitleOpac }}>
            <Text style={[styles.white, styles.miniTitle]}>{mainTitle}</Text>
          </Animated.View>
          <Header
            folder={folder}
            setFolder={setFolder}
            goBack={goBack}
            notes={notes}
            setNotes={setNotes}
            allNotes={allNotes}
            setMenuOpen={setMenuOpen}
            view={view}
            setView={setView}
            layoutOptions={layoutOptions}
            setLayoutOptions={setLayoutOptions}
          />
        </View>
        <View style={styles.folderContainer}>
          {folders.map((fold) => (
            <Folder
              key={fold.folderid}
              folder={fold}
              setFolder={setFolder}
              setOpen={setOpen}
              allNotes={allNotes}
            />
          ))}
        </View>
        <Sorter
          filter={sort}
          setFilter={setSort}
          order={order}
          setOrder={setOrder}
          sortOptions={sortOptions}
          setSortOptions={setSortOptions}
          db={db}
        />
        <View
          style={[
            styles.notesContainer,
            view
              ? { flexDirection: "row", flexWrap: "wrap", gap: 15 }
              : { flexDirection: "column", gap: 30 },
          ]}
        >
          {notesToRender.map((aNote, index) => (
            <Note
              key={aNote.noteid}
              note={aNote}
              setOpen={setOpen}
              setNote={setNote}
              view={view}
              index={index}
              width={width}
            />
          ))}
        </View>
        {layoutOptions ? (
          <Pressable
            style={styles.backdrop}
            onPress={() => setLayoutOptions(false)}
          ></Pressable>
        ) : null}
        {sortOptions ? (
          <Pressable
            style={styles.backdrop}
            onPress={() => setSortOptions(false)}
          ></Pressable>
        ) : null}
      </ScrollView>
      {!note ? (
        <>
          {options ? (
            <Pressable
              style={styles.backdrop}
              onPress={() => setOptions(false)}
            ></Pressable>
          ) : null}
          <Pressable onPress={() => toggleOptions()} style={styles.addIcon}>
            <Icon name="edit" style={styles.iconColor} />
          </Pressable>
        </>
      ) : null}
      <Outlet />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 5,
    paddingBottom: 8,
    backgroundColor: "#000",
  },
  miniTitle: {
    fontSize: 10,
    marginTop: 5,
  },
  note: {
    borderRadius: 10,
    backgroundColor: "#222",
    elevation: 2,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  mainTitleContainer: {
    marginTop: 150,
  },
  mainTitle: {
    fontSize: 25,
    color: "#fff",
    textAlign: "center",
  },
  folderLen: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 125,
    fontSize: 12,
  },
  folderContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 15,
    marginTop: 20,
  },
  notesContainer: {
    marginVertical: 25,
  },
  white: {
    color: "#fff",
  },
  addIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    padding: 20,
    borderRadius: 1000,
    backgroundColor: "#111",
  },
  iconColor: {
    color: "#fcd34d",
    fontSize: 15,
  },
});

export default Account;
