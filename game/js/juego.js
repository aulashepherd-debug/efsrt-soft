const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cuySprite = new Image();
cuySprite.src = "image/cuy.png";

let score = 0;
const abecedario = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let letraObjetivo = abecedario[Math.floor(Math.random() * abecedario.length)];
let lives = 3;
let level = 1;
let invulnerable = 0;
let bonusTimer = 0;
let bonusText = "";
let bonusX = 0;
let bonusY = 0;
let gameOver = false;
const gravity = 0.6;

const player = {
    x: 120,
    y: 540,
    width: 44,
    height: 44,
    dx: 0,
    dy: 0,
    speed: 6,
    jumpPower: -13.5,
    grounded: false,
    facingRight: true,
    spriteWidth: 256,
    spriteHeight: 279,
    frameX: 0,
    frameY: 0,
    gameFrame: 0,
    staggerFrames: 7
};

const bell = {
    x: 530,
    y: 55,
    width: 36,
    height: 38
};

let platforms = [];

function buildInitialPlatforms() {
    platforms = [
        { x: 0, y: 610, width: 1100, baseWidth: 1100, height: 40, color: "#a6e3a1", dynamic: false, phase: 0, amp: 0 },
        { x: 140, y: 515, width: 170, baseWidth: 170, height: 18, color: "#e30505", dynamic: true, phase: 0.0, amp: 50 },
        { x: 740, y: 515, width: 170, baseWidth: 170, height: 18, color: "#8f2374", dynamic: true, phase: 1.5, amp: 50 },
        { x: 360, y: 420, width: 165, baseWidth: 165, height: 18, color: "#4e54d2", dynamic: true, phase: 0.8, amp: 50 },
        { x: 860, y: 420, width: 165, baseWidth: 165, height: 18, color: "#fab387", dynamic: true, phase: 2.3, amp: 50 },
        { x: 110, y: 325, width: 160, baseWidth: 160, height: 18, color: "#96a539", dynamic: true, phase: 1.2, amp: 48 },
        { x: 580, y: 325, width: 160, baseWidth: 160, height: 18, color: "#edf509", dynamic: true, phase: 3.1, amp: 48 },
        { x: 310, y: 230, width: 155, baseWidth: 155, height: 18, color: "#fab387", dynamic: true, phase: 2.0, amp: 45 },
        { x: 790, y: 230, width: 155, baseWidth: 155, height: 18, color: "#147dd8", dynamic: true, phase: 4.0, amp: 45 },
        { x: 160, y: 135, width: 150, baseWidth: 150, height: 18, color: "#34d9e2", dynamic: true, phase: 2.7, amp: 45 },
        { x: 510, y: 135, width: 150, baseWidth: 150, height: 18, color: "#fab387", dynamic: true, phase: 4.7, amp: 45 }
    ];

    bell.x = platforms[10].x + (platforms[10].baseWidth / 2) - (bell.width / 2);
    bell.y = platforms[10].y - bell.height - 16;
}

buildInitialPlatforms();

let bombs = [];
let logos = [];

const keys = {};
let teclaPresionada = "";

window.addEventListener("keydown", function(e) {
    keys[e.code] = true;
    // Guarda la letra en mayúscula si el usuario presiona una tecla de texto
    if (e.key.length === 1) {
        teclaPresionada = e.key.toUpperCase();
    }
    if (gameOver && e.code === "Enter") {
        resetGame();
    }
});

window.addEventListener("keyup", function(e) {
    keys[e.code] = false;
    // Limpia la letra al soltar la tecla para evitar que quede fija
    if (e.key.length === 1 && e.key.toUpperCase() === teclaPresionada) {
        teclaPresionada = "";
    }
});


setInterval(() => {
    if (!gameOver) {
        const size = 20;
        const randomX = Math.random() * (canvas.width - size);
        bombs.push({
            x: randomX,
            y: -size,
            width: size,
            height: size,
            speed: 3.2 + Math.random() * 2 + (level - 1) * 0.7
        });
    }
}, 950);

setInterval(() => {
    if (!gameOver) {
        const size = 48;
        const randomX = Math.random() * (canvas.width - size);
        logos.push({
            x: randomX,
            y: -size,
            width: size,
            height: size,
            speed: 2.6
        });
    }
}, 6000);

function randomizePlatforms() {
    const rowHeights = [515, 420, 325, 230, 135];

    for (let r = 0; r < rowHeights.length; r++) {
        const leftPlat = platforms[1 + r * 2];
        const rightPlat = platforms[2 + r * 2];
        const baseY = rowHeights[r];

        leftPlat.x = 70 + Math.floor(Math.random() * 280);
        leftPlat.y = baseY + (Math.floor(Math.random() * 19) - 9);

        rightPlat.x = 560 + Math.floor(Math.random() * 310);
        rightPlat.y = baseY + (Math.floor(Math.random() * 19) - 9);
    }

    const topChoice = Math.random() < 0.5 ? platforms[9] : platforms[10];
    bell.x = topChoice.x + (topChoice.baseWidth / 2) - (bell.width / 2);
    bell.y = topChoice.y - bell.height - 16;
}

function updateCuyAnimation() {
    if (!player.grounded) {
        player.frameX = player.dy < 0 ? 2 : 3;
    } else if (player.dx !== 0) {
        if (player.gameFrame % player.staggerFrames === 0) {
            player.frameX = player.frameX === 1 ? 0 : 1;
        }
    } else {
        player.frameX = 0;
    }

    if (player.gameFrame % (player.staggerFrames * 2) === 0) {
        player.frameY = player.frameY === 0 ? 1 : 0;
    }
    player.gameFrame++;
}

function drawBell(x, y, width, height) {
    const cx = x + width / 2;
    ctx.save();

    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.arc(cx, y + height - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, y + 8);
    ctx.quadraticCurveTo(cx, y - 2, cx + 10, y + 8);
    ctx.lineTo(x + width - 2, y + height - 8);
    ctx.lineTo(x + 2, y + height - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, y + 3, 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawInstituteLogo(x, y, size) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const rOuter = size * 0.44;
    const rRed = size * 0.31;
    const rCream = size * 0.25;

    ctx.save();

    const teeth = 12;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#901116";
    ctx.lineWidth = 1.5;

    for (let i = 0; i < teeth; i++) {
        const angle = (i * Math.PI * 2) / teeth;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.fillRect(-3, -rOuter - 3, 6, 6);
        ctx.strokeRect(-3, -rOuter - 3, 6, 6);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#C81D25";
    ctx.beginPath();
    ctx.arc(cx, cy, rRed, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#faf9e1";
    ctx.strokeStyle = "#403F9C";
    ctx.beginPath();
    ctx.arc(cx, cy, rCream, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#424040";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("IESTP", cx, y + size - 3);

    ctx.restore();
}

function nextLevel() {
    level++;
    score += 100;
    player.x = 120;
    player.y = 540;
    player.dx = 0;
    player.dy = 0;
    bombs = [];
    invulnerable = 60;

    randomizePlatforms();

    bonusText = "¡NIVEL " + level + "!";
    bonusTimer = 85;
    bonusX = canvas.width / 2 - 50;
    bonusY = 140;
}

function resetGame() {
    player.x = 120;
    player.y = 540;
    player.dx = 0;
    player.dy = 0;
    player.facingRight = true;
    bombs = [];
    logos = [];
    score = 0;
    lives = 3;
    level = 1;
    invulnerable = 0;
    bonusTimer = 0;
    gameOver = false;

    buildInitialPlatforms();
    update();
}

function update() {
    if (gameOver) {
        drawGameOver();
        return;
    }

    if (invulnerable > 0) invulnerable--;
    if (bonusTimer > 0) {
        bonusTimer--;
        bonusY -= 0.6;
    }

    const time = Date.now() * (0.0032 + (level - 1) * 0.0005);
    platforms.forEach(plat => {
        if (plat.dynamic) {
            const centerX = plat.x + plat.width / 2;
            plat.width = plat.baseWidth + Math.sin(time + plat.phase) * plat.amp;
            plat.x = centerX - plat.width / 2;
        }
    });

    if (keys["ArrowRight"]) {
        player.dx = player.speed;
        player.facingRight = true;
    } else if (keys["ArrowLeft"]) {
        player.dx = -player.speed;
        player.facingRight = false;
    } else {
        player.dx = 0;
    }

    if ((keys["ArrowUp"] || keys["Space"]) && player.grounded) {
        player.dy = player.jumpPower;
        player.grounded = false;
    }

    player.dy += gravity;
    player.x += player.dx;
    player.y += player.dy;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.grounded = false;
    platforms.forEach(plat => {
        if (
            player.x < plat.x + plat.width &&
            player.x + player.width > plat.x &&
            player.y + player.height > plat.y &&
            player.y + player.height < plat.y + plat.height + player.dy &&
            player.dy >= 0
        ) {
            player.grounded = true;
            player.dy = 0;
            player.y = plat.y - player.height;
        }
    });

    if (
        player.x < bell.x + bell.width &&
        player.x + player.width > bell.x &&
        player.y < bell.y + bell.height &&
        player.y + player.height > bell.y
    ) {
        nextLevel();
    }

    updateCuyAnimation();

    for (let i = bombs.length - 1; i >= 0; i--) {
        let b = bombs[i];
        b.y += b.speed;

        if (
            invulnerable === 0 &&
            player.x + 6 < b.x + b.width &&
            player.x + player.width - 6 > b.x &&
            player.y + 6 < b.y + b.height &&
            player.y + player.height - 4 > b.y
        ) {
            bombs.splice(i, 1);
            lives--;
            invulnerable = 60;
            if (lives <= 0) {
                gameOver = true;
            }
            continue;
        }

        if (b.y > canvas.height) {
            bombs.splice(i, 1);
            score += 10;
        }
    }

    for (let i = logos.length - 1; i >= 0; i--) {
        let l = logos[i];
        l.y += l.speed;

        if (
            player.x < l.x + l.width &&
            player.x + player.width > l.x &&
            player.y < l.y + l.height &&
            player.y + player.height > l.y &&
            teclaPresionada === letraObjetivo
        ) {
            lives += 1;
            bonusText = "+1 VIDA (" + letraObjetivo + ")";
            bonusTimer = 60;
            bonusX = player.x;
            bonusY = player.y - 10;
            logos.splice(i, 1);

            // Cambiar a una nueva letra aleatoria para el siguiente logo
            letraObjetivo = abecedario[Math.floor(Math.random() * abecedario.length)];
            teclaPresionada = "";
            continue;
        }

        if (l.y > canvas.height) {
            logos.splice(i, 1);
        }
    }


    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    platforms.forEach(plat => {
        ctx.fillStyle = plat.color;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    });

    drawBell(bell.x, bell.y, bell.width, bell.height);

    if (invulnerable % 10 < 5) {
        ctx.save();
        const drawW = 58;
        const drawH = 58;
        const offsetX = (drawW - player.width) / 2;
        const offsetY = drawH - player.height - 4;

        if (cuySprite.complete && cuySprite.naturalWidth > 0) {
            if (!player.facingRight) {
                ctx.translate(player.x + player.width / 2, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    cuySprite,
                    player.frameX * player.spriteWidth,
                    player.frameY * player.spriteHeight,
                    player.spriteWidth,
                    player.spriteHeight,
                    -drawW / 2,
                    player.y - offsetY,
                    drawW,
                    drawH
                );
            } else {
                ctx.drawImage(
                    cuySprite,
                    player.frameX * player.spriteWidth,
                    player.frameY * player.spriteHeight,
                    player.spriteWidth,
                    player.spriteHeight,
                    player.x - offsetX,
                    player.y - offsetY,
                    drawW,
                    drawH
                );
            }
        } else {
            ctx.fillStyle = "#b45309";
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
        ctx.restore();
    }

    bombs.forEach(b => {
        ctx.fillStyle = "#11111b";
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Dibujar logos del instituto con su letra objetivo encima
    logos.forEach(l => {
        drawInstituteLogo(l.x, l.y, l.width);

        // Etiqueta con la letra que se debe presionar
        ctx.fillStyle = "#11111b";
        ctx.fillRect(l.x + l.width / 2 - 14, l.y - 26, 28, 22);
        ctx.fillStyle = "#f9e2af";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(letraObjetivo, l.x + l.width / 2, l.y - 10);
        ctx.textAlign = "left";
    });


    if (bonusTimer > 0) {
        ctx.fillStyle = "#C81D25";
        ctx.font = "bold 22px Arial";
        ctx.fillText(bonusText, bonusX, bonusY);
    }

    ctx.fillStyle = "#11111b";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Puntos: " + score, 25, 35);
    ctx.fillText("Vidas: " + lives, 25, 65);
    ctx.fillText("Nivel: " + level, canvas.width - 120, 35);
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Arial";
    ctx.textAlign = "center";
    ctx.fillText("¡JUEGO TERMINADO!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "22px Arial";
    ctx.fillText("Nivel alcanzado: " + level + "  |  Puntaje final: " + score, canvas.width / 2, canvas.height / 2 + 25);
    ctx.fillText("Presiona ENTER para volver a jugar", canvas.width / 2, canvas.height / 2 + 65);
    ctx.textAlign = "left";
}

update();
