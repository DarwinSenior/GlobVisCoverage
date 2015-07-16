var Globe = function(){
	this.init();
	this.animate();
}

function start_app(){
	var globe = new Globe(document.body);
	var data = tiles.features.map(function(item){
		return {
			'coordinates' : item.geometry.coordinates[0],
			'color' : 'red',
			'data' : {
				id : item.id,
				properties : item.properties
			},
		}
	});
	globe.addTile(data);
	var data = tiles2.features.map(function(item){
		return {
			'coordinates' : item.geometry.coordinates[0],
			'color' : 'green',
			'data' : {
				id : item.id,
				properties : item.properties
			},
		}
	});
	globe.addTile(data);
	var data = tiles3.features.map(function(item){
		return {
			'coordinates' : item.geometry.coordinates[0],
			'color' : 'blue',
			'data' : {
				id : item.id,
				properties : item.properties
			},
		}
	});
	globe.addTile(data);
}

Globe.prototype.addDirectionalLight = function(lights, options){
	options = options || {}
	options.color = options.color || 0xffffff;
	options.intensity = options.intensity || 0.5;
	for (var i=0; i<lights.length; i++){
		var directionalLight = new THREE.DirectionalLight(0xaaaaaa, 0.5);
		var x = lights[i][0], y = lights[i][1], z = lights[i][2];
		directionalLight.position.set(x,y,z).normalize();
		this.scene.add(directionalLight); 
	}
}
/* options including the following default */
Globe.prototype.setControl = function(options){
	options = options || {
		rotateSpeed : 1.0,
		zoomSpeed : 1,
		noZoom : false,
		noPan : true,
		staticMoving : false,
		minDistance : 23.0,
		maxDistance : 70,
		dynamicDampingFactor : 0.1
	}
	for (key in options){
		this.controls[key] = options[key];
	}
}

Globe.prototype.on = function(data){

};

Globe.prototype.addTile = function(data){
	var mesh = new TileMesh(data);
	this.globe.add(mesh);
	this.tiles.push(mesh);
};

Globe.prototype.onWindowResize = function(){
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();
	this.renderer.setSize(window.innerWidth, window.innerHeight);
};

Globe.prototype.init = function(){
	
	if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }
    this.tiles = [];
    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initGlobe();

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '80px';
    document.body.appendChild(stats.domElement);
    

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    document.body.addEventListener('mousemove', this.handleClick.bind(this), false);
};


Globe.prototype.initRenderer = function(){
	this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0xffffff, 0.1);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
}

// camera and trackball control
Globe.prototype.initCamera = function(){
	this.camera = camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4500);
    this.camera.position.z = 100;
    this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
    this.setControl();
}

// scene and light
Globe.prototype.initScene = function(){
	this.scene = new THREE.Scene();
	// this.scene.add(new THREE.AmbientLight(0xffffff));// add all lighting
	this.addDirectionalLight([
		[-1,1,1],
		[-1,1,-1],
		[-1,-1,1],
		[-1,-1,-1],
		[1,1,1],
		[1,1,-1],
		[1,-1,1],
		[1,-1,-1]
		])
};

Globe.prototype.initGlobe = function(){
	var segments = 64;
    var radius = 0.995;

	this.globe = new THREE.Object3D();
	this.scene.add(this.globe);

	this.globe.add(new THREE.Mesh(
    	new THREE.SphereGeometry(radius, segments, segments),
    	new THREE.MeshLambertMaterial({
    		transparent : true,
    		depthTest : true,
    		opacity : 0.5,
    		color : 0xffffff
    	})));
	this.selectedTile = new TileSelectedMesh(4);
	this.globe.add(this.selectedTile);

	this.globe.scale.set(20, 20, 20);
}

Globe.prototype.handleClick = function(event){
	event.preventDefault();
	var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(mouseX, mouseY, -1);
    vector.unproject(this.camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObject(this.globe, true);
    var intersect = intersects[0];
    if (intersect && intersect.object.getIntersectGeometry){ // so it intercept and is not base globe
    	var tile = intersect.object.getIntersectGeometry(intersect.face);
    	this.selectedTile.update(tile);
    	console.log(tile.data.id);
    }else{
    	this.selectedTile.clear();
    }
}

Globe.prototype.animate = function(time){
	requestAnimationFrame(this.animate.bind(this));
	this.controls.update();
	this.renderer.render(this.scene, this.camera);
	stats.update();
};


