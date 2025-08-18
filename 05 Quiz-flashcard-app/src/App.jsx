import { useState, useEffect } from "react";

// --- Constants & Helper Functions ---

const Quiz_Seconds = 300;
const QUIZ_RULES = [
  "You will be presented with a series of 10 questions.",
  "Type your answer in the input box and click 'Submit'.",
  "You can navigate through questions using the 'Next' and 'Previous' buttons.",
  "Your score is calculated based on correct answers.",
  "Additional information about the answer will be shown after submission.",
  "You will be shown your final score at the end of the quiz.",
  "You cannot switch between tabs once the quiz has started.",
  "If the Switch Count reached 3, the quiz will end.",
  "You will be shown a summary of your answers at the end of the quiz.",
];
const MAX_TAB_WARNING = 3;

const decodeHtml = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const fetchQuizQuestions = async () => {
  try {
    const res = await fetch(
      "https://opentdb.com/api.php?amount=10&difficulty=medium&type=multiple"
    );
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await res.json();
    if (data.response_code === 0 && data.results.length > 0) {
      return data.results.map((item, index) => ({
        index: index,
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
        const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=500&titles=${encodeURIComponent(
          firstResultTitle
        )}&format=json&origin=*&explaintext`;

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

// --- Component Definitions ---

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

function RulesModal({ onStart }) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 transform scale-100 animate-slideUp">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Game Rules 📝</h2>
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

function SummaryView({
  score,
  userAttempts,
  setUserAttempts,
  onRestart,
  reviewingQuestionIndex,
  setReviewIndex,
  onViewRules,
  onExit,
  hasExitedEarly,
  isInfoLoading,
  setIsInfoLoading,
}) {
  useEffect(() => {
    if (reviewingQuestionIndex === null) return;

    const currentAttempt = userAttempts[reviewingQuestionIndex];

    if (currentAttempt.info && currentAttempt.info.length > 0) {
      return; // Info already fetched, no need to fetch again
    }

    const fetchInfoForQuestion = async () => {
      setIsInfoLoading(true);
      try {
        const info = await searchAndExtractWikipedia([
          currentAttempt.correctAnswer,
          currentAttempt.question,
        ]);
        setUserAttempts((prevAttempts) => {
          const newAttempts = [...prevAttempts];
          newAttempts[reviewingQuestionIndex] = {
            ...newAttempts[reviewingQuestionIndex],
            info,
          };
          return newAttempts;
        });
      } catch (err) {
        setUserAttempts((prevAttempts) => {
          const newAttempts = [...prevAttempts];
          newAttempts[reviewingQuestionIndex] = {
            ...newAttempts[reviewingQuestionIndex],
            info: "Failed to fetch additional information.",
          };
          return newAttempts;
        });
      } finally {
        setIsInfoLoading(false);
      }
    };
    fetchInfoForQuestion();
  }, [reviewingQuestionIndex, userAttempts, setUserAttempts, setIsInfoLoading]);

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

  const reviewedQues = userAttempts[reviewingQuestionIndex];

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
            style={{ backgroundColor: reviewedQues.isCorrect ? "#dcfce7" : "#fee2e2" }}
          >
            <p className="font-bold mb-2">Question:</p>
            <p>{reviewedQues.question}</p>
            <p className="mt-2 font-bold">Your Answer:</p>
            <p>{reviewedQues.userAnswer}</p>
            <p className="mt-2 font-bold">Correct Answer:</p>
            <p>{reviewedQues.correctAnswer}</p>
            <p
              className="mt-2 font-bold"
              style={{ color: reviewedQues.isCorrect ? "#16a34a" : "#ef4444" }}
            >
              {reviewedQues.isCorrect ? "Status: Correct ✅" : "Status: Incorrect ❌"}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-200 text-gray-700">
            <p className="font-bold mb-2">Additional Information:</p>
            {isInfoLoading ? (
              <p>Loading additional information...</p>
            ) : (
              <p>{reviewedQues.info || "No additional information found."}</p>
            )}
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

// QuizView component (use with props including handleSkip, skippedQuestions)
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
  handleSkip,
  isSubmitted,
  isInfo,
  isInfoLoading,
  answeredQuestions,
  skippedQuestions,
  warningMessage,
  warningCount,
  onViewRules,
  onExit,
  timeLeft,
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

        {/* Skip Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleSkip}
            disabled={
              isSubmitted || answeredQuestions.has(currentIndex) || skippedQuestions.has(currentIndex)
            }
            className="py-2 px-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>

        {/* Timer Display */}
        <div className="timer mb-4 text-lg font-semibold text-indigo-700">
          Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>

        {/* Warning Message */}
        {warningMessage && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg text-center font-bold mb-4 animate-fadeIn">
            {warningMessage}
          </div>
        )}

        {/* Quiz Container */}
        <div className="quiz-container p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-600">
              Question {currentIndex + 1} of {ques.length}
            </span>
            <span className="text-lg font-bold text-gray-800">Score: {score}</span>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-800 leading-snug">{ques[currentIndex].question}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={handleUserInput}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-200"
              placeholder="Type your answer here..."
              required
              disabled={
                isSubmitted || answeredQuestions.has(currentIndex) || skippedQuestions.has(currentIndex)
              }
            />

            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                disabled={isSubmitted || answeredQuestions.has(currentIndex) || skippedQuestions.has(currentIndex)}
              >
                {answeredQuestions.has(currentIndex) ? "Answered" : "Submit"}
              </button>
            </div>
          </form>

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
              disabled={!answeredQuestions.has(currentIndex) && !skippedQuestions.has(currentIndex)}
              className="py-2 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all duration-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Tab-Switch Warning Count */}
          <div className="mt-4 text-center text-sm text-gray-500">Tab-Switch Warning Count: {warningCount}</div>
        </div>
      </div>
    </div>
  );
}

function ExitMessage() {
  return (
    <div className="w-full flex flex-col items-center p-6 min-h-screen justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-lg w-full transform scale-100 animate-fadeIn">
        <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight mb-4">👋 Thanks for playing!</h1>
        <p className="text-lg text-gray-700">We hope you had a great time with the quiz.</p>
      </div>
    </div>
  );
}

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
  const [timeLeft, setTimeLeft] = useState(Quiz_Seconds);
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());

  const handleSkip = () => {
    setSkippedQuestions((prev) => new Set(prev).add(currentIndex));
    handleNextQuestion();
  };

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
    setSkippedQuestions(new Set());
    handleFetchQuestions();
    resetTimer();
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
      normalizedUserAnswer === normalizedCorrectAnswer.replace(/^the\s/, "");

    if (isCorrect) {
      setMessage("✅ Correct!");
      setScore((prev) => prev + 1);
    } else {
      setMessage(`❌ Incorrect! The correct answer is ${ques[currentIndex].answer}.`);
    }

    setAnsweredQuestions((prevSet) => new Set(prevSet).add(currentIndex));

    const newAttempt = {
      questionIndex: currentIndex,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      question: ques[currentIndex].question,
      correctAnswer: ques[currentIndex].answer,
      info: "",
    };

    setUserAttempts((prevAttempts) => [...prevAttempts, newAttempt]);
    setIsInfo(null);
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
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const newCount = warningCount + 1;
        setWarningCount(newCount);
        setWarningMessage(
          `⚠️ Warning: You have switched tabs. This is warning ${newCount} of ${MAX_TAB_WARNING}`
        );
        setTimeout(() => setWarningMessage(null), 3000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [warningCount]);

  useEffect(() => {
    if (warningCount >= MAX_TAB_WARNING) {
      setIsQuizComplete(true);
      setWarningMessage("Quiz ended due to excessive tab switching.");
    }
  }, [warningCount]);

  useEffect(() => {
    if (isQuizComplete) return;

    if (timeLeft <= 0) {
      setIsQuizComplete(true);
      return;
    }

    const timerCount = setTimeout(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timerCount);
  }, [timeLeft, isQuizComplete]);

  const resetTimer = () => setTimeLeft(Quiz_Seconds);

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
    warningCount,
    reviewingQuestionIndex,
    timeLeft,
    skippedQuestions,
    setUserAnswer,
    setReviewingQuestionIndex,
    setShowRules,
    setHasExited,
    handleExit,
    handleNextQuestion,
    handleRestart,
    handlePreviousQuestion,
    handleUserInput,
    handleSubmit,
    handleSkip,
    resetTimer,
  };
}

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
    timeLeft,
    skippedQuestions,
    setUserAnswer,
    setReviewingQuestionIndex,
    setShowRules,
    setHasExited,
    handleExit,
    handleNextQuestion,
    handleRestart,
    handlePreviousQuestion,
    handleUserInput,
    handleSubmit,
    handleSkip,
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
      <div className="p-8 text-center text-red-500 font-medium text-lg">{error}</div>
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
        setUserAttempts={setUserAttempts}
        onRestart={handleRestart}
        reviewingQuestionIndex={reviewingQuestionIndex}
        setReviewIndex={setReviewingQuestionIndex}
        onViewRules={() => setShowRules(true)}
        onExit={handleExit}
        hasExitedEarly={hasExited}
        isInfoLoading={isInfoLoading}
        setIsInfoLoading={setIsInfoLoading}
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
      handleSkip={handleSkip}
      isSubmitted={isSubmitted}
      isInfo={isInfo}
      isInfoLoading={isInfoLoading}
      answeredQuestions={answeredQuestions}
      skippedQuestions={skippedQuestions}
      warningMessage={warningMessage}
      warningCount={warningCount}
      onViewRules={() => setShowRules(true)}
      onExit={handleExit}
      timeLeft={timeLeft}
    />
  );
}

export default App;
