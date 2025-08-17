import { useState, useEffect, useRef } from "react";

// This is a single-file simulation of a modular React app.
// In a real project, these components would live in their own files:
//
// src/components/QuizHeaderControls.js
// src/components/RulesModal.js
// src/components/SummaryView.js
// src/components/QuizView.js
// src/components/ExitMessage.js
// src/hooks/useQuizLogic.js
// src/utils/api.js

// --- Constants & Helper Functions (src/utils/constants.js & src/utils/helpers.js) ---

const QUIZ_RULES = [
  "You will be presented with a series of 10 questions.",
  "Type your answer in the input box and click 'Submit'.",
  "You can navigate through questions using the 'Next' and 'Previous' buttons.",
  "Your score is calculated based on correct answers.",
  "Additional information about the answer will be shown after submission.",
  "You Cannot go back to a question once you have submitted it.",
  "You will be shown your final score at the end of the quiz.",
  "You cannot switch between tabs once the quiz has started.",
  "If the Switch Count reached 3 , the quiz will end.",
  "You will be shown a summary of your answers at the end of the quiz.",
];
const MAX_TAB_WARNING = 3;

// Helper function to decode HTML entities from API
const decodeHtml = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

// Fetches new quiz questions from the API
const fetchQuizQuestions = async () => {
  try {
    const res = await fetch("https://opentdb.com/api.php?amount=10&difficulty=medium&type=multiple");
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await res.json();
    if (data.response_code === 0 && data.results.length > 0) {
      return data.results.map((item, index) => ({
        index: index, // 0-based index for easy array access
        question: decodeHtml(item.question),
        answer: decodeHtml(item.correct_answer),
      }));
    } else {
      throw new Error("API returned no questions or an error code.");
    }
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    throw error;
  }
};

// New and improved info fetching logic with multiple attempts
const searchAndExtractWikipedia = async (queries) => {
  if (!queries || queries.length === 0) {
    return "No search terms were provided.";
  }

  for (const query of queries) {
    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&origin=*`;
      
      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`Wikipedia search API responded with status: ${res.status}`);
      }
      
      const data = await res.json();

      if (data.error) {
        console.error("Wikipedia API error:", data.error.info);
        throw new Error("Wikipedia API error.");
      }

      if (data.query.search.length > 0) {
        const firstResultTitle = data.query.search[0].title;
        const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=500&titles=${encodeURIComponent(firstResultTitle)}&format=json&origin=*&explaintext`;

        const extractRes = await fetch(extractUrl);
        if (!extractRes.ok) {
          throw new Error(`Wikipedia extract API responded with status: ${extractRes.status}`);
        }

        const extractData = await extractRes.json();
        const extractPages = extractData.query.pages;
        const pageId = Object.keys(extractPages)[0];

        if (pageId && extractPages[pageId].extract) {
          return extractPages[pageId].extract;
        }
      }
    } catch (error) {
      console.error("Error during Wikipedia fetch:", error);
    }
  }

  return "Sorry, we couldn't find any detailed information for this topic on Wikipedia. The topic may be too specific or not have a direct article.";
};


// --- Component Definitions (src/components/...) ---

/**
 * Renders the header with quiz title and control buttons.
 */
function QuizHeaderControls({ onViewRules, onExit }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">
        🚀 Modern Quiz App
      </h1>
      <div className="flex space-x-2">
        <button
          onClick={onViewRules}
          className="py-2 px-4 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium transition-all duration-200"
        >
          View Rules
        </button>
        <button
          onClick={onExit}
          className="py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200"
        >
          Exit Quiz
        </button>
      </div>
    </div>
  );
}

/**
 * Renders the initial modal with quiz rules.
 */
function RulesModal({ onStart }) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 transform scale-100 animate-slideUp">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Game Rules 📝
        </h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          {QUIZ_RULES.map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
        <button
          onClick={onStart}
          className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
        >
          Start Quiz!
        </button>
      </div>
    </div>
  );
}

/**
 * Renders the final quiz summary or a detailed question review.
 */
function SummaryView({ score, userAttempts, onRestart, reviewingQuestionIndex, setReviewIndex, onViewRules, onExit, hasExitedEarly }) {
  // Conditional rendering: Show summary list or single question review
  if (reviewingQuestionIndex === null) {
    return (
      <div className="w-full flex flex-col items-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl border border-gray-100">
          <QuizHeaderControls onViewRules={onViewRules} onExit={onExit} />
          <div className="summary-box p-6 bg-white rounded-lg shadow-md animate-fadeIn">
            <h2 className="text-2xl font-bold text-center mb-4">
              {hasExitedEarly ? "Quiz Ended Early" : "Quiz Complete!"}
            </h2>
            <p className="text-xl font-semibold text-center mb-6">
              Your final score: {score} out of {userAttempts.length}
            </p>
            <div className="space-y-4">
              {userAttempts.length > 0 ? (
                userAttempts.map((attempt, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg cursor-pointer hover:bg-opacity-80 transition-all duration-200 animate-fadeIn"
                    style={{ backgroundColor: attempt.isCorrect ? "#dcfce7" : "#fee2e2" }}
                    onClick={() => setReviewIndex(index)}
                  >
                    <p className="font-bold">Question {attempt.questionIndex + 1}:</p>
                    <p>{attempt.question}</p>
                    <p className="mt-2">
                      Your Answer: <span className="font-medium">{attempt.userAnswer}</span>
                    </p>
                    <p className="mt-1">
                      Correct Answer: <span className="font-medium">{attempt.correctAnswer}</span>
                    </p>
                    <p
                      className="mt-2 font-bold"
                      style={{ color: attempt.isCorrect ? "#16a34a" : "#ef4444" }}
                    >
                      {attempt.isCorrect ? "Correct ✅" : "Incorrect ❌"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">You didn't answer any questions.</p>
              )}
            </div>
            <div className="text-center mt-6">
              <button
                onClick={onRestart}
                className="py-2 px-5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all"
              >
                Restart Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single Question Review View
  const attempt = userAttempts[reviewingQuestionIndex];
  return (
    <div className="w-full flex flex-col items-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl border border-gray-100">
        <QuizHeaderControls onViewRules={onViewRules} onExit={onExit} />
        <div className="single-review-box p-6 bg-white rounded-lg shadow-md animate-fadeIn">
          <h2 className="text-2xl font-bold text-center mb-4">
            Question {reviewingQuestionIndex + 1} Review
          </h2>
          <div
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: attempt.isCorrect ? "#dcfce7" : "#fee2e2" }}
          >
            <p className="font-bold mb-2">Question:</p>
            <p>{attempt.question}</p>
            <p className="mt-2 font-bold">Your Answer:</p>
            <p>{attempt.userAnswer}</p>
            <p className="mt-2 font-bold">Correct Answer:</p>
            <p>{attempt.correctAnswer}</p>
            <p
              className="mt-2 font-bold"
              style={{ color: attempt.isCorrect ? "#16a34a" : "#ef4444" }}
            >
              {attempt.isCorrect ? "Status: Correct ✅" : "Status: Incorrect ❌"}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-200 text-gray-700">
            <p className="font-bold mb-2">Additional Information:</p>
            <p>{attempt.info}</p>
          </div>
          <div className="text-center mt-6">
            <button
              onClick={() => setReviewIndex(null)}
              className="py-2 px-5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all"
            >
              Back to Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Renders the main quiz interface.
 */
function QuizView({
  isWinner,
  ques,
  currentIndex,
  score,
  message,
  userAnswer,
  handleSubmit,
  handleUserInput,
  handleNextQuestion,
  handlePreviousQuestion,
  isSubmitted,
  isInfo,
  isInfoLoading,
  answeredQuestions,
  warningMessage,
  warningCount,
  onViewRules,
  onExit,
}) {
  return (
    <div className="w-full flex flex-col items-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl border border-gray-100">
        <QuizHeaderControls onViewRules={onViewRules} onExit={onExit} />
        {isWinner && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center font-bold mb-4 animate-fadeIn">
            🏆 Congratulations! You are a quiz master!
          </div>
        )}
        {warningMessage && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg text-center font-bold mb-4 animate-fadeIn">
            {warningMessage}
          </div>
        )}
        <div className="quiz-container p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-600">
              Question {currentIndex + 1} of {ques.length}
            </span>
            <span className="text-lg font-bold text-gray-800">
              Score: {score}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 leading-snug">
            {ques[currentIndex].question}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={handleUserInput}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-200"
              placeholder="Type your answer here..."
              required
              disabled={isSubmitted || answeredQuestions.has(currentIndex)}
            />
            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                disabled={isSubmitted || answeredQuestions.has(currentIndex)}
              >
                {answeredQuestions.has(currentIndex) ? "Answered" : "Submit"}
              </button>
            </div>
          </form>

          {isSubmitted && (
            <div className="mt-6">
              <p className={`text-lg font-bold text-center ${message.startsWith("✅") ? "text-green-600 animate-slideDown" : "text-red-600 animate-slideDown"}`}>
                {message}
              </p>
              {isInfoLoading ? (
                <div className="mt-4 text-center text-gray-500 animate-pulse">
                  Loading additional info...
                </div>
              ) : (
                isInfo && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-sm text-gray-700">
                    <p className="font-semibold mb-2">Additional Info:</p>
                    <p>{isInfo}</p>
                  </div>
                )
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentIndex === 0}
              className="py-2 px-4 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium transition-all duration-200 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={!answeredQuestions.has(currentIndex)}
              className="py-2 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all duration-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          {/* This is a visual aid to show the warning count */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Tab-Switch Warning Count: {warningCount}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a simple message when the user exits the quiz.
 */
function ExitMessage() {
  return (
    <div className="w-full flex flex-col items-center p-6 min-h-screen justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-lg w-full transform scale-100 animate-fadeIn">
        <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight mb-4">
          👋 Thanks for playing!
        </h1>
        <p className="text-lg text-gray-700">
          We hope you had a great time with the quiz.
        </p>
      </div>
    </div>
  );
}

// --- Custom Hook (src/hooks/useQuizLogic.js) ---
/**
 * A custom hook to encapsulate all quiz logic and state management.
 */
function useQuizLogic() {
  const [score, setScore] = useState(0);
  const [ques, setQues] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [userAttempts, setUserAttempts] = useState([]);
  const [isWinner, setIsWinner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [isInfo, setIsInfo] = useState(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [hasExited, setHasExited] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [warningCount, setWarningCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState(null);
  const [reviewingQuestionIndex, setReviewingQuestionIndex] = useState(null);

  const handleFetchQuestions = async () => {
    try {
      setLoading(true);
      const newQuestions = await fetchQuizQuestions();
      setQues(newQuestions);
      setError(null);
    } catch (err) {
      setError("Failed to load quiz questions.");
      console.error("Error fetching quiz questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    setIsQuizComplete(true);
    setHasExited(true);
  };

  const handleNextQuestion = () => {
    resetForNewQuestion();
    if (currentIndex === ques.length - 1) {
      setIsQuizComplete(true);
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentIndex(0);
    setUserAnswer("");
    setIsSubmitted(false);
    setIsWinner(false);
    setMessage("");
    setIsInfo(null);
    setIsInfoLoading(false);
    setIsQuizComplete(false);
    setUserAttempts([]);
    setShowRules(true);
    setAnsweredQuestions(new Set());
    setWarningCount(0);
    setWarningMessage(null);
    setReviewingQuestionIndex(null);
    setHasExited(false);
    handleFetchQuestions();
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
      resetForNewQuestion();
    }
  };

  const resetForNewQuestion = () => {
    setUserAnswer("");
    setIsSubmitted(false);
    setMessage("");
    setIsInfo(null);
  };

  const fetchWikipediaInfo = async (answer, question) => {
    setIsInfoLoading(true);
    const queriesToTry = [answer, question];
    const infoText = await searchAndExtractWikipedia(queriesToTry);
    setIsInfoLoading(false);
    return infoText;
  };

  const handleUserInput = (event) => {
    setUserAnswer(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (answeredQuestions.has(currentIndex)) {
      setMessage("You have already answered this question!");
      return;
    }

    setIsSubmitted(true);
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = ques[currentIndex].answer.toLowerCase();

    const isCorrect =
      normalizedUserAnswer === normalizedCorrectAnswer ||
      normalizedUserAnswer === normalizedCorrectAnswer.replace(/^the\s/, '');

    let infoText = "";
    if (isCorrect) {
      setMessage("✅ Correct!");
      setScore((prev) => prev + 1);
      infoText = await fetchWikipediaInfo(ques[currentIndex].answer, ques[currentIndex].question);
    } else {
      setMessage(
        `❌ Incorrect! The correct answer is ${ques[currentIndex].answer}.`
      );
      infoText = await fetchWikipediaInfo(ques[currentIndex].answer, ques[currentIndex].question);
    }
    
    // This line was moved here. It will now run after every submission.
    setAnsweredQuestions(prevSet => new Set(prevSet.add(currentIndex)));

    const newAttempt = {
      questionIndex: currentIndex,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      question: ques[currentIndex].question,
      correctAnswer: ques[currentIndex].answer,
      info: infoText
    };

    setUserAttempts((prevAttempts) => [...prevAttempts, newAttempt]);
    setIsInfo(infoText);
  };

  useEffect(() => {
    handleFetchQuestions();
  }, []);

  useEffect(() => {
    if (score === 10 && ques.length === 10) {
      setIsWinner(true);
    }
  }, [score, ques]);

  useEffect(() => {
    // This is the event listener that checks for tab switching.
    // In the preview environment, which uses an iframe, this may not fire as expected.
    // For a real app, this logic is perfectly sound.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const newCount = warningCount + 1;
        setWarningCount(newCount);
        setWarningMessage(`⚠️ Warning: You have switched tabs. This is warning ${newCount} of ${MAX_TAB_WARNING}`);
        setTimeout(() => setWarningMessage(null), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [warningCount]);

  useEffect(() => {
    if (warningCount >= MAX_TAB_WARNING) {
      setIsQuizComplete(true);
      setWarningMessage("Quiz ended due to excessive tab switching.");
    }
  }, [warningCount]);

  return {
    score,
    ques,
    userAnswer,
    currentIndex,
    isSubmitted,
    isQuizComplete,
    userAttempts,
    isWinner,
    loading,
    error,
    message,
    isInfo,
    isInfoLoading,
    showRules,
    hasExited,
    answeredQuestions,
    warningMessage,
    warningCount, // Pass the count to QuizView for debugging
    reviewingQuestionIndex,
    setUserAnswer,
    setReviewingQuestionIndex,
    setShowRules,
    setHasExited,
    handleExit,
    handleNextQuestion,
    handleRestart,
    handlePreviousQuestion,
    handleUserInput,
    handleSubmit
  };
}

// Main App component (src/App.js)
function App() {
  const {
    score,
    ques,
    userAnswer,
    currentIndex,
    isSubmitted,
    isQuizComplete,
    userAttempts,
    isWinner,
    loading,
    error,
    message,
    isInfo,
    isInfoLoading,
    showRules,
    hasExited,
    answeredQuestions,
    warningMessage,
    warningCount,
    reviewingQuestionIndex,
    setUserAnswer,
    setReviewingQuestionIndex,
    setShowRules,
    setHasExited,
    handleExit,
    handleNextQuestion,
    handleRestart,
    handlePreviousQuestion,
    handleUserInput,
    handleSubmit
  } = useQuizLogic();

  if (loading) {
    return (
      <div className="p-8 text-center text-2xl font-semibold text-gray-700 animate-pulse">
        Loading questions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-medium text-lg">
        {error}
      </div>
    );
  }

  if (hasExited) {
    return <ExitMessage />;
  }

  if (showRules) {
    return <RulesModal onStart={() => setShowRules(false)} />;
  }

  if (isQuizComplete) {
    return (
      <SummaryView
        score={score}
        userAttempts={userAttempts}
        onRestart={handleRestart}
        reviewingQuestionIndex={reviewingQuestionIndex}
        setReviewIndex={setReviewingQuestionIndex}
        onViewRules={() => setShowRules(true)}
        onExit={handleExit}
        hasExitedEarly={hasExited}
      />
    );
  }

  return (
    <QuizView
      isWinner={isWinner}
      ques={ques}
      currentIndex={currentIndex}
      score={score}
      message={message}
      userAnswer={userAnswer}
      handleSubmit={handleSubmit}
      handleUserInput={handleUserInput}
      handleNextQuestion={handleNextQuestion}
      handlePreviousQuestion={handlePreviousQuestion}
      isSubmitted={isSubmitted}
      isInfo={isInfo}
      isInfoLoading={isInfoLoading}
      answeredQuestions={answeredQuestions}
      warningMessage={warningMessage}
      warningCount={warningCount}
      onViewRules={() => setShowRules(true)}
      onExit={handleExit}
    />
  );
}

export default App;
