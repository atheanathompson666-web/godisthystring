// =============================================================================
// HELIOCENTRIC IMMERSION PROTOCOL v3.0
// Advanced 3D Solar System with Three.js, NASA-accurate orbital data, 
// parallax stars, orbit trails, and deep-space immersion
// =============================================================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

class SolarSystemScene {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.launched = false;
    this.targetPlanet = null;
    this.hovered = null;

    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 120, 200);
    this.camera.lookAt(0, 0, 0);

    // Controls
    this.controls = {
      isDragging: false,
      previousMousePosition: { x: 0, y: 0 },
      rotation: { x: 0, y: 0 },
      zoom: 1,
      targetZoom: 1,
      velocity: { x: 0, y: 0 }
    };

    // Scene data
    this.celestialBodies = [];
    this.trailLines = new Map();
    this.stars = [];
    this.nebula = null;
    this.time = 0;
    this.stats = { speed: 0, distance: '-', zoom: 1.0 };

    // Initialize
    this.setupLighting();
    this.createStarfield();
    this.createNebula();
    this.createSolarSystem();
    this.setupInteractivity();
    this.animate();
    this.setupEventListeners();
  }

  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Sun light source
    const sunLight = new THREE.PointLight(0xfdb813, 2, 0);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0x0088ff, 0.2);
    fillLight.position.set(100, 100, 100);
    this.scene.add(fillLight);
  }

  createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const distance = 5000 + Math.random() * 10000;

      positions[i] = distance * Math.sin(phi) * Math.cos(angle);
      positions[i + 1] = distance * Math.sin(phi) * Math.sin(angle);
      positions[i + 2] = distance * Math.cos(phi);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 8,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  createNebula() {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;

    const ctx = textureCanvas.getContext('2d');
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;

    // Create gradient nebula texture
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.random() * 255;
      data[i] = Math.random() * 100 + 50;      // R
      data[i + 1] = Math.random() * 50;        // G
      data[i + 2] = Math.random() * 150 + 100; // B
      data[i + 3] = Math.random() * 50;        // A
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(textureCanvas);

    const nebulaGeometry = new THREE.SphereGeometry(8000, 32, 32);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });

    this.nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    this.scene.add(this.nebula);
  }

  createSolarSystem() {
    // NASA-accurate orbital data (scaled for visualization)
    const planetsData = [
      {
        name: 'Mercury',
        size: 3.8,
        color: 0x8c7853,
        distance: 60,
        speed: 0.04,
        tilt: 0.122,
        moons: [],
        temp: '167°C avg',
        mass: '3.3 × 10²³ kg',
        type: 'Terrestrial'
      },
      {
        name: 'Venus',
        size: 9.5,
        color: 0xffc649,
        distance: 110,
        speed: 0.015,
        tilt: 177.36,
        moons: [],
        temp: '464°C avg',
        mass: '4.87 × 10²⁴ kg',
        type: 'Terrestrial'
      },
      {
        name: 'Earth',
        size: 10,
        color: 0x4a90e2,
        distance: 160,
        speed: 0.01,
        tilt: 23.44,
        moons: [{ name: 'Luna', size: 2.7, distance: 20, speed: 0.1 }],
        temp: '15°C avg',
        mass: '5.97 × 10²⁴ kg',
        type: 'Terrestrial'
      },
      {
        name: 'Mars',
        size: 5.3,
        color: 0xe27b58,
        distance: 240,
        speed: 0.008,
        tilt: 25.19,
        moons: [
          { name: 'Phobos', size: 0.6, distance: 30, speed: 0.08 },
          { name: 'Deimos', size: 0.3, distance: 45, speed: 0.05 }
        ],
        temp: '-65°C avg',
        mass: '6.42 × 10²³ kg',
        type: 'Terrestrial'
      },
      {
        name: 'Jupiter',
        size: 50,
        color: 0xc88b3a,
        distance: 400,
        speed: 0.002,
        tilt: 3.13,
        moons: [
          { name: 'Io', size: 3.6, distance: 80, speed: 0.05 },
          { name: 'Europa', size: 3.1, distance: 100, speed: 0.04 },
          { name: 'Ganymede', size: 5.3, distance: 120, speed: 0.03 },
          { name: 'Callisto', size: 4.8, distance: 140, speed: 0.025 }
        ],
        temp: '-110°C avg',
        mass: '1.90 × 10²⁷ kg',
        type: 'Gas Giant'
      },
      {
        name: 'Saturn',
        size: 42,
        color: 0xf4d47f,
        distance: 550,
        speed: 0.0009,
        tilt: 26.73,
        hasRings: true,
        moons: [
          { name: 'Titan', size: 5.1, distance: 100, speed: 0.035 },
          { name: 'Rhea', size: 1.5, distance: 130, speed: 0.02 }
        ],
        temp: '-140°C avg',
        mass: '5.68 × 10²⁶ kg',
        type: 'Gas Giant'
      },
      {
        name: 'Uranus',
        size: 17,
        color: 0x4fd0e7,
        distance: 700,
        speed: 0.0004,
        tilt: 97.77,
        moons: [
          { name: 'Titania', size: 1.2, distance: 90, speed: 0.025 },
          { name: 'Oberon', size: 1.2, distance: 110, speed: 0.02 }
        ],
        temp: '-195°C avg',
        mass: '8.68 × 10²⁵ kg',
        type: 'Ice Giant'
      },
      {
        name: 'Neptune',
        size: 16,
        color: 0x4166f5,
        distance: 850,
        speed: 0.0001,
        tilt: 28.32,
        moons: [
          { name: 'Triton', size: 2.7, distance: 100, speed: 0.02 }
        ],
        temp: '-200°C avg',
        mass: '1.02 × 10²⁶ kg',
        type: 'Ice Giant'
      }
    ];

    // Create Sun
    const sunGeometry = new THREE.IcosahedronGeometry(25, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = {
      name: 'Sol',
      size: 25,
      color: 0xfdb813,
      distance: 0,
      type: 'Star',
      temp: '5,500°C surface',
      mass: '1.989 × 10³⁰ kg',
      radius: 696000 + ' km'
    };
    this.scene.add(sun);
    this.celestialBodies.push(sun);

    // Create planets
    planetsData.forEach((data, idx) => {
      const planet = this.createPlanet(data);
      planet.userData = data;
      this.scene.add(planet);
      this.celestialBodies.push(planet);

      // Create orbit line
      this.createOrbitLine(data.distance);

      // Create moons
      if (data.moons && data.moons.length > 0) {
        data.moons.forEach(moonData => {
          const moon = this.createMoon(moonData, planet);
          planet.userData.moonMeshes = planet.userData.moonMeshes || [];
          planet.userData.moonMeshes.push(moon);
          this.scene.add(moon);
        });
      }

      // Initialize trail
      this.trailLines.set(planet, {
        positions: [],
        line: null,
        maxLength: 200
      });
    });
  }

  createPlanet(data) {
    const geometry = new THREE.IcosahedronGeometry(data.size, 32);
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.7,
      metalness: 0.1,
      emissive: data.color,
      emissiveIntensity: 0.1
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.x = THREE.MathUtils.degToRad(data.tilt);
    planet.castShadow = true;
    planet.receiveShadow = true;

    // Store orbital data
    planet.userData.orbitPhase = Math.random() * Math.PI * 2;
    planet.userData.orbitData = data;

    // Add glow
    const glowGeometry = new THREE.IcosahedronGeometry(data.size * 1.3, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: data.color,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    planet.add(glow);

    return planet;
  }

  createMoon(data, parentPlanet) {
    const geometry = new THREE.IcosahedronGeometry(data.size, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0
    });

    const moon = new THREE.Mesh(geometry, material);
    moon.userData = {
      isMoon: true,
      parent: parentPlanet,
      orbitData: data,
      orbitPhase: Math.random() * Math.PI * 2
    };

    return moon;
  }

  createOrbitLine(distance) {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * distance,
          0,
          Math.sin(angle) * distance
        )
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      opacity: 0.15,
      transparent: true
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
  }

  updateOrbits() {
    this.time += 0.0003;

    this.celestialBodies.forEach(body => {
      if (body.userData.orbitData) {
        const data = body.userData.orbitData;
        body.userData.orbitPhase += data.speed;

        body.position.x = Math.cos(body.userData.orbitPhase) * data.distance;
        body.position.z = Math.sin(body.userData.orbitPhase) * data.distance;

        // Rotation
        body.rotation.y += 0.001;

        // Update moons
        if (body.userData.moonMeshes) {
          body.userData.moonMeshes.forEach(moon => {
            moon.userData.orbitPhase += moon.userData.orbitData.speed;
            const moonDist = moon.userData.orbitData.distance;
            moon.position.x = body.position.x + Math.cos(moon.userData.orbitPhase) * moonDist;
            moon.position.y = body.position.y;
            moon.position.z = body.position.z + Math.sin(moon.userData.orbitPhase) * moonDist;
          });
        }

        // Update orbit trail
        this.updateTrail(body);
      }
    });

    // Parallax stars
    if (this.stars) {
      this.stars.rotation.x += 0.00001;
      this.stars.rotation.y += 0.00002;
    }
  }

  updateTrail(body) {
    const trail = this.trailLines.get(body);
    if (!trail) return;

    trail.positions.push(body.position.clone());
    if (trail.positions.length > trail.maxLength) {
      trail.positions.shift();
    }

    // Remove old line
    if (trail.line) this.scene.remove(trail.line);

    // Create new line
    if (trail.positions.length > 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints(trail.positions);
      const material = new THREE.LineBasicMaterial({
        color: body.userData.orbitData.color,
        opacity: 0.4,
        transparent: true,
        linewidth: 2
      });
      trail.line = new THREE.Line(geometry, material);
      this.scene.add(trail.line);
    }
  }

  setupInteractivity() {
    // Raycaster for hover detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    document.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    document.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    document.addEventListener('wheel', (e) => this.onMouseWheel(e), false);
    document.addEventListener('dblclick', () => this.launch(), false);
    document.addEventListener('touchend', (e) => this.onTouchEnd(e), false);

    document.getElementById('launchButton').addEventListener('click', () => this.launch());

    // Planet card clicks
    document.querySelectorAll('.planet-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        this.focusPlanet(target);
      });
    });
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Check hover
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.celestialBodies);

    document.body.style.cursor = 'default';
    this.hovered = null;

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.orbitData) {
        this.hovered = obj;
        document.body.style.cursor = 'pointer';
        this.updateInfoPanel(obj.userData);
      }
    }

    if (this.controls.isDragging) {
      const deltaX = event.clientX - this.controls.previousMousePosition.x;
      const deltaY = event.clientY - this.controls.previousMousePosition.y;

      this.controls.velocity.x = deltaX * 0.01;
      this.controls.velocity.y = deltaY * 0.01;

      this.controls.rotation.y += deltaX * 0.005;
      this.controls.rotation.x += deltaY * 0.005;

      this.controls.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.controls.rotation.x));
    }

    this.controls.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  onMouseDown(event) {
    this.controls.isDragging = true;
  }

  onMouseUp(event) {
    this.controls.isDragging = false;
  }

  onMouseWheel(event) {
    event.preventDefault();
    this.controls.targetZoom *= 1 + (event.deltaY > 0 ? 0.1 : -0.1);
    this.controls.targetZoom = Math.max(0.5, Math.min(8000, this.controls.targetZoom));
  }

  onTouchEnd(event) {
    const now = Date.now();
    if (!this.lastTapTime) this.lastTapTime = 0;
    if (now - this.lastTapTime < 300) {
      this.launch();
    }
    this.lastTapTime = now;
  }

  focusPlanet(targetName) {
    const planet = this.celestialBodies.find(b => 
      b.userData.orbitData && b.userData.orbitData.name.toLowerCase() === targetName
    );
    if (planet) {
      this.targetPlanet = planet;
    }
  }

  launch() {
    if (!this.launched) {
      this.launched = true;
      const panel = document.querySelector('.panel');
      const indicator = document.getElementById('immersionIndicator');

      indicator.classList.add('active');
      panel.classList.add('hidden');

      setTimeout(() => {
        panel.style.display = 'none';
        indicator.classList.remove('active');
      }, 1500);

      // Zoom to first planet
      this.targetPlanet = this.celestialBodies.find(b => 
        b.userData.orbitData && b.userData.orbitData.name === 'Earth'
      );
    }
  }

  updateInfoPanel(data) {
    const infoPanel = document.getElementById('infoPanel');
    const nameEl = document.getElementById('bodyName');
    const infoEl = document.getElementById('bodyInfo');
    const statsEl = document.getElementById('bodyStats');

    nameEl.textContent = data.name || 'Unknown';
    infoEl.textContent = `Type: ${data.type || 'N/A'}`;

    let statsHTML = `
      <div class="stat-line">
        <span class="label">Temperature:</span>
        <span>${data.temp || 'N/A'}</span>
      </div>
      <div class="stat-line">
        <span class="label">Mass:</span>
        <span>${data.mass || 'N/A'}</span>
      </div>
    `;

    if (data.distance > 0) {
      statsHTML += `
        <div class="stat-line">
          <span class="label">Orbit Distance:</span>
          <span>${Math.round(data.distance * 1.496e8 / 1e6)} M km</span>
        </div>
      `;
    }

    statsEl.innerHTML = statsHTML;
    infoPanel.classList.add('active');
  }

  updateCamera() {
    const targetRotationSpeed = 0.02;
    this.controls.rotation.y += this.controls.velocity.x * targetRotationSpeed;
    this.controls.rotation.x += this.controls.velocity.y * targetRotationSpeed;

    this.controls.velocity.x *= 0.95;
    this.controls.velocity.y *= 0.95;

    // Smooth zoom
    this.controls.zoom += (this.controls.targetZoom - this.controls.zoom) * 0.05;

    if (this.targetPlanet && this.launched) {
      const targetPos = this.targetPlanet.position.clone();
      const distance = 100 * this.controls.zoom * 0.1;

      this.camera.position.lerp(
        new THREE.Vector3(
          targetPos.x + Math.cos(this.time) * distance,
          targetPos.y + distance * 0.3,
          targetPos.z + Math.sin(this.time) * distance
        ),
        0.03
      );
      this.camera.lookAt(targetPos);

      this.stats.distance = Math.round(distance);
    } else {
      const radius = 250 * this.controls.zoom * 0.1;
      this.camera.position.x = Math.cos(this.controls.rotation.y) * Math.cos(this.controls.rotation.x) * radius;
      this.camera.position.y = Math.sin(this.controls.rotation.x) * radius;
      this.camera.position.z = Math.sin(this.controls.rotation.y) * Math.cos(this.controls.rotation.x) * radius;
      this.camera.lookAt(0, 0, 0);
    }

    this.stats.zoom = this.controls.zoom.toFixed(1);
    this.stats.speed = Math.round(Math.sqrt(this.controls.velocity.x ** 2 + this.controls.velocity.y ** 2));

    // Update HUD
    document.getElementById('zoom-display').textContent = `${this.stats.zoom}x`;
    document.getElementById('speed-display').textContent = `${this.stats.speed} km/s`;
    document.getElementById('distance-display').textContent = this.stats.distance + ' km';
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.updateOrbits();
    this.updateCamera();

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  new SolarSystemScene();
});
