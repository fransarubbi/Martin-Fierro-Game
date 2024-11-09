import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'stats.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';


// Obtén el botón "Play" y la pantalla de inicio
const playButton = document.getElementById('playButton');
const inicioScreen = document.getElementById('inicio');
const gameContainer = document.getElementById('gameContainer');
const fogExp2 = new THREE.FogExp2(0xaaaaaa, 0.1);


var renderer,scene,camera,controlsFirst;
var ambientLight,directionalLight,lampSpotLight;

var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var moveSpeed = 0.1;

var raycaster = new THREE.Raycaster();
raycaster.far = 200;
var mouse = new THREE.Vector2();
var ob = [];


var clock = new THREE.Clock(), delta = 0, stats, fps = 60, maxTime = 1/fps;


// Variables para el temporizador
var startTime = 70; // Tiempo total en segundos (2 minutos)
var remainingTime = startTime; // Tiempo restante
var timerText = "02:10"; // Texto del temporizador

// Propiedades de la GUI
var props = {
    contObjects : 0,
    FPS: 60
};


const gui = new GUI();
const loader = new GLTFLoader();
const timerFolder = gui.addFolder('Temporizador');
timerFolder.open();
timerFolder.add({ time: timerText }, 'time').name('Tiempo Restante').listen();


const guitarPos = [
    new THREE.Vector3(-16, 2, -20.5),
    new THREE.Vector3(5, 1.5, -13),
    new THREE.Vector3(17, 1.5, 25),
    new THREE.Vector3(-8.5, 3, 16)
];

const knifePos = [
    new THREE.Vector3(-8, 1, -21),
    new THREE.Vector3(22, 2, 15),
    new THREE.Vector3(-15.5, 2, -2),
    new THREE.Vector3(-6, 1.5, 22)
];

const ponchoPos = [
    new THREE.Vector3(-14, 1, -12),
    new THREE.Vector3(-16, 1, 2),
    new THREE.Vector3(-12, 1.5, 16),
    new THREE.Vector3(9.5, 1.5, 20)
];

const hatPos = [
    new THREE.Vector3(10.5, 1, -23),
    new THREE.Vector3(20, 1, 4),
    new THREE.Vector3(-16, 1, 6.5),
    new THREE.Vector3(-16, 1.5, 16)
];

const matePos = [
    new THREE.Vector3(-20, 1, 2),  
    new THREE.Vector3(-16, 1, 10),
    new THREE.Vector3(-6, 1.5, 16),
    new THREE.Vector3(16, 1, -23)
];


const crucifixPos = [
    new THREE.Vector3(16, 1, -10),
    new THREE.Vector3(19, 1, -4),
    new THREE.Vector3(5, 1.5, 3),
    new THREE.Vector3(24, 1.5, -23)
];


// Agregar un evento al botón para cambiar de pantalla
playButton.addEventListener('click', () => {
    
    // Ocultar la pantalla de inicio
    inicioScreen.style.display = 'none';
    // Mostrar el contenedor del juego
    gameContainer.style.display = 'block';
    inicio();
    buclePrincipal();
});


function inicio(){

    renderer = new THREE.WebGLRenderer({ antialias: true });
    scene = new THREE.Scene();
    scene.fog = fogExp2;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    //inicializar Stats.js para mostrar los FPS
    stats = new Stats();
    stats.showPanel(0);  //0 para mostrar los FPS
    document.body.appendChild(stats.dom);


    var f1 = gui.addFolder('Estado del Juego');
    f1.add(props, 'contObjects').name('Objetos Encontrados').listen();
    f1.add(props, 'FPS', 2, 60).name('FPS').onChange(value => {
        fps = value;  // Actualiza el valor de FPS
        maxTime = 1 / fps;  // Recalcula el tiempo entre cuadros
    });
    f1.open();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.2, 0);
    
    // Configuración de controles
    controlsFirst = new PointerLockControls(camera, document.body);
    scene.add(controlsFirst.getObject());

    document.addEventListener('click', () => {
        controlsFirst.lock();
    });

    sceneBuild();
    lights();
    objectsToSearch();

    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW':
                direction.z = 1;
                break;
            case 'KeyS':
                direction.z = -1;
                break;
            case 'KeyA':
                direction.x = -1;
                break;
            case 'KeyD':
                direction.x = 1;
                break;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'KeyS':
                direction.z = 0;
                break;
            case 'KeyA':
            case 'KeyD':
                direction.x = 0;
                break;
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('mousedown', onMouseDown, false);

}


function lights(){
    //luz ambiental
    ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    //luz direccional
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(-10, 50, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.7;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    //luz spot en linterna
    lampSpotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 2);
    lampSpotLight.angle = Math.PI/6;
    lampSpotLight.intensity = 3;
    lampSpotLight.penumbra = 0.5;
    lampSpotLight.distance = 30;
    lampSpotLight.decay = 1;
    lampSpotLight.castShadow = true;
    lampSpotLight.shadow.mapSize.width = 2048; 
    lampSpotLight.shadow.mapSize.height = 2048;
    lampSpotLight.shadow.radius = 2;
    scene.add(lampSpotLight);
    scene.add(lampSpotLight.target); //añadir el objetivo de la luz    
}


function flashlight(){
    // Hacer que la linterna siga al personaje
    lampSpotLight.position.copy(camera.position); // Ajustar la posición de la linterna a la cámara

    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir); // Obtener la dirección de la cámara
    
    // Asegurarse de que la linterna apunte hacia donde está mirando el personaje
    const target = new THREE.Vector3();
    target.addVectors(camera.position, cameraDir); // Posicionar el objetivo
    lampSpotLight.target.position.copy(target); // Actualizar el objetivo de la linterna
}


function sceneBuild(){
    
    const ground = new URL('../media/Ground.glb', import.meta.url);
    loader.load(ground.href,
        function(gltf){
            meshGround = gltf.scene;   
            meshGround.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGround.position.set(0, 0, 0);
            meshGround.scale.set(1.7,0.1,1.5);
            scene.add(meshGround);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const farm = new URL('../media/Granjero.glb', import.meta.url);
    loader.load(farm.href,
        function(gltf){
            meshFarm = gltf.scene;   
            meshFarm.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshFarm.position.set(13, 0.5, -17);
            meshFarm.scale.set(1,1.3,1);
            scene.add(meshFarm);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const woodHouse = new URL('../media/Casa_madera.glb', import.meta.url);
    loader.load(woodHouse.href,
        function(gltf){
            meshWoodHouse = gltf.scene;   
            meshWoodHouse.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshWoodHouse.position.set(0, 0.5, 25);
            meshWoodHouse.rotation.y = Math.PI/2;
            meshWoodHouse.scale.set(1,1.5,1);
            scene.add(meshWoodHouse);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const house = new URL('../media/House.glb', import.meta.url);
    loader.load(house.href,
        function(gltf){
            meshHouse = gltf.scene;   
            meshHouse.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshHouse.position.set(-10, 0.5, 7);
            meshHouse.rotation.y = Math.PI/2;
            meshHouse.scale.set(0.02,0.02,0.02);
            scene.add(meshHouse);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const oldTree = new URL('../media/Arbol.glb', import.meta.url);
    loader.load(oldTree.href,
        function(gltf){
            meshOldTree = gltf.scene;   
            meshOldTree.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree.position.set(-4,0.2,-10);
            meshOldTree.scale.set(0.5,0.5,0.5);
            scene.add(meshOldTree);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(oldTree.href,
        function(gltf){
            meshOldTree2 = gltf.scene;   
            meshOldTree2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree2.position.set(-8,0.2,-20);
            meshOldTree2.scale.set(0.7,0.7,0.7);
            scene.add(meshOldTree2);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(oldTree.href,
        function(gltf){
            meshOldTree2 = gltf.scene;   
            meshOldTree2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree2.position.set(-14,0.2,-11);
            meshOldTree2.scale.set(0.8,0.8,0.8);
            scene.add(meshOldTree2);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(oldTree.href,
        function(gltf){
            meshOldTree2 = gltf.scene;   
            meshOldTree2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree2.position.set(-16,0.2,-20);
            meshOldTree2.scale.set(0.5,0.5,0.5);
            scene.add(meshOldTree2);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const grass = new URL('../media/Fardos.glb', import.meta.url);
    loader.load(grass.href,
        function(gltf){
            meshGrass = gltf.scene;   
            meshGrass.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGrass.position.set(16,0,22);
            meshGrass.rotation.y = Math.PI;
            meshGrass.scale.set(5,3,5);
            scene.add(meshGrass);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(grass.href,
        function(gltf){
            meshGrass2 = gltf.scene;   
            meshGrass2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGrass2.position.set(11,0,15);
            meshGrass2.scale.set(3,3,3);
            scene.add(meshGrass2);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(grass.href,
        function(gltf){
            meshGrass3 = gltf.scene;   
            meshGrass3.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGrass3.position.set(16, 0.0, -17);
            meshGrass3.rotation.y = -Math.PI/2;
            meshGrass3.scale.set(1.5,1.5,1.5);
            scene.add(meshGrass3);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(grass.href,
        function(gltf){
            meshGrass4 = gltf.scene;   
            meshGrass4.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGrass4.position.set(12, 0.0, -19);
            meshGrass4.scale.set(1.5,1.5,1.5);
            scene.add(meshGrass4);
        },
        undefined,
        function(error){ console.error(error); }
    );
    
    const carriage = new URL('../media/Carruaje.glb', import.meta.url);
    loader.load(carriage.href,
        function(gltf){
            meshCarriage = gltf.scene;   
            meshCarriage.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshCarriage.position.set(17,0,3);
            meshCarriage.scale.set(0.4,0.4,0.4);
            scene.add(meshCarriage);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const waterWell = new URL('../media/Pozo_agua.glb', import.meta.url);
    loader.load(waterWell.href,
        function(gltf){
            meshWaterWell = gltf.scene;   
            meshWaterWell.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshWaterWell.position.set(5,0,3);
            meshWaterWell.scale.set(0.015,0.015,0.015);
            scene.add(meshWaterWell);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const cow = new URL('../media/Vaca.glb', import.meta.url);
    loader.load(cow.href,
        function(gltf){
            meshCow = gltf.scene;   
            meshCow.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshCow.position.set(11, 0.0, -13);
            meshCow.scale.set(0.2,0.2,0.2);
            scene.add(meshCow);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const horse = new URL('../media/Caballo.glb', import.meta.url);
    loader.load(horse.href,
        function(gltf){
            meshHorse = gltf.scene;   
            meshHorse.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshHorse.position.set(-4, 2, 22);
            meshHorse.rotation.y = Math.PI/2;
            meshHorse.scale.set(0.7,0.7,0.7);
            scene.add(meshHorse);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const scarecrow = new URL('../media/Espantapajaros.glb', import.meta.url);
    loader.load(scarecrow.href,
        function(gltf){
            meshScarecrow = gltf.scene;   
            meshScarecrow.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshScarecrow.position.set(-3, 0.5, 9);
            meshScarecrow.rotation.y = Math.PI/2;
            meshScarecrow.scale.set(2,2,2);
            scene.add(meshScarecrow);
        },
        undefined,
        function(error){ console.error(error); }
    );
}


async function loadModel(url, position, rotation, scale) {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                const model = gltf.scene;
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                model.position.set(position.x, position.y, position.z);
                if (rotation) model.rotation.set(rotation.x, rotation.y, rotation.z);
                if (scale) model.scale.set(scale.x, scale.y, scale.z);
                resolve(model);
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                reject(error);
            }
        );
    });
}


async function objectsToSearch() {
    try {
        var rand1 = Math.floor(Math.random() * 4);
        var rand2 = Math.floor(Math.random() * 4);
        var rand3 = Math.floor(Math.random() * 4);
        var rand4 = Math.floor(Math.random() * 4);
        var rand5 = Math.floor(Math.random() * 4);
        var rand6 = Math.floor(Math.random() * 4);

        const guitarUrl = new URL('../media/Guitarra.glb', import.meta.url).href;
        const knifeUrl = new URL('../media/Cuchillo.glb', import.meta.url).href;
        const ponchoUrl = new URL('../media/Poncho.glb', import.meta.url).href;
        const hatUrl = new URL('../media/Sombrero.glb', import.meta.url).href;
        const mateUrl = new URL('../media/Mate.glb', import.meta.url).href;
        const crucifixUrl = new URL('../media/Crucifijo.glb', import.meta.url).href;

        const meshGuitar = await loadModel(guitarUrl, guitarPos[rand1], { x: Math.PI / 2, y: 0, z: 0 }, { x: 0.5, y: 0.5, z: 0.5 });
        scene.add(meshGuitar);
        ob.push(meshGuitar);

        const meshKnife = await loadModel(knifeUrl, knifePos[rand2], { x: 0, y: 0, z: Math.PI / 2 }, { x: 1, y: 1, z: 1 });
        scene.add(meshKnife);
        ob.push(meshKnife);

        const meshPoncho = await loadModel(ponchoUrl, ponchoPos[rand3], null, { x: 3, y: 3, z: 3 });
        scene.add(meshPoncho);
        ob.push(meshPoncho);

        const meshHat = await loadModel(hatUrl, hatPos[rand4], null, { x: 0.4, y: 0.4, z: 0.4 });
        scene.add(meshHat);
        ob.push(meshHat);

        const meshMate = await loadModel(mateUrl, matePos[rand5], null, { x: 0.5, y: 0.5, z: 0.5 });
        scene.add(meshMate);
        ob.push(meshMate);

        const meshCrucifix = await loadModel(crucifixUrl, crucifixPos[rand6], null, { x: 0.003, y: 0.003, z: 0.003 });
        scene.add(meshCrucifix);
        ob.push(meshCrucifix);

    } catch (error) {
        console.error('Error cargando modelos:', error);
    }
}


function onMouseDown(event) {
    if (event.button !== 0) return; // Solo responde al clic izquierdo

    // Calcular la posición del mouse normalizada para el raycaster
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Configurar el raycaster a partir de la cámara y la posición del mouse
    raycaster.setFromCamera(mouse, camera);

    // Intersectar con los grupos del array 'ob' (y sus hijos)
    var intersects = raycaster.intersectObjects(ob, true);

    if (intersects.length > 0) {
        // Obtenemos el primer objeto intersectado
        var selectedObject = intersects[0].object;

        // Buscamos el grupo principal al que pertenece el objeto
        var groupToRemove = selectedObject;
        while (groupToRemove && !(groupToRemove instanceof THREE.Group)) {
            groupToRemove = groupToRemove.parent; // Subimos en la jerarquía hasta encontrar el grupo
        }

        // Verificamos si el grupo encontrado está en 'ob'
        if (groupToRemove && ob.includes(groupToRemove)) {
            console.log("Objeto detectado y eliminado:", groupToRemove);
            
            // Eliminamos el grupo de la escena
            scene.remove(groupToRemove);
            props.contObjects++;

            // Eliminamos el grupo del array 'ob'
            var groupIndex = ob.indexOf(groupToRemove);
            if (groupIndex > -1) {
                ob.splice(groupIndex, 1);
            }
        }
    }
}


function showVictoryScreen() {
    gameContainer.style.display = 'none';
    document.getElementById('winScreen').style.display = 'block';
}


function showDefeatScreen() {
    gameContainer.style.display = 'none';
    document.getElementById('loseScreen').style.display = 'block';
}


function buclePrincipal() {
    
    delta += clock.getDelta();  //acumular el delta del reloj

    ob.forEach((object) => {
        if (object) {
            object.rotation.y += 0.02; 
        }
    });

    //solo renderizar si ha pasado suficiente tiempo (según los fps configurados)
    if (delta >= maxTime) {
        stats.begin();  //inicia la medición de FPS
        
        // Actualizar el temporizador
        if (remainingTime > 0) {
            remainingTime -= delta; // Disminuir el tiempo restante
        }

        // Convertir el tiempo restante a minutos y segundos
        var minutes = Math.floor(remainingTime / 60);
        var seconds = Math.floor(remainingTime % 60);
        timerText = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

        // Actualizar el texto en la GUI
        timerFolder.__controllers[0].setValue(timerText);

        if (props.contObjects == 6) {
            showVictoryScreen();
            return;
        }
        else if (remainingTime > 60) {
            scene.background = new THREE.Color(0x87CEEB); // Color celeste para el día
            ambientLight.intensity = 1; // Luz ambiental más intensa
            directionalLight.intensity = 1.5; // Luz direccional más intensa
        } else if (remainingTime > 0) {
            scene.background = new THREE.Color(0x000000); // Color negro para la noche
            ambientLight.intensity = 0.001; // Luz ambiental tenue
            directionalLight.intensity = 0.001; // Luz direccional tenue
            flashlight();
        } else {
            showDefeatScreen();
            return; // Termina el bucle
        }

        direction.normalize();
        velocity.x = direction.x * moveSpeed;
        velocity.z = direction.z * moveSpeed;

        controlsFirst.moveRight(velocity.x);
        controlsFirst.moveForward(velocity.z);

        renderer.render(scene, camera);  //renderizar la escena
        delta = delta % maxTime;  //restablecer el delta para la siguiente iteración
        stats.end();  //termina la medición de FPS
    }

    requestAnimationFrame(buclePrincipal); 
}