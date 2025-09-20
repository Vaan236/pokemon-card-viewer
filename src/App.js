import React, { useEffect, useState, useRef} from 'react';
import './App.css';

function App() {
  const [cards, setCards] = useState([]); //cards
  const [searchTerm, setSearchTerm] = useState(''); //searching
  const [isLoading, setIsLoading] = useState(false); //loading
  const [favorites, setFavorites] = useState([]); //favorite cards
  const [hasSearched, setHasSearched] = useState(false);
  const [nightMode, setNightMode] = useState(false); //night mode
  const [greeting, setGreeting] = useState(''); //date/time greet
  const [sets, setSets] = useState([]); //set packs
  const [setsLoading, setSetsLoading] = useState(true); //loading for set packs
  const [sortBy, setSortBy] = useState('name'); //for sorting option
  const [sortOrder, setSortOrder] = useState('asc'); // for ascending/descending
  const [selectedSet, setSelectedSet] = useState(null); // track which set is clicked
  const [currentPage, setCurrentPage] = useState(1); //current page
  const [totalPage, setTotalPage] = useState(1); // total of pages
  const abortControllerRef = useRef(null); // This will track our requests
  
  //home button
  const handleHomeClick = () => {
      if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  
    setCards([]);
    setSearchTerm('');
    setHasSearched(false);
    setSelectedSet(null);
    setCurrentPage(1);
    setIsLoading(false); //stop the loading state
  }

  const sortItems = (items, key) => {
    return [...items].sort((a, b) => {
      let compareA, compareB;
      
      if (key === 'releaseDate') {
        compareA = new Date(a[key]);
        compareB = new Date(b[key]);
      } else if (key === 'set.name') {
        compareA = a.set?.name || '';
        compareB = b.set?.name || '';
      } else if (key === 'types') {
        compareA = a.types ? a.types[0] || '' : '';
        compareB = b.types ? b.types[0] || '' : '';
      } else {
        compareA = a[key] || '';
        compareB = b[key] || '';
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
  };
  
  const greetingStyles = {
    morning: { color: '#ff8c00' },    // Orange for morning
    afternoon: { color: '#4169e1' },  // Royal blue for afternoon
    evening: { color: '#663399' }     // Purple for evening
  }

  const toggleNightMode = () => {
    setNightMode(!nightMode);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <span style={greetingStyles.morning}>Good Morning! ☀️</span>;
    if (hour < 18) return <span style={greetingStyles.afternoon}>Good Afternoon! 🌇</span>;
    return <span style={greetingStyles.evening}>Good Evening! 🌙</span>;
  }

  const fetchSetCards = (setId, page = 1) => {
    if(abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setCurrentPage(page); 
    fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=20`, {
      headers: {
        'X-Api-Key': process.env.REACT_APP_POKEMON_API_KEY
      },
      signal: abortControllerRef.current.signal
    })
      .then(response => {
        if(!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setCards(data.data);
        setTotalPage(Math.ceil(data.totalCount / 20)); //it calculates the total pages
        setIsLoading(false);
      })
      .catch(error => {
        if(error.name !== 'AbortError') {
          console.error('Error fetching set cards: ', error);
          setCards([{ error: error.message}]);
          setIsLoading(false);
        }
      });
  };

  useEffect(() => {
    fetch('https://api.pokemontcg.io/v2/sets', {
      headers: {
        'X-Api-Key': process.env.REACT_APP_POKEMON_API_KEY
      }
    })
      .then(response => response.json())
      .then(data => {
        setSets(data.data);
        setSetsLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setSetsLoading(false);
      });
  }, []);

  const handleSearch = () => {
    if(searchTerm.length >= 3) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSelectedSet(null); 
      setCurrentPage(1);
      setIsLoading(true);
      setHasSearched(true);
      fetch(`https://api.pokemontcg.io/v2/cards?q=name:*${searchTerm}*`, {
        headers: {
          'X-Api-Key': process.env.REACT_APP_POKEMON_API_KEY
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          setCards(data.data);
          setIsLoading(false);
        })
        .catch(error => {
          setCards([{ error: error.message }]);
          setIsLoading(false);
        });
    }
  };
    
  return (
    <div className={`container ${nightMode ? 'dark-mode' : 'light-mode'}`}>
      <button 
      className="night-mode" 
      onClick={toggleNightMode}
      >
        {nightMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
      <h1 
        onClick={handleHomeClick}
        style={{cursor: 'pointer'}}
      >
        Card Viewer
      </h1>
      <h2>{getGreeting()}</h2>
      <p>Powered by Pokemon TCG API</p>

      <div className="search-container">
        <input 
          type="text" 
          placeholder='Search Pokemon Card here'
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHasSearched(false);
          }}
          className='search-input'
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button 
          onClick={handleSearch}
          className="search-button"
        >
          Search
        </button>
      </div>
      
      {/* button to go back to set */}
      {selectedSet && (
        <button
          onClick={() => {
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }

            setSelectedSet(null);
            setCards([]);
            setHasSearched(false);
            setCurrentPage(1);
            setIsLoading(false);
          }}
          className="back-button"
        >
          ← Back to Sets ({selectedSet.name})
        </button>
      )}

      {isLoading ? (
        <p>Searching...</p>
      ) : hasSearched && searchTerm.length >= 3 && cards.length === 0 ? (
        <p>No cards found</p>
      ) : cards.length > 0 ? (
        <>
          {selectedSet && (
            <div className="pagination">
              <div className="pagination-buttons">
              <button
                onClick={() => fetchSetCards(selectedSet.id, currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <button
                onClick={() => fetchSetCards(selectedSet.id, currentPage + 1)}
                disabled={currentPage === totalPage}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
            <span className="page-counter">Page {currentPage} of {totalPage}</span>
          </div>
          )}

          <div className="sort-container">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Sort by Name</option>
                <option value="types">Sort by Type</option>
                <option value="set.name">Sort by Set</option>
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? '⬆️' : '⬇️'}
              </button>
          </div>

          <div className="card-grid">
            {sortItems(cards, sortBy).map(card => (
              <div key={card.id} className="pokemon-card">
                <h2 className="card-title">{card.name}</h2>
                {card.images && (
                  <img src={card.images.small} 
                  alt={card.name} 
                  onLoad={() => console.log('Image Loaded')}
                  onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <p>Supertype: {card.supertype}</p>
                <p>Set: {card.set?.name || 'N/A'}</p>
                <p>Type: {card.types ? card.types.join(', ') : 'N/A'}</p>
                <button
                  onClick={() => {
                    if(favorites.includes(card.id)) {
                      setFavorites(favorites.filter(id => id !== card.id));
                    } else {
                      setFavorites([...favorites, card.id]);
                    }
                  }}
                >
                  {favorites.includes(card.id) ? '❤️' : '🤍'}
                </button>
              </div>
            ) 
          )}
          </div>
        </>
        
      ) : 
      setsLoading ? (
        <p>Loading sets...</p>
      ) : (
        <>
          {/* for sorting */}
          <div className="sort-container">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="releaseDate">Sort by Release Date</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>

          <div className="sets-grid">
            {sortItems(sets, sortBy).map(set => (
              <div 
                key={set.id} 
                className="set-card"
                onClick={() => {
                  setSelectedSet(set);
                  setCurrentPage(1); // reset to page 1
                  fetchSetCards(set.id, 1);
                }}
                style={{cursor: 'pointer'}}
                >
                {set.images && <img src={set.images.logo} alt={set.name}/>}
                <h3>{set.name}</h3>
                <p>Released: {set.releaseDate}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;