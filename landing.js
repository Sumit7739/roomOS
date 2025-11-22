// ===== 3D BACKGROUND ANIMATION =====
class ParticleBackground {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;
        this.connectionDistance = 150;
        this.mouse = { x: null, y: null, radius: 150 };
        
        this.init();
        this.animate();
        this.setupEventListeners();
    }
    
    init() {
        this.resize();
        this.createParticles();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
            this.ctx.fill();
        });
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouse.radius) {
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    particle.vx -= Math.cos(angle) * force * 0.2;
                    particle.vy -= Math.sin(angle) * force * 0.2;
                }
            }
            
            // Boundary check
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw gradient background
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 3, 0,
            this.canvas.width / 2, this.canvas.height / 3, this.canvas.width
        );
        gradient.addColorStop(0, 'rgba(26, 26, 46, 1)');
        gradient.addColorStop(0.5, 'rgba(10, 10, 15, 1)');
        gradient.addColorStop(1, 'rgba(5, 5, 8, 1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawConnections();
        this.drawParticles();
        this.updateParticles();
        
        requestAnimationFrame(() => this.animate());
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
}

// ===== NAVIGATION =====
class Navigation {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        
        this.init();
    }
    
    init() {
        this.setupScrollEffect();
        this.setupMobileMenu();
        this.setupSmoothScroll();
    }
    
    setupScrollEffect() {
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }
    
    setupMobileMenu() {
        this.mobileMenuBtn.addEventListener('click', () => {
            this.mobileMenu.classList.toggle('active');
            this.animateMenuButton();
        });
        
        this.mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.mobileMenu.classList.remove('active');
                this.resetMenuButton();
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.mobileMenu.contains(e.target) && !this.mobileMenuBtn.contains(e.target)) {
                this.mobileMenu.classList.remove('active');
                this.resetMenuButton();
            }
        });
    }
    
    animateMenuButton() {
        const spans = this.mobileMenuBtn.querySelectorAll('span');
        if (this.mobileMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translateY(8px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
        } else {
            this.resetMenuButton();
        }
    }
    
    resetMenuButton() {
        const spans = this.mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
    
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// ===== DEMO SCREENSHOT SWITCHER =====
class DemoSwitcher {
    constructor() {
        this.screenshots = document.querySelectorAll('.screenshot');
        this.buttons = document.querySelectorAll('.demo-btn');
        this.currentIndex = 0;
        this.autoPlayInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupButtons();
        this.startAutoPlay();
    }
    
    setupButtons() {
        this.buttons.forEach(button => {
            button.addEventListener('click', () => {
                const screenshotId = button.getAttribute('data-screenshot');
                this.switchScreenshot(parseInt(screenshotId) - 1);
                this.stopAutoPlay();
            });
        });
    }
    
    switchScreenshot(index) {
        // Remove active class from all
        this.screenshots.forEach(s => s.classList.remove('active'));
        this.buttons.forEach(b => b.classList.remove('active'));
        
        // Add active class to selected
        this.screenshots[index].classList.add('active');
        this.buttons[index].classList.add('active');
        
        this.currentIndex = index;
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.screenshots.length;
            this.switchScreenshot(this.currentIndex);
        }, 4000);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }
}

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, this.observerOptions);
        
        // Observe all feature cards
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
            observer.observe(card);
        });
        
        // Observe pricing cards
        document.querySelectorAll('.pricing-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`;
            observer.observe(card);
        });
        
        // Observe demo features
        document.querySelectorAll('.demo-feature').forEach((feature, index) => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateX(-30px)';
            feature.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
            observer.observe(feature);
        });
    }
}

// ===== FLOATING CARDS PARALLAX =====
class FloatingCards {
    constructor() {
        this.cards = document.querySelectorAll('.floating-card');
        this.init();
    }
    
    init() {
        window.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            this.cards.forEach((card, index) => {
                const speed = (index + 1) * 0.5;
                const x = (mouseX - 0.5) * speed * 20;
                const y = (mouseY - 0.5) * speed * 20;
                
                card.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
}

// ===== STATS COUNTER ANIMATION =====
class StatsCounter {
    constructor() {
        this.stats = document.querySelectorAll('.stat-number');
        this.hasAnimated = false;
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.animateCounters();
                    this.hasAnimated = true;
                }
            });
        }, { threshold: 0.5 });
        
        this.stats.forEach(stat => observer.observe(stat));
    }
    
    animateCounters() {
        this.stats.forEach(stat => {
            const text = stat.textContent;
            const hasPlus = text.includes('+');
            const hasDollar = text.includes('$');
            const hasK = text.includes('K');
            const hasM = text.includes('M');
            
            let target = parseInt(text.replace(/[^0-9]/g, ''));
            
            if (hasK) target *= 1000;
            if (hasM) target *= 1000000;
            
            const duration = 2000;
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                
                let displayValue = Math.floor(current);
                
                if (hasM) {
                    displayValue = (displayValue / 1000000).toFixed(1) + 'M';
                } else if (hasK) {
                    displayValue = (displayValue / 1000).toFixed(0) + 'K';
                }
                
                stat.textContent = (hasDollar ? '$' : '') + displayValue + (hasPlus ? '+' : '');
            }, duration / steps);
        });
    }
}

// ===== VIDEO PLAYER =====
class VideoPlayer {
    constructor() {
        this.videoPlaceholder = document.querySelector('.video-placeholder');
        this.playButton = document.querySelector('.play-button');
        
        this.init();
    }
    
    init() {
        if (this.videoPlaceholder) {
            this.videoPlaceholder.addEventListener('click', () => {
                // In a real implementation, this would open a modal with the actual video
                this.showVideoModal();
            });
        }
    }
    
    showVideoModal() {
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
        `;
        
        content.innerHTML = `
            <h2 style="font-size: 2rem; margin-bottom: 20px; font-family: 'Space Grotesk', sans-serif;">Demo Video Coming Soon!</h2>
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 1.2rem;">
                We're working on creating an amazing demo video for you.<br>
                In the meantime, feel free to <a href="web/index.html" style="color: #667eea; text-decoration: none; font-weight: 600;">launch the app</a> and explore!
            </p>
            <p style="margin-top: 30px; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">Click anywhere to close</p>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });
        
        // Animate in
        modal.style.opacity = '0';
        setTimeout(() => modal.style.transition = 'opacity 0.3s', 10);
        setTimeout(() => modal.style.opacity = '1', 20);
    }
}

// ===== CURSOR TRAIL EFFECT =====
class CursorTrail {
    constructor() {
        this.coords = [];
        this.circles = [];
        this.colors = [
            'rgba(102, 126, 234, 0.3)',
            'rgba(118, 75, 162, 0.3)',
            'rgba(240, 147, 251, 0.3)'
        ];
        
        this.init();
    }
    
    init() {
        // Create circles
        for (let i = 0; i < 12; i++) {
            const circle = document.createElement('div');
            circle.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: ${this.colors[i % this.colors.length]};
                pointer-events: none;
                z-index: 9999;
                transition: transform 0.1s;
                transform: translate(-50%, -50%) scale(0);
            `;
            document.body.appendChild(circle);
            this.circles.push(circle);
            this.coords.push({ x: 0, y: 0 });
        }
        
        // Track mouse
        window.addEventListener('mousemove', (e) => {
            this.coords[0] = { x: e.clientX, y: e.clientY };
        });
        
        // Animate
        this.animate();
    }
    
    animate() {
        let x = this.coords[0].x;
        let y = this.coords[0].y;
        
        this.circles.forEach((circle, index) => {
            circle.style.left = x + 'px';
            circle.style.top = y + 'px';
            circle.style.transform = `translate(-50%, -50%) scale(${(this.circles.length - index) / this.circles.length})`;
            
            if (index < this.coords.length - 1) {
                const next = this.coords[index + 1];
                x += (next.x - x) * 0.3;
                y += (next.y - y) * 0.3;
                this.coords[index + 1] = { x, y };
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ===== MODAL HANDLING =====
function openDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDownloadModal();
    }
});

// Expose functions to global scope
window.openDownloadModal = openDownloadModal;
window.closeDownloadModal = closeDownloadModal;

// ===== INITIALIZE EVERYTHING =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    new ParticleBackground();
    new Navigation();
    new DemoSwitcher();
    new ScrollAnimations();
    new FloatingCards();
    new StatsCounter();
    new VideoPlayer();
    
    // Optional: Cursor trail (can be disabled if too distracting)
    if (window.innerWidth > 768) {
        new CursorTrail();
    }
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s';
        document.body.style.opacity = '1';
    }, 100);
    
    console.log('%c🚀 RoomOS Landing Page Loaded!', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%cBuilt with ❤️ using Vanilla JavaScript', 'color: #764ba2; font-size: 14px;');
});
