import { useState, useEffect, useRef } from "react";

const QUIZ_RULES = [
  "You will be presented with a series of 10 questions.",
  "Type your answer in the input box and click 'Submit'.",
  "You can navigate through questions using the 'Next' and 'Previous' buttons.",
  "Your score is calculated based on correct answers.",
  "Additional information about the answer will be shown after submission.",
];

function App() {
  // State for quiz logic
  const [score, setScore] = useState(0);
  const [ques, setQues] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [userAttempts, setUserAttempts] = useState([]);
  const [isWinner, setIsWinner] = useState(false);

  // State for UI/API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [isInfo, setIsInfo] = useState(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [showRules, setshowRules] = useState(true);

  // Utility function to decode HTML entities from API
  const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  // Toggles the visibility of the rules pop-up
  const toggleRules = () => {
    setshowRules(!showRules);
  };

  // Fetches new quiz questions from the API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://opentdb.com/api.php?amount=10&difficulty=medium&type=multiple"
      );
      const data = await res.json();

      if (data.response_code === 0 && data.results.length > 0) {
        const formatted = data.results.map((item, index) => ({
          index: index + 1,
          question: decodeHtml(item.question),
          answer: decodeHtml(item.correct_answer),
        }));
        setQues(formatted);
        setError(null);
      } else {
        throw new Error("API returned no questions or an error code.");
      }
    } catch (err) {
      setError("Failed to load quiz questions.");
      console.error("Error fetching quiz questions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effects to run on component mount and score change
  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (score === 10 && ques.length === 10) {
      setIsWinner(true);
    }
  }, [score, ques]);

  // Handles moving to the next question
  const handleNextQuestion = () => {
    // Reset state for the new question
    resetForNewQuestion();
    if (currentIndex === ques.length - 1) {
      setIsQuizComplete(true);
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };
  
  // Resets the quiz to the initial state and fetches new questions
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
    setshowRules(true); // Show rules again on restart
    fetchQuestions();
  };

  // Handles moving to the previous question
  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
      // Optional: reset state for previous question, though not strictly needed for this app's logic
      resetForNewQuestion();
    }
  };

  // Resets the UI state for a new question
  const resetForNewQuestion = () => {
    setUserAnswer("");
    setIsSubmitted(false);
    setMessage("");
    setIsInfo(null);
  };

  // Fetches additional information from Wikipedia
  const fetchWikipediaInfo = async (query) => {
    setIsInfoLoading(true);
    setIsInfo(null);
    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&origin=*`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.query.search.length > 0) {
        const firstResultTitle = data.query.search[0].title;
        const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=500&titles=${encodeURIComponent(firstResultTitle)}&format=json&origin=*&explaintext`;

        const extractRes = await fetch(extractUrl);
        const extractData = await extractRes.json();
        const extractPages = extractData.query.pages;
        const pageId = Object.keys(extractPages)[0];

        if (pageId && extractPages[pageId].extract) {
          setIsInfo(extractPages[pageId].extract);
        } else {
          setIsInfo("No detailed information available on Wikipedia.");
        }
      } else {
        setIsInfo("No information available on Wikipedia.");
      }
    } catch (error) {
      console.error("Error in fetching data from Wikipedia:", error);
      setIsInfo("Failed to fetch data from Wikipedia.");
    } finally {
      setIsInfoLoading(false);
    }
  };

  // Handles the user's input change
  const handleUserInput = (event) => {
    setUserAnswer(event.target.value);
  };

  // Handles form submission and checks the answer
  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitted(true);
    const isCorrect = userAnswer.trim().toLowerCase() === ques[currentIndex].answer.toLowerCase();

    const newAttempt = {
      questionIndex: currentIndex,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      correct_answer: ques[currentIndex].answer,
    };

    setUserAttempts((prevAttempts) => [...prevAttempts, newAttempt]);
    
    if (isCorrect) {
      setMessage("✅ Correct!");
      setScore((prev) => prev + 1);
      fetchWikipediaInfo(ques[currentIndex].answer);
    } else {
      setMessage(
        `❌ Incorrect! The correct answer is ${ques[currentIndex].answer}.`
      );
      fetchWikipediaInfo(ques[currentIndex].question);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-8 text-center text-2xl font-semibold text-gray-700 animate-pulse">
        Loading questions...
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-medium text-lg">
        {error}
      </div>
    );
  }

  // Main application rendering
  return (
    // Step 1: Check if rules should be shown
    showRules ? (
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
            onClick={toggleRules}
            className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
          >
            Start Quiz!
          </button>
        </div>
      </div>
    ) : // Step 2: If rules are not shown, check if the quiz is complete
    isQuizComplete ? (
      <div className="w-full flex flex-col items-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl border border-gray-100">
          <h1 className="text-4xl font-extrabold text-center text-indigo-600 mb-6 tracking-tight">
            🚀 Modern Quiz App
          </h1>
          <div className="summary-box p-6 bg-white rounded-lg shadow-md animate-fadeIn">
            <h2 className="text-2xl font-bold text-center mb-4">Quiz Complete!</h2>
            <p className="text-xl font-semibold text-center mb-6">Your final score: {score} out of {ques.length}</p>
            <div className="space-y-4">
              {userAttempts.map((attempt, index) => (
                <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: attempt.isCorrect ? '#dcfce7' : '#fee2e2' }}>
                  <p className="font-bold">Question {attempt.questionIndex + 1}:</p>
                  <p>{ques[attempt.questionIndex].question}</p>
                  <p className="mt-2">
                    Your Answer: <span className="font-medium">{attempt.userAnswer}</span>
                  </p>
                  <p className="mt-1">
                    Correct Answer: <span className="font-medium">{attempt.correct_answer}</span>
                  </p>
                  <p className="mt-2 font-bold" style={{ color: attempt.isCorrect ? '#16a34a' : '#ef4444' }}>
                    {attempt.isCorrect ? 'Correct ✅' : 'Incorrect ❌'}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <button
                onClick={handleRestart}
                className="py-2 px-5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all"
              >
                Restart Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      // Step 3: Otherwise, render the main quiz view
      <div className="w-full flex flex-col items-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">
              🚀 Modern Quiz App
            </h1>
            <button
              onClick={toggleRules}
              className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Rules
            </button>
          </div>
          {isWinner && (
            <div className="text-center text-3xl font-bold text-green-600 my-4">
              🎉 Congratulations, you won!
            </div>
          )}
          <div id="question-box" className="space-y-6">
            <div className="h-auto bg-white shadow-md rounded-xl p-6 border border-gray-100 transition-all">
              <h1 className="text-lg font-semibold text-gray-700 mb-4">
                Question & Answer Box
              </h1>
              {ques.length > 0 && (
                <div key={currentIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 animate-fadeIn">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    Question {ques[currentIndex].index}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {ques[currentIndex].question}
                  </p>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={handleUserInput}
                        disabled={isSubmitted}
                        placeholder="Type your answer"
                        className="flex-1 p-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitted || isInfoLoading}
                        className={`py-2 px-6 rounded-lg shadow-md transition-all duration-300 ${
                          isSubmitted || isInfoLoading
                            ? "bg-gray-300 cursor-not-allowed text-gray-700"
                            : "bg-indigo-500 hover:bg-indigo-600 text-white"
                        }`}
                      >
                        {isSubmitted && isInfoLoading ? "Loading..." : "Submit"}
                      </button>
                    </form>
                  </div>
                  {message && (
                    <div className="mt-4 p-3 rounded-lg text-center font-semibold text-white bg-indigo-500">
                      {message}
                    </div>
                  )}
                  {isSubmitted && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-200 text-gray-700 font-medium animate-fadeIn">
                      {isInfoLoading ? (
                        <p className=" animate-slideDown">Loading additional info...</p>
                      ) : (
                        <p>{isInfo}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <p className="mt-6 text-lg font-semibold text-indigo-700">
                Score: {score}
              </p>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentIndex === 0}
                  className={`py-2 px-5 rounded-lg transition-all ${
                    currentIndex === 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
                  }`}
                >
                  ⬅ Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="py-2 px-5 rounded-lg transition-all bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
                >
                  {currentIndex === ques.length - 1 ? "Show Results 🏆" : "Next ➡"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default App;
