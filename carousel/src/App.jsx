import './App.css'
import Carousel from './Carousel'

function App() {
  
const images = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30", // watch
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9", // smartphone
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad", // shoes
];

  return (
    <div style={{position: 'relative'}}>
      <Carousel images={images}/>
    </div>
  )
}

export default App
