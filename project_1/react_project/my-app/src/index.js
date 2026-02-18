// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import keycloak from "./keycloak";

// function renderApp() {
//   const root = ReactDOM.createRoot(document.getElementById("root"));
//   root.render(
//     <React.StrictMode>
//       <App keycloak={keycloak} />
//     </React.StrictMode>
//   );
// }

// keycloak
//   .init({
//     onLoad: "login-required",   // auto-login
//     pkceMethod: "S256",
//     checkLoginIframe: false,
//   })
//   .then((authenticated) => {
//     if (!authenticated) {
//       keycloak.login();
//       return;
//     }
//     renderApp();
//   })
//   .catch((err) => {
//     console.error("Keycloak init error:", err);
//   });
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import keycloak from "./keycloak";

function renderApp() {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App keycloak={keycloak} />
    </React.StrictMode>
  );
}

keycloak
  .init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  })
  .then(() => renderApp())
  .catch((err) => console.error("Keycloak init error:", err));
