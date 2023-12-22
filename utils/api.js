import Axios from "axios";
//const devUrl = "http://localhost:8080";
const devUrl = "https://notes-server-s05q.onrender.com";

export const loginUser = (username, email, password) => {
  const res = Axios.post(`${devUrl}/users/login`, {
    username,
    email,
    password,
  });
  return res;
};

export const getUserData = (token) => {
  const res = Axios.get(`${devUrl}/users/seperated/data`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const createNewFolder = (token, folder) => {
  const res = Axios.post(
    `${devUrl}/folders/create`,
    { ...folder },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const updateFolder = (token, folder) => {
  const res = Axios.patch(
    `${devUrl}/folders/update`,
    { ...folder },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const updateFolderPosition = (token, folderId, newFolderId) => {
  const res = Axios.post(
    `${devUrl}/folders/update/position`,
    { folderId, newFolderId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const createNewNote = (token, note) => {
  const res = Axios.post(
    `${devUrl}/notes/create`,
    { ...note },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const updateNote = (token, note) => {
  const res = Axios.patch(
    `${devUrl}/notes/update`,
    { ...note },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
};

export const deleteAFolder = (token, folderId) => {
  const res = Axios.delete(`${devUrl}/folders/delete/${folderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const deleteANote = (token, noteId) => {
  const res = Axios.delete(`${devUrl}/notes/delete/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};
