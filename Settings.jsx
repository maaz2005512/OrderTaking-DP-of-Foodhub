// import React, { useState } from "react";
// import { Card, Typography, Input, Button, message, Modal } from "antd";
// import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser } from "firebase/auth";
// import { doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
// import { auth, db } from "../../firebase"; // ✅ Adjust path if needed

// const { Title } = Typography;

// const Settings = () => {
//   const currentUser = auth.currentUser;

//   const [supportEmail] = useState("mashsan271219@gmail.com");

//   const [oldPassword, setOldPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");

//   const [newUsername, setNewUsername] = useState("");
//   const [deletionPassword, setDeletionPassword] = useState("");
//   const [isDeleting, setIsDeleting] = useState(false);

//   const reauthenticate = async (password) => {
//     const credential = EmailAuthProvider.credential(currentUser.email, password);
//     await reauthenticateWithCredential(currentUser, credential);
//   };

//   const handleChangePassword = async () => {
//     try {
//       await reauthenticate(oldPassword);
//       await updatePassword(currentUser, newPassword);
//       message.success("Password updated!");
//       setOldPassword("");
//       setNewPassword("");
//     } catch (err) {
//       message.error("Error: " + err.message);
//     }
//   };

//   const handleChangeUsername = async () => {
//     try {
//       const userDocRef = doc(db, "users", currentUser.uid);
//       const usernameDocRef = doc(db, "usernames", newUsername);

//       const usernameTaken = await getDoc(usernameDocRef);
//       if (usernameTaken.exists()) {
//         message.error("Username already taken.");
//         return;
//       }

//       // 1. Get old username
//       const userDoc = await getDoc(userDocRef);
//       const oldUsername = userDoc?.data()?.username;

//       // 2. Delete old username mapping
//       if (oldUsername) {
//         await deleteDoc(doc(db, "usernames", oldUsername));
//       }

//       // 3. Update username
//       await setDoc(userDocRef, { username: newUsername }, { merge: true });
//       await setDoc(usernameDocRef, { uid: currentUser.uid });

//       message.success("Username updated!");
//       setNewUsername("");
//     } catch (err) {
//       message.error("Error: " + err.message);
//     }
//   };

//   const handleDeleteAccount = async () => {
//     try {
//       setIsDeleting(true);
//       await reauthenticate(deletionPassword);

//       // Delete from Auth
//       await deleteUser(currentUser);

//       // Delete from Firestore
//       await deleteDoc(doc(db, "users", currentUser.uid));

//       // Delete username doc
//       const userDoc = await getDoc(doc(db, "users", currentUser.uid));
//       const username = userDoc?.data()?.username;
//       if (username) {
//         await deleteDoc(doc(db, "usernames", username));
//       }

//       message.success("Account deleted.");
//     } catch (err) {
//       message.error("Error: " + err.message);
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card style={{ maxWidth: 600, margin: "auto" }}>
//         <Title level={4}>Support</Title>
//         <p>If you need help, contact: <b>{supportEmail}</b></p>

//         <hr />

//         <Title level={4}>Change Password</Title>
//         <Input.Password
//           placeholder="Current Password"
//           value={oldPassword}
//           onChange={(e) => setOldPassword(e.target.value)}
//           style={{ marginBottom: "1rem" }}
//         />
//         <Input.Password
//           placeholder="New Password"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//           style={{ marginBottom: "1rem" }}
//         />
//         <Button type="primary" onClick={handleChangePassword}>Update Password</Button>

//         <hr style={{ margin: "2rem 0" }} />

//         <Title level={4}>Change Username</Title>
//         <Input
//           placeholder="New Username"
//           value={newUsername}
//           onChange={(e) => setNewUsername(e.target.value)}
//           style={{ marginBottom: "1rem" }}
//         />
//         <Button onClick={handleChangeUsername}>Update Username</Button>

//         <hr style={{ margin: "2rem 0" }} />

//         <Title level={4} style={{ color: "red" }}>Delete Account</Title>
//         <Input.Password
//           placeholder="Re-enter Password"
//           value={deletionPassword}
//           onChange={(e) => setDeletionPassword(e.target.value)}
//           style={{ marginBottom: "1rem" }}
//         />
//         <Button danger loading={isDeleting} onClick={() => {
//           Modal.confirm({
//             title: "Are you sure?",
//             content: "This will permanently delete your account.",
//             okText: "Delete",
//             okType: "danger",
//             cancelText: "Cancel",
//             onOk: handleDeleteAccount,
//           });
//         }}>
//           Delete Account
//         </Button>
//       </Card>
//     </div>
//   );
// };

// export default Settings;


// // e.g., src/pages/admin/Settings.jsx
import React from "react";
import { seedPizzas } from "../../utils/seedPizzas";

export default function Settings() {
  const onSeed = async () => {
    try {
      await seedPizzas("ySoBy3YwVhYZ7H76Ixhl"); // <-- yahan apna real shopId
      alert("Pizzas seeded!");
    } catch (e) {
      console.error(e);
      alert("Seed failed. Check console.");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Seeding (TEMP) — remove after run</h3>
      <button onClick={onSeed}>Seed Pizzas</button>
    </div>
  );
}
