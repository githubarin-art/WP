import { useState, useEffect, useRef } from "react";


function App() {
  const [score, setScore] = useState(0);
  const [ques, setQues] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [message, setMessage] = useState("");
  const [isInfo,setIsInfo]=useState(null);
  const [isInfoLoading, setIsInfoLoading]=useState(false);
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
          "https://opentdb.com/api.php?amount=10&difficulty=medium&type=multiple"
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
  useEffect(() => {
    if (score === 10) setIsWinner(true);
  }, [score]);

  const handleNextQuestion = () => {
    if (currentIndex < ques.length - 1) {
      setCurrentIndex((prevIndex)=> prevIndex + 1);
      resetForNewQuestion();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex)=> prevIndex - 1);
      resetForNewQuestion();
    }
  };

  const resetForNewQuestion = () => {
    setUserAnswer("");
    setIsSubmitted(false);
    setMessage("");
  };

  const InFoFetchedWikipedia= async (query)=>{
    setIsInfoLoading(true);
    try {
      const apiurl=`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=500&titles=${encodeURIComponent(query)}&format=json&origin=*`;
      const res= await fetch(apiurl);
      const data= await res.json();
      const pages= data.query.pages;
      const pageId= Object.keys(pages)[0];


      if(pageId && pages[pageId].extract){
        const extractDiv=document.createElement("div");
        extractDiv.innerHTML=pages[pageId].extract;
        setIsInfo(extractDiv.textContent);
      }
      else{
        setIsInfo("No information available.");
      }
      
    } catch (error) {
      console.error("OOPS!! Error in fetching data from Wikipedia..", error);
      setIsInfo("Failed to fetch data from Wikipedia.");
      
    }
    finally{
      setIsInfoLoading(false);
    }
  }

  const UserInput = (event) => {
    setUserAnswer(event.target.value);
  };

  const handleChangeSubmit = (event) => {
    event.preventDefault();
    setIsSubmitted(true);
    const isCorrect = userAnswer.trim().toLowerCase() === ques[currentIndex].answer.toLowerCase();
    if (
      isCorrect
    ) {
      setMessage("✅ Correct!");
      setScore((prev) => prev + 1);
      InFoFetchedWikipedia(ques[currentIndex].answer)
    } else {
      setMessage(
        `❌ Incorrect! The correct answer is ${ques[currentIndex].answer}.`
      );
      InFoFetchedWikipedia(ques[currentIndex].answer)
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-2xl font-semibold text-gray-700 animate-pulse">
        Loading questions...
      </div>
    );
  }

  if (error)
    {
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
          {isWinner && (
            <div className="text-center text-3xl font-bold text-green-600 my-4">
              🎉 Congratulations, you won!
            </div>
          )}

          <div className="h-auto bg-white shadow-md rounded-xl p-6 border border-gray-100 transition-all">
            <h1 className="text-lg font-semibold text-gray-700 mb-4">
              Question & Answer Box
            </h1>
            
            {ques.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  Question {ques[currentIndex].index}
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {ques[currentIndex].question}
                </p>
                <div className="mt-4">
                  <form onSubmit={handleChangeSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={UserInput}
                      disabled={isSubmitted}
                      placeholder="Type your answer"
                      className="flex-1 p-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitted}
                      className={`py-2 px-6 rounded-lg shadow-md transition-all duration-300 ${
                        isSubmitted
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-indigo-500 hover:bg-indigo-600 text-white"
                      }`}
                    >
                      Submit
                    </button>
                  </form>
                </div>
                {message && (
                  <div className="mt-4 p-3 rounded-lg text-center font-semibold text-white bg-indigo-500">
                    {message}
                  </div>
                )}
                {isSubmitted && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-200 text-gray-700 font-medium">
                    {isInfoLoading ? (
                      <p className="animate-pulse">Loading additional info...</p>
                    ) : (
                      <p>{info}</p>
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
                disabled={currentIndex === ques.length - 1}
                className={`py-2 px-5 rounded-lg transition-all ${
                  currentIndex === ques.length - 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
                }`}
              >
                Next ➡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
