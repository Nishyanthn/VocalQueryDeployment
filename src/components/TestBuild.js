import React, { useState, useEffect } from "react";
import './TestBuild.css'; // Import the CSS file

const BuildDB = () => {
  
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [newDatabaseName, setNewDatabaseName] = useState(""); // New state for creating a database
  const [inputText, setInputText] = useState(""); // To store the user input text
  const [sqlQuery, setSqlQuery] = useState(""); // To store the generated SQL query
 
  const [executionMessage, setExecutionMessage] = useState(""); 
  const [tables, setTables] = useState([]); // Holds the tables in the selected database
  const [selectedTable, setSelectedTable] = useState(""); // Holds the selected table
  const [isRecording, setIsRecording] = useState(false);

   // Function to handle the input change
   const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // Function to call the backend API for text-to-SQL conversion
  const handleConvert = async () => {
    if (!inputText) {
      alert("Please enter some text!");
      return;
    }

    if (!selectedDatabase) {
      alert("Please select a database before converting the text!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/convert_to_sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: inputText }),
      });

      const result = await response.json();
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        setSqlQuery(result.sql_query);
      }
    } catch (error) {
      console.error("Error converting text to SQL:", error);
      alert("Failed to convert text to SQL. Please try again.");
    }
  };
  // Fetch databases on component mount
  useEffect(() => {
    fetch("http://localhost:5000/get_databases")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(`Error fetching databases: ${data.error}`);
        } else {
          setDatabases(data.databases);
        }
      })
      .catch((error) => {
        console.error("Error fetching databases:", error);
        alert("Failed to fetch databases. Please try again.");
      });
  }, []);

 
  const handleSpeechToText = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        const response = await fetch("https://api.deepgram.com/v1/listen", {
          method: "POST",
          headers: {
            Authorization: "Token 7514a2aa45ee08c79b67723a21bcd719bd01372d", // Replace with your actual key
            "Content-Type": "audio/wav",
          },
          body: audioBlob,
        });

        const data = await response.json();
        const transcript = data?.results?.channels[0]?.alternatives[0]?.transcript;

        if (transcript) {
          setInputText(transcript);
          // Optional: Automatically run conversion
          // handleConvert();
        } else {
          alert("Could not get a transcription.");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000); // Record for 5 seconds
    } catch (error) {
      console.error("Speech-to-text error:", error);
      alert("Speech recognition failed.");
      setIsRecording(false);
    }
  };

 
  

  // Function to handle database creation
  const handleCreateDatabase = async () => {
    if (!newDatabaseName) {
      alert("Please enter a database name!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/create_database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database_name: newDatabaseName }),
      });

      const result = await response.json();
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert("Database created successfully!");
        setNewDatabaseName(""); // Clear the input field
        // Fetch the updated list of databases
        fetchDatabases();
      }



      
    } catch (error) {
      console.error("Error creating database:", error);
      alert("Failed to create the database. Please try again.");
    }
  };

  const fetchDatabases = () => {
    fetch("http://localhost:5000/get_databases")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(`Error fetching databases: ${data.error}`);
        } else {
          setDatabases(data.databases);
        }
      })
      .catch((error) => {
        console.error("Error fetching databases:", error);
        alert("Failed to fetch databases. Please try again.");
      });
  };


  const fetchTables = async (databaseName) => {
    try {
      const response = await fetch('http://localhost:5000/get_tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database_name: databaseName })
      });
  
      const data = await response.json();
      if (data.success) {
        setTables(data.tables); // Set the tables in the selected database
      } else {
        alert("Error fetching tables: " + data.message);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      alert("Failed to fetch tables. Please try again.");
    }
  };
  
  // Handle database selection and fetch tables for it
  const handleDatabaseSelect = (e) => {
    const databaseName = e.target.value;
    setSelectedDatabase(databaseName);
    setSelectedTable(""); // Reset selected table when database changes
    if (databaseName) {
      fetchTables(databaseName); // Fetch tables for the selected database
    }
  };

  const handleExecute = async () => {
    if (!sqlQuery) {
      alert("No SQL query to execute! Please convert text to SQL first.");
      return;
    }

    if (!selectedDatabase) {
      setExecutionMessage("Please select a database before executing the query!");
      return;
    }



    try {
      const response = await fetch('http://localhost:5000/execute_sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          database_name: selectedDatabase,
          table_name: selectedTable,
          sql_query: sqlQuery
        })
      });

      const data = await response.json();
      if (data.success) {
        setExecutionMessage("Query executed successfully!");
      } else {
        setExecutionMessage("Query executed successfully!" );
      }
    } catch (error) {
      setExecutionMessage("Error executing query: " + error.message);
    }
  };

  return (
    <div className="build-db-container">
      <h2>Build Your Database</h2>

      {/* Create New Database Section */}
      <div className="create-db-container">
        <label>
          <strong>Create New Database:</strong>
        </label>
        <input
          type="text"
          value={newDatabaseName}
          onChange={(e) => setNewDatabaseName(e.target.value)}
          placeholder="Enter new database name"
          style={{ marginLeft: "10px", padding: "5px", width: "300px" }}
        />
        <button onClick={handleCreateDatabase}>
          Create Database
        </button>
      </div>

      {/* Database Selection Dropdown */}
      <div className="db-selection-container">
        <label>
          <strong>Select Database:</strong>
        </label>
        <select
          value={selectedDatabase}
          onChange={handleDatabaseSelect}
        >
          <option value="">-- Select a Database --</option>
          {databases.map((database, index) => (
            <option key={database} value={database}>
              {database}
            </option>
          ))}
        </select>
      </div>

      {/* Table Selection Dropdown */}
      {/* {selectedDatabase && (
        <div className="table-selection-container">
          <label>
            <strong>Select Table:</strong>
          </label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="">-- Select a Table --</option>
            {tables.map((table, index) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>
      )} */}

      {/* Speech to Text Button */}
      <div className="mic-button-container">
  <button
    className={`mic-icon-button ${isRecording ? "recording" : ""}`}
    onClick={handleSpeechToText}
    disabled={isRecording}
  >
    <span className="mic-icon" >{isRecording ? "🎙️" : "🎤"}</span>
    {isRecording && <div className="wave"></div>}
  </button>
</div>

      {/* Text to SQL Converter Section */}
      <div className="text-to-sql-container">
        <h2>Text to SQL Converter</h2>
        <div className="flex-container-row">
          <div className="input-container">
            <textarea
              className="input-textarea"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Enter your query in natural language..."
            />


          
          
          </div>

        {/* Convert button */}
        <div>
          <button className="convert-button" onClick={handleConvert}>
            Convert to SQL
          </button>
        </div>

        {/* SQL query output box */}
        <div className="sql-container">
          <textarea
            className="sql-query-textarea"
            value={sqlQuery}
            readOnly
            placeholder="Generated SQL query will appear here"
          />
        </div>
      </div>
    </div>
      {/* Execute Query Button */}
      <div>
        <button className="execute-button" onClick={handleExecute}>
          Execute Query
        </button>
      </div>

      {/* Execution Message */}
      {executionMessage && (
        <div className={`execution-message ${executionMessage.includes("success") ? 'success' : 'error'}`}>
          {executionMessage}
        </div>
      )}
    </div>
  );
};
    

export default BuildDB;
