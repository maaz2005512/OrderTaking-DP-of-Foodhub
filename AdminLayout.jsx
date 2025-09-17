// src/pages/admin/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

const AdminLayout = () => {
  const [open, setOpen] = useState(true);
  <AdminSidebar open={open} onClose={() => setOpen(false)} />

  return (
    <Box sx={{ display: "flex" }}>
      <AdminSidebar open={open} onClose={() => setOpen(false)} />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Show menu button when sidebar is closed */}
        {!open && (
          <IconButton
            onClick={() => setOpen(true)}
            sx={{ mb: 2, ml: 1 }}
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
