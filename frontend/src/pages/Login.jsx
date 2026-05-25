import { useState } from "react";

import { theme } from "@/theme/theme.js";

export default function Login({ onLogin }) {

  const [isSignup, setIsSignup] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");
  
  const [name, setName] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(e) {

    e.preventDefault();

    setError("");
    setMessage("");

    setLoading(true);

    try {

      const endpoint =
        isSignup
          ? "register"
          : "login";

      const res = await fetch(
        `http://localhost:8000/${endpoint}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {

        setError(
          data.detail ||
          "Request failed"
        );

        return;
      }

      if (isSignup) {

        setMessage(
          "Account created successfully. Please sign in."
        );

        setIsSignup(false);

        return;
      }

      localStorage.setItem(
        "token",
        data.access_token
      );

      onLogin();

    } catch {

      setError(
        "Could not reach the server."
      );

    } finally {

      setLoading(false);

    }
  }

  const inputStyle = {

    width: "100%",

    padding: "10px 12px",

    background: theme.colors.background,

    border:
      "0.5px solid theme.colors.border",

    borderRadius: "7px",

    color: theme.colors.textPrimary,

    fontSize: theme.typography.placeholder.fontSize,

    outline: "none",

    fontFamily: theme.typography.placeholder.fontFamily,

    transition:
      "border-color 0.15s",
  };

  return (

    <div
      style={{
        minHeight: "100svh",

        background: theme.colors.background,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        fontFamily: theme.typography.placeholder.fontFamily,

        padding: "20px",
      }}
    >

      <div
        style={{
          width: "100%",

          maxWidth: "340px",

          background: theme.colors.sidebar,

          border:
            "0.5px solid theme.colors.border",

          borderRadius: "12px",

          padding: "28px 24px",
        }}
      >

        {/* Logo */}

        <div
          style={{
            fontSize: "48px",

            fontWeight: "500",

            color: theme.colors.textPrimary,

            letterSpacing: "-0.4px",

            marginBottom: "6px",
          }}
        >
          Fin
          <span
            style={{
              color: theme.colors.textSecondary
            }}
          >
            Sight
          </span>
        </div>

        <div
          style={{
            fontSize: "22px",

            color: theme.colors.positive,

            marginBottom: "24px",
          }}
        >
          {isSignup
            ? "Create a new account"
            : "Sign in to your account"}
        </div>

        <form
          onSubmit={handleSubmit}

          style={{
            display: "flex",

            flexDirection:
              "column",

            gap: "12px",
          }}
        >

          {/* EMAIL */}

          <div>

            <label
              style={{
                display: "block",

                fontSize: "10px",

                color: theme.colors.textSecondary,

                letterSpacing:
                  "0.07em",

                marginBottom: "5px",
              }}
            >
              EMAIL
            </label>

            <input
              type="email"

              placeholder="you@example.com"

              value={email}

              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }

              required

              style={inputStyle}

              onFocus={(e) =>
                (
                  e.target.style.borderColor =
                    "#3DB88260"
                )
              }

              onBlur={(e) =>
                (
                  e.target.style.borderColor =
                    "#2A2720"
                )
              }
            />

          </div>


          {/* NAME */}

{isSignup && (

  <div>

    <label
      style={{
        display: "block",

        fontSize: "10px",

        color: theme.colors.textSecondary,

        letterSpacing:
          "0.07em",

        marginBottom: "5px",
      }}
    >
      NAME
    </label>

    <input
      type="text"

      placeholder="Your name"

      value={name}

      onChange={(e) =>
        setName(
          e.target.value
        )
      }

      required={isSignup}

      style={inputStyle}

      onFocus={(e) =>
        (
          e.target.style.borderColor =
            "#3DB88260"
        )
      }

      onBlur={(e) =>
        (
          e.target.style.borderColor =
            "#2A2720"
        )
      }
    />

  </div>

)}

          {/* PASSWORD */}

          <div>

            <label
              style={{
                display: "block",

                fontSize: "10px",

                color: theme.colors.textSecondary,

                letterSpacing:
                  "0.07em",

                marginBottom: "5px",
              }}
            >
              PASSWORD
            </label>

            <input
              type="password"

              placeholder="••••••••"

              value={password}

              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }

              required

              style={inputStyle}

              onFocus={(e) =>
                (
                  e.target.style.borderColor =
                    "#3DB88260"
                )
              }

              onBlur={(e) =>
                (
                  e.target.style.borderColor =
                    "#2A2720"
                )
              }
            />

          </div>

          {/* ERROR */}

          {error && (

            <div
              style={{
                fontSize: "11px",

                color: "#D95F4B",

                background:
                  theme.colors.background,

                border:
                  "0.5px solid #D95F4B30",

                borderRadius: "5px",

                padding: "7px 10px",
              }}
            >
              {error}
            </div>

          )}

          {/* SUCCESS */}

          {message && (

            <div
              style={{
                fontSize: "11px",

                color: "#3DB882",

                background:
                  "#3DB88214",

                border:
                  "0.5px solid #3DB88230",

                borderRadius: "5px",

                padding: "7px 10px",
              }}
            >
              {message}
            </div>

          )}

          {/* SUBMIT */}

          <button
            type="submit"

            disabled={loading}

            style={{
              marginTop: "4px",

              padding: "10px",

              background:
                loading
                  ? "#1F1D15"
                  : "#3DB882",

              color:
                loading
                  ? "#6B6560"
                  : "#0C0B09",

              border: "none",

              borderRadius: "7px",

              fontSize: "13px",

              fontWeight: "500",

              fontFamily: "inherit",

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",

              transition:
                "background 0.15s",
            }}
          >
            {loading

              ? (
                  isSignup
                    ? "Creating account…"
                    : "Signing in…"
                )

              : (
                  isSignup
                    ? "Create Account"
                    : "Sign in"
                )}
          </button>

          {/* TOGGLE */}

          <button
            type="button"

            onClick={() =>
              setIsSignup(
                !isSignup
              )
            }

            style={{
              background:
                "transparent",

              color: "#6B6560",

              border:
                "0.5px solid #2A2720",

              borderRadius: "7px",

              padding: "10px",

              cursor: "pointer",

              fontSize: "12px",
            }}
          >
            {isSignup

              ? "Already have an account?"

              : "Create new account"}
          </button>

        </form>

      </div>

    </div>
  );
}