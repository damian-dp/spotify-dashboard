
import './App.css'
import { useThemeContext } from './context/ThemeContextProvider'

function App() {

  const [theme, toggleTheme] = useThemeContext()

  return (
    <>
      <button onClick={toggleTheme}>
        Toggle theme
      </button>
    </>
  )
}

export default App
