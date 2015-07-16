/*
	Since we are using the most simple case of the geometry
	we assume the polygon will be simple, closed and convex.
	Thus code would be simple.
	The polygon is consists of array of (lng,lat) pairs
	where the first pair shall be the same as the last pair so it is closed

	We also made the assumption that the polygon is small enough that
	triangles are enough.
*/

/*
	Since polygons are considerably large, it is going to use buffergeometry.
	Thus, it is immutable once it is settled.
	Also, the colour shall also be predefined.

	The example data would be [{coordinates: [[lng1, lat1]...], color: (CSS Style Coloring is fine)}...]
*/

function TileMesh(polygons){
	this.tiles = [];
	for (var i=0; i<polygons.length; i++){
		var polygon = polygons[i];
		var tile = {
			points : polygon.coordinates.map(TileMesh.lnglatToCoord),
			color : new THREE.Color(polygon.color),
			data : polygon.data,
		};
		for (var k=0; k<polygon.coordinates.length-3; k++){
			this.tiles.push(tile);
		}
	}
	
	var geometry = this.initGeometry(polygons);
	var material = new THREE.MeshPhongMaterial({
		transparent : true,
		opacity : 0.5,
		vertexColors : THREE.VertexColors,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading,
        depthTest : true
	});

	THREE.Mesh.call(this, geometry, material);
}
TileMesh.prototype = Object.create(THREE.Mesh.prototype);
TileMesh.lnglatToCoord = function (lnglat){
	// helper function
	var lng = lnglat[0],
		lat = lnglat[1];
	var phi = +(90.0 - lat) * Math.PI / 180.0;
    var the = +(180.0 - lng) * Math.PI / 180.0;
    var wx = Math.sin(the) * Math.sin(phi) * -1;
    var wz = Math.cos(the) * Math.sin(phi);
    var wy = Math.cos(phi);
    return new THREE.Vector3(wx, wy, wz);
};

TileMesh.prototype.initGeometry = function(polygons){
	var triangles = this.tiles.length;
	var positions = new Float32Array(triangles*3*3);
	var normals = new Float32Array(triangles*3*3);
	var colors = new Float32Array(triangles*3*3);
	var geometry = new THREE.BufferGeometry();
	var idx = 0;
	var idxp = 0;
	for (var i=0; i<polygons.length; i++){
		var polygon = polygons[i];
		if (!this.tiles[idxp]){console.log(idxp);}
		var points = this.tiles[idxp].points;
		var color = this.tiles[idxp].color;
		idxp += polygon.coordinates.length-3;
		for (var k=1; k<polygon.coordinates.length-2; k++){
			positions[idx+0] = points[0].x;
			positions[idx+1] = points[0].y;
			positions[idx+2] = points[0].z;
			positions[idx+3] = points[k].x;
			positions[idx+4] = points[k].y;
			positions[idx+5] = points[k].z;
			positions[idx+6] = points[k+1].x;
			positions[idx+7] = points[k+1].y;
			positions[idx+8] = points[k+1].z;

			normals[idx] = points[0].x;
			normals[idx+1] = points[0].y;
			normals[idx+2] = points[0].z;
			normals[idx+3] = points[k].x;
			normals[idx+4] = points[k].y;
			normals[idx+5] = points[k].z;
			normals[idx+6] = points[k+1].x;
			normals[idx+7] = points[k+1].y;
			normals[idx+8] = points[k+1].z;

			colors[idx+0] = color.r;
			colors[idx+1] = color.g;
			colors[idx+2] = color.b;
			colors[idx+3] = color.r;
			colors[idx+4] = color.g;
			colors[idx+5] = color.b;
			colors[idx+6] = color.r;
			colors[idx+7] = color.g;
			colors[idx+8] = color.b;

			idx += 9;
		}
	}
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
	geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
	geometry.computeBoundingSphere();
	return geometry;
}

TileMesh.prototype.getIntersectGeometry = function(face){
	return this.tiles[face.a/3];
}

/*
	use predefined size for the geometry,
	when update size exceeded, it will expand automatically.
	So, prepare to draw an n-gon needs at least size n.
*/
TileSelectedMesh = function(size){
	size = size || 0;
	var geometry = new THREE.Geometry();
	var material = new THREE.MeshPhongMaterial({
		vertexColors : THREE.VertexColors,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading,
        depthTest : true
	});
	THREE.Mesh.call(this, geometry, material);
	this.resize(size);
}
TileSelectedMesh.prototype = Object.create(THREE.Mesh.prototype);

TileSelectedMesh.dummyVertex = new THREE.Vector3();
TileSelectedMesh.dummyColor = new THREE.Color();

TileSelectedMesh.prototype.update = function(tile){
	var sides = tile.points.length-1;
	var points = tile.points;
	var size = this.polygonSize;
	if (sides > size){
		this.resize(sides);
	}
	for (var i=0; i<sides; i++){
		this.geometry.vertices[i] = tile.points[i].clone();
		this.geometry.vertices[i+size] = tile.points[i].clone().multiplyScalar(1.01);
		this.geometry.colors[i] = tile.color;
		this.geometry.colors[i+size] = tile.color;
	}
	for (var i=sides; i<size; i++){
		this.geometry.vertices[i] = TileSelectedMesh.dummyVertex;
		this.geometry.vertices[i+size] = TileSelectedMesh.dummyVertex;
		this.geometry.colors[i] = TileSelectedMesh.dummyColor;
		this.geometry.colors[i+size] = TileSelectedMesh.dummyColor;
	}
	this.geometry.colorsNeedUpdate = true;
	this.geometry.verticesNeedUpdate = true;
}

TileSelectedMesh.prototype.clear = function(){
	var size = this.polygonSize;
	for (var i=0; i<size; i++){
		this.geometry.vertices[i] = TileSelectedMesh.dummyVertex;
		this.geometry.vertices[i+size] = TileSelectedMesh.dummyVertex;
		this.geometry.colors[i] = TileSelectedMesh.dummyColor;
		this.geometry.colors[i+size] = TileSelectedMesh.dummyColor;
	}
	this.geometry.colorsNeedUpdate = true;
	this.geometry.verticesNeedUpdate = true;
}

TileSelectedMesh.prototype.resize = function(size){

	for (var i=0; i<size*2; i++){
		this.geometry.vertices.push(TileSelectedMesh.dummyVertex);
		this.geometry.colors.push(TileSelectedMesh.dummyColor);
	}
	for (var i=1; i<size-1; i++){
		this.geometry.faces.push(new THREE.Face3(0, i, i+1));
		this.geometry.faces.push(new THREE.Face3(size, size+i, size+i+1));
		this.geometry.faces.push(new THREE.Face3(i, size+i, size+i+1));
		this.geometry.faces.push(new THREE.Face3(i, i+1, size+i+1));
	}
	this.geometry.faces.push(new THREE.Face3(0, 1, size+1));
	this.geometry.faces.push(new THREE.Face3(0, size, size+1));
	this.geometry.faces.push(new THREE.Face3(size-1, 0, size));
	this.geometry.faces.push(new THREE.Face3(size-1, 2*size-1, size));


	this.polygonSize = size;

	this.geometry.dynamic = true;
	this.geometry.colorsNeedUpdate = true;
	this.geometry.verticesNeedUpdate = true;
	this.geometry.elementsNeedUpdate = true;

}