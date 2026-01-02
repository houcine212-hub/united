 // --- حالة اللعبة ---
        let gameState = {
            rulerName: "", country: "", email: "",
            gdp: 60000, // رصيد كافي لتجربة النووي
            dailyIncome: 10, attack: 0, defense: 0, inventory: []
        };
        let incomeInterval;

        window.onload = function() {
            const saved = localStorage.getItem('unitedStatsV3');
            if (saved) { gameState = JSON.parse(saved); showGameScreen(); }
        };

        function startGame() {
            const name = document.getElementById('ruler-name').value;
            const country = document.getElementById('country-select').value;
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            if (!name || !country || !email || !pass) { alert("املأ جميع البيانات"); return; }
            gameState.rulerName = name; gameState.country = country; gameState.email = email;
            saveGame(); showGameScreen();
        }

        function showGameScreen() {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            updateUI();
            if (incomeInterval) clearInterval(incomeInterval);
            incomeInterval = setInterval(() => { gameState.gdp += gameState.dailyIncome; saveGame(); updateUI(); }, 1000);
        }

        function buyItem(name, price, income, atk, def, type) {
            if (gameState.gdp >= price) {
                gameState.gdp -= price;
                gameState.inventory.push(name);
                gameState.dailyIncome += income;
                gameState.attack += atk;
                gameState.defense += def;
                saveGame();
                updateUI();
                
                // تحديد نوع الأنيميشن
                if (type === 'nuke') {
                    startNukeAnimation();
                } else {
                    playNormalAnimation(type);
                }
            } else {
                alert("GDP غير كافي!");
            }
        }

        function updateUI() {
            document.getElementById('display-ruler').innerText = gameState.rulerName;
            document.getElementById('display-country').innerText = gameState.country;
            document.getElementById('gdp-display').innerText = gameState.gdp.toLocaleString();
            document.getElementById('income-display').innerText = gameState.dailyIncome.toLocaleString();
            document.getElementById('attack-display').innerText = gameState.attack;
            document.getElementById('defense-display').innerText = gameState.defense;
            document.getElementById('total-power-display').innerText = gameState.attack + gameState.defense;
            const list = document.getElementById('inventory-list');
            list.innerHTML = gameState.inventory.length ? gameState.inventory.map(i => `<span>• ${i} </span>`).join('') : "لا يوجد";
        }

        function saveGame() { localStorage.setItem('unitedStatsV3', JSON.stringify(gameState)); }
        function logout() { localStorage.removeItem('unitedStatsV3'); location.reload(); }

        // --- الأنيميشن العادي ---
        function playNormalAnimation(type) {
            const modal = document.getElementById('animation-modal');
            const gunBox = document.getElementById('gun-anim-box');
            const chartBox = document.getElementById('chart-anim-box');
            modal.classList.add('active');
            gunBox.style.display = 'none'; gunBox.classList.remove('shoot-anim');
            chartBox.style.display = 'none'; chartBox.classList.remove('grow-anim');

            if (type === 'weapon') {
                gunBox.style.display = 'block'; setTimeout(() => gunBox.classList.add('shoot-anim'), 100);
            } else if (type === 'economy') {
                chartBox.style.display = 'flex'; setTimeout(() => chartBox.classList.add('grow-anim'), 100);
            }
            setTimeout(() => { modal.classList.remove('active'); }, 2500);
        }

        // ==========================================
        // === محرك الانفجار النووي (HTML Canvas) ===
        // ==========================================
        
        const canvas = document.getElementById('nuke-canvas');
        const ctx = canvas.getContext('2d');
        let width, height, centerX, centerY;
        let particles = [];
        let animationFrameId;
        let time = 0;

        function resizeCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            centerX = width / 2;
            centerY = height / 2;
        }

        class Particle {
            constructor(type) {
                this.type = type; // 'spark', 'smoke', 'shock'
                this.x = centerX;
                this.y = centerY;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * (type === 'spark' ? 20 : 5);
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.life = 1.0;
                this.decay = Math.random() * 0.01 + 0.005;
                this.size = Math.random() * 5 + 1;
                this.color = type === 'spark' 
                    ? `hsl(${Math.random()*60 + 10}, 100%, 50%)` // برتقالي وأصفر
                    : `rgba(50, 50, 50, 0.5)`; // دخان رمادي
                
                if (type === 'smoke') {
                    this.vy -= 2; // الدخان يصعد للأعلى
                    this.size = Math.random() * 20 + 10;
                    this.decay = 0.002;
                }
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
                
                // جاذبية واحتكاك
                if (this.type === 'spark') {
                    this.vx *= 0.95; 
                    this.vy *= 0.95;
                    this.vy += 0.1; // جاذبية خفيفة
                } else {
                    this.vx *= 0.98;
                    this.size += 0.5; // الدخان يتمدد
                }
            }
            draw(ctx) {
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function startNukeAnimation() {
            resizeCanvas();
            canvas.style.display = 'block';
            particles = [];
            time = 0;
            
            // تهيئة الجسيمات
            for(let i=0; i<300; i++) particles.push(new Particle('spark'));
            for(let i=0; i<100; i++) particles.push(new Particle('smoke'));

            cancelAnimationFrame(animationFrameId);
            loop();
        }

        function loop() {
            time++;
            
            // 1. مسح الشاشة (تأثير Motion Blur خفيف عبر مسح غير كامل)
            ctx.fillStyle = 'rgba(0, 0, 20, 0.2)'; // خلفية زرقاء داكنة جداً
            ctx.fillRect(0, 0, width, height);

            // اهتزاز الكاميرا (Camera Shake)
            let shake = 0;
            if (time < 50) shake = (50 - time) * 0.5;
            ctx.save();
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

            // 2. الوميض الأولي (Flash)
            if (time < 5) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(-10, -10, width+20, height+20);
            }

            // 3. كرة الطاقة المتوسعة (Energy Sphere)
            let sphereRadius = time * 8;
            if (time < 100) {
                let gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sphereRadius);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.8)');
                gradient.addColorStop(0.6, 'rgba(255, 140, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0)'); // شفاف في الحواف

                ctx.globalAlpha = 1 - (time / 120); // يتلاشى مع الوقت
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            // 4. موجة الصدمة (Shockwave Ring)
            let shockRadius = time * 20;
            if (shockRadius < width * 1.5) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, shockRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - time/60})`;
                ctx.lineWidth = 50 - time/2;
                if (ctx.lineWidth < 0) ctx.lineWidth = 0;
                ctx.stroke();
            }

            // 5. رسم وتحديث الجسيمات
            particles.forEach((p, index) => {
                p.update();
                p.draw(ctx);
                if (p.life <= 0) particles.splice(index, 1);
            });

            ctx.restore(); // إلغاء تأثير الاهتزاز للإطار التالي

            // إنهاء الأنيميشن
            if (time < 250) {
                animationFrameId = requestAnimationFrame(loop);
            } else {
                canvas.style.display = 'none';
                ctx.clearRect(0,0,width,height);
            }
        }