import { useEffect } from 'react';
import { useColorModeValue } from '@chakra-ui/react';

const ParticlesBackground = () => {
  const particleColor = useColorModeValue('#000000', '#ffffff');
  const lineColor = useColorModeValue('#000000', '#ffffff');

  useEffect(() => {
    const loadTsParticles = async () => {
      try {
        // Dynamic import of tsparticles
        const { tsParticles } = await import('tsparticles-engine');
        const { loadSlim } = await import('tsparticles-slim');

        // Load slim preset (includes basic functionality)
        await loadSlim(tsParticles);

        // Initialize particles
        await tsParticles.load('tsparticles', {
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
              type: "circle"
            },
            opacity: {
              value: 0.3,
              random: false
            },
            size: {
              value: 2,
              random: true
            },
            links: {
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
              outMode: "out",
              bounce: false,
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detectsOn: "canvas",
            events: {
              onHover: {
                enable: false,
                mode: "repulse"
              },
              onClick: {
                enable: false,
                mode: "push"
              },
              resize: true
            }
          },
          detectRetina: true,
          background: {
            color: "transparent"
          }
        });
      } catch (error) {
        console.error('Failed to load tsparticles:', error);
      }
    };

    loadTsParticles();

    // Cleanup function
    return () => {
      // tsParticles automatically cleans up when the container is removed
      const container = document.getElementById('tsparticles');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [particleColor, lineColor]);

  return (
    <div
      id="tsparticles"
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