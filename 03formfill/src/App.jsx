import { useState } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [pass, setPass] = useState('')
  const [cnf, setCnf] = useState('')
  const handlerSubmit=()=>{
    if(name && pass && cnf)
      {
      if(pass===cnf)
        {
        alert('Registration Successfull')
        }else 
        {
          alert('Password and Confirm Password should be same')
        }
      }else
        {
          alert('Please fill all the fields')
        }

    }                
          
    return (
      <>
      <h1>Form</h1>
      <div className="form">
        <input type="text"  id="input"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        placeholder="Enter your name" autoFocus="on"/>
        <input type="password"  id="input" 
        value={pass}
        onChange={(e)=>setPass(e.target.value)}
        placeholder="Enter password" autoFocus="on" />
        <input type="password"  id="input" 
        value={cnf}
        onChange={(e)=>setCnf(e.target.value)}
        placeholder="Confirm password" autoFocus="on"/>
        <button id="spaces"
        onClick={handlerSubmit}
        >Submit</button>
      </div>
    </>
  )
}


export default App
