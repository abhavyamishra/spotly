import "../aboutpage.css";
import { useNavigate } from "react-router-dom";

export default function AboutSpotly() {
  const navigate = useNavigate();

  return (
    <div className="about-page">

      <header className="about-navbar">

        <button
          className="menu-btn"
          onClick={() => navigate("/")}
        >
          ←
        </button>

        <div className="brand">
          <strong>Spotly</strong>
          <span>Local chat</span>
        </div>

      </header>

      <main className="about-content">

        <section className="about-hero">

          <h1>Spotly</h1>

          <p className="hero-tagline">
            Local conversations that matter.
          </p>

          <p className="hero-description">
            Spotly is a location-based discussion platform that helps people
            discover, start and participate in conversations happening around
            them. Whether you're looking for information, sharing an update or
            asking a question, Spotly connects you with discussions that are
            relevant to your surroundings.
          </p>

        </section>

        <section className="about-section">

          <h2>Why Spotly?</h2>

          <div className="feature-grid">

            <div className="feature-card">
              <h3>Discussions near you</h3>

              <p>
                Explore conversations that are relevant to your current
                location instead of browsing through a global feed filled with
                unrelated content.
              </p>
            </div>

            <div className="feature-card">
              <h3>Ask local questions</h3>

              <p>
                Need quick information about something nearby? Start a
                discussion and receive responses from people in the same area.
              </p>
            </div>

            <div className="feature-card">
              <h3>Stay informed</h3>

              <p>
                Keep up with what's happening around your neighbourhood,
                college, workplace or any other local community.
              </p>
            </div>

            <div className="feature-card">
              <h3>Simple and focused</h3>

              <p>
                No endless feeds or unnecessary distractions—just conversations
                that are useful to people nearby.
              </p>
            </div>

          </div>

        </section>

        <section className="about-section">

          <h2>How can you use Spotly?</h2>

          <div className="example-grid">

            <div className="example">
              Ask for recommendations around your current location.
            </div>

            <div className="example">
              Discuss traffic, weather or road conditions nearby.
            </div>

            <div className="example">
              Share updates related to your college or workplace.
            </div>

            <div className="example">
              Find people interested in local activities or events.
            </div>

            <div className="example">
              Report or discuss issues affecting your neighbourhood.
            </div>

            <div className="example">
              Get quick answers from people who are actually nearby.
            </div>

          </div>

        </section>

        <section className="about-section">

          <h2>Privacy</h2>

          <p>
            Spotly uses your location only to discover nearby discussions.
            Your exact location is not displayed publicly to other users.
            Location information is refreshed while you're active so the
            discussions you see remain relevant to where you are.
          </p>

        </section>

      </main>

      <footer className="about-footer">

        <h3>Spotly</h3>

        <p>
          Making local conversations more relevant, accessible and meaningful.
        </p>

      </footer>

    </div>
  );
}

