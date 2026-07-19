import FormRow from "./FormRow.jsx";
import "../auth.css";

export default function AuthPanel({
  status,
  isLogin,
  setIsLogin,

  username,
  displayName,
  email,
  password,
  otp,
  otpSent,

  onUsernameChange,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onOtpChange,

  onRequestOtp,
  onSignup,
  onLogin,
  otpCooldown = 0,
  isOtpLoading = false,
  isSignupLoading = false,
  isLoginLoading = false,

  forgotPassword,
  setForgotPassword,
  resetOtpSent,
  resetOtp,
  newPassword,
  onResetOtpChange,
  onNewPasswordChange,
  onForgotPasswordOtp,
  onResetPassword,
  setOtpCooldown,

  usernameStatus,
  usernameAvailable,

  emailStatus,
  emailAvailable,
}) {
  const cooldownText = `${Math.floor(otpCooldown / 60)}:${String(otpCooldown % 60).padStart(2, "0")}`;

    if (forgotPassword) {
    return (
      <div className="auth-shell">

        {/* Keep same left side */}
        <section className="auth-hero">
          <div className="logo-mark">Spotly</div>

          <h1>Reset your password</h1>

          <p>
            Enter your email to receive a verification code and
            securely reset your password.
          </p>
        </section>


        {/* Reset password card */}
        <section className="panel auth-panel">

          <h2>Forgot password?</h2>

          <p className="reset-description">
            We'll send a verification code to your registered email.
          </p>

          <FormRow label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
            />
              {emailStatus && emailAvailable === true && (
                <div className="field-status unavailable">
                  No account found with this email.
                </div>
              )}
          </FormRow>

          {!resetOtpSent ? (
            <button
              className="primary wide"
              onClick={onForgotPasswordOtp}
              disabled={emailAvailable !== false || otpCooldown > 0}
            >
              {otpCooldown > 0
               ? `Send OTP again in ${cooldownText}`
               : "Send OTP"}
            </button>
          ) : (
            <>
              <FormRow label="OTP">
                <input
                  value={resetOtp}
                  onChange={(e) =>
                    onResetOtpChange(e.target.value)
                  }
                  placeholder="123456"
                />

                {otpCooldown > 0 && (
                  <div className="helper-text">
                    You can request another OTP in {cooldownText}.
                  </div>
                )}
              </FormRow>

              {otpCooldown === 0 && (
                <button
                  type="button"
                  className="link-button"
                  onClick={onForgotPasswordOtp}
                >
                  Resend OTP
                </button>
              )}

              <FormRow label="New password">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    onNewPasswordChange(e.target.value)
                  }
                  placeholder="Enter new password"
                />
              </FormRow>

              <button
                className="primary wide"
                onClick={onResetPassword}
              >
                Reset password
              </button>
            </>
          )}

          <button
            type="button"
            className="link-button forgot-link"
            onClick={() => setForgotPassword(false) }
          >
            Back to login
          </button>

        </section>
      </div>
    );
  }  

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="logo-mark">Spotly</div>

        <h1>
            {isLogin ? "Welcome back" : "Create your Spotly account"}
        </h1>

        <p>
            Join discussions happening around you, ask questions about nearby places,
            and stay connected with your local community in real time.
        </p>

        <div className="hero-features">

            <div className="hero-feature">
                <span>📍</span>
                <div>
                    <strong>Discover nearby rooms</strong>
                    <small><br/>See conversations around your current location.</small>
                </div>
            </div>

            <div className="hero-feature">
                <span>💬</span>
                <div>
                    <strong>Ask local questions</strong>
                    <small><br/>Traffic, events, recommendations and more.</small>
                </div>
            </div>

            <div className="hero-feature">
                <span>⚡</span>
                <div>
                    <strong>Real-time discussions</strong>
                    <small><br/>Messages update instantly as people join.</small>
                </div>
            </div>

        </div>
      </section>

      <section className="panel auth-panel">
        <div className="auth-tabs">
          <button type="button" className={isLogin ? "tab active" : "tab"} onClick={() => {setIsLogin(true); setOtpCooldown(0);}}>
            Login
          </button>
          <button type="button" className={!isLogin ? "tab active" : "tab"} onClick={() => {setIsLogin(false); setOtpCooldown(0);}}>
            Sign up
          </button>
        </div>

        {!isLogin && (
          <>
            <FormRow label="Username">
              <input
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="jane_doe_spotly"
                minLength={3}
              />
              {usernameStatus && (
                <div
                  className={
                    usernameAvailable === true
                      ? "field-status available"
                      : usernameAvailable === false
                      ? "field-status unavailable"
                      : "field-status"
                  }
                >
                  {usernameStatus}
                </div>
              )}

            </FormRow>

            <FormRow label="Display name">
              <input
                value={displayName}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                placeholder="Jane Doe"
              />
            </FormRow>
          </>
        )}

        <FormRow label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
          />
          {!isLogin && emailAvailable === false && (
            <div className="field-status unavailable">
              Email already registered. Please Login.
            </div>
          )}
        </FormRow>
        
        <FormRow label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password"
          />
        </FormRow>

        {!isLogin && otpSent && (
          <FormRow label="OTP">
            <input
              value={otp}
              onChange={(e) => onOtpChange(e.target.value)}
              placeholder="123456"
            />
            {otpCooldown > 0 && (
              <div className="helper-text">You can request another OTP in {cooldownText}.</div>
            )}
          </FormRow>
        )}

        {isLogin ? (
          <button className="primary wide" onClick={onLogin} disabled={isLoginLoading || !email.trim() || !password.trim()}>
            {isLoginLoading && <span className="spinner" />}
            {isLoginLoading ? "Logging in" : "Login"}
          </button>
        ) : !otpSent ? (
          <button className="primary wide" onClick={onRequestOtp} disabled={isOtpLoading || otpCooldown > 0 || username.length < 3 || usernameAvailable !== true || emailAvailable !== true} >
            {isOtpLoading && <span className="spinner" />}
            {otpCooldown > 0 ? `Send OTP again in ${cooldownText}` : isOtpLoading ? "Sending OTP" : "Send OTP"}
          </button>
        ) : (
          <button className="primary wide" onClick={onSignup} disabled={isSignupLoading || username.length < 3 || usernameAvailable === false}>
            {isSignupLoading && <span className="spinner" />}
            {isSignupLoading ? "Creating account" : "Create account"}
          </button>
        )}
        {isLogin && status && (
          <div className="field-status unavailable login-error">
            {status}
          </div>
        )}

        {isLogin && (
          <button
            type="button"
            className="link-button forgot-link"
            onClick={() => setForgotPassword(true)}
          >
            Forgot password?
          </button>
        )}

        {isLogin && (
          <button type="button" className="link-button forgot-link" onClick={() => setForgotPassword(true)}>
            Forgot password?
          </button>
        )}
      </section>
    </div>
  );
}
