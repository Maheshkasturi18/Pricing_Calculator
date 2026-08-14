import { Link, useNavigate } from "react-router-dom";
import { FiFileText, FiBarChart2, FiLogOut, FiLogIn, FiUserPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="font-bold tracking-tight text-white no-underline">
          Pricing Calculator
        </Link>

        {user ? (
          <div className="flex items-center gap-3 sm:gap-4 text-sm">
            <Link to="/" className="flex items-center gap-1.5 text-slate-200 hover:text-white no-underline">
              <FiFileText size={15} /> <span className="hidden sm:inline">Documents</span>
            </Link>
            <Link to="/report" className="flex items-center gap-1.5 text-slate-200 hover:text-white no-underline">
              <FiBarChart2 size={15} /> <span className="hidden sm:inline">Report</span>
            </Link>
            {/* <span className="text-slate-400">{user.email}</span> */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white bg-transparent p-0 cursor-pointer"
            >
              <FiLogOut size={15} className="text-red-500"/> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4 text-sm">
            <Link to="/login" className="flex items-center gap-1.5 text-slate-200 hover:text-white no-underline">
              <FiLogIn size={15} /> <span className="hidden sm:inline">Log in</span>
            </Link>
            <Link to="/signup" className="flex items-center gap-1.5 text-slate-200 hover:text-white no-underline">
              <FiUserPlus size={15} /> <span className="hidden sm:inline">Sign up</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}