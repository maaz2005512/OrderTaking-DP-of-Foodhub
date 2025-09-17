import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [allowedShops, setAllowedShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setCurrentUser(null);
    setUserRole(null);
    setAllowedShops([]);              // ✅ reset
    setLoading(true);

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          ...userData, // ✅ includes name, role, allowedShops etc.
        });
        setUserRole(userData.role || null);
        setAllowedShops(userData.allowedShops || []);   // ✅ set it
      } else {
        setCurrentUser(user); // fallback
        setUserRole(null);
        setAllowedShops([]);
      }
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    await setDoc(doc(db, "users", result.user.uid), {
      email,
      role: "worker",
      allowedShops: [],
    });
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithUsername = async (username, password) => {
    const docSnap = await getDoc(doc(db, "usernames", username));
    if (!docSnap.exists()) {
      throw new Error("Username not found");
    }
    const email = docSnap.data().email;
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
         currentUser, 
         role: userRole,
         allowedShops,
          login, 
          signup,
           logout,
            loginWithUsername,
             loading }}
    >
      {loading ? <div>Loading...</div> : children}
  </AuthContext.Provider>
  );
};


