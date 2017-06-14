//	........................................................................................................
//
//	useful recurring routines, v0.1
//
//  by xiangchen@acm.org, 06/2017
//
//	........................................................................................................

var XAC = XAC || {};

function log(msg) {
	console.log(msg);
}

function time(desc) {
	var t = new Date().getTime();
	if (XAC.t != undefined && desc != undefined) {
		console.info(desc + ': ' + (t - XAC.t) + ' ms');
	}
	XAC.t = t;
	return t;
}


//
//	load models from stl binary/ascii data
//
XAC.loadStl = function (data, onStlLoaded) {
	var stlLoader = new THREE.STLLoader();
	var geometry = stlLoader.parse(data);
	var object = new THREE.Mesh(geometry, XAC.MATERIALNORMAL);
	// XAC.scene.add(object.clone());

	var dims = getBoundingBoxDimensions(object);
	var ctr = getBoundingBoxCenter(object);

	// reposition the ground & grid
	XAC.ground.position.y -= dims[1];

	XAC.scene.remove(XAC.grid);
	XAC.grid = XAC.drawGrid(dims[1]);
	XAC.scene.add(XAC.grid);

	// relocate the camera
	var r = Math.max(25, XAC.getBoundingSphereRadius(object));
	XAC.camera.position.copy(XAC.posCam.clone().normalize().multiplyScalar(r * 2));

	// re-lookAt for the camera
	XAC.mouseCtrls.target = new THREE.Vector3(0, 0, 0);

	// store the object
	XAC.objects.push(object);

	if (onStlLoaded != undefined) {
		onStlLoaded(object);
	}
}

//
//	read text file from local path
//
XAC.readFile = function (file, onSuccess, onFailure) {
	var rawFile = new XMLHttpRequest();
	rawFile.responseType = 'arraybuffer';
	rawFile.open("GET", file, true);
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4) {
			if (rawFile.status === 200 || rawFile.status == 0) {
				if (onSuccess != undefined) onSuccess(rawFile.response);
				return true;
			}
		}

		if (onFailure != undefined) onFailure();
		return false;
	}

	rawFile.send(null);
}

//
//	trim a number to certain digits after decimal point
//
XAC.trim = function (value, ndigits) {
	if (ndigits < 0) return value;
	var divider = Math.pow(10, ndigits);
	return ((value * divider) | 0) / (divider * 1.0);
}

//
//	boolean operation - union a set of meshes
//
XAC.union = function (meshes, material) {
	var __mergeUnion = function (meshes) {
		if (meshes.length > 2) {
			var merged1 = __mergeUnion(meshes.slice(0, meshes.length / 2));
			var merged2 = __mergeUnion(meshes.slice(meshes.length / 2 + 1));
			return merged1.union(merged2);
		} else if (meshes.length == 2)
			return new ThreeBSP(meshes[0]).union(new ThreeBSP(meshes[1]));
		else if (meshes.length == 1)
			return new ThreeBSP(meshes[0]);
	};
	var csgMesh = __mergeUnion(meshes);
	return csgMesh.toMesh(material == undefined ? XAC.MATERIALNORMAL : material);
}

//
//	boolean operation - subtract mesh1 from mesh0
//
XAC.subtract = function (mesh0, mesh1, material) {
	var csgMesh0 = new ThreeBSP(mesh0);
	var csgMesh1 = new ThreeBSP(mesh1);
	return csgMesh0.subtract(csgMesh1).toMesh(material == undefined ? XAC.MATERIALNORMAL : material);
}