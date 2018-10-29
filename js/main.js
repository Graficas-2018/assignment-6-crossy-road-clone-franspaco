/// <reference path="../types/three/index.d.ts" />

var scene = null;
var renderer = null;
var materials = {};
var controls = null;
var lastUpdate = null;
var imgloader = new THREE.TextureLoader();

var score = 0;
var score_field = null;
var highscore = 0;
var highscore_field = null;

var playing = false;

var menu = null;

var player = null;
var surface = null;
var light = null;

var last_generated = 0;

var keypress = {
    w: false,
    a: false,
    s: false,
    d: false
}

var game_values = {
    side_limits: 10,
    dirs: {
        w: new THREE.Vector3( 0, 0, -1 ),
        a: new THREE.Vector3( -1, 0, 0 ),
        s: new THREE.Vector3( 0, 0, 1 ),
        d: new THREE.Vector3( 1, 0, 0 )
    }
}

var geometries = {}

var objects = {
    obstacles: [],
    cars: [],
    tiles: []
}

/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * TEMPORIZADORES
 */


/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Utilities
 */
function poisson(lambda){
    return -Math.log(Math.random())/lambda;;
}

async function asyncLoadImg(url){
    return new Promise((resolve, fail) => {
        imgloader.load(url, resolve, null, fail);
    });
}

function deg2rad(val) {
    return (val / 180.0) * Math.PI;
}

/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Basic stuff
 */

/**
 * Starts the game
 */
function reset_start(){
    player.position.set(0,1,0);
    playing = true;
    score = 0;
    menu.addClass("hidden");
    updateScore();
    run();
    console.log('lol');
}

/**
 * Stops the game
 */
function stop_game(){
    playing = false;
    menu.removeClass("hidden");
}

/**
 * Initialized everything
 */
async function startUp(){
    score_field = $("#score-field");
    highscore_field = $("#highscore-field");
    menu = $("#menu");
    $("#reset-button").click(reset_start);

    var canvas = document.getElementById("webglcanvas");
    var container = $("#container");
    canvas.width = container.width();
    canvas.height = container.height();
    // create the scene
    createScene(canvas);

    // Create materials
    await createMaterials();

    // Create objects
    await createObjects();

    document.addEventListener("keydown", onKeyPressed, false);
    document.addEventListener("keyup", onKeyReleased, false);
    
    lastUpdate = Date.now();

    run();

    // Show menu after loading is done
    menu.removeClass("hidden");
}

/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Scoring & UI functions
 */

/**
 * Records a hit in the score & requests an update of the UI
 */
function setScore(value){
    score = value;
    updateScore();
}

/**
 * Updates score UI
 */
function updateScore(){
    score_field.text("Score: " + score);
    if(score > highscore){
        highscore = score;
        updateHighscore();
    }
}

/**
 * Updates score UI
 */
function updateHighscore(){
    highscore_field.text("Highscore: " + highscore);
}



/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Rendering & animation 
 */

/**
 * Main render function
 */
function run() {
    if(playing){
        requestAnimationFrame(run);
    }
    // setTimeout( function() {
    //     requestAnimationFrame( run );
    // }, 1000 / 30 );

    // Render the scene
    renderer.render(scene, camera);

    // Update the camera controller
    // orbitControls.update();
    // controls.update();

    if(playing){
        // Animate
        KF.update();
        // Move camera
        camera.position.z = player.position.z + 10;

        // Move light
        light.position.z = player.position.z + 20;

        // Move surface and make it appear it didnt
        surface.position.z = player.position.z;
        surface.material.map.offset.y = -0.2*player.position.z;

        // Update score
        setScore(-Math.floor(player.position.z));

        // Check death conditions
        checkCarCollisions();
        checkRiver();
        checkOutOfBounds();

        // Make more game?
        makeMoreGame();
    }
}


/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Objects & materials
 */

/**
 * Create materials
 */
async function createMaterials() {
    // Plane Background
    var texture = await asyncLoadImg("img/background.jpg");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    var texture_bump = await asyncLoadImg("img/background.jpg");
    texture_bump.wrapS = texture_bump.wrapT = THREE.RepeatWrapping;
    texture_bump.repeat.set(16, 16);
    // Desactivado porque alenta, pero aqui esta el pasto con bumps
    // materials['surface'] = new THREE.MeshPhongMaterial({map: texture, bumpMap: texture_bump, bumpScale: 0.3, specular: 0x0});
    materials['surface'] = new THREE.MeshLambertMaterial({map: texture});
    materials['slot'] = new THREE.MeshLambertMaterial({color: 0x101010});
    materials['pavement'] = new THREE.MeshLambertMaterial({color: 0x101010});
    materials['car'] = new THREE.MeshLambertMaterial({color: 0xF44336});
    materials['river'] = new THREE.MeshLambertMaterial({color: 0x0022ee});
    materials['invisible'] = new THREE.MeshLambertMaterial({color: 0xffffff});
    materials['invisible'].visible = false;
    materials['log'] = new THREE.MeshLambertMaterial({color: 0xeeee11});
}

/**
 * Set up scene
 */
function createScene(canvas) {
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Image background
    scene.background = new THREE.Color(0.0, 0.0, 0.0);

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera(
        45,
        canvas.width / canvas.height,
        1,
        4000
    );
    // controls = new THREE.OrbitControls(camera, canvas);
    camera.position.set(8, 15, 10);
    camera.rotation.set(-0.9827937232473292, 0.41765276918141875, 0.546590715404528);
    // controls.update();
    scene.add(camera);

    light = new THREE.PointLight(0xffffff, 2);
    light.position.set(0, 20, 20);
    light.shadowCameraVisible = true;
    light.shadowDarkness = 1;
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadowCameraVisible = true;
    scene.add(light);

    var amLight = new THREE.AmbientLight(0x333333);
    scene.add(amLight);
}

/**
 * Create objects
 */

async function createObjects(){

    // Background plane
    var plane = new THREE.PlaneGeometry(100, 100);
    surface = new THREE.Mesh(plane, materials['surface']);
    surface.rotation.x = -Math.PI/2;
    surface.receiveShadow = true;
    scene.add(surface);

    var cube = new THREE.BoxGeometry(1,2,1);
    var player_mesh = new THREE.Mesh(cube, materials['slot']);
    player_mesh.castShadow = true;
    player = new THREE.Object3D();
    player.add(player_mesh);
    player.position.set(0,1,0);
    scene.add(player);

    player.speed = 10;

    player.anims = {
        w: new KF.KeyFrameAnimator,
        a: new KF.KeyFrameAnimator,
        s: new KF.KeyFrameAnimator,
        d: new KF.KeyFrameAnimator
    }

    player.anims.w.init({
        interps: [{ 
            keys:[0, 0.5, 1], 
            values:[
                { x :  0, z:  0,   y: 0 },
                { x :  0, z: -0.5, y: 0.5 },
                { x :  0, z: -1,   y: 0 },
            ],
            target:player.position,
            relative: true
        }],
        loop: false,
        duration: 1000/player.speed
    });
    player.anims.a.init({
        interps: [{ 
            keys:[0, 0.5, 1], 
            values:[
                { x :  0,   z: 0, y: 0 },
                { x : -0.5, z: 0, y: 0.3 },
                { x : -1,   z: 0, y: 0 },
            ],
            target:player.position,
            relative: true
        }],
        loop: false,
        duration: 1000/player.speed
    });
    player.anims.s.init({
        interps: [{ 
            keys:[0, 0.5, 1], 
            values:[
                { x :  0, z: 0,   y: 0 },
                { x :  0, z: 0.5, y: 0.3 },
                { x :  0, z: 1,   y: 0 },
            ],
            target:player.position,
            relative: true
        }],
        loop: false,
        duration: 1000/player.speed
    });
    player.anims.d.init({
        interps: [{ 
            keys:[0, 0.5, 1], 
            values:[
                { x : 0,   z: 0, y: 0 },
                { x : 0.5, z: 0, y: 0.3 },
                { x : 1,   z: 0, y: 0 },
            ],
            target:player.position,
            relative: true
        }],
        loop: false,
        duration: 1000/player.speed
    });

    player.moving = function() {
        for (var property in this.anims) {
            if (!this.anims.hasOwnProperty(property)) continue;
            if (player.anims[property].running){
                return true;
            }
        }
        return false;
    }

    var loader = new THREE.FBXLoader();
    var obj = await loader.asyncLoad('models/Oak_Tree.fbx');
    obj.traverse( child => {
        if(child.isMesh){
            child.castShadow = true;
            child.scale.multiplyScalar(0.007);
            child.material[0].color.setHex("0x2e7d32");
            child.material[1].color.setHex("0x4CAF50");
            child.material[2].color.setHex("0x5D4037");
            objects.tree1 = child;
        }
    });

    for (let index = 1; index <= 2; index+=3) {
        objects.tiles.push(makeObstacles(-TILE_SPACING*index));
        objects.tiles.push(makeRoad(-TILE_SPACING*index - TILE_SPACING));
        objects.tiles.push(makeRiver(-TILE_SPACING*index - 2*TILE_SPACING))
        last_generated = -TILE_SPACING*index - 2*TILE_SPACING;
    }
    
}

/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Events
 */

function makeMoreGame(){
    while(last_generated + 10 > player.position.z){
        objects.tiles.push(makeObstacles(-TILE_SPACING + last_generated));
        objects.tiles.push(makeRoad(-TILE_SPACING*2 + last_generated));
        objects.tiles.push(makeRiver(-TILE_SPACING*3 + last_generated))
        last_generated = -TILE_SPACING*3 + last_generated;
    }
}

function checkOutOfBounds(){
    if(Math.abs(player.position.x) > game_values.side_limits + 1 ){
        stop_game();
    }
}

function checkRiver(){
    if(riverDeath()){
        stop_game();
    }
}

function riverDeath(){
    for (element of objects.tiles) {
        if(element.type === tileEnum.river){
            if(element.box.containsPoint(player.position)){
                if(!onLog()){
                    return true;
                }
            }
        }
    }
    return false;
}

function onLog(){
    for (element of objects.tiles) {
        if(element.type === tileEnum.river){
            for (log of element.content) {
                var logbox = new THREE.Box3().setFromObject(log.box);
                if(logbox.containsPoint(player.position)){
                    player.position.x = log.position.x;
                    return true;
                }
            }
        }
    }
    return false;
}

function checkCarCollisions(){
    if(carCollision()){
        stop_game();
    }
}

function carCollision(){
    for (element of objects.tiles) {
        if(element.type === tileEnum.road){
            for (car of element.content) {
                var playerbox = new THREE.Box3().setFromObject(player);
                var carbox = new THREE.Box3().setFromObject(car);
                if(playerbox.intersectsBox(carbox)){
                    return true;
                }
            }
        }
    }
    return false;
}

function canMove(point){
    for (element of objects.tiles) {
        if(element.type === tileEnum.obstacle){
            for (tree of element.content) {
                if(tree.box.containsPoint(point)){
                    return false;
                }
            }
        }
    }
    return true;
}

function onKeyReleased(event){
    if(event.key in keypress){
        keypress[event.key] = false;
    }
}

function onKeyPressed(event){
    event.preventDefault();
    if(!playing){
        return;
    }
    var key = event.key.toLowerCase();
    if(key in keypress && !keypress[key]){
        keypress[key] = true;
        if(key in player.anims && !player.moving()){
            var point = player.position.clone();
            point.add(game_values.dirs[key]);
            if (!canMove(point)){
                return;
            }
            // for (let index = 0; index < objects.obstacles.length; index++) {
            //     if(objects.obstacles[index].box.containsPoint(point)){
            //         return;
            //     }
            // }
            if(key == 'a' && player.position.x <= -game_values.side_limits)
                return
            if(key == 'd' && player.position.x >= game_values.side_limits)
                return
            // if(key == 's')
            //     return
            player.anims[key].start();
        }
    }
}