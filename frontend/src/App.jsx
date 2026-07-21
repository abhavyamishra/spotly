import { useEffect, useState } from "react";
import AuthPanel from "./components/AuthPanel.jsx";
import { getRooms, getNearbyRooms, updateLocation, createRoom as createRoomApi, joinRoom } from "./services/roomService.js";
import { getCurrentLocation } from "./services/locationService.js";
import "./styles.css";
import { connectSocket, disconnectSocket, subscribeToSocketMessages } from "./services/socketService.js";
import {
    authMe,
    requestOtp,
    signup,
    login as loginApi,
    logout as logoutApi,
    uploadAvatar,
    requestPasswordResetOtp,
    resetPassword,
    checkUsername,
    checkEmail,
} from "./services/authService.js";
import ChatRoom from "./pages/ChatRoom.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AboutSpotly from "./pages/AboutSpotly";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";


function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState("");
  const [rooms, setRooms] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [allowPending, setAllowPending] = useState(false);
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [profileOpen,setProfileOpen]=useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const navigate = useNavigate();
  const [deletedRoom, setDeletedRoom] = useState(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(null);
  
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      handleRefreshLocation();
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleSocketMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "rooms_changed") {

          if (
            payload.action === "pending_room_removed" &&
            payload.ownerId === user.userId
          ) {
            setDeletedRoom({
    title: "Room Deleted",
    message: `The room "${payload.roomName}" was deleted because no nearby users were found.`,
  });
          }


          refreshRooms();
          refreshNearby();
        }
      } catch {}
    };

    return subscribeToSocketMessages(handleSocketMessage);
  }, [user, location.lat, location.lon]);

  useEffect(() => {
    // Only check during signup
    if (isLogin && !forgotPassword) {
      setEmailStatus("");
      setEmailAvailable(null);
      return;
    }

    const value = email.trim();

    if (!value) {
      setEmailStatus("");
      setEmailAvailable(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailStatus("");
      setEmailAvailable(null);
      return;
    }

    setEmailStatus("Checking...");

    const timer = setTimeout(async () => {
      try {
        const data = await checkEmail(value);

        setEmailAvailable(data.available);
        setEmailStatus(data.message);
      } catch {
        setEmailStatus("Could not check email.");
        setEmailAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, isLogin, forgotPassword]);

  useEffect(() => {
    const value = username.trim();

    if (!value) {
      setUsernameStatus("");
      setUsernameAvailable(null);
      return;
    }

    if (value.length < 3) {
      setUsernameStatus(
        "Username must be at least 3 characters."
      );
      setUsernameAvailable(false);
      return;
    }

    setUsernameStatus("Checking...");

    const timer = setTimeout(async () => {
      try {
        const data = await checkUsername(value);

        setUsernameAvailable(data.available);
        setUsernameStatus(data.message);
      } catch {
        setUsernameStatus("Could not check username.");
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (user && location.lat != null) {
      refreshNearby();
    }
  }, [user, location.lat, location.lon]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => {
      setOtpCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  async function checkSession() {
    try {
      const data = await authMe();
      setUser(data.user);
      setStatus("");
      refreshRooms();
      handleRefreshLocation();
    } catch {
      setUser(null);
    }
  }

  async function refreshRooms() {
    try {
      const data = await getRooms();
      setRooms(data.rooms || data);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function refreshNearby(nextLocation = location) {
    if (nextLocation.lat == null || nextLocation.lon == null) return;
    try {
      const data = await getNearbyRooms(nextLocation.lat, nextLocation.lon);
      setNearby(data.rooms || []);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
        setStatus("Enter email and password.");
        return;
    }

    try {
        setIsLoginLoading(true);
        const data = await loginApi(email, password);

        setUser(data.user);
        connectSocket();
        navigate("/");
        setStatus("Logged in.");

        refreshRooms();
        handleRefreshLocation();
    } catch (error) {
        setStatus(error.message);
    } finally {
        setIsLoginLoading(false);
    }
 }

  async function handleRequestOtp() {
    if (otpCooldown > 0 || isOtpLoading) return;
    if (!email) {
      setStatus("Enter your email first.");
      return;
    }
    try {
      setIsOtpLoading(true);
      await requestOtp(email);
      setOtpSent(true);
      setOtpCooldown(180);
      setStatus("OTP sent to your email.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsOtpLoading(false);
    }
  }

    async function handleSignup() {
    if (!username || !email || !password || !otp) {
        setStatus("Fill all fields.");
        return;
    }

    try {
        setIsSignupLoading(true);
        const data = await signup(
            username,
            displayName,
            email,
            password,
            otp
        );

        setUser(data.user);
        setOtpSent(false);
        setStatus("Signup successful.");
        connectSocket();
        navigate("/");
        refreshRooms();
        handleRefreshLocation();
    } catch (error) {
        setStatus(error.message);
    } finally {
        setIsSignupLoading(false);
    }
  }

  async function handleForgotPasswordOtp() {
    if (!email) {
      setStatus("Enter your email.");
      return;
    }

    try {
      const data = await requestPasswordResetOtp(email);

      setResetOtpSent(true);
      setOtpCooldown(180);
      setStatus(data.message);
    } catch (error) {
      setStatus(error.message);
    }
  } 

  async function handleResetPassword() {
    if (!resetOtp || !newPassword) {
      setStatus("Enter OTP and new password.");
      return;
    }

    try {
      const data = await resetPassword(
        email,
        resetOtp,
        newPassword
      );

      setStatus(data.message);

      setForgotPassword(false);
      setResetOtpSent(false);
      setResetOtp("");
      setNewPassword("");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore error
    }
    setUser(null);
    setRooms([]);
    setNearby([]);
    setOtpSent(false);
    disconnectSocket();
    setStatus("");
  }

  async function handleRefreshLocation() {
    console.log("Refreshing location...");
    try {
      const pos = await getCurrentLocation();
      setLocation(pos);
      await updateLocation(pos.lat, pos.lon);
      refreshNearby(pos);
    } catch (error) {
      setStatus(error.message);
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const data = await uploadAvatar(formData);
       // console.log("Avatar uploaded:", data);
        setUser(data.avatar);
        // update user state here later
    } catch (err) {
        console.error(err);
    }
};

  async function handleCreateRoom() {
    if (!roomName) {
      setStatus("Room name is required.");
      return;
    }

    let roomLocation = location;

    if (roomLocation.lat == null || roomLocation.lon == null) {
      const pos = await getCurrentLocation().catch((error) => {
        setStatus(error.message);
        return null;
      });
      if (!pos) return;
      roomLocation = pos;
      setLocation(pos);
      await updateLocation(pos.lat, pos.lon).catch(() => {});
    }

    try {
      const data = await createRoomApi({
        roomName,
        description,
        lat: roomLocation.lat,
        lon: roomLocation.lon,
        allowPending,
      });
      setStatus(data.message || "Room created.");
      setRoomName("");
      setDescription("");
      refreshRooms();
      refreshNearby(roomLocation);
    } catch (error) {
      if (
        error.message === "No nearby users found; room creation stopped"
      ) {
        setDeletedRoom({
      title: "No Nearby Users",
      message:
        "No nearby users are currently available. Enable 'Wait for nearby users' to create this room and automatically notify nearby users when they come online.",
    });
      } else {
        setStatus(error.message);
      }
    }
  }

  async function handleJoinRoom(room) {
  try {
    await joinRoom(room.name);

    setNearby((prev) =>
      prev.filter((r) => r.name !== room.name)
    );

    setRooms((prev) => [...prev, room]);

    navigate(`/rooms/${encodeURIComponent(room.name)}`);
  } catch (error) {
    setStatus(error.message);
  }
}
    function handleOpenRoom(room) {
        navigate(`/rooms/${encodeURIComponent(room.name)}`);
    }   

  return (
  <div className="app-root">

    {deletedRoom && (
    <div className="modal-overlay">
      <div className="modal-card">

        <h2>{deletedRoom.title}</h2>

        <p>{deletedRoom.message}</p>

        <button
          className="primary"
          onClick={() => {setDeletedRoom(null);
            const shouldRedirect = deletedRoom.redirect;
            if(shouldRedirect){
              navigate("/");
            }
          }}
        >
          Okay
        </button>

      </div>
    </div>
  )}

    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Dashboard
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              user={user}
              rooms={rooms}
              nearby={nearby}
              roomName={roomName}
              description={description}
              allowPending={allowPending}
              location={location}
              onLogout={handleLogout}
              onCreateRoom={handleCreateRoom}
              onRefreshLocation={handleRefreshLocation}
              onJoinRoom={handleJoinRoom}
              onRoomNameChange={setRoomName}
              onDescriptionChange={setDescription}
              onTogglePending={setAllowPending}
              onOpenRoom={handleOpenRoom}
              handleAvatarUpload={handleAvatarUpload}
            />
            
          ) : (
            <AuthPanel
                status={status}
                username={username}
                displayName={displayName}

                onUsernameChange={setUsername}
                onDisplayNameChange={setDisplayName}

                email={email}
                password={password}
                otp={otp}
                otpSent={otpSent}

                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onOtpChange={setOtp}

                onRequestOtp={handleRequestOtp}
                onSignup={handleSignup}
                onLogin={handleLogin}
                otpCooldown={otpCooldown}
                isOtpLoading={isOtpLoading}
                isSignupLoading={isSignupLoading}
                isLoginLoading={isLoginLoading}

                isLogin={isLogin}
                setIsLogin={setIsLogin}

                forgotPassword={forgotPassword}
                setForgotPassword={setForgotPassword}
                resetOtpSent={resetOtpSent}
                resetOtp={resetOtp}
                newPassword={newPassword}
                onResetOtpChange={setResetOtp}
                onNewPasswordChange={setNewPassword}
                onForgotPasswordOtp={handleForgotPasswordOtp}
                onResetPassword={handleResetPassword}
                setOtpCooldown={setOtpCooldown}

                usernameStatus={usernameStatus}
                usernameAvailable={usernameAvailable}

                emailStatus={emailStatus}
                emailAvailable={emailAvailable}
            />
          )
        }
      />
      

      <Route
        path="/rooms/:roomName"
        element={
          user ? (
            <ChatRoom user={user}
            setDeletedRoom={setDeletedRoom} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
          path="/about"
          element={<AboutSpotly />}
      />
    </Routes>
  </div>
);
}

export default App;
