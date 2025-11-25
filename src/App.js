import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, RotateCcw, Trophy } from 'lucide-react';

const GRID_SIZE = 6;
const CHOCOLATE_TYPES = [
  { id: 'milk', color: '#8B4513', name: 'Milk Chocolate' },
  { id: 'dark', color: '#3E2723', name: 'Dark Chocolate' },
  { id: 'cookies', color: '#F5E6D3', dots: true, name: 'Cookies & Cream' },
  { id: 'almond', color: '#CD853F', name: 'Almond' }
];

const MATCHES_NEEDED = 3;
const AMAZON_LINK = 'https://www.amazon.com/s?k=hersheys+chocolate';

function App() {
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [successfulMatches, setSuccessfulMatches] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    let newGrid;
    let hasMatches = true;
    
    // Keep generating until we have a grid with no initial matches
    while (hasMatches) {
      newGrid = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        const newRow = [];
        for (let col = 0; col < GRID_SIZE; col++) {
          newRow.push({
            type: CHOCOLATE_TYPES[Math.floor(Math.random() * CHOCOLATE_TYPES.length)],
            row,
            col,
            id: `${row}-${col}-${Date.now()}-${Math.random()}`
          });
        }
        newGrid.push(newRow);
      }
      
      const matches = checkMatches(newGrid);
      hasMatches = matches.size > 0;
    }
    
    setGrid(newGrid);
    setSelectedCell(null);
    setMessage('Swap adjacent chocolates to match 3 or more!');
  };

  const checkMatches = (testGrid) => {
    const matchedCells = new Set();
    
    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const type = testGrid[row][col].type.id;
        if (testGrid[row][col + 1].type.id === type && 
            testGrid[row][col + 2].type.id === type) {
          matchedCells.add(`${row}-${col}`);
          matchedCells.add(`${row}-${col + 1}`);
          matchedCells.add(`${row}-${col + 2}`);
          
          let checkCol = col + 3;
          while (checkCol < GRID_SIZE && testGrid[row][checkCol].type.id === type) {
            matchedCells.add(`${row}-${checkCol}`);
            checkCol++;
          }
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const type = testGrid[row][col].type.id;
        if (testGrid[row + 1][col].type.id === type && 
            testGrid[row + 2][col].type.id === type) {
          matchedCells.add(`${row}-${col}`);
          matchedCells.add(`${row + 1}-${col}`);
          matchedCells.add(`${row + 2}-${col}`);
          
          let checkRow = row + 3;
          while (checkRow < GRID_SIZE && testGrid[checkRow][col].type.id === type) {
            matchedCells.add(`${checkRow}-${col}`);
            checkRow++;
          }
        }
      }
    }

    return matchedCells;
  };

  const removeMatchesAndRefill = async (matchedCells, gridToUpdate) => {
    if (matchedCells.size === 0) return gridToUpdate;

    const newGrid = gridToUpdate.map(row => [...row]);
    
    // Mark cells to remove
    matchedCells.forEach(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      newGrid[row][col] = null;
    });

    await new Promise(resolve => setTimeout(resolve, 400));

    // Drop cells down
    for (let col = 0; col < GRID_SIZE; col++) {
      let emptySpaces = 0;
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col] === null) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          newGrid[row + emptySpaces][col] = newGrid[row][col];
          newGrid[row][col] = null;
        }
      }
      
      // Fill empty spaces at top
      for (let row = 0; row < emptySpaces; row++) {
        newGrid[row][col] = {
          type: CHOCOLATE_TYPES[Math.floor(Math.random() * CHOCOLATE_TYPES.length)],
          row,
          col,
          id: `${row}-${col}-${Date.now()}-${Math.random()}`
        };
      }
    }

    return newGrid;
  };

  const handleCellClick = async (row, col) => {
    if (isAnimating || showReward) return;

    if (selectedCell === null) {
      setSelectedCell({ row, col });
      setMessage('Now tap an adjacent chocolate to swap!');
    } else {
      const rowDiff = Math.abs(selectedCell.row - row);
      const colDiff = Math.abs(selectedCell.col - col);
      
      // Check if cells are adjacent
      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        setIsAnimating(true);
        setMessage('Checking for matches...');
        
        // Swap cells
        const newGrid = grid.map(r => [...r]);
        const temp = newGrid[selectedCell.row][selectedCell.col];
        newGrid[selectedCell.row][selectedCell.col] = newGrid[row][col];
        newGrid[row][col] = temp;
        
        setGrid(newGrid);
        setSelectedCell(null);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check for matches
        const matchedCells = checkMatches(newGrid);
        
        if (matchedCells.size === 0) {
          // No matches, swap back
          setMessage('No match! Try again.');
          await new Promise(resolve => setTimeout(resolve, 500));
          setGrid(grid);
          setIsAnimating(false);
        } else {
          // Success!
          const points = matchedCells.size * 10;
          const newScore = score + points;
          const newSuccessfulMatches = successfulMatches + 1;
          
          setScore(newScore);
          setSuccessfulMatches(newSuccessfulMatches);
          setMessage(`Great! +${points} points! ${MATCHES_NEEDED - newSuccessfulMatches} more to go!`);
          
          // Remove matches and refill
          const updatedGrid = await removeMatchesAndRefill(matchedCells, newGrid);
          setGrid(updatedGrid);
          
          // Check if won
          if (newSuccessfulMatches >= MATCHES_NEEDED) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setShowReward(true);
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
            setMessage('Make another match!');
          }
          
          setIsAnimating(false);
        }
      } else {
        // Not adjacent, select new cell
        setSelectedCell({ row, col });
        setMessage('Now tap an adjacent chocolate to swap!');
      }
    }
  };

  const resetGame = () => {
    setSuccessfulMatches(0);
    setScore(0);
    setShowReward(false);
    setIsAnimating(false);
    initializeGrid();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #d97d34 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Fredoka", "Comic Sans MS", "Chalkboard SE", cursive',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes firework {
          0% { transform: translateY(0) scale(0); opacity: 1; }
          100% { transform: translateY(-100px) scale(1); opacity: 0; }
        }
      `}</style>

      {/* Diwali Decorative background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {/* Diyas (oil lamps) at bottom corners */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          fontSize: '48px',
          animation: 'flicker 2s infinite',
          filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.8))'
        }}>🪔</div>
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: '48px',
          animation: 'flicker 2.5s infinite',
          filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.8))'
        }}>🪔</div>
        
        {/* More diyas scattered around */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          fontSize: '36px',
          animation: 'flicker 3s infinite',
          filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.6))'
        }}>🪔</div>
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          fontSize: '36px',
          animation: 'flicker 2.3s infinite',
          filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.6))'
        }}>🪔</div>
        
        {/* Sparkles/Stars */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${12 + Math.random() * 20}px`,
              animation: `sparkle ${2 + Math.random() * 3}s infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >✨</div>
        ))}
        
        {/* Firework effects */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`firework-${i}`}
            style={{
              position: 'absolute',
              bottom: '0',
              left: `${10 + i * 12}%`,
              fontSize: '24px',
              animation: `firework ${3 + Math.random() * 2}s infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          >🎆</div>
        ))}
        
        {/* Rangoli pattern corners */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(255,165,0,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          border: '3px solid rgba(255,215,0,0.4)',
        }} />
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(255,165,0,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          border: '3px solid rgba(255,215,0,0.4)',
        }} />
        
        {/* Floating lanterns */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          fontSize: '40px',
          animation: 'float 4s ease-in-out infinite',
          filter: 'drop-shadow(0 0 15px rgba(255, 200, 0, 0.6))'
        }}>🏮</div>
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '8%',
          fontSize: '35px',
          animation: 'float 5s ease-in-out infinite',
          animationDelay: '1s',
          filter: 'drop-shadow(0 0 15px rgba(255, 200, 0, 0.6))'
        }}>🏮</div>
        <div style={{
          position: 'absolute',
          bottom: '30%',
          left: '3%',
          fontSize: '32px',
          animation: 'float 4.5s ease-in-out infinite',
          animationDelay: '2s',
          filter: 'drop-shadow(0 0 15px rgba(255, 200, 0, 0.6))'
        }}>🏮</div>
        
        {/* Glowing overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,165,0,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 70%, rgba(255,215,0,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(255,140,0,0.1) 0%, transparent 60%)`,
        }} />
      </div>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Diwali greeting */}
        <div style={{
          fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
          color: '#FFD700',
          textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
          marginBottom: '5px',
          fontWeight: '600',
          letterSpacing: '1px',
          animation: 'sparkle 2s infinite'
        }}>
          ✨ Happy Diwali! ✨
        </div>
        
        <h1 style={{
          fontSize: 'clamp(2rem, 8vw, 3.5rem)',
          color: '#fff',
          margin: '0 0 10px 0',
          textShadow: '4px 4px 8px rgba(0,0,0,0.3)',
          letterSpacing: '2px',
          fontWeight: 'bold'
        }}>
          HERSHEY'S
        </h1>
        <div style={{
          fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
          color: '#FFE082',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '15px',
          fontWeight: '600'
        }}>
          CHOCO MATCH
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '15px 25px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          display: 'inline-block',
          marginBottom: '10px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            color: '#fff'
          }}>
            <Trophy size={24} style={{ color: '#FFD700' }} />
            <div style={{ fontWeight: '600' }}>
              Matches: {successfulMatches}/{MATCHES_NEEDED}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.3)',
              padding: '5px 15px',
              borderRadius: '15px'
            }}>
              Score: {score}
            </div>
          </div>
        </div>

        {/* Message */}
        <div style={{
          minHeight: '30px',
          color: '#fff',
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
          textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
          fontWeight: '500',
          animation: message.includes('Great!') ? 'pulse 0.5s ease' : 'none'
        }}>
          {message}
        </div>
      </div>

      {/* Game Grid */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        padding: 'clamp(10px, 3vw, 20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
        maxWidth: '100%',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, clamp(50px, 10vw, 70px))`,
          gridTemplateRows: `repeat(${GRID_SIZE}, clamp(50px, 10vw, 70px))`,
          gap: 'clamp(4px, 1vw, 8px)',
          background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
          padding: 'clamp(10px, 2vw, 15px)',
          borderRadius: '15px'
        }}>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={cell.id}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: '1',
                  background: cell.type.color,
                  borderRadius: '50%',
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  transform: selectedCell?.row === rowIndex && selectedCell?.col === colIndex 
                    ? 'scale(1.15)' 
                    : 'scale(1)',
                  boxShadow: selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                    ? '0 0 25px rgba(255,255,255,0.9), inset 0 0 20px rgba(255,255,255,0.3)'
                    : '0 4px 8px rgba(0,0,0,0.3)',
                  border: selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                    ? '4px solid #FFD700'
                    : '3px solid rgba(255,255,255,0.4)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'fadeIn 0.3s ease',
                  opacity: isAnimating ? 0.7 : 1
                }}
              >
                {cell.type.dots && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'clamp(4px, 1vw, 8px)'
                  }}>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 'clamp(6px, 1.5vw, 8px)',
                          height: 'clamp(6px, 1.5vw, 8px)',
                          background: '#5D4037',
                          borderRadius: '50%'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        color: '#fff',
        textAlign: 'center',
        fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
        maxWidth: '500px',
        textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
        padding: '0 10px',
        lineHeight: '1.6'
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '15px',
          borderRadius: '15px',
          backdropFilter: 'blur(5px)'
        }}>
          <p style={{ margin: '5px 0', fontWeight: '600' }}>
            🎯 Tap two adjacent chocolates to swap
          </p>
          <p style={{ margin: '5px 0', fontWeight: '600' }}>
            ⭐ Match 3 or more to score!
          </p>
          <p style={{ margin: '5px 0', fontWeight: '600' }}>
            🏆 Make {MATCHES_NEEDED} successful matches to win!
          </p>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetGame}
        style={{
          marginTop: '20px',
          padding: '12px 30px',
          fontSize: 'clamp(1rem, 3vw, 1.1rem)',
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          fontWeight: 'bold',
          color: '#764ba2',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 1
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <RotateCcw size={20} />
        New Game
      </button>

      {/* Reward Modal */}
      {showReward && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ff9a44 100%)',
            borderRadius: '30px',
            padding: 'clamp(30px, 8vw, 50px)',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.5s ease',
            position: 'relative',
            border: '5px solid rgba(255,215,0,0.5)',
            overflow: 'hidden'
          }}>
            {/* Diwali sparkles in modal */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '24px',
              animation: 'sparkle 1.5s infinite'
            }}>✨</div>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '24px',
              animation: 'sparkle 1.5s infinite',
              animationDelay: '0.5s'
            }}>✨</div>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontSize: '20px',
              animation: 'flicker 2s infinite'
            }}>🪔</div>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              fontSize: '20px',
              animation: 'flicker 2s infinite'
            }}>🪔</div>
            
            <div style={{
              fontSize: 'clamp(60px, 15vw, 100px)',
              marginBottom: '10px',
              animation: 'bounce 1s infinite'
            }}>
              🎉
            </div>
            <div style={{
              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
              color: '#FFD700',
              fontWeight: '700',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              marginBottom: '10px'
            }}>
              🪔 Happy Diwali! 🪔
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              color: '#fff',
              margin: '0 0 15px 0',
              textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
              fontWeight: '700'
            }}>
              CONGRATULATIONS!
            </h2>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '15px',
              borderRadius: '15px',
              marginBottom: '20px'
            }}>
              <p style={{
                fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                color: '#fff',
                margin: '5px 0',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                fontWeight: '600'
              }}>
                🏆 {successfulMatches} Successful Matches!
              </p>
              <p style={{
                fontSize: 'clamp(1rem, 3.5vw, 1.2rem)',
                color: '#FFE082',
                margin: '5px 0',
                fontWeight: '600'
              }}>
                ⭐ Final Score: {score} points
              </p>
            </div>
            <p style={{
              fontSize: 'clamp(1rem, 4vw, 1.3rem)',
              color: '#fff',
              marginBottom: '30px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              fontWeight: '600'
            }}>
              You've earned your sweet reward!
            </p>
            <a
              href={AMAZON_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: 'clamp(16px, 4vw, 20px) clamp(30px, 8vw, 45px)',
                fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                background: '#fff',
                color: '#f5576c',
                textDecoration: 'none',
                borderRadius: '30px',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                transition: 'all 0.3s ease',
                marginBottom: '20px',
                border: '3px solid rgba(245,87,108,0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
              }}
            >
              <Gift size={28} />
              Claim Your Reward
            </a>
            <div>
              <button
                onClick={resetGame}
                style={{
                  padding: 'clamp(12px, 3vw, 14px) clamp(25px, 6vw, 35px)',
                  fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                  background: 'rgba(255,255,255,0.3)',
                  border: '3px solid #fff',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              >
                Play Again 🎮
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;