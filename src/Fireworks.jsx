import { useEffect, useRef } from 'react';

const Fireworks = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const particles = [];
    const rockets = [];

    // Helper: Random number in range
    const random = (min, max) => Math.random() * (max - min) + min;

    // Helper: Random Color
    const getRandomColor = () => `hsl(${Math.random() * 360}, 100%, 60%)`;

    class Rocket {
      constructor(targetX, targetY) {
        this.x = targetX !== undefined ? targetX : random(0, canvas.width);
        this.y = canvas.height;
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = getRandomColor();
        
        // If target is set (click), calculate velocity to reach there roughly
        if (targetX !== undefined && targetY !== undefined) {
          const angle = Math.atan2(targetY - this.y, targetX - this.x);
          const speed = 15; // Constant speed for clicked rockets
          this.velocity = {
            x: Math.cos(angle) * (speed * 0.5), // Adjust horizontal speed
            y: Math.sin(angle) * speed
          };
          this.isTargeted = true;
        } else {
           // Random auto launch
          this.velocity = {
            x: random(-3, 3),
            y: random(-10, -15)
          };
          this.isTargeted = false;
        }
        
        this.gravity = 0.2;
        this.alpha = 1;
        this.history = [];
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Explode logic
        if (this.isTargeted) {
          // If close to target or starts falling
          if (this.velocity.y >= 0 || this.y <= this.targetY) {
            return true; // Explode
          }
        } else {
          // Auto rockets explode when they start falling
          if (this.velocity.y >= 0) {
            return true; // Explode
          }
        }
        return false;
      }
    }

    class Particle {
      constructor(x, y, color, type = 'default') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.alpha = 1;
        this.decay = random(0.01, 0.03);

        // Physics based on type
        if (this.type === 'sparkle') {
          const angle = random(0, Math.PI * 2);
          const speed = random(1, 4);
          this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          };
          this.gravity = 0.05;
          this.friction = 0.98;
          this.flicker = true;
        } else if (this.type === 'ring') {
            const angle = random(0, Math.PI * 2);
            const speed = 6; // Consistent speed for ring
            this.velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            this.gravity = 0.1;
            this.friction = 0.96;
        } else {
          // Default burst
          const angle = random(0, Math.PI * 2);
          const speed = random(1, 10);
          this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          };
          this.gravity = 0.1;
          this.friction = 0.95;
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.flicker ? (Math.random() < 0.5 ? this.alpha : 0.2) : this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.type === 'sparkle' ? 1 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
      }
    }

    const createExplosion = (x, y, color) => {
      const types = ['default', 'sparkle', 'ring', 'mixed'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let particleCount = 100;
      if (type === 'ring') particleCount = 60;

      for (let i = 0; i < particleCount; i++) {
        let pColor = color;
        if (type === 'mixed') {
             pColor = getRandomColor();
        }
        
        if (type === 'ring') {
            // Ensure particles form a circle initially (handled in constructor with fixed speed)
             particles.push(new Particle(x, y, pColor, 'ring'));
        } else {
             particles.push(new Particle(x, y, pColor, type === 'mixed' ? 'default' : type));
        }
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Slightly darker for better trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random auto launch
      if (Math.random() < 0.02) {
        rockets.push(new Rocket());
      }

      // Update Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.draw();
        const shouldExplode = rocket.update();
        if (shouldExplode) {
          createExplosion(rocket.x, rocket.y, rocket.color);
          rockets.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.draw();
        particle.update();
        if (particle.alpha <= 0) {
          particles.splice(i, 1);
        }
      }
    };

    const handleInteraction = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      
      // Launch a rocket to the specific point
      rockets.push(new Rocket(x, y));
      
      // Optional: Multiple rockets for more fun on click
      if (Math.random() > 0.5) {
          setTimeout(() => rockets.push(new Rocket(x + random(-50, 50), y + random(-50, 50))), 100);
      }
    };

    canvas.addEventListener('mousedown', handleInteraction);
    canvas.addEventListener('touchstart', handleInteraction);

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleInteraction);
      canvas.removeEventListener('touchstart', handleInteraction);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1, 
        background: 'black',
        cursor: 'pointer'
      }}
    />
  );
};

export default Fireworks;