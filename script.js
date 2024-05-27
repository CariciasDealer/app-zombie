window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    // Crear la imagen
    const cornerImage = new Image();
    cornerImage.src = 'reglas.jpg';

    // Tamaño deseado para la imagen
    const cornerWidth = 500;
    const cornerHeight = 300;

    // Posicionar la imagen en la esquina superior derecha del canvas
    cornerImage.onload = function () {
        const cornerX = canvas.width - cornerWidth - 10; // Ajustar el valor 10 según lo necesites
        const cornerY = 10; // Ajustar según lo necesites
        context.drawImage(cornerImage, cornerX, cornerY, cornerWidth, cornerHeight);
    };
    // Cargar el archivo de audio para la carga de la página
    const pageLoadSound = new Audio('intro.mp3');

    const startScreen = document.getElementById('startScreen');

    startScreen.addEventListener('click', startGame);

    function startGame() {
        startScreen.style.display = 'none'; // Oculta la pantalla de inicio
        pageLoadSound.play();
        setTimeout(() => {
            gameStarted = true; // Después de 3 segundos, habilita gameStarted
            console.log('El juego ha comenzado.');
            gameplaySound.play();
        }, 6000);
    }

    startScreen.addEventListener('click', function () {
        startGame();
    });

    const elementosTexto = document.querySelectorAll('h1, body');

    elementosTexto.forEach(elemento => {
        elemento.style.fontFamily = "'Jersey 10', sans-serif";
    });

    // Establecer tamaño del canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const zombies = [];
    const zombieImage = new Image();
    zombieImage.src = 'zombie.png';

    const fastZombieImage = new Image();
    fastZombieImage.src = 'fast_zombie.png';

    const heavyZombieImage = new Image();
    heavyZombieImage.src = 'heavy_zombie.png';

    const playerHandsImage = new Image();
    playerHandsImage.src = 'player_hands.png';

    const shotgunFiringImage = new Image();
    shotgunFiringImage.src = 'shotgun_firing.png';

    const reloadAnimationImage = new Image();
    reloadAnimationImage.src = 'reload_animation.png';

    const gameOverImage = new Image();
    gameOverImage.src = 'game_over.png';


    const gameOverSound = new Audio();
    gameOverSound.src = 'game_over.mp3';

    const gameplaySound = new Audio();
    gameplaySound.src = 'gameplay.mp3';


    let playerHealth = 100;
    let shotgunVisible = true;
    const maxShots = 9;
    let playerShots = maxShots;
    let isReloading = false;
    let reloading = false;
    const reloadDelay = 250;
    let bulletsToReload = 1.5;
    let score = 0;
    let level = 1;
    let zombiesKilled = 0;
    let zombiesToKill = 5;
    let levelUpPending = false;
    let totalZombiesKilled = 0; // Nuevo contador para el número total de zombies eliminados
    let zombieSpawnTimer;
    let fastZombieSpawnTimer;
    let heavyZombieSpawnTimer;
    let gameStarted = false;
    let gameOver = false; // Variable para controlar si el juego ha terminado
    let zombieGenerationTimer;

    const playerHealthBar = document.createElement('div');
    playerHealthBar.id = 'playerHealthBar';
    playerHealthBar.classList.add('progress');
    playerHealthBar.innerHTML = `
        <div id="playerHealth" class="progress-bar bg-danger" role="progressbar" style="width: 100%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>`;
    canvas.parentNode.appendChild(playerHealthBar);
    zombieImage.onload = function () {
        console.log('Imagen de zombi cargada correctamente.');
    };
    zombieImage.onerror = function () {
        console.error('Error al cargar la imagen del zombi.');
    };

    document.addEventListener('keydown', function (event) {
        if (event.key === 'r' || event.key === 'R') {
            if (playerShots < maxShots && !isReloading) {
                isReloading = true;
                shotgunVisible = 0;
                setTimeout(() => {
                    playerShots += bulletsToReload;
                    if (playerShots > maxShots) {
                        playerShots = maxShots;
                    }
                    isReloading = false;
                    shotgunVisible = true; // Mostrar las manos del jugador después de la recarga
                    console.log('Arma recargada. Disparos restantes:', playerShots);
                }, reloadDelay);
            } else {
                console.log('El arma ya está completamente cargada o se está recargando.');
            }
        }
    });

    class Zombie {
        constructor(x, y, initialSize, speed, image, health) {
            this.x = x;
            this.y = y;
            this.size = initialSize;
            this.speed = speed;
            this.maxSize = 200;
            this.dead = false;
            this.reachedMaxSize = false;
            this.image = image;
            this.health = health;
            this.time = 0; // Variable para controlar el movimiento ondulatorio
        }

        update() {
            this.time += 0.1; // Aumentar el tiempo en cada actualización

            // Calcular la posición y con un movimiento ondulatorio
            this.y = this.y + Math.sin(this.time * this.speed) * 0.4; // Ajusta la amplitud según lo desees

            if (this.size < this.maxSize) {
                this.size += this.speed;
            }

            if (this.size >= this.maxSize && !this.reachedMaxSize) {
                this.reachedMaxSize = true;
            }

            if (this.reachedMaxSize && !this.dead) {
                playerHealth -= 20;
                if (playerHealth < 0) playerHealth = 0;
                playerHealthBar.style.width = playerHealth + '%';
                console.log('¡Un zombi llegó al jugador! Vida restante:', playerHealth);
                this.dead = true;
            }
        }

        takeDamage() {
            this.health -= 1;
            if (this.health <= 0) {
                this.dead = true;
                zombiesKilled++; // Incrementa el contador de zombies eliminados para la lógica de nivel
                totalZombiesKilled++; // Incrementa el contador total de zombies eliminados
                checkLevelUp();
            }
        }

        draw() {
            if (!this.dead) {
                context.drawImage(this.image, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            }
        }
    }

    function getRandomSpawnPosition() {
        const spawnX = Math.random() * (canvas.width - 10) + 20;
        const spawnY = canvas.height / 2;
        return { x: spawnX, y: spawnY };
    }


    function spawnFastZombie() {
        if (gameStarted) {
            const { x: spawnX, y: spawnY } = getRandomSpawnPosition();
            const initialSize = 20;
            const speed = 3;
            const health = 1;
            zombies.push(new Zombie(spawnX, spawnY, initialSize, speed, fastZombieImage, health));
            console.log('Zombi rápido generado en:', spawnX, spawnY);
        }
    }


    function spawnHeavyZombie() {
        if (gameStarted) {
            const { x: spawnX, y: spawnY } = getRandomSpawnPosition();
            const initialSize = 20;
            const speed = 0.5;
            const health = 2;
            zombies.push(new Zombie(spawnX, spawnY, initialSize, speed, heavyZombieImage, health));
            console.log('Zombi pesado generado en:', spawnX, spawnY);
        }
    }

    function spawnZombie() {
        if (gameStarted) {
            const { x: spawnX, y: spawnY } = getRandomSpawnPosition();
            const initialSize = 20;
            const speed = 1;
            const health = 1;
            zombies.push(new Zombie(spawnX, spawnY, initialSize, speed, zombieImage, health));
            console.log('Zombi normal generado en:', spawnX, spawnY);
        }
    }

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        for (let i = 0; i < zombies.length; i++) {
            const zombie = zombies[i];
            if (
                mouseX > zombie.x - zombie.size / 2 &&
                mouseX < zombie.x + zombie.size / 2 &&
                mouseY > zombie.y - zombie.size / 2 &&
                mouseY < zombie.y + zombie.size / 2 &&
                playerShots > 0
            ) {
                zombie.takeDamage();
                if (zombie.dead) {
                    if (zombie.image === zombieImage) {
                        score += 50;
                    } else if (zombie.image === fastZombieImage) {
                        score += 40;
                    } else if (zombie.image === heavyZombieImage) {
                        score += 200;
                    }
                    console.log('Zombi eliminado. Puntos:', score);
                    zombies.splice(i, 1);
                    i--;
                }
                break;
            }
        }

        if (playerShots > 0) {
            shotgunVisible = false;
            playerShots--;
            setTimeout(() => {
                shotgunVisible = true;
            }, 200);
        } else {
            console.log('¡Recarga tu arma!');
        }
    });

    function drawHealthBar() {
        const barWidth = 400;
        const barHeight = 20;
        const xPos = (canvas.width - barWidth) / 2;
        const yPos = 30;
        const healthPercentage = playerHealth / 100;

        context.fillStyle = 'black';
        context.fillRect(xPos, yPos, barWidth, barHeight);

        context.fillStyle = 'red';
        context.fillRect(xPos, yPos, barWidth * healthPercentage, barHeight);
    }

    function drawAmmoBar() {
        const barWidth = 200;
        const barHeight = 20;
        const xPos = 1100;
        const yPos = canvas.height - barHeight - 220;
        const ammoPercentage = playerShots / maxShots;

        context.fillStyle = 'black';
        context.fillRect(xPos, yPos, barWidth, barHeight);

        context.fillStyle = 'green';
        context.fillRect(xPos, yPos, barWidth * ammoPercentage, barHeight);
    }

    function drawScore() {
        context.font = '24px "Jersey 10, sans-serif"';
        context.fillStyle = 'white';
        context.fillText('Puntos: ' + score, 19, 50);
    }

    function drawLevel() {
        context.font = '24px "Jersey 10, sans-serif"';
        context.fillStyle = 'white';
        context.fillText('Nivel: ' + level, 19, 80);

        // Calcula la posición vertical para el texto del número de zombies eliminados
        const zombiesKilledY = 110;

        context.fillText('Zombies eliminados: ' + totalZombiesKilled, 19, zombiesKilledY);
    }

    function checkLevelUp() {
        const zombiesToAdvance = level + 4; // 5 en el nivel 1, 6 en el nivel 2, y así sucesivamente
        if (zombiesKilled >= zombiesToAdvance) {
            level++;
            zombiesKilled = 0; // Reiniciar el contador de zombies eliminados para la lógica de nivel
            adjustSpawnIntervals(); // Llamar a la función para ajustar los intervalos de aparición
            console.log('¡Nivel subido! Nivel actual:', level);
        }
    }




    function draw() {
        const handsX = canvas.width - playerHandsImage.width - 10;
        const handsY = canvas.height - playerHandsImage.height - 10;

        if (shotgunVisible) {
            context.drawImage(playerHandsImage, handsX, handsY);
        } else {
            context.drawImage(shotgunFiringImage, handsX, handsY);
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!gameOver) { // Verificar si el juego aún no ha terminado
            zombies.forEach(zombie => zombie.draw());

            if (shotgunVisible) {
                context.drawImage(playerHandsImage, handsX, handsY);
            } else {
                context.drawImage(shotgunFiringImage, handsX, handsY);
            }

            if (isReloading) {
                context.drawImage(reloadAnimationImage, handsX, handsY);
            }

            zombies.forEach(zombie => zombie.draw());

            drawHealthBar();
            drawAmmoBar();
            drawScore();
            drawLevel();

            checkGameOver(); // Verificar si se ha alcanzado el estado de derrota
        } else {
            drawGameOverScreen(); // Dibujar la pantalla de juego terminado si es necesario
        }
    }

    function checkGameOver() {
        if (playerHealth <= 0) {
            gameOver = true; // Establece la variable gameOver en true
            gameOverSound.play(); // Reproducir sonido de game over
            gameplaySound.pause();
            // Detén los intervalos de generación de zombies
            clearInterval(zombieSpawnTimer);
            clearInterval(fastZombieSpawnTimer);
            clearInterval(heavyZombieSpawnTimer);
        }
    }


    function drawGameOverScreen() {
        context.clearRect(0, 0, canvas.width, canvas.height); // Limpia el canvas
        context.fillStyle = 'white';
        context.font = '40px "Jersey 10", sans-serif';
        context.textAlign = 'center';

        // Obtener el centro del canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Dibujar la imagen de Game Over
        context.drawImage(gameOverImage, centerX - gameOverImage.width / 2, centerY - gameOverImage.height / 2 - 100);

        // Dibujar el nivel actual

        context.fillText('Fuiste devorado por la horda, llegaste a la oleada ' + level, centerX, centerY + 30);

        context.fillText('Reuniste ' + score + ' puntos', centerX, centerY + 80);

        context.fillText('Mataste a ' + totalZombiesKilled + ' zombies', centerX, centerY + 130);

        context.fillText('Refresca la pagina para repetir la aventura', centerX, centerY + 180);
    }


    function update() {
        for (let i = 0; i < zombies.length; i++) {
            zombies[i].update();
            if (zombies[i].dead) {
                zombies.splice(i, 1);
                i--;
            }
        }
    }

    function gameLoop() {
        if (gameStarted) {
            update();
            draw();
        }
        requestAnimationFrame(gameLoop);
    }


    function adjustSpawnIntervals() {
        clearInterval(zombieSpawnTimer);
        clearInterval(fastZombieSpawnTimer);
        clearInterval(heavyZombieSpawnTimer);

        zombieSpawnTimer = setInterval(spawnZombie, 2000 - (level * 100)); // Ajuste del intervalo para los zombies normales
        fastZombieSpawnTimer = setInterval(spawnFastZombie, 3000 - (level * 50)); // Ajuste del intervalo para los zombies rápidos
        heavyZombieSpawnTimer = setInterval(spawnHeavyZombie, 4000 - (level * 100)); // Ajuste del intervalo para los zombies pesados
    }



    adjustSpawnIntervals();

    gameLoop();
};
