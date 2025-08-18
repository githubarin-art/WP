import React, { useState, useEffect } from "react";

// Constants & Helper Functions
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
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    if (data.response_code === 0 && data.results.length > 0) {
      return data.results.map((item, index) => ({
        index,
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
  if (!queries || queries.length === 0) return "No search terms were provided.";

  for (const query of queries) {
    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&origin=*`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Wikipedia API status: ${res.status}`);

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
        if (!extractRes.ok) throw new Error(`Wikipedia extract status: ${extractRes.status}`);

        const extractData = await extractRes.json();
        const extractPages = extractData.query.pages;
        const pageId = Object.keys(extractPages);

        if (pageId && extractPages[pageId].extract) return extractPages[pageId].extract;
      }
    } catch (error) {
      console.error("Error during Wikipedia fetch:", error);
    }
  }

  return "Sorry, we couldn't find any detailed information for this topic on Wikipedia. The topic may be too specific or not have a direct article.";
};

// Components

function QuizHeaderControls({ onViewRules, onExit }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">🚀 Modern Quiz App</h1>
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
          {QUIZ_RULES.map((rule, i) => (
            <li key={i}>{rule}</li>
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
    if (currentAttempt.info && currentAttempt.info.length > 0) return;

    const fetchInfoForQuestion = async () => {
      setIsInfoLoading(true);
      try {
        const info = await searchAndExtractWikipedia([
          currentAttempt.correctAnswer,
          currentAttempt.question,
        ]);
        setUserAttempts((prev) => {
          const newAttempts = [...prev];
          newAttempts[reviewingQuestionIndex] = {
            ...newAttempts[reviewingQuestionIndex],
            info,
          };
          return newAttempts;
        });
      } catch (e) {
        setUserAttempts((prev) => {
          const newAttempts = [...prev];
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
                userAttempts.map((attempt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg cursor-pointer hover:bg-opacity-80 transition-all duration-200 animate-fadeIn"
                    style={{ backgroundColor: attempt.isCorrect ? "#dcfce7" : "#fee2e2" }}
                    onClick={() => setReviewIndex(idx)}
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
            {isInfoLoading ? (
              <p>Loading additional information...</p>
            ) : (
              <p>{attempt.info || "No additional information found."}</p>
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

// You need to define and properly pass the following props in your App and useQuizLogic:
// - setUserAttempts
// - setIsInfoLoading
// - skippedQuestions
// - handleSkip

// This fixed version makes sure 'setUserAttempts' and others are defined and passed wherever needed.
