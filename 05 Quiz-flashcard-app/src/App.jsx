import { useState, useEffect, useRef } from "react";
import "./index.css";

function App() {
  const paragraphRef = useRef(null);
  const winningRef = useRef(null);
  const headingRef = useRef(null);

  const [score, setScore] = useState(0);
  const [ques, setQues] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerDisabled, setAnswerDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://opentdb.com/api.php?amount=10&type=multiple"
        );
        const data = await res.json();

        if (data.response_code === 0) {
          const formatted = data.results.map((item, index) => ({
            index: index + 1,
            question: decodeHtml(item.question),
            answer: decodeHtml(item.correct_answer),
          }));
          setQues(formatted);
          setError(null);
        } else {
          throw new Error("API returned no questions or error code.");
        }
      } catch (err) {
        setError("Failed to load quiz questions.");
        console.error("Error fetching quiz questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleNextQuestion = () => {
    if (currentIndex < ques.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetForNewQuestion();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetForNewQuestion();
    }
  };

  const resetForNewQuestion = () => {
    setShowAnswer(false);
    setUserAnswer("");
    setIsEditing(false);
    setAnswerDisabled(false);
  };

  const ToDisplayAnswer = () => {
    setShowAnswer(true);
    headingRef.current.textContent = `Question ${ques[currentIndex].index}`;
    paragraphRef.current.textContent = ques[currentIndex].answer;
    setUserAnswer("");
    setIsEditing(true);
    setAnswerDisabled(true);
  };

  const UserInput = (event) => {
    setUserAnswer(event.target.value);
  };

  const handleChangeSubmit = (event) => {
    event.preventDefault();
    if (
      userAnswer.trim().toLowerCase() ===
      ques[currentIndex].answer.toLowerCase()
    ) {
      alert("✅ Correct!");
      setScore((prev) => prev + 1);
    } else {
      alert(
        `❌ Incorrect! The correct answer is ${ques[currentIndex].answer}.`
      );
    }

    setIsEditing(false);
    setShowAnswer(false);
    setAnswerDisabled(false);
  };

  if (score === 10 && winningRef.current) {
    winningRef.current.textContent = "🎉 You have won!";
  }

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

  return (
    <div className="w-full flex flex-col items-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl border border-gray-100">
        <h1 className="text-4xl font-extrabold text-center text-indigo-600 mb-6 tracking-tight">
          🚀 Modern Quiz App
        </h1>
        <div id="question-box" className="space-y-6">
          <div
            ref={winningRef}
            className="h-auto bg-white shadow-md rounded-xl p-6 border border-gray-100 transition-all"
          >
            <h1 className="text-lg font-semibold text-gray-700 mb-4">
              Question & Answer Box
            </h1>
            {ques.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                <h2
                  ref={headingRef}
                  className="text-lg font-bold text-gray-800 mb-2"
                >
                  Question {ques[currentIndex].index}
                </h2>
                <p
                  ref={paragraphRef}
                  className="text-gray-700 leading-relaxed"
                >
                  {showAnswer ? (
                    isEditing ? (
                      <form
                        onSubmit={handleChangeSubmit}
                        className="flex flex-col sm:flex-row gap-3"
                      >
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={UserInput}
                          placeholder="Type your answer"
                          className="flex-1 p-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-6 rounded-lg shadow-md transition-all duration-300"
                        >
                          Submit
                        </button>
                      </form>
                    ) : (
                      <span className="font-semibold text-green-600">
                        {ques[currentIndex].answer}
                      </span>
                    )
                  ) : (
                    ques[currentIndex].question
                  )}
                </p>
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
                disabled={currentIndex === ques.length - 1}
                className={`py-2 px-5 rounded-lg transition-all ${
                  currentIndex === ques.length - 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
                }`}
              >
                Next ➡
              </button>
              <button
                onClick={ToDisplayAnswer}
                disabled={answerDisabled}
                className={`py-2 px-5 rounded-lg border-none transition-all ${
                  answerDisabled
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-pink-500 hover:bg-pink-600 text-white shadow-md"
                }`}
              >
                💡 Show Answer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
