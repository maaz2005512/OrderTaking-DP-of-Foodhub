

import React from "react";
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Avatar, Divider, IconButton, Select, MenuItem, Fab,
} from "@mui/material";
import {
  ListAltOutlined, AssessmentOutlined, SettingsOutlined, Logout,
  Close as CloseIcon, Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
// ✅ ownerKey
import { resolveOwnerKey } from "../../utils/resolveOwnerKey";

const WorkerSidebar = ({ open, onClose, onOpen, shopId, currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [ownerKey, setOwnerKey] = React.useState(null);
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const key = await resolveOwnerKey(currentUser);
      if (!active) return;
      setOwnerKey(key || null);
    })();
    return () => { active = false; };
  }, [currentUser]);

  // live pending for current shop
  React.useEffect(() => {
    if (!ownerKey || !shopId) return;
    const col = collection(db, "names", ownerKey, "shops", shopId, "orders");
    const q = query(col, where("status", "==", "Pending"));
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size), () => setPendingCount(0));
    return () => unsub();
  }, [ownerKey, shopId]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // const handleStoreChange = (e) => {
  //   const newShopId = e.target.value;
  //   navigate(`/dashboard/${newShopId}/orders`);
  // };

  const sidebarItems = [
    { text: "Orders", icon: <ListAltOutlined />, path: `/dashboard/${shopId}/orders` },
    { text: "Reports", icon: <AssessmentOutlined />, path: `/dashboard/${shopId}/reports` },
    { text: "Settings", icon: <SettingsOutlined />, path: `/dashboard/${shopId}/settings` },
    { text: "Menu Editor", icon: <SettingsOutlined />, path: `/dashboard/${shopId}/menu-editor` },

  ];

  // ✅ Kitchen Display only for kitchen role
  if (currentUser?.role === "kitchen") {
    sidebarItems.push({
      text: "Kitchen Display",
      icon: <ListAltOutlined />,
      path: `/dashboard/${shopId}/kds`,
    });
  }

  return (
    <>
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: 1300,
          [`& .MuiDrawer-paper`]: {
            width: 240,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          },
        }}
      >
        <Box px={2} py={2} borderBottom="1px solid #f2f2f2" position="relative" display="flex" flexDirection="column" alignItems="center">
          <Box sx={{ position: "absolute", top: 8, right: 8 }}>
            <IconButton onClick={onClose} size="small">
              <CloseIcon sx={{ color: "#666" }} />
            </IconButton>
          </Box>
          <Avatar src="/logo.png" sx={{ width: 60, height: 60 }} />
          <Typography fontWeight="bold" mt={1}>
            {currentUser?.name || "users.name"}
          </Typography>
          <Typography
                    color="primary"
                    sx={{ fontSize: "13px", cursor: "pointer" }}
                    onClick={() => navigate("/select-location")}
                  >
                    Change Store
                  </Typography>
              

          {/* {allowedShops.length > 1 && (
            <Select size="small" value={shopId} onChange={handleStoreChange} sx={{ mt: 2, minWidth: 180 }}>
              {allowedShops.map((shop) => (
                <MenuItem key={shop.id} value={shop.id}>
                  {shop.name}
                </MenuItem>
              ))}
            </Select>
          )} */}
        </Box>

        <Box flexGrow={1}>
          <List dense>
            {sidebarItems.map(({ text, icon, path }) => {
              const isActive = location.pathname === path;

              const rightBadge =
                text === "Orders" && pendingCount > 0 ? (
                  <Box component="span"
                    sx={{ ml: "auto", px: 1, py: "2px", fontSize: 12, borderRadius: 10, bgcolor: "#ffe8a3", color: "#7a5b00", lineHeight: 1.2 }}>
                    {pendingCount}
                  </Box>
                ) : null;

              return (
                <React.Fragment key={text}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => navigate(path)}
                      sx={{
                        backgroundColor: isActive ? "#fef8e5" : "transparent",
                        "&:hover": { backgroundColor: "#fdfdfd" },
                        display: "flex", alignItems: "center", gap: 1,
                      }}
                    >
                      <ListItemIcon sx={{ color: "#dcc672" }}>{icon}</ListItemIcon>
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
                  <Divider sx={{ my: 0.5, mx: 2 }} />
                </React.Fragment>
              );
            })}
          </List>
        </Box>

        <Box p={2} borderTop="1px solid #eee">
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: "#e53935" }}>
              <Logout />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontWeight: 500, fontSize: "15px", color: "#e53935" }}
            />
          </ListItemButton>
        </Box>
      </Drawer>

      {!open && (
        <Fab
          color="primary"
          size="medium"
          onClick={onOpen}
          sx={{
            position: "fixed",
            top: 20,
            left: 0,
            zIndex: 500,
            backgroundColor: "#f0c000",
            "&:hover": { backgroundColor: "#dab500" },
          }}
        >
          <MenuIcon />
        </Fab>
      )}
    </>
  );
};

export default WorkerSidebar;
