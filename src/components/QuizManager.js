// src/components/QuizManager.js
import React, { useState, useEffect, useRef } from 'react';
import './QuizManager.css';

const QuizManager = () => {
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('quizQuestions');
    return saved ? JSON.parse(saved) : [];
  });
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [importError, setImportError] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  
  const fileInputRef = useRef();

  useEffect(() => {
    localStorage.setItem('quizQuestions', JSON.stringify(questions));
  }, [questions]);

  const validateAndImportQuestions = (questionsToImport) => {
    try {
      const imported = Array.isArray(questionsToImport) ? questionsToImport : JSON.parse(questionsToImport);
      if (!Array.isArray(imported)) {
        throw new Error('Dane muszą zawierać tablicę pytań');
      }
      
      const isValid = imported.every(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 3 &&
        typeof q.correct === 'number' && 
        q.correct >= 0 && 
        q.correct < 3 &&
        q.explanation
      );

      if (!isValid) {
        throw new Error('Nieprawidłowa struktura pytań');
      }

      setQuestions(prev => [...prev, ...imported]);
      setImportError('');
      setJsonInput('');
      setShowJsonInput(false);
    } catch (error) {
      setImportError('Błąd podczas importu: ' + error.message);
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      validateAndImportQuestions(e.target.result);
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleJsonImport = () => {
    validateAndImportQuestions(jsonInput);
  };

  const exportQuestions = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnswer = (questionIndex, selectedIndex, optionsDiv) => {
    if (answeredQuestions.has(questionIndex)) return;

    const newAnswered = new Set(answeredQuestions);
    newAnswered.add(questionIndex);
    setAnsweredQuestions(newAnswered);

    const question = questions[questionIndex];
    const feedback = optionsDiv.parentNode.querySelector('.feedback');
    const explanation = optionsDiv.parentNode.querySelector('.explanation');
    const options = optionsDiv.querySelectorAll('.option');
    
    options.forEach(opt => opt.classList.remove('selected'));
    options[selectedIndex].classList.add('selected');

    if (selectedIndex === question.correct) {
      setCurrentScore(score => score + 1);
      feedback.textContent = 'Prawidłowa odpowiedź!';
      feedback.className = 'feedback correct';
    } else {
      feedback.textContent = `Nieprawidłowa odpowiedź. Prawidłowa odpowiedź to: ${String.fromCharCode(97 + question.correct)}) ${question.options[question.correct]}`;
      feedback.className = 'feedback incorrect';
    }
    
    feedback.style.display = 'block';
    explanation.style.display = 'block';
    explanation.textContent = `Wyjaśnienie: ${question.explanation}`;
  };

  const resetQuiz = () => {
    setAnsweredQuestions(new Set());
    setCurrentScore(0);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="button-group">
          <button 
            className="button"
            onClick={() => {
              setIsQuizMode(!isQuizMode);
              if (!isQuizMode) resetQuiz();
            }}
          >
            {isQuizMode ? 'Przejdź do dodawania pytań' : 'Przejdź do testu'}
          </button>
          {!isQuizMode && (
            <>
              <button
                className="button"
                onClick={() => setShowJsonInput(!showJsonInput)}
              >
                {showJsonInput ? 'Ukryj import JSON' : 'Pokaż import JSON'}
              </button>
              <button
                className="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Import z pliku
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                style={{ display: 'none' }}
              />
              <button
                className="button"
                onClick={exportQuestions}
                disabled={questions.length === 0}
              >
                Eksportuj pytania
              </button>
            </>
          )}
        </div>
        {questions.length > 0 && (
          <div className="question-count">
            Liczba pytań: {questions.length}
          </div>
        )}
      </div>

      {!isQuizMode && showJsonInput && (
        <div className="import-section">
          <h3>Wklej JSON z pytaniami:</h3>
          <textarea
            className="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='[
  {
    "question": "Treść pytania",
    "options": ["Odpowiedź A", "Odpowiedź B", "Odpowiedź C"],
    "correct": 0,
    "explanation": "Wyjaśnienie odpowiedzi"
  }
]'
          />
          <button className="button" onClick={handleJsonImport}>
            Importuj z JSON
          </button>
          {importError && (
            <div className="error-message">{importError}</div>
          )}
        </div>
      )}

      {isQuizMode ? (
        <div className="quiz-container">
          <div className="score">
            Wynik: {currentScore} / {questions.length}
          </div>
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question">
              <div className="question-text">
                <strong>{qIndex + 1}. </strong>
                {q.question}
              </div>
              <div className="options">
                {q.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className="option"
                    onClick={(e) => handleAnswer(qIndex, optIndex, e.target.parentNode)}
                  >
                    {String.fromCharCode(97 + optIndex)}) {option}
                  </div>
                ))}
              </div>
              <div className="feedback"></div>
              <div className="explanation"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="question">
          <h3>Przykładowy format JSON:</h3>
          <pre className="json-example">
{`[
  {
    "question": "Treść pytania",
    "options": [
      "Odpowiedź A",
      "Odpowiedź B",
      "Odpowiedź C"
    ],
    "correct": 0,
    "explanation": "Wyjaśnienie odpowiedzi"
  }
]`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QuizManager;