import { useState } from 'react';
import './App.css';

function App() {
  const [taskinp, settaskinp] = useState(''); // State for input text
  const [tasks, setTasks] = useState([]); // State for storing tasks

  const Addtask = () => {
    if (taskinp.trim()) { // Check if input is not empty
      setTasks([...tasks, taskinp]); // Add new task to tasks array
      settaskinp(''); // Clear input after adding
    }
  };

  return (
    <>
      <div className="container">
        <p>Task List</p>
        <input
          type="text"
          placeholder='Enter new Task'
          value={taskinp}
          onChange={(e) => settaskinp(e.target.value)} // Update taskInp on change
        />
        <button onClick={Addtask}>Add Task</button> {/* Button to trigger Add Task */}
        <ul>
          {tasks.map((task, index) => (
            <li key={index}>{task}</li> // Render each task in a list item
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
