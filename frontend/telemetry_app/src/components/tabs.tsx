import React from "react";
import { NavLink } from "react-router-dom";

const Tabs: React.FC = () => {
  const baseStyle =
    "px-4 py-2 rounded-md text-sm font-medium transition";

  const activeStyle = "bg-blue-600 text-white";
  const inactiveStyle = "bg-gray-800 hover:bg-gray-700 text-gray-300";

  return (
    <div className="flex gap-3 p-4 bg-gray-900 border-b border-gray-800">

      <NavLink
        to="/"
        className={({ isActive }) =>
          `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
        }
      >
        Live
      </NavLink>

      <NavLink
        to="/post"
        className={({ isActive }) =>
          `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
        }
      >
        Post Session
      </NavLink>

      <NavLink
        to="/compare"
        className={({ isActive }) =>
          `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
        }
      >
        Lap Compare
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
        }
      >
        Settings
      </NavLink>

    </div>
  );
};

export default Tabs;