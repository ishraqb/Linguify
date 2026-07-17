import {useState} from 'react'
import {Link, useLocation} from 'react-router-dom'

function Flashcards(){
  const location =useLocation()
  const savedWords = location.state?.savedWords || []
  const sourceLanguage = location.state?.sourceLanguage
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)


  if(savedWords.length === 0){
    return (
      <div className="page">
        <h2 className="section-title center-text">No saved words yet</h2>
        <p className="page-text center-text">
          Save words during a lesson before starting flashcard review.
        </p>
        <Link to="/search" className="main-button wide-button">
        Choose a song
        </Link>
      </div>
    )
  }
  const currentWord = savedWords[currentIndex]
  function handleNext(){
    setCurrentIndex((previousIndex - 1) =>
      previousIndex === savedWords.length - 1 ? 0: previousIndex + 1
  )
  setIsFlipped(false)
  }
  function handlePrevious(){
    setCurrentIndex((previousIndex) => 
      previousIndex === 0 ? savedWords.length - 1 : previousIndex - 1
    )
    setIsFlipped(false)
  }
  
}