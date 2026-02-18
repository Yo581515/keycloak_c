// import React, { useEffect, useMemo, useState } from "react";

// function decodeJwt(token) {
//   if (!token) return null;
//   const parts = token.split(".");
//   if (parts.length !== 3) return null;

//   // base64url decode
//   const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
//   const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);

//   try {
//     return JSON.parse(atob(padded));
//   } catch {
//     return null;
//   }
// }

// export default function App({ keycloak }) {
//   const [token, setToken] = useState(keycloak.token || "");
//   const [refreshToken, setRefreshToken] = useState(keycloak.refreshToken || "");
//   const [idToken, setIdToken] = useState(keycloak.idToken || "");
//   const [profile, setProfile] = useState(null);
//   const [apiResult, setApiResult] = useState(null);
//   const [error, setError] = useState(null);

//   const decodedAccess = useMemo(() => decodeJwt(token), [token]);
//   const decodedId = useMemo(() => decodeJwt(idToken), [idToken]);

//   useEffect(() => {
//     // load basic user profile
//     keycloak
//       .loadUserProfile()
//       .then((p) => setProfile(p))
//       .catch(() => setProfile(null));

//     // keep token updated
//     const interval = setInterval(() => {
//       keycloak
//         .updateToken(30) // refresh if expires in < 30s
//         .then((refreshed) => {
//           if (refreshed) {
//             setToken(keycloak.token || "");
//             setRefreshToken(keycloak.refreshToken || "");
//             setIdToken(keycloak.idToken || "");
//           }
//         })
//         .catch(() => {
//           // if refresh fails, force re-login
//           keycloak.login();
//         });
//     }, 5000);

//     return () => clearInterval(interval);
//   }, [keycloak]);

//   async function callProtectedApi() {
//     setError(null);
//     setApiResult(null);

//     try {
//       const res = await fetch("http://localhost:6767/protected", {
//         headers: {
//           Authorization: `Bearer ${keycloak.token}`,
//         },
//       });

//       const text = await res.text();
//       let data;
//       try {
//         data = JSON.parse(text);
//       } catch {
//         data = text;
//       }

//       if (!res.ok) {
//         throw new Error(typeof data === "string" ? data : JSON.stringify(data));
//       }
//       setApiResult(data);
//     } catch (e) {
//       setError(e.message || String(e));
//     }
//   }

//   return (
//     <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 1000 }}>
//       <h2>React + Keycloak (Auth Code + PKCE)</h2>

//       <div style={{ marginBottom: 12 }}>
//         <button onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>
//           Logout
//         </button>{" "}
//         <button onClick={() => keycloak.login()}>Login</button>{" "}
//         <button onClick={callProtectedApi}>Call /protected</button>
//       </div>

//       <hr />

//       <h3>User</h3>
//       <pre>{JSON.stringify({ authenticated: keycloak.authenticated, profile }, null, 2)}</pre>

//       <h3>Decoded access token claims</h3>
//       <pre>{JSON.stringify(decodedAccess, null, 2)}</pre>

//       <h3>Decoded ID token claims</h3>
//       <pre>{JSON.stringify(decodedId, null, 2)}</pre>

//       <h3>Raw tokens (for debugging)</h3>
//       <details>
//         <summary>Show tokens</summary>
//         <div style={{ marginTop: 8 }}>
//           <h4>access_token</h4>
//           <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{token}</pre>

//           <h4>refresh_token</h4>
//           <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{refreshToken}</pre>

//           <h4>id_token</h4>
//           <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{idToken}</pre>
//         </div>
//       </details>

//       <hr />

//       <h3>API Result</h3>
//       {error && <pre style={{ color: "crimson" }}>{error}</pre>}
//       {apiResult && <pre>{JSON.stringify(apiResult, null, 2)}</pre>}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:6767";

function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);

  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

async function apiFetch(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  return data;
}

export default function App({ keycloak }) {
  const [profile, setProfile] = useState(null);

  const [accessToken, setAccessToken] = useState(keycloak.token || "");
  const [idToken, setIdToken] = useState(keycloak.idToken || "");
  const [refreshToken, setRefreshToken] = useState(keycloak.refreshToken || "");

  const decodedAccess = useMemo(() => decodeJwt(accessToken), [accessToken]);
  const decodedId = useMemo(() => decodeJwt(idToken), [idToken]);

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // item form state
  const [itemName, setItemName] = useState("coffee");
  const [itemDesc, setItemDesc] = useState("tasty");
  const [itemPrice, setItemPrice] = useState(3.5);

  function syncTokensFromKeycloak() {
    setAccessToken(keycloak.token || "");
    setIdToken(keycloak.idToken || "");
    setRefreshToken(keycloak.refreshToken || "");
  }

  useEffect(() => {
    // If already authenticated via SSO, load profile + tokens
    if (keycloak.authenticated) {
      syncTokensFromKeycloak();
      keycloak.loadUserProfile().then(setProfile).catch(() => setProfile(null));
    }

    // Keep token refreshed if logged in
    const interval = setInterval(() => {
      if (!keycloak.authenticated) return;

      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) syncTokensFromKeycloak();
        })
        .catch(() => {
          // if refresh fails, treat as logged out
          setResult(null);
          setError("Token refresh failed. Please login again.");
        });
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runCall(fn) {
    setError(null);
    setResult(null);
    try {
      const data = await fn();
      setResult(data);
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  // ---- API calls ----
  const callPublic = () => apiFetch("/public");
  const callUserMe = () => apiFetch("/user/me", { token: keycloak.token });
  const callProtected = () => apiFetch("/protected", { token: keycloak.token });
  const callDeveloper = () => apiFetch("/developer", { token: keycloak.token });

  const listItems = () => apiFetch("/admin/items", { token: keycloak.token });
  const getItem = (name) => apiFetch(`/admin/items/${encodeURIComponent(name)}`, { token: keycloak.token });
  const createItem = (item) => apiFetch("/admin/items", { method: "POST", token: keycloak.token, body: item });
  const updateItem = (name, item) =>
    apiFetch(`/admin/items/${encodeURIComponent(name)}`, { method: "PUT", token: keycloak.token, body: item });
  const deleteItem = (name) =>
    apiFetch(`/admin/items/${encodeURIComponent(name)}`, { method: "DELETE", token: keycloak.token });

  const currentItemObj = {
    name: itemName,
    description: itemDesc,
    price: Number(itemPrice),
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 1100 }}>
      <h2>React ↔ Keycloak ↔ FastAPI</h2>

      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong>{" "}
        {keycloak.authenticated ? "Authenticated ✅" : "Not authenticated ❌"}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => keycloak.login()}>Login</button>
        <button
          onClick={() =>
            keycloak.logout({ redirectUri: window.location.origin })
          }
        >
          Logout
        </button>
        <button onClick={() => { setResult(null); setError(null); }}>
          Clear output
        </button>
      </div>

      <hr />

      <h3>API calls</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <button onClick={() => runCall(callPublic)}>GET /public</button>
        <button onClick={() => runCall(callUserMe)} disabled={!keycloak.authenticated}>
          GET /user/me
        </button>
        <button onClick={() => runCall(callProtected)} disabled={!keycloak.authenticated}>
          GET /protected
        </button>
        <button onClick={() => runCall(callDeveloper)} disabled={!keycloak.authenticated}>
          GET /developer (role: developer)
        </button>
      </div>

      <h3>Admin items (role: admin)</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <label>
              name{" "}
              <input value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </label>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label>
              description{" "}
              <input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} />
            </label>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label>
              price{" "}
              <input
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                step="0.1"
              />
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignContent: "start" }}>
          <button onClick={() => runCall(listItems)} disabled={!keycloak.authenticated}>
            GET /admin/items
          </button>
          <button onClick={() => runCall(() => getItem(itemName))} disabled={!keycloak.authenticated}>
            GET /admin/items/{`{name}`}
          </button>
          <button onClick={() => runCall(() => createItem(currentItemObj))} disabled={!keycloak.authenticated}>
            POST /admin/items
          </button>
          <button onClick={() => runCall(() => updateItem(itemName, currentItemObj))} disabled={!keycloak.authenticated}>
            PUT /admin/items/{`{name}`}
          </button>
          <button onClick={() => runCall(() => deleteItem(itemName))} disabled={!keycloak.authenticated}>
            DELETE /admin/items/{`{name}`}
          </button>
        </div>
      </div>

      <hr />

      <h3>User info</h3>
      <pre>{JSON.stringify({ profile }, null, 2)}</pre>

      <h3>Decoded access token claims</h3>
      <pre>{JSON.stringify(decodedAccess, null, 2)}</pre>

      <h3>Decoded ID token claims</h3>
      <pre>{JSON.stringify(decodedId, null, 2)}</pre>

      <h3>Tokens</h3>
      <details>
        <summary>Show raw tokens</summary>
        <div style={{ marginTop: 8 }}>
          <h4>access_token</h4>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {accessToken}
          </pre>

          <h4>refresh_token</h4>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {refreshToken}
          </pre>

          <h4>id_token</h4>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {idToken}
          </pre>
        </div>
      </details>

      <hr />

      <h3>API output</h3>
      {error && <pre style={{ color: "crimson" }}>{error}</pre>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
