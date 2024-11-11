import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'stats.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

var renderer,scene,camera,controlsFirst;
var ambientLight,directionalLight,lampSpotLight;

// Variables para movimiento 
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var moveSpeed = 0.1;

// Variables para raycaster 
var raycaster = new THREE.Raycaster();
raycaster.far = 200;
var mouse = new THREE.Vector2();
var ob = [];

// Variables control de fps
var clock = new THREE.Clock(), delta = 0, stats, fps = 60, maxTime = 1/fps;

// Variables para el temporizador
var startTime = 130; // Tiempo total en segundos (2 minutos y 10 seg)
var remainingTime = startTime; // Tiempo restante
var timerText = "02:10"; // Texto del temporizador

// Propiedades de la GUI
var props = {
    contObjects : 0, // Objetos encontrados
    FPS: 60          // FPS
};

// Obtener el botón "Play" y la pantalla de inicio
const playButton = document.getElementById('playButton');
const initScreen = document.getElementById('inicio');
const gameContainer = document.getElementById('gameContainer');
const fogExp2 = new THREE.FogExp2(0xaaaaaa, 0.1);  // Niebla
const gui = new GUI();                  // GUI
const loader = new GLTFLoader();   // loader de los modelos
const timerFolder = gui.addFolder('Temporizador');
timerFolder.open();    // Abrir la GUI
timerFolder.add({ time: timerText }, 'time').name('Tiempo Restante').listen(); // Timer


// Posiciones viables para la guitarra
const guitarPos = [
    new THREE.Vector3(-16, 2, -20.5),
    new THREE.Vector3(5, 1.5, -13),
    new THREE.Vector3(17, 1.5, 25),
    new THREE.Vector3(-8.5, 3, 16)
];

// Posiciones viables para el cuchillo
const knifePos = [
    new THREE.Vector3(-8, 1, -21),
    new THREE.Vector3(22, 2, 15),
    new THREE.Vector3(-15.5, 2, -2),
    new THREE.Vector3(-6, 1.5, 22)
];

// Posiciones viables para el poncho
const ponchoPos = [
    new THREE.Vector3(-14, 1, -12),
    new THREE.Vector3(-16, 1, 2),
    new THREE.Vector3(-12, 1.5, 16),
    new THREE.Vector3(9.5, 1.5, 20)
];

// Posiciones viables para el sombrero
const hatPos = [
    new THREE.Vector3(10.5, 1, -23),
    new THREE.Vector3(20, 1, 4),
    new THREE.Vector3(-16, 1, 6.5),
    new THREE.Vector3(-16, 1.5, 16)
];

// Posiciones viables para el mate
const matePos = [
    new THREE.Vector3(-20, 1, 2),  
    new THREE.Vector3(-16, 1, 10),
    new THREE.Vector3(-6, 1.5, 16),
    new THREE.Vector3(16, 1, -23)
];

// Posiciones viables para el crucifijo
const crucifixPos = [
    new THREE.Vector3(16, 1, -10),
    new THREE.Vector3(19, 1, -4),
    new THREE.Vector3(5, 1.5, 3),
    new THREE.Vector3(24, 1.5, -23)
];


// Agregar un evento al botón para cambiar de pantalla
playButton.addEventListener('click', () => {
    // Ocultar la pantalla de inicio
    initScreen.style.display = 'none';
    // Mostrar el contenedor del juego
    gameContainer.style.display = 'block';
    init();
    mainLoop();
});


function init(){

    renderer = new THREE.WebGLRenderer({ antialias: true });  // Habilitar antialising
    scene = new THREE.Scene();  // Crear la escena
    scene.fog = fogExp2;   // Agregar niebla a la escena
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;   // Habilitar sombras
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Sombras mas suaves
    document.body.appendChild(renderer.domElement);

    //inicializar Stats.js para mostrar los FPS
    stats = new Stats();
    stats.showPanel(0);  //0 para mostrar los FPS
    document.body.appendChild(stats.dom);

    var f1 = gui.addFolder('Estado del Juego');
    f1.add(props, 'contObjects').name('Objetos Encontrados').listen();  // Utilizar el mismo props como contador
    f1.add(props, 'FPS', 2, 60).name('FPS').onChange(value => {
        fps = value;  // Actualiza el valor de FPS
        maxTime = 1 / fps;  // Recalcula el tiempo entre cuadros
    });
    f1.open();   // Setear para que este abierta la ventana

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.2, 0);   // Define la camara a 3.2 de altura
    
    // Configuración de primera persona
    controlsFirst = new PointerLockControls(camera, document.body);
    scene.add(controlsFirst.getObject());

    document.addEventListener('click', () => {  // Activar el puntero al hacer click
        controlsFirst.lock();
    });
 
    sceneBuild();   // Llamar al creador de la escena
    lights();       // Definir luces
    objectsToSearch();  // Llamar al creador de objetos para buscar

    document.addEventListener('keydown', (event) => {  //Controlar cuando la tecla se pisa
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
    
    document.addEventListener('keyup', (event) => {  // Controlar cuando la tecla se suelta
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

    window.addEventListener('resize', () => {  // Controlar que se redimensione la ventana
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('mousedown', onMouseDown, false);  // Controlar click para seleccionar objetos

}


function lights(){
    ambientLight = new THREE.AmbientLight(0xffffff);  // Luz ambiental blanca pura
    scene.add(ambientLight);   // Agregar a la escena

    directionalLight = new THREE.DirectionalLight(0xffffff, 2);  // Luz direccional blanca pura y de intensidad 2
    directionalLight.position.set(-10, 50, 10);  // Posicion de la luz
    directionalLight.castShadow = true;    // Habilitar la proyeccion de sombras
    directionalLight.shadow.camera.left = -60;  // Borde izquierdo de la camara de sombras
    directionalLight.shadow.camera.right = 60;  // Borde derecho de la camara de sombras
    directionalLight.shadow.camera.top = 50;    // Borde superior de la camara de sombras
    directionalLight.shadow.camera.bottom = -50;  // Borde inferior de la camara de sombras
    directionalLight.shadow.camera.near = 0.5;   // Distancia minima a partir de la cual se proyectan sombras
    directionalLight.shadow.camera.far = 300;  // Distancia maxima que la camara de sombras captura las sombras
    directionalLight.shadow.mapSize.width = 2048;  // Ancho del mapa de sombras
    directionalLight.shadow.mapSize.height = 2048;  // Alto del mapa de sombras
    scene.add(directionalLight);    // Agregar a la escena

    lampSpotLight = new THREE.SpotLight(0xffffff, 3, 30, Math.PI/6, 0.5, 2); // Luz spot en linterna
    // Color blanco puro, intensidad de 3, Distancia maxima de alcance, Angulo, Penumbra, Decaimiento
    lampSpotLight.castShadow = true;   // Proyectar sombras
    lampSpotLight.shadow.mapSize.width = 2048;  // Ancho del mapa de sombras
    lampSpotLight.shadow.mapSize.height = 2048; // Alto del mapa de sombras
    lampSpotLight.shadow.radius = 3;  // Radio de desenfoque de la sombra
    scene.add(lampSpotLight);  // Agregar a la escena
    scene.add(lampSpotLight.target); // Agregar el objetivo de la luz    
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
    // Importar los modelos de la escena
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


// async permite que la funcion sea asincrona. Retorna una promesa
// luego se usa el await para pausar la ejecucion hasta que la promesa se resuelve
async function loadModel(url, position, rotation, scale) {
    // La funcion recibe como parametros la url del objeto y sus propiedades
    return new Promise((resolve, reject) => {  // Retorna la promesa, la misma sera resuelta con exito o rechazada si falla la carga
        loader.load(  // Cargar el modelo en base a la url y aplicar las propiedades
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
                resolve(model);   // Si la carga es exitosa, resolver promesa
            },
            undefined,
            (error) => {   // Si la carga es erronea, resolver con error
                console.error('Error loading model:', error);
                reject(error);
            }
        );
    });
}


async function objectsToSearch() {
    try {
        // Crear 6 variables aleatorias, una para cada objeto
        // y con un valor entre 0 y 3
        var rand1 = Math.floor(Math.random() * 4);
        var rand2 = Math.floor(Math.random() * 4);
        var rand3 = Math.floor(Math.random() * 4);
        var rand4 = Math.floor(Math.random() * 4);
        var rand5 = Math.floor(Math.random() * 4);
        var rand6 = Math.floor(Math.random() * 4);

        // Definir las url de cada objeto
        const guitarUrl = new URL('../media/Guitarra.glb', import.meta.url).href;
        const knifeUrl = new URL('../media/Cuchillo.glb', import.meta.url).href;
        const ponchoUrl = new URL('../media/Poncho.glb', import.meta.url).href;
        const hatUrl = new URL('../media/Sombrero.glb', import.meta.url).href;
        const mateUrl = new URL('../media/Mate.glb', import.meta.url).href;
        const crucifixUrl = new URL('../media/Crucifijo.glb', import.meta.url).href;

        // Llamar a la funcion loadModel y pausar la resolucion hasta que se resuelva con exito o fracaso
        const meshGuitar = await loadModel(guitarUrl, guitarPos[rand1], { x: Math.PI / 2, y: 0, z: 0 }, { x: 0.5, y: 0.5, z: 0.5 });
        scene.add(meshGuitar);  // Agregar a la escena
        ob.push(meshGuitar);    // Agregar el objeto al arreglo de los objetos para buscar

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

    } catch (error) {   // Si falla, imprimir un mensaje de error
        console.error('Error cargando modelos:', error);
    }
}


function onMouseDown(event) {

    if (event.button !== 0) return; // Solo responde al clic izquierdo

    // Calcular la posición del mouse normalizada para el raycaster
    // event.clientX y event.clientY son las coordenadas del clic en la ventana
    // La normalizacion convierte la posicion del mouse a un rango de (-1,1)
    // (-1,-1) es la esquina inf izq y el (1,1) es la esquina sup der
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Configurar el raycaster a partir de la cámara y la posición del mouse
    raycaster.setFromCamera(mouse, camera);

    // Intersectar con los grupos del array 'ob'
    var intersects = raycaster.intersectObjects(ob, true);

    if (intersects.length > 0) {  // Si se intersecto algo (la longitud no es vacia)
        // Obtener el primer objeto intersectado (el mas cercano)
        var selectedObject = intersects[0].object;

        // Se busca el grupo principal al que pertenece el objeto
        var groupToRemove = selectedObject;
        while (groupToRemove && !(groupToRemove instanceof THREE.Group)) {
            groupToRemove = groupToRemove.parent; // Subimos en la jerarquía hasta encontrar el grupo
        }

        // Verificar si el grupo encontrado está en el array ob
        if (groupToRemove && ob.includes(groupToRemove)) {
            // Eliminar el grupo de la escena
            scene.remove(groupToRemove);
            props.contObjects++;   // Aumentar el contador de objetos

            // Eliminar el grupo del array ob
            var groupIndex = ob.indexOf(groupToRemove);
            if (groupIndex > -1) {
                ob.splice(groupIndex, 1);  // Elimina el elemento
            }
        }
    }
}


function showVictoryScreen() {
    // Pantalla de victoria
    gameContainer.style.display = 'none';
    document.getElementById('winScreen').style.display = 'block';
}


function showDefeatScreen() {
    // Pantalla de derrota
    gameContainer.style.display = 'none';
    document.getElementById('loseScreen').style.display = 'block';
}


function mainLoop() {
    
    delta += clock.getDelta();  // Acumular el delta del reloj

    // Darle una rotacion en el eje y, a cada objeto de los que se buscan
    ob.forEach((object) => {     
        if (object) {
            object.rotation.y += 0.02; 
        }
    });

    // Solo renderizar si ha pasado suficiente tiempo (según los fps configurados)
    if (delta >= maxTime) {
        stats.begin();  // Inicia la medición de FPS
        
        // Actualizar el temporizador
        if (remainingTime > 0) {
            remainingTime -= delta; // Disminuir el tiempo restante
        }

        // Convertir el tiempo restante a minutos y segundos
        var minutes = Math.floor(remainingTime / 60);
        var seconds = Math.floor(remainingTime % 60);
        // Formatear el texto del temporizador para agregar ceros a la izquierda cuando el numero sea menor a 10
        timerText = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

        // Actualizar el texto en la GUI
        timerFolder.__controllers[0].setValue(timerText);

        // Si se encontraron los 6 elementos, poner pantalla de victoria
        if (props.contObjects == 6) {
            showVictoryScreen();
            return;
        }
        else if (remainingTime > 60) {   // Si queda mas de un minuto...
            scene.background = new THREE.Color(0x87CEEB); // Color celeste para el día
            ambientLight.intensity = 1; // Luz ambiental más intensa
        } else if (remainingTime > 0) {   // Si queda menos de un minuto...
            scene.background = new THREE.Color(0x000000); // Color negro para la noche
            ambientLight.intensity = 0.001; // Luz ambiental tenue
            directionalLight.intensity = 0.001; // Luz direccional tenue
            flashlight();   // Linterna
        } else {
            showDefeatScreen();    // Pantalla de derrota
            return; 
        }

        // Normalizar el vector y calcular velocidad de movimiento
        direction.normalize();   
        velocity.x = direction.x * moveSpeed;
        velocity.z = direction.z * moveSpeed;

        // Actualizar la posicion del control de la camara
        controlsFirst.moveRight(velocity.x);
        controlsFirst.moveForward(velocity.z);

        renderer.render(scene, camera);  //renderizar la escena
        delta = delta % maxTime;  //restablecer el delta para la siguiente iteración
        stats.end();  //termina la medición de FPS
    }

    requestAnimationFrame(mainLoop); 
}