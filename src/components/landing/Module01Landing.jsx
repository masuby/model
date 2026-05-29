/**
 * MODULE 01: UNDERSTANDING RISK FOR DECISION-MAKING IN TANZANIA
 *
 * Educational landing page following INFORM methodology
 * 6 Sequential Sections: Hazard → Exposure → Sensitivity → Vulnerability → Coping → Risk
 *
 * Critical: This is NOT a dashboard - it's a conceptual orientation module
 */

import React, { useState } from 'react';
import './Module01Landing.css';

// Import section components
import Section1Hazard from './sections/Section1Hazard';
import Section2Exposure from './sections/Section2Exposure';
import Section3Sensitivity from './sections/Section3Sensitivity';
import Section4Vulnerability from './sections/Section4Vulnerability';
import Section5Coping from './sections/Section5Coping';
import Section6Risk from './sections/Section6Risk';
import QuizComponent from './components/QuizComponent';

const SECTIONS = [
  { id: 1, title: 'Hazard', subtitle: 'What Can Happen?', component: Section1Hazard },
  { id: 2, title: 'Exposure', subtitle: 'Who is in Harm\'s Way?', component: Section2Exposure },
  { id: 3, title: 'Sensitivity', subtitle: 'Why Different Impacts?', component: Section3Sensitivity },
  { id: 4, title: 'Vulnerability', subtitle: 'Why Some Suffer More?', component: Section4Vulnerability },
  { id: 5, title: 'Coping Capacity', subtitle: 'Can We Manage It?', component: Section5Coping },
  { id: 6, title: 'Risk', subtitle: 'Combining All Dimensions', component: Section6Risk },
];

function Module01Landing({ onComplete }) {
  const [currentSection, setCurrentSection] = useState(1);
  const [completedSections, setCompletedSections] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState({});

  const CurrentSectionComponent = SECTIONS[currentSection - 1].component;

  const handleNext = () => {
    setShowQuiz(true);
  };

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      setShowQuiz(false);
    }
  };

  const handleQuizComplete = (passed, results) => {
    setQuizResults({ ...quizResults, [currentSection]: results });

    if (passed) {
      // Mark section as completed
      if (!completedSections.includes(currentSection)) {
        setCompletedSections([...completedSections, currentSection]);
      }

      // Move to next section or complete
      if (currentSection < 6) {
        setCurrentSection(currentSection + 1);
        setShowQuiz(false);
      } else {
        // All sections completed!
        if (onComplete) {
          onComplete();
        }
      }
    } else {
      // Failed quiz - show review option
      setShowQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setShowQuiz(true);
  };

  return (
    <div className="module01-landing">
      {/* Header */}
      <header className="module01-header">
        <div className="header-content">
          <h1>Understanding Risk for Decision-Making in Tanzania</h1>
          <p className="subtitle">INFORM Framework - Educational Module</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-tracker">
          {SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className={`progress-step ${
                currentSection === section.id ? 'current' :
                completedSections.includes(section.id) ? 'completed' :
                'pending'
              }`}
            >
              <div className="step-circle">
                {completedSections.includes(section.id) ? '✓' : section.id}
              </div>
              <div className="step-label">
                <div className="step-title">{section.title}</div>
                <div className="step-subtitle">{section.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${(completedSections.length / 6) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          Section {currentSection} of 6 • {completedSections.length} completed
        </div>
      </div>

      {/* Main Content */}
      <main className="module01-main">
        {!showQuiz ? (
          <div className="section-content">
            <CurrentSectionComponent />
          </div>
        ) : (
          <QuizComponent
            sectionId={currentSection}
            sectionTitle={SECTIONS[currentSection - 1].title}
            onComplete={handleQuizComplete}
          />
        )}
      </main>

      {/* Navigation */}
      <footer className="module01-footer">
        <button
          className="nav-button prev"
          onClick={handlePrevious}
          disabled={currentSection === 1}
        >
          ◄ Previous
        </button>

        {!showQuiz && !completedSections.includes(currentSection) && (
          <button
            className="nav-button quiz"
            onClick={handleNext}
          >
            Take Quiz
          </button>
        )}

        {!showQuiz && completedSections.includes(currentSection) && currentSection < 6 && (
          <button
            className="nav-button next"
            onClick={() => {
              setCurrentSection(currentSection + 1);
              setShowQuiz(false);
            }}
          >
            Next ►
          </button>
        )}

        {completedSections.length === 6 && (
          <button
            className="nav-button complete"
            onClick={onComplete}
          >
            Continue to INFORM Risk Module ►
          </button>
        )}
      </footer>

      {/* Important Notice */}
      <div className="important-notice">
        <div className="notice-icon">⚠️</div>
        <div className="notice-content">
          <strong>INFORM is a decision-support tool</strong> for humanitarian and development actors.
          <br />
          It requires proper training to interpret correctly. This module provides essential conceptual foundation.
        </div>
      </div>
    </div>
  );
}

export default Module01Landing;
