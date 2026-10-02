// =============================================================================
// HELIOCENTRIC IMMERSION PROTOCOL v3.0
// Advanced 3D Solar System with Three.js, NASA-accurate orbital data, 
// parallax stars, orbit trails, drag-to-rotate, wheel-to-zoom, and deep-space immersion
// =============================================================================

class SolarSystemScene {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.launched = false;
    this.targetPlanet = null;
    this.hovered = null;
    this.lastTapTime = 0;

    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 120, 200);
    this.camera.lookAt(0, 0, 0);

    // Mouse/touch controls
    this.controls = {
      isDragging: false,
      previousMousePosition: { x: 0, y: 0 },
      rotation: { x: 0.3, y: 0 },
      zoom: 1,
      targetZoom: 1,
      velocity: { x: 0, y: 0 }
    };

    // Scene data
    this.celestialBodies = [];
    this.trailLines = new Map();
    this.stars = [];
    this.nebula = null;
    this.sunLight = null;
    this.time = 0;
    this.stats = { speed: 0, distance: '-', zoom: 1.0 };

    // Initialize
    this.setupLighting();
    this.createStarfield();
    this.createNebula();
    this.createGalaxyBackground();
    this.createSolarSystem();
    this.setupInteractivity();
    this.setupEventListeners();
    this.animate();
  }

  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambientLight);

    // Sun as point light source
    this.sunLight = new THREE.PointLight(0xfdb813, 3, 0);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.scene.add(this.sunLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0x0088ff, 0.25);
    fillLight.position.set(500, 300, 500);
    fillLight.castShadow = true;
    this.scene.add(fillLight);
  }

  createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const distance = 5000 + Math.random() * 15000;

      positions[i] = distance * Math.sin(phi) * Math.cos(angle);
      positions[i + 1] = distance * Math.sin(phi) * Math.sin(angle);
      positions[i + 2] = distance * Math.cos(phi);

      // Vary star colors slightly
      colors[i] = 0.7 + Math.random() * 0.3;     // R
      colors[i + 1] = 0.75 + Math.random() * 0.25; // G
      colors[i + 2] = 1;                          // B
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 6,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  createNebula() {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 1024;
    textureCanvas.height = 1024;

    const ctx = textureCanvas.getContext('2d');
    const imageData = ctx.createImageData(1024, 1024);
    const data = imageData.data;

    // Perlin-like noise for nebula
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      const x = (i / 4) % 1024;
      const y = Math.floor((i / 4) / 1024);
      const dist = Math.sqrt(Math.pow(x - 512, 2) + Math.pow(y - 512, 2)) / 512;
      const intensity = Math.max(0, 1 - dist) * noise;

      data[i] = Math.random() * 80 + 40;        // R (purples/pinks)
      data[i + 1] = Math.random() * 30;         // G
      data[i + 2] = Math.random() * 150 + 100;  // B (blues)
      data[i + 3] = intensity * 80;             // A (alpha)
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(textureCanvas);

    const nebulaGeometry = new THREE.SphereGeometry(9000, 64, 64);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });

    this.nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    this.scene.add(this.nebula);
  }

  createGalaxyBackground() {
    // Add a subtle gradient sphere behind everything
    const galaxyGeometry = new THREE.SphereGeometry(20000, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(1024, 1024, 0, 1024, 1024, 1024);
    gradient.addColorStop(0, '#220844');
    gradient.addColorStop(0.5, '#0d001a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 2048);

    const texture = new THREE.CanvasTexture(canvas);
    const galaxyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide
    });

    const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    this.scene.add(galaxy);
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
        temp: '15°C avg',
        mass: '5.97 × 10²⁴ kg',
        type: 'Terrestrial',
        hasAtmosphere: true
      },
      {
        name: 'Mars',
        size: 5.3,
        color: 0xe27b58,
        distance: 240,
        speed: 0.008,
        tilt: 25.19,
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
        temp: '-110°C avg',
        mass: '1.90 × 10²⁷ kg',
        type: 'Gas Giant',
        hasStorms: true
      },
      {
        name: 'Saturn',
        size: 42,
        color: 0xf4d47f,
        distance: 550,
        speed: 0.0009,
        tilt: 26.73,
        hasRings: true,
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
        temp: '-200°C avg',
        mass: '1.02 × 10²⁶ kg',
        type: 'Ice Giant'
      }
    ];

    // Create Sun
    const sunGeometry = new THREE.IcosahedronGeometry(25, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xfdb813,
      emissive: 0xfdb813,
      emissiveIntensity: 1
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.castShadow = true;
    sun.userData = {
      name: 'Sol',
      size: 25,
      color: 0xfdb813,
      distance: 0,
      type: 'Star',
      temp: '5,500°C surface',
      mass: '1.989 × 10³⁰ kg',
      radius: '696,000 km'
    };
    this.scene.add(sun);
    this.celestialBodies.push(sun);

    // Add sun corona glow
    const coronaGeometry = new THREE.SphereGeometry(35, 64, 64);
    const coronaMaterial = new THREE.MeshBasicMaterial({
      color: 0xfdb813,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      emissive: 0xfdb813,
      emissiveIntensity: 0.5
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    sun.add(corona);

    // Create planets
    planetsData.forEach((data) => {
      const planet = this.createPlanet(data);
      planet.userData = data;
      this.scene.add(planet);
      this.celestialBodies.push(planet);

      // Create orbit line
      this.createOrbitLine(data.distance);

      // Initialize trail
      this.trailLines.set(planet, {
        positions: [],
        line: null,
        maxLength: 250
      });
    });
  }

  createPlanet(data) {
    const geometry = new THREE.IcosahedronGeometry(data.size, 64);
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.6,
      metalness: 0.1,
      emissive: data.color,
      emissiveIntensity: 0.15,
      flatShading: false
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.x = THREE.MathUtils.degToRad(data.tilt);
    planet.castShadow = true;
    planet.receiveShadow = true;

    // Store orbital data
    planet.userData.orbitPhase = Math.random() * Math.PI * 2;
    planet.userData.orbitData = data;

    // Add atmospheric glow for planets with atmospheres
    if (data.hasAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.15, 64, 64);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        emissive: data.color,
        emissiveIntensity: 0.3
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      planet.add(atmosphere);
    } else {
      // Standard glow for other planets
      const glowGeometry = new THREE.SphereGeometry(data.size * 1.25, 64, 64);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
        emissive: data.color,
        emissiveIntensity: 0.15
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      planet.add(glow);
    }

    // Add rings for Saturn
    if (data.hasRings) {
      const ringGeometry = new THREE.BufferGeometry();
      const ringMaterial = new THREE.LineBasicMaterial({
        color: 0xe8d7b7,
        transparent: true,
        opacity: 0.7,
        linewidth: 1
      });

      const ringPoints = [];
      for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        const x = Math.cos(angle) * 75;
        const z = Math.sin(angle) * 75;
        const y = Math.sin(angle * 0.3) * 8;
        ringPoints.push(new THREE.Vector3(x, y, z));
      }

      ringGeometry.setFromPoints(ringPoints);
      const ring = new THREE.Line(ringGeometry, ringMaterial);
      planet.add(ring);
    }

    return planet;
  }

  createOrbitLine(distance) {
    const points = [];
    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
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
      opacity: 0.12,
      transparent: true,
      linewidth: 1
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
  }

  updateOrbits() {
    this.time += 0.0003;

    this.celestialBodies.forEach((body) => {
      if (body.userData.orbitData && body.userData.orbitData.distance > 0) {
        const data = body.userData.orbitData;
        body.userData.orbitPhase += data.speed;

        body.position.x = Math.cos(body.userData.orbitPhase) * data.distance;
        body.position.z = Math.sin(body.userData.orbitPhase) * data.distance;

        // Self rotation
        body.rotation.y += 0.001;

        // Update orbit trail
        this.updateTrail(body);
      }
    });

    // Parallax stars rotation
    if (this.stars) {
      this.stars.rotation.x += 0.000008;
      this.stars.rotation.y += 0.000012;
    }

    // Nebula rotation
    if (this.nebula) {
      this.nebula.rotation.y += 0.000002;
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

    // Create new line with gradient effect
    if (trail.positions.length > 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints(trail.positions);
      
      // Create alpha array for fading trail
      const colors = [];
      for (let i = 0; i < trail.positions.length; i++) {
        const t = i / trail.positions.length;
        const color = new THREE.Color(body.userData.orbitData.color);
        colors.push(color.r * (t * 0.7), color.g * (t * 0.7), color.b * (t * 0.7));
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.6,
        transparent: true,
        vertexColors: true,
        linewidth: 1
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
    document.querySelectorAll('.planet-card').forEach((card) => {
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

      this.controls.velocity.x = deltaX * 0.008;
      this.controls.velocity.y = deltaY * 0.008;

      this.controls.rotation.y += deltaX * 0.004;
      this.controls.rotation.x += deltaY * 0.004;

      // Clamp vertical rotation
      this.controls.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.controls.rotation.x));
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
    this.controls.targetZoom *= 1 + (event.deltaY > 0 ? 0.12 : -0.12);
    this.controls.targetZoom = Math.max(0.3, Math.min(8000, this.controls.targetZoom));
  }

  onTouchEnd(event) {
    const now = Date.now();
    if (now - this.lastTapTime < 300) {
      this.launch();
    }
    this.lastTapTime = now;
  }

  focusPlanet(targetName) {
    const planet = this.celestialBodies.find(
      (b) => b.userData.orbitData && b.userData.orbitData.name.toLowerCase() === targetName
    );
    if (planet) {
      this.targetPlanet = planet;
      this.launch();
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

      // Default to Earth if no target selected
      if (!this.targetPlanet) {
        this.targetPlanet = this.celestialBodies.find(
          (b) => b.userData.orbitData && b.userData.orbitData.name === 'Earth'
        );
      }
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
      const auDistance = (data.distance * 1.496e8) / 1e6;
      statsHTML += `
        <div class="stat-line">
          <span class="label">Orbit:</span>
          <span>${Math.round(auDistance)} M km</span>
        </div>
      `;
    }

    statsEl.innerHTML = statsHTML;
    infoPanel.classList.add('active');
  }

  updateCamera() {
    const targetRotationSpeed = 0.015;
    this.controls.rotation.y += this.controls.velocity.x * targetRotationSpeed;
    this.controls.rotation.x += this.controls.velocity.y * targetRotationSpeed;

    // Damping
    this.controls.velocity.x *= 0.92;
    this.controls.velocity.y *= 0.92;

    // Smooth zoom interpolation
    this.controls.zoom += (this.controls.targetZoom - this.controls.zoom) * 0.06;

    if (this.targetPlanet && this.launched) {
      // Immersion mode: orbit around target planet
      const targetPos = this.targetPlanet.position.clone();
      const distance = 100 * this.controls.zoom * 0.08;

      const orbitRadius = Math.max(this.targetPlanet.userData.orbitData.size * 3, distance * 0.5);
      const cameraX = targetPos.x + Math.cos(this.time * 0.3) * orbitRadius;
      const cameraY = targetPos.y + orbitRadius * 0.4;
      const cameraZ = targetPos.z + Math.sin(this.time * 0.3) * orbitRadius;

      this.camera.position.lerp(new THREE.Vector3(cameraX, cameraY, cameraZ), 0.04);
      this.camera.lookAt(targetPos);

      this.stats.distance = Math.round(distance);
    } else {
      // Exploration mode: free orbit around solar system
      const radius = 250 * this.controls.zoom * 0.08;
      this.camera.position.x = Math.cos(this.controls.rotation.y) * Math.cos(this.controls.rotation.x) * radius;
      this.camera.position.y = Math.sin(this.controls.rotation.x) * radius;
      this.camera.position.z = Math.sin(this.controls.rotation.y) * Math.cos(this.controls.rotation.x) * radius;
      this.camera.lookAt(0, 0, 0);
    }

    this.stats.zoom = this.controls.zoom.toFixed(1);
    this.stats.speed = Math.round(Math.sqrt(this.controls.velocity.x ** 2 + this.controls.velocity.y ** 2) * 100);

    // Update HUD telemetry
    document.getElementById('zoom-display').textContent = `${this.stats.zoom}x`;
    document.getElementById('speed-display').textContent = `${this.stats.speed} km/s`;
    document.getElementById('distance-display').textContent = `${this.stats.distance} km`;
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

// Initialize on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new SolarSystemScene();
});
