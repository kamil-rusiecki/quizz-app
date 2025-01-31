import React, { useState, useEffect, useRef } from 'react';
import './QuizManager.css';

const QuizManager = () => {
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('quizQuestions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
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
      console.log('Importowane pytania:', imported);

      if (!Array.isArray(imported)) {
        throw new Error('Dane muszą zawierać tablicę pytań');
      }

      imported.forEach((q, index) => {
        console.log(`Sprawdzanie pytania ${index + 1}:`, q);
        if (!q.question) {
          throw new Error(`Pytanie ${index + 1} nie ma treści`);
        }
        if (!Array.isArray(q.options)) {
          throw new Error(`Pytanie ${index + 1} nie ma tablicy opcji`);
        }
        if (q.options.length < 2 || q.options.length > 6) {
          throw new Error(`Pytanie ${index + 1} musi mieć od 2 do 6 opcji odpowiedzi`);
        }
        if (typeof q.correct !== 'number') {
          throw new Error(`Pytanie ${index + 1} musi mieć numeryczny indeks poprawnej odpowiedzi`);
        }
        if (q.correct < 0 || q.correct >= q.options.length) {
          throw new Error(`Pytanie ${index + 1} ma nieprawidłowy indeks poprawnej odpowiedzi`);
        }
        if (!q.explanation) {
          throw new Error(`Pytanie ${index + 1} nie ma wyjaśnienia`);
        }
      });

      setQuestions(prev => [...prev, ...imported]);
      setImportError('');
      setJsonInput('');
      setShowJsonInput(false);
    } catch (error) {
      console.error('Błąd walidacji:', error);
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

  const handleOptionAdd = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleOptionRemove = (indexToRemove) => {
    if (options.length > 2) {
      setOptions(options.filter((_, index) => index !== indexToRemove));
      if (correctAnswer >= options.length - 1) {
        setCorrectAnswer(0);
      }
    }
  };

  const addQuestion = () => {
    if (!currentQuestion || options.some(opt => !opt) || !explanation) {
      alert('Proszę wypełnić wszystkie pola!');
      return;
    }

    const newQuestion = {
      question: currentQuestion,
      options: options.filter(opt => opt.trim() !== ''),
      correct: correctAnswer,
      explanation
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion('');
    setOptions(['', '', '']);
    setExplanation('');
    setCorrectAnswer(0);
  };

  const handleAnswer = (questionIndex, selectedIndex) => {
    if (answeredQuestions.has(questionIndex)) return;

    const newAnswered = new Set(answeredQuestions);
    newAnswered.add(questionIndex);
    setAnsweredQuestions(newAnswered);

    if (selectedIndex === questions[questionIndex].correct) {
      setCurrentScore(score => score + 1);
    }
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
            placeholder='[{"question": "Treść pytania","options": ["Odpowiedź A", "Odpowiedź B", "Odpowiedź C"],"correct": 0,"explanation": "Wyjaśnienie odpowiedzi"}]'
          />
          <button className="button" onClick={handleJsonImport}>
            Importuj z JSON
          </button>
          {importError && (
            <div className="error-message">{importError}</div>
          )}
        </div>
      )}

      {!isQuizMode ? (
        <div className="question-form">
          <textarea
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Wpisz pytanie"
            className="input"
          />

          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-input-group">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder={`Odpowiedź ${String.fromCharCode(65 + index)}`}
                  className="input"
                />
                {options.length > 2 && (
                  <button
                    className="button remove-option"
                    onClick={() => handleOptionRemove(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                className="button add-option"
                onClick={handleOptionAdd}
              >
                Dodaj opcję
              </button>
            )}
          </div>

          <div className="correct-answer">
            <label>Poprawna odpowiedź:</label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(Number(e.target.value))}
              className="select"
            >
              {options.map((_, index) => (
                <option key={index} value={index}>
                  {String.fromCharCode(65 + index)}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Wpisz wyjaśnienie"
            className="input"
          />

          <button onClick={addQuestion} className="button">
            Dodaj pytanie
          </button>
        </div>
      ) : (
        <div className="quiz-mode">
          <div className="score">
            Wynik: {currentScore} / {questions.length}
          </div>
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question">
              <div className="question-text">
                {qIndex + 1}. {q.question}
              </div>
              <div className="options">
                {q.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`option ${answeredQuestions.has(qIndex)
                        ? optIndex === q.correct
                          ? 'correct'
                          : optIndex === q.correct
                            ? 'correct'
                            : 'incorrect'
                        : ''
                      }`}
                    onClick={() => {
                      if (!answeredQuestions.has(qIndex)) {
                        handleAnswer(qIndex, optIndex);
                      }
                    }}
                  >
                    {String.fromCharCode(65 + optIndex)}) {option}
                  </div>
                ))}
              </div>
              {answeredQuestions.has(qIndex) && (
                <div className="explanation">
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizManager;