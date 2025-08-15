import { useState } from 'react'

import Portfolio from './Portfolio'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Portfolio/>
    </>
  )
}

export default App
