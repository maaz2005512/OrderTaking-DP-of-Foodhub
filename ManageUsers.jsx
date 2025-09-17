// import React, { useEffect, useState } from "react";
// import { db } from "../../firebase";
// import {
//   collection,
//   getDocs,
//   updateDoc,
//   doc,
// } from "firebase/firestore";
// import {
//   Table,
//   Tag,
//   Select,
//   message,
//   Spin,
//   Typography,
// } from "antd";

// const { Option } = Select;
// const { Title } = Typography;

// const ROLE_LABEL = (r) => (r || "N/A");
// const ROLE_COLORS = {
//   admin: "volcano",
//   worker: "geekblue",
//   kitchen: "green",
// };

// const ManageUsers = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchUsers = async () => {
//     try {
//       const usersRef = collection(db, "users");
//       const snapshot = await getDocs(usersRef);
//       const data = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setUsers(data);
//     } catch (err) {
//       console.error("Error fetching users:", err);
//       message.error("Failed to fetch users.");
//     } finally {
//       setLoading(false);
//     }
//   };


// const handleRoleChange = async (userId, newRole) => {
//     try {
//       const role = String(newRole || "").toLowerCase().trim();   // ✅ lowercase
//       await updateDoc(doc(db, "users", userId), {
//         role: newRole,
//       });
//       message.success("Role updated successfully!");
//       setUsers((prev) =>
//         prev.map((user) =>
//           user.id === userId ? { ...user, role: newRole } : user
//         )
//       );
//     } catch (err) {
//       console.error("Error updating role:", err);
//       message.error("Failed to update role.");
//     }
//   };

//   useEffect(() => { fetchUsers(); }, []);

//   const columns = [
//     {
//       title: "Name",
//       dataIndex: "name",
//       key: "name",
//       render: (text) => text || "N/A",
//     },
//     {
//       title: "Email",
//       dataIndex: "email",
//       key: "email",
//     },
//     {
//       title: "Role",
//       dataIndex: "role",
//       key: "role",
//       render: (role, record) => (
//         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           <Tag color={ROLE_COLORS[role] || "default"}>{ROLE_LABEL(role)}</Tag>
//           <Select
//             value={role}
//             onChange={(value) => handleRoleChange(record.id, value)}
//             style={{ width: 140 }}
//           >
//             <Option value="admin">Admin</Option>
//             <Option value="worker">Worker</Option>
//             <Option value="kitchen">Kitchen</Option> {/* ✅ NEW */}
//           </Select>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div style={{ padding: "1rem" }}>
//       <Title level={3}>Manage Users</Title>
//       {loading ? <Spin /> : (
//         <Table dataSource={users} columns={columns} rowKey="id" pagination={false} />
//       )}
//     </div>
//   );
// };

// export default ManageUsers;


// src/pages/admin/ManageUsers.jsx
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  Table,
  Tag,
  Select,
  message,
  Spin,
  Typography,
  Checkbox,
  Space,
} from "antd";

const { Option } = Select;
const { Title } = Typography;

const ROLE_LABEL = (r) => (r || "N/A");
const ROLE_COLORS = {
  admin: "volcano",
  worker: "geekblue",
  kitchen: "green",
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const shopsRef = collection(db, "shops");

      const [usersSnap, shopsSnap] = await Promise.all([
        getDocs(usersRef),
        getDocs(shopsRef),
      ]);

      const usersData = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const shopsData = shopsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setUsers(usersData);
      setShops(shopsData);
    } catch (err) {
      console.error("Error fetching users/shops:", err);
      message.error("Failed to fetch users/shops.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const shopOptions = useMemo(
    () => shops.map((s) => ({ label: s.name || s.id, value: s.id })),
    [shops]
  );

  const handleRoleChange = async (userId, newRole) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      message.success("Role updated.");
    } catch (err) {
      console.error("Error updating role:", err);
      message.error("Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  const handleAllowedShopsChange = async (userId, newList) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", userId), {
        allowedShops: newList,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, allowedShops: newList } : u))
      );
      message.success("Allowed shops updated.");
    } catch (err) {
      console.error("Error updating allowed shops:", err);
      message.error("Failed to update allowed shops.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => text || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Tag color={ROLE_COLORS[role] || "default"}>{ROLE_LABEL(role)}</Tag>
          <Select
            value={role}
            onChange={(value) => handleRoleChange(record.id, value)}
            style={{ width: 140 }}
          >
            <Option value="admin">Admin</Option>
            <Option value="worker">Worker</Option>
            <Option value="kitchen">Kitchen</Option>
          </Select>
        </div>
      ),
    },
    {
      title: "Assigned Shops",
      key: "allowedShops",
      render: (_, record) => {
        const value = record.allowedShops || [];
        return (
          <Space direction="vertical" size={6} style={{ width: 380 }}>
            {/* Multi-select dropdown */}
            <Select
              mode="multiple"
              allowClear
              placeholder="Select shops"
              value={value}
              onChange={(vals) => handleAllowedShopsChange(record.id, vals)}
              options={shopOptions}
              style={{ width: "100%" }}
            />
            {/* Quick checkboxes (optional convenience) */}
            <div style={{ maxHeight: 120, overflowY: "auto", paddingRight: 6 }}>
              {shops.map((s) => {
                const checked = value.includes(s.id);
                return (
                  <div key={s.id}>
                    <Checkbox
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? value.filter((id) => id !== s.id)
                          : [...value, s.id];
                        handleAllowedShopsChange(record.id, next);
                      }}
                    >
                      {s.name || s.id}
                    </Checkbox>
                  </div>
                );
              })}
            </div>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "1rem" }}>
      <Title level={3}>Manage Users</Title>
      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={saving}
        />
      )}
    </div>
  );
};

export default ManageUsers;
