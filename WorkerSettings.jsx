// import React, { useState } from "react";
// import { Card, Typography, Switch, Divider, Input, Button, message } from "antd";
// import { Box } from "@mui/material";

// const { Title, Text } = Typography;

// const WorkerSettings = () => {
//   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
//   const [adminEmail, setAdminEmail] = useState("admin@bikeshop.com");
//   const [supportPhone, setSupportPhone] = useState("+1234567890");

//   const handleSave = () => {
//     // 🔧 Backend-needed: Save to Firestore or config collection
//     message.success("Settings saved successfully");
//   };

//   return (
//     <Box sx={{ padding: "2rem" }}>
//       <Card>
//         <Title level={4}>Admin Settings</Title>

//         <Divider />

//         <div style={{ marginBottom: "1.5rem" }}>
//           <Text strong>Email for Support:</Text>
//           <Input
//             value={adminEmail}
//             onChange={(e) => setAdminEmail(e.target.value)}
//             placeholder="Enter support email"
//             style={{ marginTop: "0.5rem", maxWidth: 400 }}
//           />
//         </div>

//         <div style={{ marginBottom: "1.5rem" }}>
//           <Text strong>Phone for Support:</Text>
//           <Input
//             value={supportPhone}
//             onChange={(e) => setSupportPhone(e.target.value)}
//             placeholder="Enter support phone"
//             style={{ marginTop: "0.5rem", maxWidth: 400 }}
//           />
//         </div>

//         <div style={{ marginBottom: "1.5rem" }}>
//           <Text strong>Enable Order Notifications:</Text>
//           <div>
//             <Switch
//               checked={notificationsEnabled}
//               onChange={setNotificationsEnabled}
//               style={{ marginTop: "0.5rem" }}
//             />
//           </div>
//         </div>

//         <Button type="primary" onClick={handleSave}>
//           Save Settings
//         </Button>
//       </Card>
//     </Box>
//   );
// };

// export default WorkerSettings;


import React, { useState } from "react";
import { Card, Typography, Input, Button, message, Modal } from "antd";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser } from "firebase/auth";
import { doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // ✅ Adjust path if needed

const { Title } = Typography;

const WorkerSettings = () => {
  const currentUser = auth.currentUser;

  const [supportEmail] = useState("mashsan271219@gmail.com");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [deletionPassword, setDeletionPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const reauthenticate = async (password) => {
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  };

  const handleChangePassword = async () => {
    try {
      await reauthenticate(oldPassword);
      await updatePassword(currentUser, newPassword);
      message.success("Password updated!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      message.error("Error: " + err.message);
    }
  };

  const handleChangeUsername = async () => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const usernameDocRef = doc(db, "usernames", newUsername);

      const usernameTaken = await getDoc(usernameDocRef);
      if (usernameTaken.exists()) {
        message.error("Username already taken.");
        return;
      }

      // 1. Get old username
      const userDoc = await getDoc(userDocRef);
      const oldUsername = userDoc?.data()?.username;

      // 2. Delete old username mapping
      if (oldUsername) {
        await deleteDoc(doc(db, "usernames", oldUsername));
      }

      // 3. Update username
      await setDoc(userDocRef, { username: newUsername }, { merge: true });
      await setDoc(usernameDocRef, { uid: currentUser.uid });

      message.success("Username updated!");
      setNewUsername("");
    } catch (err) {
      message.error("Error: " + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await reauthenticate(deletionPassword);

      // Delete from Auth
      await deleteUser(currentUser);

      // Delete from Firestore
      await deleteDoc(doc(db, "users", currentUser.uid));

      // Delete username doc
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const username = userDoc?.data()?.username;
      if (username) {
        await deleteDoc(doc(db, "usernames", username));
      }

      message.success("Account deleted.");
    } catch (err) {
      message.error("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Card style={{ maxWidth: 600, margin: "auto" }}>
        <Title level={4}>Support</Title>
        <p>If you need help, contact: <b>{supportEmail}</b></p>

        <hr />

        <Title level={4}>Change Password</Title>
        <Input.Password
          placeholder="Current Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <Input.Password
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <Button type="primary" onClick={handleChangePassword}>Update Password</Button>

        <hr style={{ margin: "2rem 0" }} />

        <Title level={4}>Change Username</Title>
        <Input
          placeholder="New Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <Button onClick={handleChangeUsername}>Update Username</Button>

        <hr style={{ margin: "2rem 0" }} />

        <Title level={4} style={{ color: "red" }}>Delete Account</Title>
        <Input.Password
          placeholder="Re-enter Password"
          value={deletionPassword}
          onChange={(e) => setDeletionPassword(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <Button danger loading={isDeleting} onClick={() => {
          Modal.confirm({
            title: "Are you sure?",
            content: "This will permanently delete your account.",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: handleDeleteAccount,
          });
        }}>
          Delete Account
        </Button>
      </Card>
    </div>
  );
};

export default WorkerSettings;
