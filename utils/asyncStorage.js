import AsyncStorage from "@react-native-async-storage/async-storage";

export const getToken = async () => {
  try {
    const tokenString = await AsyncStorage.getItem("authToken");
    if (!tokenString) {
      return null;
    }
    return tokenString;
  } catch (err) {
    console.log("Error grabbing token from AsyncStorage inside getToken: ");
    console.log(err);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem("authToken");
    return true;
  } catch (err) {
    console.log("Error removing token from AsyncStorage inside removeToken: ");
    console.log(err);
    return false;
  }
};

export const storeToken = async (storedToken) => {
  try {
    await AsyncStorage.setItem("authToken", storedToken);
    return true;
  } catch (err) {
    console.log("Error storing token in AsyncStorage inside storeToken: ");
    console.log(err);
    return false;
  }
};
