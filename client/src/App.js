import { useContext, useEffect } from "react";
import axios from "axios";
import { UserContext } from "./context/UserContext";
import { Route, Routes, Navigate } from "react-router-dom";

import Signup from "./pages/SignUp/SignUp";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import AskQuestion from "./pages/AskQuestion/AskQuestion";
import QuestionDetail from "./pages/QuestionDetail/QuestionDetail";

function App() {
  const { userdata, setUserdata } = useContext(UserContext);

  const logout = () => {
    setUserdata({ token: undefined, user: undefined });
    localStorage.setItem("auth-token", "");
  };

  useEffect(() => {
    const checkLoggedIn = async () => {
      let token = localStorage.getItem("auth-token");
      if (!token) {
        localStorage.setItem("auth-token", "");
        return;
      }
      try {
        const userRes = await axios.get("http://localhost:4000/api/users/id", {
          headers: { "x-auth-token": token },
        });
        const currentUser = Array.isArray(userRes.data.data)
          ? userRes.data.data[0]
          : userRes.data.data;
        setUserdata({
          token,
          user: {
            id: currentUser?.user_id,
            displayName: currentUser?.user_name,
          },
        });
      } catch (error) {
        console.log(error);
      }
    };
    checkLoggedIn();
  }, [setUserdata]);

  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/SignUp" element={<Navigate to="/signup" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Login" element={<Navigate to="/login" replace />} />

      <Route
        path="/"
        element={
          userdata?.user ? (
            <Home logout={logout} />
          ) : (
            <Navigate to="/signup" />
          )
        }
      />
      <Route
        path="/questions/ask"
        element={
          userdata?.user ? (
            <AskQuestion />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/questions/:questionId"
        element={
          userdata?.user ? (
            <QuestionDetail />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={userdata?.user ? "/" : "/signup"} replace />}
      />
    </Routes>
  );
}

export default App;
