import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  FolderOpen,
  Network,
  ShieldAlert,
  Search
} from "lucide-react";

import "./App.css";
import NetworkGraph from "./NetworkGraph";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function App() {
  const [persons, setPersons] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [question, setQuestion] = useState("");
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [person1, setPerson1] = useState("");
  const [person2, setPerson2] = useState("");
  const [pathResult, setPathResult] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  useEffect(() => {
    api
      .get("/persons")
      .then((response) => {
        setPersons(response.data);
      })
      .catch((error) => {
        console.error("Persons API error:", error);
      });

    api
      .get("/leads")
      .then((response) => {
        setLeads(response.data);
      })
      .catch((error) => {
        console.error("Leads API error:", error);
      });
  }, []);

  const selectPerson = (person) => {
    api
      .get(`/persons/${person.person_id}`)
      .then((response) => {
        setSelectedPerson(response.data);
      })
      .catch((error) => {
        console.error("Person profile error:", error);
      });
  };

  const askAssistant = async () => {
    if (!question.trim()) return;

    setLoading(true);

    try {
      const response = await api.post(
        "/assistant",
        {
          question: question
        }
      );

      console.log("Assistant response:", response.data);

      setAssistantResponse(response.data);

    } catch (error) {
      console.error("Assistant error:", error);

      setAssistantResponse({
        answer: "Unable to connect to the investigation assistant.",
        data: []
      });

    } finally {
      setLoading(false);
    }
  };

  const searchPerson = async () => {
    if (!searchText.trim()) return;

    try {
      const response = await api.get(
        "/search",
        {
          params: {
            name: searchText
          }
        }
      );

      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const findShortestPath = async () => {

    if (!person1 || !person2) {
      alert("Please select both persons.");
      return;
    }

    if (person1 === person2) {
      alert("Please select two different persons.");
      return;
    }

    setPathLoading(true);
    setPathResult(null);

    try {

      const response = await api.get(
        "/shortest-path",
        {
          params: {
            person1: person1,
            person2: person2
          }
        }
      );

      setPathResult(response.data);

    } catch (error) {

      console.error("Shortest path error:", error);

      setPathResult({
        found: false,
        message: "Unable to calculate investigation path."
      });

    } finally {

      setPathLoading(false);

    }
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div>
          <h1>🕵️ CrimeLink AI</h1>
          <p>Criminal Network Intelligence Platform</p>
        </div>
      </header>

      {/* STAT CARDS */}
      <section className="stats">

        <div className="card">
          <Users />
          <div>
            <h3>Persons</h3>
            <strong>{persons.length}</strong>
          </div>
        </div>

        <div className="card">
          <ShieldAlert />
          <div>
            <h3>Investigative Leads</h3>
            <strong>{leads.length}</strong>
          </div>
        </div>

        <div className="card">
          <Network />
          <div>
            <h3>Network</h3>
            <strong>Active</strong>
          </div>
        </div>

        <div className="card">
          <FolderOpen />
          <div>
            <h3>Cases</h3>
            <strong>Crime Database</strong>
          </div>
        </div>

      </section>

      {/*Search UI*/}
      <section className="panel">

        <div className="panel-title">
          <h2>🔎 Search Person</h2>
          <p>Search the criminal network by name</p>
        </div>

        <div className="assistant-input">

          <input
            type="text"
            placeholder="Enter person name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                searchPerson();
              }
            }}
          />

          <button onClick={searchPerson}>
            <Search size={18} />
            Search
          </button>

        </div>

        {searchResults.length > 0 && (
          <div className="search-results">

            {searchResults.map((person) => (
              <div
                className="assistant-result"
                key={person.person_id}
                onClick={() => selectPerson(person)}
                style={{ cursor: "pointer" }}
              >

                <strong>{person.name}</strong>

                <span>ID: {person.person_id}</span>

                <span>
                  Lead Score:{" "}
                  {person.leadScore?.toFixed(2)}
                </span>

              </div>
            ))}

          </div>
        )}

        {searchText && searchResults.length === 0 && (
          <p>No person found.</p>
        )}

      </section>

      {/* PERSON PROFILE */}
      {selectedPerson && (
        <section className="panel profile">

          <div className="profile-header">
            <div>
              <h2>🔎 Person Profile</h2>
              <h3>{selectedPerson.name}</h3>
            </div>
          </div>

          <div className="profile-grid">

            <div>
              <span>Person ID</span>
              <strong>{selectedPerson.person_id}</strong>
            </div>

            <div>
              <span>Community</span>
              <strong>{selectedPerson.community}</strong>
            </div>

            <div>
              <span>PageRank</span>
              <strong>
                {selectedPerson.pageRank?.toFixed(3)}
              </strong>
            </div>

            <div>
              <span>Betweenness</span>
              <strong>
                {selectedPerson.betweenness}
              </strong>
            </div>

            <div>
              <span>Lead Score</span>
              <strong className="big-score">
                {selectedPerson.leadScore?.toFixed(2)}
              </strong>
            </div>

          </div>

          <h3>📂 Associated Cases</h3>

          <ul>
            {selectedPerson.cases
              ?.filter((c) => c.case_id)
              .map((c) => (
                <li key={c.case_id}>
                  <strong>{c.case_id}</strong>
                  {" — "}
                  {c.role}
                </li>
              ))}
          </ul>

        </section>
      )}
      
      {/*Investigation Path*/}
      <section className="panel">

        <div className="panel-title">
          <h2>🛣️ Investigation Path</h2>
          <p>Find the shortest connection between two people</p>
        </div>

        <div className="path-controls">

          <div className="path-select">

            <label>Person A</label>

            <select
              value={person1}
              onChange={(e) => setPerson1(e.target.value)}
            >

              <option value="">
                Select Person
              </option>

              {persons.map((person) => (
                <option
                  key={person.person_id}
                  value={person.person_id}
                >
                  {person.name} ({person.person_id})
                </option>
              ))}

            </select>

          </div>


          <div className="path-arrow">
            →
          </div>


          <div className="path-select">

            <label>Person B</label>

            <select
              value={person2}
              onChange={(e) => setPerson2(e.target.value)}
            >

              <option value="">
                Select Person
              </option>

              {persons.map((person) => (
                <option
                  key={person.person_id}
                  value={person.person_id}
                >
                  {person.name} ({person.person_id})
                </option>
              ))}

            </select>

          </div>


          <button
            className="path-button"
            onClick={findShortestPath}
            disabled={pathLoading}
          >
            {pathLoading ? "Finding..." : "Find Path"}
          </button>

        </div>


        {pathResult && (

          <div className="path-result">

            {pathResult.found ? (

              <>
                <h3>🔎 Investigation Path Found</h3>

                <div className="path-chain">

                  {pathResult.path.map((person, index) => (

                    <div
                      className="path-node"
                      key={person.id}
                    >

                      <div className="person-node">
                        {person.name}
                      </div>

                      <small>
                        {person.id}
                      </small>

                      {index < pathResult.path.length - 1 && (
                        <span className="path-line">
                          →
                        </span>
                      )}

                    </div>

                  ))}

                </div>

                <p className="distance">
                  Connection distance:
                  <strong> {pathResult.distance}</strong>
                </p>

              </>

            ) : (

              <div className="no-path">
                ❌ {pathResult.message}
              </div>

            )}

          </div>

        )}

      </section>

      {/* LEADS */}
      <section className="panel">
        <div className="panel-title">
          <h2>🔥 Investigative Leads</h2>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Person</th>
                <th>Community</th>
                <th>PageRank</th>
                <th>Betweenness</th>
                <th>Lead Score</th>
              </tr>
            </thead>

            <tbody>
              {leads.map((person, index) => (
                <tr
                  key={person.person_id}
                  onClick={() => selectPerson(person)}
                >
                  <td>#{index + 1}</td>
                  <td>{person.name}</td>
                  <td>{person.community}</td>
                  <td>
                    {person.pageRank?.toFixed(3)}
                  </td>
                  <td>{person.betweenness}</td>
                  <td>
                    <span className="score">
                      {person.leadScore?.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="panel">
          <div className="panel-title">
            <h2>🕸️ Criminal Network</h2>
                <p>
                  Interactive relationship and community network
                </p>
              </div>

              <div className="network-legend">

                <span>
                  <i className="legend-dot community-blue"></i>
                  Community 0
                </span>

                <span>
                  <i className="legend-dot community-red"></i>
                  Community 1
                </span>

                <span>
                  <i className="legend-dot community-green"></i>
                  Community 2
                </span>

                <span>
                  <i className="legend-dot community-purple"></i>
                  Community 3
                </span>

                <span className="legend-important">
                  ⭕ High Lead Score
                </span>
          </div>

          <NetworkGraph />
      </section>

      <section className="panel assistant">
        <div className="panel-title">
          <h2>🤖 CrimeLink Investigation Assistant</h2>
          <p>Ask questions about the criminal network</p>
        </div>

        <div className="assistant-input">
          <input
            type="text"
            placeholder="Ask: Who are the top investigative leads?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                askAssistant();
              }
            }}
          />

          <button onClick={askAssistant}>
            {loading ? "Analyzing..." : "Ask"}
          </button>
        </div>
      
        {assistantResponse && (
          <div className="assistant-response">

            <h3>🔎 {assistantResponse.answer}</h3>

            {Array.isArray(assistantResponse.data) ? (

              assistantResponse.data.map((item, index) => (
                <div className="assistant-result" key={index}>

                  {item.name && (
                    <strong>{item.name}</strong>
                  )}

                  {item.person_id && (
                    <span>ID: {item.person_id}</span>
                  )}

                  {item.score !== undefined && (
                    <span>
                      Lead Score: {Number(item.score).toFixed(2)}
                    </span>
                  )}

                  {item.leadScore !== undefined && (
                    <span>
                      Lead Score: {Number(item.leadScore).toFixed(2)}
                    </span>
                  )}

                  {item.community !== undefined && (
                    <span>
                      Community: {item.community}</span>
                  )}

                </div>
              ))

            ) : (

              <div className="assistant-result">

                {assistantResponse.data?.name && (
                  <strong>
                    {assistantResponse.data.name}
                  </strong>
                )}

                {assistantResponse.data?.person_id && (
                  <span>
                    ID: {assistantResponse.data.person_id}
                  </span>
                )}

                {assistantResponse.data?.community !== undefined && (
                  <span>
                    Community: {assistantResponse.data.community}
                  </span>
                )}

                {assistantResponse.data?.leadScore !== undefined && (
                  <span>
                    Lead Score:{" "}
                    {Number(
                      assistantResponse.data.leadScore
                    ).toFixed(2)}
                  </span>
                )}

                {assistantResponse.data?.cases && (
                  <span>
                    Cases:{" "}
                    {assistantResponse.data.cases.length > 0
                      ? assistantResponse.data.cases.join(", ")
                      : "No associated cases"}
                  </span>
                )}

              </div>

            )}

          </div>
        )}
      </section>
    </div>
  );
}

export default App;