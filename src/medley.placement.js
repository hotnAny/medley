//	........................................................................................................
//
//
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

// XXX
MEDLEY._matobjSelected = {
    radius: 1, // mm
    dim: 1
};

//
MEDLEY.initPlacementWithPainting = function(info) {
    var diagnal = info.maxPoint.distanceTo(info.minPoint);
    var ctrPlane = new THREE.Vector3().addVectors(info.minPoint, info.maxPoint).divideScalar(2);

    // find cross plane
    var paramsCross = XAC.findPlaneToFitPoints(info.points);
    // var planeCross = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALCONTRAST);
    // planeCross.fitTo(ctrPlane, paramsCross.A, paramsCross.B, paramsCross.C);
    // XAC.scene.add(planeCross.m);

    // find normal plane
    var pointsExtended = [];
    for (var i = 0; i < info.points.length; i++) {
        var p = info.points[i].clone().add(info.normals[i].clone().multiplyScalar(diagnal));
        pointsExtended.push(p);
    }

    var paramsNormal = XAC.findPlaneToFitPoints(info.points.concat(pointsExtended));
    var planeNormal = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALHIGHLIGHT);
    planeNormal.fitTo(ctrPlane, paramsNormal.A, paramsNormal.B, paramsNormal.C);
    XAC.scene.add(planeNormal.m);

    setTimeout(function() {
        // XAC.scene.remove(planeCross.m);
        XAC.scene.remove(planeNormal.m);
    }, 500);

    if (MEDLEY._matobjSelected != undefined) {
        var embeddable = new MEDLEY.Embeddable(MEDLEY._matobjSelected);
        // embeddable.generateGeometry(info);

        switch (embeddable._dim) {
            case 0:
                break;
            case 1:
                // generative material
                embeddable.generateGeometry = function(points) {
                    if (this._geometry == undefined) {
                        this._geometry = [];
                        for (var i = 0; i < points.length - 1; i++) {
                            var segment = new XAC.ThickLine(points[i], points[i + 1], this._matobj
                                .radius, XAC.MATERIALHIGHLIGHT);
                            this._geometry.push(segment);
                            XAC.scene.add(segment.m);
                        }
                    } else {
                        for (var i = 0; i < points.length - 1; i++) {
                            var segment = this._geometry[i];
                            segment.update(points[i], points[i + 1], this._matobj.radius);
                        }
                    }
                };
                // embeddable.generateGeometry(info.points);

                // impose ranges for each point
                embeddable.points0 = info.points;
                embeddable.points1 = [];
                for (var i = 0; i < info.points.length; i++) {
                    var rayCaster = new THREE.Raycaster();
                    var nml = info.normals[i].multiplyScalar(-1).normalize();
                    rayCaster.ray.set(info.points[i].clone().add(nml.clone().multiplyScalar(0.1)), nml);
                    var hits = rayCaster.intersectObjects([info.object]);
                    _balls.remove(addABall(hits[0].point, 0xff0000, 1));
                    embeddable.points1.push(hits[0].point);
                }

                // ghost object for manipulation
                // var ghostArrow = ...
                // var sliderInput = new XAC.SliderInput(XAC.scene);
                // sliderInput.addSubscriber(function(info) {
                //     var t = info.interpolation;
                //
                //     for (var i = 0; i < embeddable.points0.length; i++) {
                //         embeddable.points[i] = new THREE, Vector3().addVectors(
                //             points0[i].multiplyScalar(t),
                //             points1[i].multiplyScalar(1 - t));
                //     }
                //
                // });
                break;
            case 2:
                //
                break;
            case 3:
                //
                break;
        }
    }
};

//
MEDLEY.initPlacementWithSelection = function(info) {};
