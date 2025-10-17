import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiMessage, setApiMessage] = useState("…loading");

  useEffect(() => {
    fetch("http://localhost:5000/api/greeting")
      .then((r) => r.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage("API not reachable"));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Smart Trivia (Dev)</h1>
      <p>This is my React app talking to our Express API.</p>

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <strong>API says:</strong> {apiMessage}
      </div>

      <hr />
      <p>Next steps we’ll add: OTP login, MongoDB, timed quizzes, admin panel.</p>
    </div>
  );
}

export default App;
