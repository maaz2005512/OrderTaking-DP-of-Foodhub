// import React from "react";
// import {
//   Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
//   Box, Typography, Avatar, Divider, IconButton
// } from "@mui/material";
// import {
//   PeopleOutline, StorefrontOutlined, DeleteOutline, Logout, Close as CloseIcon,
//   BarChartOutlined, Settings, ReceiptLong
// } from "@mui/icons-material";
// import DashboardIcon from "@mui/icons-material/Dashboard";
// import KitchenIcon from "@mui/icons-material/Kitchen";
// import { useNavigate, useLocation } from "react-router-dom";
// import { signOut, onAuthStateChanged } from "firebase/auth";
// import { collectionGroup, onSnapshot, query, where , orderBy } from "firebase/firestore";
// import { auth, db } from "../firebase";
// import { doc, getDoc } from "firebase/firestore";

// // ✅ ownerKey resolver
// import { resolveOwnerKey } from "../utils/resolveOwnerKey";

// const sidebarItems = [
//   { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
//   { text: "Manage Users", icon: <PeopleOutline />, path: "/admin/users" },
//   { text: "Control Shops", icon: <StorefrontOutlined />, path: "/admin/control-shops" },
//   { text: "Orders", icon: <ReceiptLong />, path: "/admin/orders" },
//   { text: "Kitchen (KDS)", icon: <KitchenIcon />, path: "/kds" },
//   { text: "Delete Today's Orders", icon: <DeleteOutline />, path: "/admin/clear-orders" },
//   { text: "Reports", icon: <BarChartOutlined />, path: "/admin/reports" },
//   { text: "Settings", icon: <Settings />, path: "/admin/settings" },
//   { text: "Menu Editor", icon: <Settings />, path: "/admin/menu-editor" },

// ];

// const AdminSidebar = ({ open, onClose }) => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [users, setUsers] = React.useState(null);
//   const [ownerKey, setOwnerKey] = React.useState(null);
//   const [pendingCount, setPendingCount] = React.useState(0);

//   // current user profile (for avatar/name)
//   React.useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         const docRef = doc(db, "users", user.uid);
//         const snap = await getDoc(docRef);
//         if (snap.exists()) setUsers(snap.data());

//         const key = await resolveOwnerKey({ uid: user.uid, email: user.email });
//         setOwnerKey(key || null);
//       } else {
//         setUsers(null);
//         setOwnerKey(null);
//       }
//     });
//     return () => unsub();
//   }, []);

//   // live pending badge (all shops for this owner)
//   React.useEffect(() => {
//     if (!ownerKey) return;
//     const q = query(
//       collectionGroup(db, "orders"),
//       where("username", "==", ownerKey),
//       where("status", "==", "Pending"),
//       orderBy("createdAt", "desc")   // <— add this line
//     );
//     const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size), () => setPendingCount(0));
//     return () => unsub();
//   }, [ownerKey]);

//   const handleLogout = async () => {
//     await signOut(auth);
//     navigate("/login");
//   };

//   return (
//     <Drawer
//       variant="persistent"
//       anchor="left"
//       open={open}
//       sx={{
//         width: 240,
//         flexShrink: 0,
//         [`& .MuiDrawer-paper`]: {
//           width: 240,
//           boxSizing: "border-box",
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "space-between",
//           backgroundColor: "#fff",
//         },
//       }}
//     >
//       {/* Header */}
//       <Box px={2} py={2} borderBottom="1px solid #f2f2f2" position="relative" display="flex" flexDirection="column" alignItems="center">
//         <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
//           <IconButton onClick={onClose} size="small">
//             <CloseIcon sx={{ color: "#666" }} />
//           </IconButton>
//         </Box>

//         <Avatar src={users?.profileImageUrl || "/logo.png"} alt={users?.name} sx={{ width: 60, height: 60, mt: 1 }} />
//         <Typography fontWeight="bold" mt={1} color="#333">
//           {users?.name || "Admin"}
//         </Typography>
//         <Typography
//           color="primary"
//           sx={{ fontSize: "13px", cursor: "pointer" }}
//           onClick={() => navigate("/select-location")}
//         >
//           Change Store
//         </Typography>
//       </Box>

//       {/* Navigation */}
//       <Box flexGrow={1} sx={{ overflowY: "auto" }}>
//         <List dense>
//           {sidebarItems.map(({ text, icon, path }, idx) => {
//             const isActive = location.pathname === path;

//             const rightBadge =
//               text === "Orders" && pendingCount > 0 ? (
//                 <Box component="span"
//                   sx={{ ml: "auto", px: 1, py: "2px", fontSize: 12, borderRadius: 10, bgcolor: "#ffe8a3", color: "#7a5b00", lineHeight: 1.2 }}>
//                   {pendingCount}
//                 </Box>
//               ) : null;

//             return (
//               <React.Fragment key={text}>
//                 <ListItem disablePadding>
//                   <ListItemButton
//                     onClick={() => navigate(path)}
//                     sx={{
//                       px: 2, py: 1,
//                       backgroundColor: isActive ? "#fef8e5" : "transparent",
//                       "&:hover": { backgroundColor: "#fdfdfd" },
//                       display: "flex", alignItems: "center", gap: 1,
//                     }}
//                   >
//                     <ListItemIcon sx={{ color: "#dcc672", minWidth: 36 }}>{icon}</ListItemIcon>
//                     <ListItemText
//                       primary={
//                         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                           <span style={{ fontWeight: 500, fontSize: 15, color: "#333" }}>{text}</span>
//                           {rightBadge}
//                         </Box>
//                       }
//                     />
//                   </ListItemButton>
//                 </ListItem>
//                 {idx < sidebarItems.length - 1 && (
//                   <Divider sx={{ my: 0.5, mx: 2, backgroundColor: "#f2f2f2" }} />
//                 )}
//               </React.Fragment>
//             );
//           })}
//         </List>
//       </Box>

//       {/* Sign Out */}
//       <Box p={2} borderTop="1px solid #eee">
//         <ListItemButton onClick={handleLogout} sx={{ px: 2, py: 1 }}>
//           <ListItemIcon sx={{ color: "#e53935", minWidth: 36 }}>
//             <Logout />
//           </ListItemIcon>
//           <ListItemText
//             primary="Sign Out"
//             primaryTypographyProps={{ fontWeight: 500, fontSize: "15px", color: "#e53935" }}
//           />
//         </ListItemButton>
//       </Box>
//     </Drawer>
//   );
// };

// export default AdminSidebar;

// src/components/AdminSidebar.jsx
import React from "react";
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Avatar, Divider, IconButton
} from "@mui/material";
import {
  PeopleOutline, StorefrontOutlined, DeleteOutline, Logout, Close as CloseIcon,
  BarChartOutlined, Settings, ReceiptLong
} from "@mui/icons-material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import KitchenIcon from "@mui/icons-material/Kitchen";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collectionGroup, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { resolveOwnerKey } from "../utils/resolveOwnerKey";

const sidebarItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
  { text: "Manage Users", icon: <PeopleOutline />, path: "/admin/users" },
  { text: "All Shops", icon: <StorefrontOutlined />, path: "/admin/shops" }, // renamed & repathed
  { text: "Orders", icon: <ReceiptLong />, path: "/admin/orders" },
  { text: "Kitchen (KDS)", icon: <KitchenIcon />, path: "/kds" },
  { text: "Delete Today's Orders", icon: <DeleteOutline />, path: "/admin/clear-orders" },
  { text: "Reports", icon: <BarChartOutlined />, path: "/admin/reports" },
  { text: "Settings", icon: <Settings />, path: "/admin/settings" },
  { text: "Menu Editor", icon: <Settings />, path: "/admin/menu-editor" },
];

const AdminSidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = React.useState(null);
  const [ownerKey, setOwnerKey] = React.useState(null);
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) setUsers(snap.data());

        const key = await resolveOwnerKey({ uid: user.uid, email: user.email });
        setOwnerKey(key || null);
      } else {
        setUsers(null);
        setOwnerKey(null);
      }
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!ownerKey) return;
    const q = query(
      collectionGroup(db, "orders"),
      where("username", "==", ownerKey),
      where("status", "==", "Pending"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size), () => setPendingCount(0));
    return () => unsub();
  }, [ownerKey]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fff",
        },
      }}
    >
      {/* Header */}
      <Box
        px={2}
        py={2}
        borderBottom="1px solid #f2f2f2"
        position="relative"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
          <IconButton onClick={onClose} size="small">
            <CloseIcon sx={{ color: "#666" }} />
          </IconButton>
        </Box>

        <Avatar src={users?.profileImageUrl || "/logo.png"} alt={users?.name} sx={{ width: 60, height: 60, mt: 1 }} />
        <Typography fontWeight="bold" mt={1} color="#333">
          {users?.name || "Admin"}
        </Typography>
        {/* Removed Change Store link for admin */}
      </Box>

      {/* Navigation */}
      <Box flexGrow={1} sx={{ overflowY: "auto" }}>
        <List dense>
          {sidebarItems.map(({ text, icon, path }, idx) => {
            const isActive = location.pathname === path;

            const rightBadge =
              text === "Orders" && pendingCount > 0 ? (
                <Box
                  component="span"
                  sx={{
                    ml: "auto",
                    px: 1,
                    py: "2px",
                    fontSize: 12,
                    borderRadius: 10,
                    bgcolor: "#ffe8a3",
                    color: "#7a5b00",
                    lineHeight: 1.2,
                  }}
                >
                  {pendingCount}
                </Box>
              ) : null;

            return (
              <React.Fragment key={text}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => navigate(path)}
                    sx={{
                      px: 2,
                      py: 1,
                      backgroundColor: isActive ? "#fef8e5" : "transparent",
                      "&:hover": { backgroundColor: "#fdfdfd" },
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <ListItemIcon sx={{ color: "#dcc672", minWidth: 36 }}>{icon}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <span style={{ fontWeight: 500, fontSize: 15, color: "#333" }}>{text}</span>
                          {rightBadge}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {idx < sidebarItems.length - 1 && (
                  <Divider sx={{ my: 0.5, mx: 2, backgroundColor: "#f2f2f2" }} />
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Sign Out */}
      <Box p={2} borderTop="1px solid #eee">
        <ListItemButton onClick={handleLogout} sx={{ px: 2, py: 1 }}>
          <ListItemIcon sx={{ color: "#e53935", minWidth: 36 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            primaryTypographyProps={{ fontWeight: 500, fontSize: "15px", color: "#e53935" }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default AdminSidebar;

