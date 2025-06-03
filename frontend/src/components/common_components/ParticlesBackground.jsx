import { useEffect, useRef } from 'react';
import { useColorModeValue } from '@chakra-ui/react';

const ParticlesBackground = () => {
  const particlesRef = useRef(null);
  const particleColor = useColorModeValue('#000000', '#ffffff');
  const lineColor = useColorModeValue('#000000', '#ffffff');

  useEffect(() => {
    // Import particles.js from node_modules
    const loadParticles = async () => {
      try {
        // Import the installed particles.js
        await import('particles.js');
        
        // Wait a bit for the script to initialize
        setTimeout(() => {
          initParticles();
        }, 100);
      } catch (error) {
        console.error('Failed to load particles.js:', error);
        // Fallback to CDN
        loadFromCDN();
      }
    };

    const loadFromCDN = () => {
      if (window.particlesJS) {
        initParticles();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
      script.onload = () => {
        setTimeout(() => {
          initParticles();
        }, 100);
      };
      document.head.appendChild(script);
    };

    const initParticles = () => {
      console.log('initParticles called, particlesJS available:', !!window.particlesJS, 'ref current:', !!particlesRef.current);
      if (!window.particlesJS || !particlesRef.current) return;

      // Clear any existing particles
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom.forEach(pjs => {
          if (pjs && pjs.pJS && pjs.pJS.fn && pjs.pJS.fn.vendors) {
            pjs.pJS.fn.vendors.destroypJS();
          }
        });
        window.pJSDom = [];
      }

      window.particlesJS(particlesRef.current.id, {
        particles: {
          number: {
            value: 50,
            density: {
              enable: true,
              value_area: 800
            }
          },
          color: {
            value: particleColor
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: particleColor
            }
          },
          opacity: {
            value: 0.3,
            random: false,
            anim: {
              enable: false,
              speed: 1,
              opacity_min: 0.1,
              sync: false
            }
          },
          size: {
            value: 2,
            random: true,
            anim: {
              enable: false,
              speed: 40,
              size_min: 0.1,
              sync: false
            }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: lineColor,
            opacity: 0.2,
            width: 1
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200
            }
          }
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: false,
              mode: "repulse"
            },
            onclick: {
              enable: false,
              mode: "push"
            },
            resize: true
          }
        },
        retina_detect: true
      });
    };

    loadParticles();

    console.log('ParticlesBackground: Component mounted, particleColor:', particleColor, 'lineColor:', lineColor);

    // Cleanup function
    return () => {
      if (window.pJSDom && window.pJSDom[0]) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
      }
    };
  }, [particleColor, lineColor]);

  return (
    <div
      id="particles-js"
      ref={particlesRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    />
  );
};

export default ParticlesBackground;