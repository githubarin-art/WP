import { useState } from 'react';
import Calculator from './Calculator';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [display, setDisplay] = useState('');

  const handleButtonClick = (value) => {
    setInput(input + value);
    setDisplay(input + value);
  };

  const calculate = () => {
    try {
      let result = eval(input);
      setDisplay(result);
      setInput(result.toString());
    } catch (error) {
      setDisplay('Error');
      setInput('');
    }
  };

  return (
    <>
      <h1>Calculator</h1>
      <Calculator 
        display={display} 
        handleButtonClick={handleButtonClick} 
        calculate={calculate} 
        setInput={setInput} 
        setDisplay={setDisplay} 
      />
    </>
  );
}

export default App;