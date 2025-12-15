/**
 * Quiz Component for Module 01
 * One question per section, 83% pass threshold (5/6 correct)
 */

import React, { useState } from 'react';
import './QuizComponent.css';

const QUIZ_QUESTIONS = {
  1: {
    section: 'Hazard',
    question: 'According to INFORM, what is the key difference between a hazard and a disaster?',
    options: [
      'A hazard is natural, a disaster is human-made',
      'A hazard is a potential threat; a disaster occurs when it affects vulnerable populations',
      'A hazard is small-scale, a disaster is large-scale',
      'A hazard happens rarely, a disaster happens frequently'
    ],
    correct: 1,
    explanation: 'A hazard is just a potential threat (like heavy rainfall). It only becomes a disaster when it impacts exposed and vulnerable populations who cannot cope.'
  },
  2: {
    section: 'Exposure',
    question: 'What is the difference between absolute exposure and relative exposure?',
    options: [
      'Absolute is total population exposed; relative is the percentage of total population exposed',
      'Absolute is for urban areas; relative is for rural areas',
      'Absolute measures hazard intensity; relative measures population density',
      'There is no difference; they mean the same thing'
    ],
    correct: 0,
    explanation: 'Absolute exposure counts the total number of people exposed (e.g., 500,000 people). Relative exposure shows what percentage of the total population is exposed (e.g., 8.5%).'
  },
  3: {
    section: 'Sensitivity',
    question: 'Why do two districts with the same hazard exposure sometimes experience very different outcomes?',
    options: [
      'One district has a larger population',
      'Different sensitivity factors like housing quality, health infrastructure, and economic conditions',
      'One district is closer to the capital city',
      'Random chance and luck'
    ],
    correct: 1,
    explanation: 'Sensitivity factors determine how severely a hazard impacts people. Poor housing, weak health systems, inadequate infrastructure, and economic fragility increase sensitivity to harm.'
  },
  4: {
    section: 'Vulnerability',
    question: 'In the INFORM framework, vulnerability has two main components. What are they?',
    options: [
      'Natural hazards and human hazards',
      'Socio-economic vulnerability and vulnerable groups',
      'Urban vulnerability and rural vulnerability',
      'Short-term vulnerability and long-term vulnerability'
    ],
    correct: 1,
    explanation: 'INFORM measures vulnerability through: (1) Socio-economic conditions (poverty, malnutrition, lack of access to services) and (2) Vulnerable groups (children, elderly, persons with disabilities, displaced populations).'
  },
  5: {
    section: 'Coping Capacity',
    question: 'What are the three phases of disaster management covered in the Lack of Coping Capacity dimension?',
    options: [
      'Warning, Evacuation, Recovery',
      'Prepare, Respond, Recover',
      'Prevention, Mitigation, Adaptation',
      'Risk Assessment, Early Warning, Relief'
    ],
    correct: 1,
    explanation: 'INFORM\'s Lack of Coping Capacity assesses a country\'s ability to: (1) Prepare before disasters, (2) Respond during emergencies, and (3) Recover after events. Lower capacity means higher risk.'
  },
  6: {
    section: 'Risk',
    question: 'Why does INFORM use a geometric mean instead of an arithmetic mean in the risk formula?',
    options: [
      'Geometric mean is easier to calculate',
      'Geometric mean ensures all three dimensions (H and E, V, LCC) must be addressed; weakness in any dimension significantly affects overall risk',
      'Geometric mean produces lower risk scores',
      'Geometric mean is the international standard for all risk calculations'
    ],
    correct: 1,
    explanation: 'Geometric mean prevents "compensation" - you can\'t offset very high vulnerability with low hazard. All three dimensions matter equally. A weakness in any dimension significantly lowers the overall score, encouraging balanced risk reduction.'
  }
};

function QuizComponent({ sectionId, sectionTitle, onComplete }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = QUIZ_QUESTIONS[sectionId];

  const handleSubmit = () => {
    setShowResult(true);
    setShowExplanation(true);
  };

  const handleContinue = () => {
    const isCorrect = selectedAnswer === question.correct;
    onComplete(isCorrect, {
      question: question.question,
      selectedAnswer: selectedAnswer,
      correctAnswer: question.correct,
      isCorrect: isCorrect
    });
  };

  const isCorrect = selectedAnswer === question.correct;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>Section {sectionId} Quiz: {question.section}</h2>
        <p className="quiz-instruction">
          {!showResult
            ? 'Select the best answer and click Submit'
            : isCorrect
              ? '✅ Correct! You may proceed to the next section.'
              : '❌ Incorrect. Please review the explanation and try again.'}
        </p>
      </div>

      <div className="quiz-content">
        <div className="quiz-question">
          <p>{question.question}</p>
        </div>

        <div className="quiz-options">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`quiz-option ${
                selectedAnswer === index ? 'selected' : ''
              } ${
                showResult && index === question.correct ? 'correct' : ''
              } ${
                showResult && selectedAnswer === index && index !== question.correct ? 'incorrect' : ''
              }`}
              onClick={() => !showResult && setSelectedAnswer(index)}
              disabled={showResult}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
              {showResult && index === question.correct && (
                <span className="option-indicator">✓</span>
              )}
              {showResult && selectedAnswer === index && index !== question.correct && (
                <span className="option-indicator">✗</span>
              )}
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className={`quiz-explanation ${isCorrect ? 'correct-box' : 'incorrect-box'}`}>
            <div className="explanation-title">
              {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            <div className="explanation-text">
              {question.explanation}
            </div>
          </div>
        )}
      </div>

      <div className="quiz-footer">
        {!showResult ? (
          <button
            className="quiz-submit-btn"
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
          >
            Submit Answer
          </button>
        ) : (
          <button
            className={`quiz-continue-btn ${isCorrect ? 'success' : 'retry'}`}
            onClick={handleContinue}
          >
            {isCorrect ? 'Continue to Next Section ►' : '◄ Review Section & Retry'}
          </button>
        )}
      </div>
    </div>
  );
}

export default QuizComponent;
