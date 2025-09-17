
// src/pages/dashboard/DashboardLayout.jsx
import React, { useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import WorkerSidebar from "./WorkerSidebar";
import { useAuth } from "../../context/AuthContext";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { shopId } = useParams();
  const { currentUser } = useAuth();

  return (
    <div style={{ display: "flex" }}>
      <WorkerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        shopId={shopId}
        currentUser={currentUser}
      />
      <main
        style={{
          width: "100vw",
          maxWidth: "100%",
          overflowX: "hidden",
          transition: "all 0.3s ease",
          flexGrow: 1,
          padding: "2rem",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
