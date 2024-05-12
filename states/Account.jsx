import { useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Pressable, View, Text } from "react-native";
import { BackHandler } from "react-native";
import { Outlet, useLocation, useNavigate } from "react-router-native";
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
 note,
 setNote,
 allNotes,
 setMenuOpen
}) => {
 const [order, setOrder] = useState(true);
 const [filter, setFilter] = useState("Title");
 const [notesToRender, setNotesToRender] = useState([]);
 const [searchedNotes, setSearchedNotes] = useState([]);
 const [view, setView] = useState(false);

 const navigate = useNavigate();
 const location = useLocation();

 const handleBackPress = useCallback(() => {
  if (folder) {
   if (note) {
    setNote(null);
    navigate("/");
    return true;
   }
   goBack();
   return true;
  }
  if (location !== "/") {
   navigate("/");
   return true;
  }
  return false;
 }, [folder, note]);

 useEffect(() => {
  BackHandler.addEventListener("hardwareBackPress", handleBackPress);
  return () => {
   BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
  };
 }, [handleBackPress]);

 useEffect(() => {
  const copyOfNotes = [...notes];
  if (order && notes.length > 1) {
   const sortedNotesAsc = copyOfNotes.sort((a, b) =>
    filter === "Title"
     ? a.title.localeCompare(b.title)
     : filter === "Date"
     ? new Date(a.createdAt) - new Date(b.createdAt)
     : new Date(a.createdAt) - new Date(b.createdAt)
   );
   return setNotesToRender(sortedNotesAsc);
  }
  if (!order && notes.length > 1) {
   const sortedNotesDesc = copyOfNotes.sort((a, b) =>
    filter === "Title"
     ? b.title.localeCompare(a.title)
     : filter === "Date"
     ? new Date(b.createdAt) - new Date(a.createdAt)
     : new Date(b.createdAt) - new Date(a.createdAt)
   );
   return setNotesToRender(sortedNotesDesc);
  }
  //setNotesToRender(copyOfNotes);
 }, [order, notes, filter]);

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
    />
    <View style={styles.folderContainer}>
     {folders.map(fold => (
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
    />
    <View
     style={[
      styles.notesContainer,
      view
       ? { flexDirection: "row", flexWrap: "wrap", gap: 25 }
       : { flexDirection: "column", gap: 50 }
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
   </ScrollView>
   <Outlet />
  </>
 );
};

const styles = StyleSheet.create({
 note: {
  borderRadius: 10,
  backgroundColor: "#222",
  elevation: 2
 },
 mainTitle: {
  fontSize: 25,
  marginTop: 100,
  color: "#fff",
  textAlign: "center"
 },
 folderLen: {
  color: "#aaa",
  textAlign: "center",
  marginBottom: 125,
  fontSize: 12
 },
 folderContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  gap: 15,
  marginTop: 20
 },
 notesContainer: {
  marginVertical: 25
 }
});

export default Account;
