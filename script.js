document.addEventListener('DOMContentLoaded', () => {
  const board = document.getElementById('game-board');
  const scoreDisplay = document.getElementById('score');
  const powerStatus = document.getElementById('power-status');
  const retryBtn = document.getElementById('retry-btn');
  const width = 19; 
  let score = 0;
  let isPowerActive = false;
  let powerTimeoutId = null;
  let camelCurrentIndex = 308;
  const squares = [];
  let currentLayout = [];

  // Master map blueprint
  const originalLayout = [
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,3,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,1,
    1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,
    1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1,
    1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,
    1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1,
    2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2,
    1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1,
    2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2,
    1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1,
    2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2,
    1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1,
    1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,
    1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,
    1,3,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,3,1,
    1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
  ];

  class Lion {
    constructor(className, startIndex, speed) {
      this.className = className;
      this.startIndex = startIndex;
      this.baseSpeed = speed;
      this.speed = speed;
      this.currentIndex = startIndex;
      this.isScared = false;
      this.timerId = null;
    }
  }

  const lions = [
    new Lion('lion', 162, 280),
    new Lion('lion', 180, 320),
    new Lion('lion', 198, 360)
  ];

  function createBoard() {
    board.innerHTML = '';
    squares.length = 0;
    // Deep copy layout so changes don't persist permanently across resets
    currentLayout = [...originalLayout];

    for (let i = 0; i < currentLayout.length; i++) {
      const square = document.createElement('div');
      board.appendChild(square);
      squares.push(square);

      if (currentLayout[i] === 1) {
        squares[i].classList.add('wall');
      } else if (currentLayout[i] === 0) {
        squares[i].classList.add('dot');
      } else if (currentLayout[i] === 3) {
        squares[i].classList.add('power-pellet');
      }
    }
  }

  function initGame() {
    score = 0;
    scoreDisplay.textContent = score;
    isPowerActive = false;
    powerStatus.textContent = "";
    retryBtn.style.display = 'none';
    camelCurrentIndex = 308;
    
    clearTimeout(powerTimeoutId);

    createBoard();
    squares[camelCurrentIndex].classList.add('camel');

    lions.forEach(lion => {
      clearInterval(lion.timerId);
      lion.currentIndex = lion.startIndex;
      lion.isScared = false;
      lion.speed = lion.baseSpeed;
      squares[lion.currentIndex].classList.add('lion');
      moveLion(lion);
    });

    document.removeEventListener('keydown', moveCamel);
    document.addEventListener('keydown', moveCamel);
  }

  window.addEventListener('keydown', (e) => {
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key) > -1) {
        e.preventDefault();
    }
  }, {passive: false});

  function moveCamel(e) {
    squares[camelCurrentIndex].classList.remove('camel');
    switch(e.key) {
      case 'ArrowLeft':
        if (camelCurrentIndex % width !== 0 && !squares[camelCurrentIndex - 1].classList.contains('wall')) 
          camelCurrentIndex -= 1;
        break;
      case 'ArrowUp':
        if (camelCurrentIndex - width >= 0 && !squares[camelCurrentIndex - width].classList.contains('wall')) 
          camelCurrentIndex -= width;
        break;
      case 'ArrowRight':
        if (camelCurrentIndex % width < width - 1 && !squares[camelCurrentIndex + 1].classList.contains('wall')) 
          camelCurrentIndex += 1;
        break;
      case 'ArrowDown':
        if (camelCurrentIndex + width < width * width && !squares[camelCurrentIndex + width].classList.contains('wall')) 
          camelCurrentIndex += width;
        break;
    }
    squares[camelCurrentIndex].classList.add('camel');
    handleCollisions();
  }

  function handleCollisions() {
    if (squares[camelCurrentIndex].classList.contains('dot')) {
      score++;
      scoreDisplay.textContent = score;
      squares[camelCurrentIndex].classList.remove('dot');
      currentLayout[camelCurrentIndex] = 2; // Mark as completely empty in layout array
    }

    if (squares[camelCurrentIndex].classList.contains('power-pellet')) {
      score += 10;
      scoreDisplay.textContent = score;
      squares[camelCurrentIndex].classList.remove('power-pellet');
      currentLayout[camelCurrentIndex] = 2; // Mark as completely empty in layout array
      triggerPowerUp();
    }

    checkLionCollision();
  }

  function triggerPowerUp() {
    isPowerActive = true;
    clearTimeout(powerTimeoutId);
    powerStatus.textContent = "🌵 CHASE MODE ACTIVE!";

    lions.forEach(lion => {
      lion.isScared = true;
      squares[lion.currentIndex].classList.remove('lion');
      squares[lion.currentIndex].classList.add('lion-scared');
      
      clearInterval(lion.timerId);
      lion.speed = lion.baseSpeed + 150; 
      moveLion(lion);
    });

    powerTimeoutId = setTimeout(() => {
      isPowerActive = false;
      powerStatus.textContent = "";
      lions.forEach(lion => {
        lion.isScared = false;
        squares[lion.currentIndex].classList.remove('lion-scared');
        squares[lion.currentIndex].classList.add('lion');
        
        clearInterval(lion.timerId);
        lion.speed = lion.baseSpeed;
        moveLion(lion);
      });
    }, 10000);
  }

  function getXY(index) {
    return { x: index % width, y: Math.floor(index / width) };
  }

  function moveLion(lion) {
    const directions = [-1, +1, -width, +width];

    lion.timerId = setInterval(function() {
      const validMoves = directions.filter(dir => {
        const targetIndex = lion.currentIndex + dir;
        return targetIndex >= 0 && 
               targetIndex < squares.length && 
               !squares[targetIndex].classList.contains('wall');
      });

      if (validMoves.length > 0) {
        let bestMove = validMoves[0];
        let bestDistance = lion.isScared ? -1 : Infinity;
        const camelCoord = getXY(camelCurrentIndex);

        validMoves.forEach(dir => {
          const targetCoord = getXY(lion.currentIndex + dir);
          const distance = Math.abs(targetCoord.x - camelCoord.x) + Math.abs(targetCoord.y - camelCoord.y);

          if (!lion.isScared && distance < bestDistance) {
            bestDistance = distance;
            bestMove = dir;
          } else if (lion.isScared && distance > bestDistance) {
            bestDistance = distance;
            bestMove = dir;
          }
        });

        squares[lion.currentIndex].classList.remove('lion', 'lion-scared');
        lion.currentIndex += bestMove;
        
        if (lion.isScared) {
          squares[lion.currentIndex].classList.add('lion-scared');
        } else {
          squares[lion.currentIndex].classList.add('lion');
        }
      }

      checkLionCollision();
    }, lion.speed);
  }

  function checkLionCollision() {
    if (squares[camelCurrentIndex].classList.contains('lion') && !isPowerActive) {
      // Game Over 
      lions.forEach(lion => clearInterval(lion.timerId));
      clearTimeout(powerTimeoutId);
      document.removeEventListener('keydown', moveCamel);
      
      retryBtn.style.display = 'block';
      powerStatus.textContent = "GAME OVER";
    } 
    else if (squares[camelCurrentIndex].classList.contains('lion-scared')) {
      // Defeat Lion
      const hitLion = lions.find(l => l.currentIndex === camelCurrentIndex);
      if (hitLion) {
        squares[hitLion.currentIndex].classList.remove('lion-scared');
        hitLion.currentIndex = hitLion.startIndex; 
        squares[hitLion.currentIndex].classList.add(isPowerActive ? 'lion-scared' : 'lion');
        score += 50;
        scoreDisplay.textContent = score;
      }
    }
  }

  retryBtn.addEventListener('click', initGame);

  initGame();
});
   
      
        
