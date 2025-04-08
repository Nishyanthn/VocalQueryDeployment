import React, { useState, useEffect } from "react";
import "./AnalyseDB.css"; // Separate CSS file for styling

const AnalyzeDB = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [error, setError] = useState(""); // Error message state

  // Fetch databases on component mount
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch("http://localhost:5000/get_databases");
        if (!response.ok) {
          throw new Error("Failed to fetch databases.");
        }
        const data = await response.json();
        setDatabases(data.databases);
        setError(""); // Clear previous errors
      } catch (err) {
        console.error("Error fetching databases:", err);
        setError("Failed to fetch databases. Please try again.");
      }
    };

    fetchDatabases();
  }, []);

  // Fetch tables whenever the selected database changes
  useEffect(() => {
    if (selectedDatabase) {
      const fetchTables = async () => {
        try {
          const response = await fetch("http://localhost:5000/get_tables", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ database_name: selectedDatabase }),
          });
          if (!response.ok) {
            throw new Error("Failed to fetch tables.");
          }
          const data = await response.json();
          setTables(data.tables);
          setError(""); // Clear previous errors
        } catch (err) {
          console.error("Error fetching tables:", err);
          setError("Failed to fetch tables. Please try again.");
        }
      };

      fetchTables();
    } else {
      setTables([]); // Reset tables when no database is selected
    }
  }, [selectedDatabase]);

  // Handle question submission
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setError("Please enter a valid question.");
      return;
    }
    if (!selectedDatabase || !selectedTable) {
      setError("Please select both a database and a table before asking a question.");
      return;
    }

    // Clear error and add user question to chat
    setError("");
    const newQuestion = { sender: "user", text: question };
    setChatHistory((prev) => [...prev, newQuestion]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          database_name: selectedDatabase,
          table_name: selectedTable,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to process the question.");
      }
      const data = await response.json();
      const newAnswer = { sender: "gemini", text: data.answer };
      setChatHistory((prev) => [...prev, newAnswer]);
    } catch (err) {
      console.error("Error asking question:", err);
      setError("Failed to process the question. Please try again.");
    } finally {
      setLoading(false);
    }

    setQuestion(""); // Clear the input field
  };

  return (
    <div className="analyze-db">
      {/* Top Section: Database and Table Selection */}
      <div className="selection-section">
        <h2>Select Database and Table</h2>
        {error && <p className="error-message">{error}</p>}
        <select
          value={selectedDatabase}
          onChange={(e) => setSelectedDatabase(e.target.value)}
        >
          <option value="">Select Database</option>
          {databases.map((db) => (
            <option key={db} value={db}>
              {db}
            </option>
          ))}
        </select>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          disabled={!selectedDatabase}
        >
          <option value="">Select Table</option>
          {tables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <hr />

      {/* Main Section: Chat Interface */}
      <div className="chat-section">
        <div className="chat-window">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`chat-bubble ${message.sender === "user" ? "user" : "gemini"}`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className="input-section">
          <input
            type="text"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <button onClick={handleAskQuestion} disabled={loading}>
            {loading ? <span className="spinner"></span> : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeDB;
