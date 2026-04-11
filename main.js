import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';


const scene = new THREE.Scene();

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const exrLoader = new EXRLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const btnOverview = document.getElementById('btn-overview');
const btnAntenna = document.getElementById('btn-antenna');
const btnPanels = document.getElementById('btn-panels');
const btnSatellite = document.getElementById('btn-satellite');
const btnStationRotation = document.getElementById('btn-stationRotation');
const btnExit = document.getElementById('btn-exit');
const infoPanel = document.getElementById('infoPanel');
const infoTitle = document.getElementById('infoTitle');
const infoText = document.getElementById('infoText');
const rotationPanel = document.getElementById('rotationPanel');
const rotationTitle = document.getElementById('rotationTitle');
const rotationText = document.getElementById('rotationText');
const otherButtons = [btnAntenna, btnPanels, btnSatellite, btnOverview];


const windows = [
    'Cube016_Material050_0',
    'Cylinder034_Material041_0',
    'Cylinder034_Material041_0',
    'Cube013_Material033_0',
    'Cube014_Material033_0',
    'Cube012_Material033_0',
    'Cube022_Material033_0'
];

const glassMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x61656b,
                transmission: 0.15,
                roughness: 0.02,
                thickness: 0.05,
                metalness: 0.7,
                reflectivity: 0.3,
                transparent: true,
                envMapIntensity: 2.5
});

const metalTexture = textureLoader.load('/textures/rusty_metal_02_rough_4k.jpg');
metalTexture.colorSpace = THREE.SRGBColorSpace;

metalTexture.wrapS = metalTexture.wrapT = THREE.RepeatWrapping;
metalTexture.repeat.set(2, 5);

let station;
let satellite;
let followSatellite = false;
let isStationRotationActive = false;
let antenna;
let antennaHeadMaterial; 
let antennaPulse = 0;
let solarPanels = [];

gltfLoader.load(
  '/models/sci_fi_space_station.glb',
  (gltf) => {
    station = gltf.scene;

    station.traverse((child) => {
        if (
            child.isMesh &&
            child.name.toLowerCase().includes('plane')
        ) {
            solarPanels.push(child);
            child.userData = {
                type: 'Solarni panel',
                info: 'Solarni panel proizvodi električnu energiju za stanicu.'
            };
        }

        if (
            child.isMesh &&
            windows.includes(child.name)
        ) {
            child.material = glassMaterial;
            child.userData = {
                type: 'Prozor stanice',
                info: 'Ojačano staklo sa refleksijom svemirskog okruženja.'
            };
        }
    });


    station.scale.set(0.1, 0.1, 0.1);
    station.position.set(-50, 0, 0);

    scene.add(station);

    antenna = createAntenna();

    antenna.position.set(1751, 30, 0);
    antenna.scale.set(50, 50, 50);
    station.add(antenna);
  },
  undefined,
  (error) => {
    console.error('Greška pri učitavanju stanice', error);
  }
);

const satellitePivot = new THREE.Object3D();
scene.add(satellitePivot);

gltfLoader.load(
    '/models/satellite.glb',  
    (gltf) => {
        satellite = gltf.scene;

        satellite.scale.set(1, 1, 1);      
        satellite.position.set(150, 30, 0);
        
        satellite.userData = {
            type: 'satellite',
            title: 'Orbitalni satelit',
            description: 'Pomoćni satelit koji kruži oko stanice i služi za komunikaciju i nadzor.'
        };

        satellitePivot.add(satellite);
    },
    undefined,
    (err) => console.error('Greška pri učitavanju satelita', err)
);

exrLoader.load('/skybox/RenderCrate-HDRI_Orbital_46_Sunset_4K.exr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;    
    scene.environment = texture;   
});

function createAntenna() {
    const antenna = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.109, 3, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        metalness: 0.4,
        roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;

    body.userData = {
        type: 'Stub antene',
        info: 'Antena za dugodometnu komunikaciju sa Zemljom.'
    };

    antenna.add(body);

    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    antennaHeadMaterial = new THREE.MeshStandardMaterial({
        map: metalTexture,
        metalness: 0.9,
        roughness: 0.2,
        emissive: new THREE.Color(0x00ffff),
        emissiveIntensity: 0.2
    });
    const head = new THREE.Mesh(headGeometry, antennaHeadMaterial);
    head.position.y = 3;

    head.userData = {
        type: 'Glava antene',
        info: 'Antena za dugodometnu komunikaciju sa Zemljom.'
    };

    antenna.add(head);

    return antenna;
}

function animateAntenna() {
    if (!antennaHeadMaterial) return;

    antennaPulse += 0.015;
    antennaHeadMaterial.emissiveIntensity = 0.15 + Math.sin(antennaPulse) * 0.15;
}

function animateStation() {
    if (station) {
        station.rotation.y -= 0.0009;
    }
}

function animateSatellite() {
    if (!satellitePivot) return;

    satellitePivot.rotation.y -= 0.005; 
}

function animatePanels(){
    solarPanels.forEach(panel => {
        panel.rotation.y += 0.002;
    });
}

function satelliteView(){
    if (followSatellite && satellite) {
        const offset = new THREE.Vector3(0, 15, 30); 

        const satelliteWorldPos = new THREE.Vector3();
        satellite.getWorldPosition(satelliteWorldPos);

        camera.position.copy(satelliteWorldPos).add(offset);
        camera.lookAt(satelliteWorldPos);
    }
}

function moveCamera(position, target) {
    camera.position.set(position.x, position.y, position.z);
    control.target.set(target.x, target.y, target.z);
    control.update();
}

function setActiveButton(activeBtn) {
    document.querySelectorAll('#ui button').forEach(btn => {
        btn.classList.remove('btn-active');
        btn.classList.remove('active');
    });

    activeBtn.classList.add('active');
    activeBtn.classList.add('btn-active');
}

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);

camera.position.set(260, 100, 220);
camera.lookAt(0, 0, 0);

const canvas = document.querySelector('canvas.threejs');

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(260, 40, 250);
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight); 

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const control = new OrbitControls(camera, canvas);

const initialCameraPosition = camera.position.clone();
const initialTarget = control.target.clone();

control.enableDamping = true;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

btnOverview.addEventListener('click', () => {
    if (!control.enabled){
        followSatellite = false;
        control.enabled = true;
    };
    isStationRotationActive = false;
    btnStationRotation.classList.remove('hidden');
    camera.position.copy(initialCameraPosition);
    control.target.copy(initialTarget);
    control.update();
    setActiveButton(btnOverview);

});

btnPanels.addEventListener('click', () => {
    if (!control.enabled){
        followSatellite = false;
        control.enabled = true;
    };
    isStationRotationActive = false;
    const panelWorldPos = new THREE.Vector3();
    solarPanels[0].getWorldPosition(panelWorldPos);

    btnStationRotation.classList.add('hidden');
    btnExit.classList.add('hidden');

    moveCamera(
        panelWorldPos.clone().add(new THREE.Vector3(40, 15, 40)),
        panelWorldPos
    );

    setActiveButton(btnPanels);
});

btnAntenna.addEventListener('click', () => {
    if (!control.enabled){
        followSatellite = false;
        control.enabled = true;
    };
    isStationRotationActive = false;
    const antennaWorldPos = new THREE.Vector3();
    antenna.getWorldPosition(antennaWorldPos);

    btnStationRotation.classList.add('hidden');
    btnExit.classList.add('hidden');

    moveCamera(
        antennaWorldPos.clone().add(new THREE.Vector3(30, 20, 30)),
        antennaWorldPos
    );

    setActiveButton(btnAntenna);
});

btnSatellite.addEventListener('click', () => {
    isStationRotationActive = false;
    followSatellite = true;
    btnStationRotation.classList.add('hidden');
    btnExit.classList.add('hidden');
    control.enabled = false;
    setActiveButton(btnSatellite);
});

btnStationRotation.addEventListener('click', () => {
    if (!control.enabled){
        followSatellite = false;
        control.enabled = true;
    };
    otherButtons.forEach(btn => btn.classList.add('disabled'));
    btnExit.classList.remove('hidden');
    isStationRotationActive = true;
    rotationPanel.classList.remove('hidden');
    rotationTitle.innerText = 'Animacija rotacije';
    rotationText.innerText = 'Stanica se sada polako rotira oko svoje ose. EXIT za povratak na prvobitan meni!'
    setActiveButton(btnStationRotation);
});

btnExit.addEventListener('click', () => {
    location.reload();
});

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(station, true);

    if (intersects.length === 0) {
        infoPanel.classList.add('hidden');
        return;
    }

    const clicked = intersects[0].object;

    if (!clicked.userData || !clicked.userData.info) {
        infoPanel.classList.add('hidden');
        return;
    }

    infoTitle.innerText = clicked.userData.type;
    infoText.innerText = clicked.userData.info;
    infoPanel.classList.remove('hidden');
});


const gameLoop = () => {
    control.update();
    satelliteView();
    if (isStationRotationActive) {
        animateStation();
    }
    animateSatellite();
    animatePanels();
    animateAntenna();
    renderer.render(scene, camera);
    window.requestAnimationFrame(gameLoop);
}

gameLoop();


