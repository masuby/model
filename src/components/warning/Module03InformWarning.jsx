/**
 * MODULE 03: INFORM WARNING EDUCATION
 *
 * Teaches users about INFORM Warning - an early warning system for humanitarian crises
 * Builds on INFORM Risk concepts from Modules 01 and 02
 *
 * Structure:
 * - 7 educational sections
 * - Interactive quizzes
 * - Tanzania-specific examples
 * - Real-world case studies
 */

import React, { useState, useEffect } from 'react';
import './Module03InformWarning.css';

// Section components
import Section01Introduction from './sections/Section01Introduction';
import Section02TriggerEvents from './sections/Section02TriggerEvents';
import Section03Vulnerability from './sections/Section03Vulnerability';
import Section04CopingCapacity from './sections/Section04CopingCapacity';
import Section05WarningScores from './sections/Section05WarningScores';
import Section06Integration from './sections/Section06Integration';
import Section07Applications from './sections/Section07Applications';

const Module03InformWarning = ({ onComplete }) => {
  const [currentSection, setCurrentSection] = useState(1);
  const [completedSections, setCompletedSections] = useState([]);
  const [quizScores, setQuizScores] = useState({});
  const [showCertificate, setShowCertificate] = useState(false);

  const totalSections = 7;

  // Section metadata
  const sections = [
    { id: 1, title: 'Introduction to Early Warning', duration: '5 min', icon: '⚠️' },
    { id: 2, title: 'Trigger Events', duration: '8 min', icon: '🚨' },
    { id: 3, title: 'Vulnerability in Crisis', duration: '7 min', icon: '🛡️' },
    { id: 4, title: 'Immediate Coping Capacity', duration: '7 min', icon: '🏥' },
    { id: 5, title: 'Warning Scores and Thresholds', duration: '8 min', icon: '📊' },
    { id: 6, title: 'Integration with INFORM Risk', duration: '7 min', icon: '🔗' },
    { id: 7, title: 'Real-World Applications', duration: '8 min', icon: '🌍' }
  ];

  // Calculate overall progress
  const progressPercentage = (completedSections.length / totalSections) * 100;

  // Handle section completion
  const handleSectionComplete = (sectionId, quizScore) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId]);
    }

    if (quizScore !== undefined) {
      setQuizScores({ ...quizScores, [sectionId]: quizScore });
    }

    // Move to next section
    if (sectionId < totalSections) {
      setCurrentSection(sectionId + 1);
    } else {
      // All sections completed
      checkModuleCompletion();
    }
  };

  // Check if module is complete
  const checkModuleCompletion = () => {
    const allSectionsCompleted = completedSections.length === totalSections;
    const allQuizzesPassed = Object.values(quizScores).every(score => score >= 80);

    if (allSectionsCompleted && allQuizzesPassed) {
      setShowCertificate(true);
    }
  };

  // Calculate average quiz score
  const averageScore = Object.values(quizScores).length > 0
    ? Math.round(Object.values(quizScores).reduce((a, b) => a + b, 0) / Object.values(quizScores).length)
    : 0;

  // Render current section
  const renderSection = () => {
    const commonProps = {
      onComplete: (quizScore) => handleSectionComplete(currentSection, quizScore),
      isCompleted: completedSections.includes(currentSection),
      quizScore: quizScores[currentSection]
    };

    switch (currentSection) {
      case 1:
        return <Section01Introduction {...commonProps} />;
      case 2:
        return <Section02TriggerEvents {...commonProps} />;
      case 3:
        return <Section03Vulnerability {...commonProps} />;
      case 4:
        return <Section04CopingCapacity {...commonProps} />;
      case 5:
        return <Section05WarningScores {...commonProps} />;
      case 6:
        return <Section06Integration {...commonProps} />;
      case 7:
        return <Section07Applications {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="module03-container">
      {/* Header */}
      <header className="module03-header">
        <div className="header-content">
          <div className="header-icon">⚠️</div>
          <div className="header-text">
            <h1>MODULE 03: INFORM Warning</h1>
            <p className="header-subtitle">Early Warning Systems for Humanitarian Crises</p>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="module03-progress">
        <div className="progress-header">
          <span className="progress-label">
            Module Progress: {completedSections.length}/{totalSections} Sections
          </span>
          <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {averageScore > 0 && (
          <div className="average-score">
            Average Quiz Score: {averageScore}%
          </div>
        )}
      </div>

      {/* Section Navigation */}
      <div className="section-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`section-nav-item ${
              currentSection === section.id ? 'active' : ''
            } ${completedSections.includes(section.id) ? 'completed' : ''}`}
            onClick={() => setCurrentSection(section.id)}
            title={section.title}
          >
            <span className="section-icon">{section.icon}</span>
            <span className="section-number">{section.id}</span>
            {completedSections.includes(section.id) && (
              <span className="completion-check">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Current Section Info */}
      <div className="current-section-info">
        <div className="section-badge">
          <span className="section-badge-icon">{sections[currentSection - 1].icon}</span>
          <div className="section-badge-text">
            <div className="section-badge-title">Section {currentSection}</div>
            <div className="section-badge-name">{sections[currentSection - 1].title}</div>
          </div>
        </div>
        <div className="section-duration">
          <span className="duration-icon">⏱️</span>
          <span className="duration-text">{sections[currentSection - 1].duration}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="module03-main">
        {renderSection()}
      </main>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="certificate-modal">
          <div className="certificate-content">
            <button
              className="certificate-close"
              onClick={() => setShowCertificate(false)}
            >
              ×
            </button>
            <div className="certificate">
              <div className="certificate-header">
                <div className="certificate-icon">🏆</div>
                <h2>Certificate of Completion</h2>
              </div>
              <div className="certificate-body">
                <h3>INFORM Warning Education</h3>
                <p className="certificate-text">
                  This certifies that you have successfully completed all 7 sections
                  of Module 03: INFORM Warning and demonstrated understanding of
                  early warning systems for humanitarian crises.
                </p>
                <div className="certificate-stats">
                  <div className="stat">
                    <div className="stat-value">{totalSections}</div>
                    <div className="stat-label">Sections Completed</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{averageScore}%</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      {Object.values(quizScores).filter(s => s >= 80).length}/{totalSections}
                    </div>
                    <div className="stat-label">Quizzes Passed</div>
                  </div>
                </div>
                <div className="certificate-date">
                  Completed on {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="certificate-footer">
                <button
                  className="continue-btn"
                  onClick={() => {
                    setShowCertificate(false);
                    if (onComplete) onComplete();
                  }}
                >
                  Continue to Next Module →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Info Panel */}
      <div className="module-info-panel">
        <div className="info-card">
          <h3>📚 About This Module</h3>
          <p>
            INFORM Warning builds on the INFORM Risk framework you learned in Modules 01 and 02.
            While INFORM Risk assesses long-term vulnerability, INFORM Warning focuses on
            imminent threats and rapid-onset crises.
          </p>
        </div>
        <div className="info-card">
          <h3>🎯 Learning Objectives</h3>
          <ul>
            <li>Understand early warning systems</li>
            <li>Identify trigger events</li>
            <li>Assess crisis vulnerability</li>
            <li>Evaluate coping capacity</li>
            <li>Interpret warning scores</li>
            <li>Integrate Risk + Warning data</li>
            <li>Apply to real-world scenarios</li>
          </ul>
        </div>
        <div className="info-card">
          <h3>⏰ Estimated Time</h3>
          <p>
            Total module duration: <strong>50 minutes</strong>
            <br />
            You can complete sections at your own pace and return anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Module03InformWarning;
