import { useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Pressable, View, Text } from "react-native";
import { Outlet, useLocation, useNavigate } from "react-router-native";
import { BackHandler } from "react-native";
import Header from "../components/Header";
import Sorter from "../components/Sorter";
import Folder from "../components/Folder";
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
  note,
  setNote,
  allNotes,
  setMenuOpen,
  systemFolder,
  layoutOptions,
  setLayoutOptions,
  userSettingsOpen,
}) => {
  const [order, setOrder] = useState(true);
  const [filter, setFilter] = useState("Title");
  const [notesToRender, setNotesToRender] = useState([]);
  const [searchedNotes, setSearchedNotes] = useState([]);
  const [view, setView] = useState(false);
  const [sortOptions, setSortOptions] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const nestedGoBack = () => {
    if (location.pathname !== "/") {
      navigate("/");
      console.log("location is not home");
      console.log(location.pathname);
      if (note) {
        console.log("killing note");
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
  }, [order, notes, filter]);

  const sortAndFilterNotes = () => {
    let copyOfNotes;
    if (mainTitle === "Trashed") {
      copyOfNotes = notes.filter((aNote) => aNote.trashed);
    } else {
      copyOfNotes = notes.filter((aNote) => !aNote.trashed);
    }
    if (order) {
      copyOfNotes.sort((a, b) =>
        filter === "Title"
          ? a.title.localeCompare(b.title)
          : filter === "Date"
          ? +new Date(a.createdAt) - +new Date(b.createdAt)
          : +new Date(a.updated) - +new Date(b.updated)
      );
      console.log("order");
    }
    if (!order) {
      copyOfNotes.sort((a, b) =>
        filter === "Title"
          ? b.title.localeCompare(a.title)
          : filter === "Date"
          ? +new Date(b.createdAt) - +new Date(a.createdAt)
          : +new Date(b.updated) - +new Date(a.updated)
      );
      console.log("no order");
    }
    setNotesToRender(copyOfNotes);
  };

  return (
    <>
      <ScrollView
        stickyHeaderIndices={[2]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        <Text style={styles.mainTitle}>{mainTitle}</Text>
        <Text style={styles.folderLen}>
          {folders.length} {folders.length === 1 ? "folder" : "folders"}{" "}
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </Text>
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
        <View style={styles.folderContainer}>
          {folders.map((fold) => (
            <Folder
              key={fold.folderid}
              folder={fold}
              setFolder={setFolder}
              setOpen={setOpen}
            />
          ))}
        </View>
        <Sorter
          filter={filter}
          setFilter={setFilter}
          order={order}
          setOrder={setOrder}
          sortOptions={sortOptions}
          setSortOptions={setSortOptions}
        />
        <View
          style={[
            styles.notesContainer,
            view
              ? { flexDirection: "row", flexWrap: "wrap", gap: 25 }
              : { flexDirection: "column", gap: 50 },
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
      <Outlet />
    </>
  );
};

const styles = StyleSheet.create({
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
  mainTitle: {
    fontSize: 25,
    marginTop: 100,
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
});

export default Account;
