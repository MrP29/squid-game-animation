var canvas;
var gl;

var program ;

var near = 0.1;
var far = 9000;

const viewportValue = 6;
var left = -viewportValue;
var right = viewportValue;
var ytop = viewportValue;
var bottom = -viewportValue;


var lightPosition = vec4(0.0, 30.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 100.0;


var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix ;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;

var eye = vec3(0.0, 4.0, -8.0);
var at = vec3(0.0, 3.0, -4.0);
var up = vec3(0.0, 1.0, 0.0);


var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var resetTimerFlag = true ;
var animFlag = false ;
var prevTime = 0.0 ;
var useTextures = 0 ;

let scene = 0;
let sceneTime = 0.0;
let frame = 0.0;
let second = 0.0;

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
for ( var j = 0; j < texSize; j++)
image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
for ( var j = 0; j < texSize; j++ )
for(var k =0; k<4; k++)
image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var textureArray = [] ;

// Color Schemes
const RED = vec4(1.0, 0.0, 0.0, 1.0);
const GREEN = vec4(0.0, 1.0, 0.0, 1.0);
const ORANGE = vec4(0.8, 0.4, 0.0, 1.0);
const YELLOW = vec4(1.0, 1.0, 0.2, 1.0);
const SKIN = vec4(1.0, 0.7, 0.4, 1.0);
const BLACK = vec4(0.15, 0.15, 0.15, 1.0);
const PURPLE = vec4(1.0, 0.2, 0.6, 1.0);
const DARKGREEN = vec4(0.0, 0.35, 0.17, 1.0);
const WHITE = vec4(1.0, 1.0, 1.0, 1.0);
let LINE = RED;

function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

function loadFileTexture(tex, filename)
{
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;
    
    gl.bindTexture( gl.TEXTURE_2D, tex.textureWebGL );
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true ;

}

function initTextures() {
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/sand.jpg") ;
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/wall.jpg") ;
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/tree.jpg") ;
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/orange.jpg") ;   

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/sky.jpg") ;      

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/door.jpg") ;   

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/blood.jpg") ;   

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Textures/metal.jpg") ;  
}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

//----------------------------------------------------------------

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

function toggleTextures() {
    useTextures = 1 - useTextures ;
    gl.uniform1i( gl.getUniformLocation(program,
                                         "useTextures"), useTextures );
}

function waitForTextures1(tex) {
    setTimeout( function() {
    console.log("Waiting for: "+ tex.image.src) ;
    wtime = (new Date()).getTime() ;
    if( !tex.isTextureReady )
    {
        console.log(wtime + " not ready yet") ;
        waitForTextures1(tex) ;
    }
    else
    {
        console.log("ready to render") ;
        window.requestAnimFrame(render);
    }
               },5) ;
    
}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log("boo"+texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               console.log("ready to render") ;
               window.requestAnimFrame(render);
               }
               },5) ;
    
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader-custom", "fragment-shader-custom" );
    gl.useProgram( program );
    
 
    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;

    gl.uniform1i( gl.getUniformLocation(program, "useTextures"), useTextures );

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // set a default material
    setColor(materialDiffuse) ;
    
  
    
    // set the callbacks for the UI elements
    // document.getElementById("sliderXi").oninput = function() {
    //     RX = this.value ;
    //     window.requestAnimFrame(render);
    // };
    // document.getElementById("sliderYi").oninput = function() {
    //     RY = this.value;
    //     window.requestAnimFrame(render);
    // };
    // document.getElementById("sliderZi").oninput = function() {
    //     RZ =  this.value;
    //     window.requestAnimFrame(render);
    // };
    
    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };
    
    // document.getElementById("textureToggleButton").onclick = function() {
    //     toggleTextures() ;
    //     window.requestAnimFrame(render);
    // };

    // document.getElementById("shaderToggleButton").onclick = function() {
    //     toggleShaders() ;
    //     window.requestAnimFrame(render);
    // };

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };
    
    // load and initialize the textures
    initTextures() ;
    
    // Recursive wait for the textures to load
    waitForTextures(textureArray) ;
    //setTimeout (render, 100) ;
    
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set the projection matrix
    projectionMatrix = perspective(60.0, 1.0, near, far);

    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
    
    // initialize the modeling matrix stack
    MS= [] ;
    modelMatrix = mat4() ;
    
    // apply the slider rotations
    // gRotate(RZ,0,0,1) ;
    // gRotate(RY,0,1,0) ;
    // gRotate(RX,1,0,0) ;
    
    // send all the matrices to the shaders
    setAllMatrices() ;
    
    // get real time
    let curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        sceneTime = sceneTime + curTime - prevTime;
        second += curTime - prevTime;
        prevTime = curTime ;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);    

    switch(scene) {
        case 0: scene0(sceneTime);
        break;
        case 1: scene1(sceneTime);
        break;
        case 2: scene2(sceneTime);
        break;
        case 3: scene3(sceneTime);
        break;
        case 4: scene4(sceneTime);
        break;
        case 5: scene5(sceneTime);
        break;
    }

    frame++;
    if(second > 2.0) {
        console.log("frame rate:" + (frame / second));
        frame = 0.0;
        second = 0.0;
    }

    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;
    
    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function(ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };
    
    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function(ev) {
        controller.dragging = false;
    };
    
    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function(ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}

function scene0(sceneTime) {
    // Basic position setting up
    background.changeColor(RED);
    LINE = RED;
    youngHee.position = vec3(0.0, 7.0, 7.0);
    guard1.position = vec3(8.0, 4.2, 7.0);
    guard2.position = vec3(-8.0, 4.2, 7.0);

    human1.position = vec3(5.0, 3.5, -9.0);
    human2.position = vec3(1.5, 3.5, -9.0);
    human3.position = vec3(-1.5, 3.5, -9.0);
    human4.position = vec3(-5.0, 3.5, -9.0);

    // Move back camera
    if(sceneTime < 0.2) {
        youngHee.headRotation[1] = 180;
    } else if(sceneTime < 1.8) {
        at = vec3(youngHee.position[0], youngHee.position[1], youngHee.position[2] - sceneTime * 7);
        eye = vec3(at[0], at[1] + 1.0, at[2] - 3.0 - sceneTime * 7);
    } else if(sceneTime < 6.0) {  // 6.25 for a cycle
        at[0] = Math.sin((sceneTime - 1.8) * 1.5) * 4;
    } else {
        at = vec3(youngHee.position[0], youngHee.position[1], youngHee.position[2]);
        nextScene();
    }
    
    background.drawBackground();
    youngHee.drawYoungHee();
    guard1.drawHuman();
    guard2.drawHuman();
    human1.drawHuman();
    human2.drawHuman();
    human3.drawHuman();
    human4.drawHuman();
}

function scene1(sceneTime) {
    //Younghee rotates and game starts
    if(youngHee.headRotation[1] > 0) {
        youngHee.headRotation[1] -= 2;
    } else {
        background.changeColor(GREEN);
        LINE = GREEN;
        nextScene();
    }

    background.drawBackground();
    youngHee.drawYoungHee();
    guard1.drawHuman();
    guard2.drawHuman();
    human1.drawHuman();
    human2.drawHuman();
    human3.drawHuman();
    human4.drawHuman();
}

function scene2(sceneTime) {
    // Candidates walks
    if(sceneTime < 3.0) {
        human1.walk(0.025);
        human2.walk(0.03);
        human3.walk(0.02);
        human4.walk(0.025);
        at[2] += 0.02;
        eye[2] += 0.02;
        lastAt = cloneVec3(at);
        lastEye = cloneVec3(eye);
    } else if(sceneTime < 5.5) {    // Younghee rotates
        if(youngHee.headRotation[1] < 180) {
            youngHee.headRotation[1] += 2;
        }
        if(youngHee.headRotation[1] > 30) {
            at = cloneVec3(youngHee.position);
            eye = cloneVec3(human2.position);
            eye[2] = eye[2] - 3.0;
            background.changeColor(RED);
            LINE = RED;
        }
        human2.walk(0.01);
    } else if(sceneTime < 6.0) {    // Candidate 2 gets caught
        if(youngHee.headRotation[1] > 170) {
            youngHee.headRotation[1] -= 3;
        }
        at = cloneVec3(youngHee.position);
        eye = cloneVec3(human2.position);
        eye[2] = eye[2] - 3.0;
        human2.walk(0.01);
    } else if(sceneTime < 7.0) {
        if(youngHee.headRotation[0] > -20) {
            youngHee.headRotation[0] -= 0.5;
        }
        human2.walk(0.01);
    } else if(sceneTime < 7.5) {    // Candidate 2 gets killed
        if(background.gun1Rotation[1] < 20) {
            background.gun1Rotation[1] += 1.5;
        } else if(background.gun1Rotation[0] > -15) {
            background.gun1Rotation[0] -= 0.5;
        }

        if(background.gun2Rotation[1] > -30) {
            background.gun2Rotation[1] -= 2.5;
        } else if(background.gun2Rotation[0] > -15) {
            background.gun2Rotation[0] -= 0.5;
        }
        human2.walk(0.01);
    } else if(sceneTime < 14.0) {
        if(sceneTime < 12.5) {
            background.gun1Shoot(cloneVec3(human2.position), TIME);
            background.gun2Shoot(cloneVec3(human2.position), TIME);
        }
        if(sceneTime > 9.5) {
            human2.die(TIME);
            at = cloneVec3(human2.position);

            eye[0] = at[0] + (Math.sin((sceneTime - 9.5) * 1.5) * 8.0);
            eye[1] = at[1] + 3.0;
            eye[2] = at[2] + (Math.cos((sceneTime - 9.5) * 1.5) * 8.0);
        }
    } else if(sceneTime < 17.5) {   // Candidate 4 gets shocked and runs
        if(sceneTime < 16.5) {
            human4.backstep(0.025);
        } else {
            human4.die(TIME);
        }

        if(sceneTime > 16.0) {      // Candidate 4 gets killed
            background.gun1Shoot(cloneVec3(human4.position), TIME);
            background.gun2Shoot(cloneVec3(human4.position), TIME);
        }
    } else if(sceneTime < 19.0) {
        background.gun1Rotation = vec3(0.0, 0.0, 0.0);
        background.gun2Rotation = vec3(0.0, 0.0, 0.0);
        at = cloneVec3(youngHee.position);
        eye = vec3(0.0, 2.0, -3.0)
    } else if(sceneTime < 22.0) {
        if(youngHee.headRotation[0] < 0) {
            youngHee.headRotation[0] += 0.5;
        } else if(youngHee.headRotation[1] > 0) {
            youngHee.headRotation[1] -= 3;    
        }
        if(youngHee.headRotation[1] < 5) {
            background.changeColor(GREEN);
            LINE = GREEN;
        }
    } else {
        eye = cloneVec3(human3.position);
        eye[1] = eye[1] + 0.5;
        eye[2] = eye[2] - 5.0;
        nextScene();
    }

    background.drawBackground();
    youngHee.drawYoungHee();
    guard1.drawHuman();
    guard2.drawHuman();
    human1.drawHuman();
    human2.drawHuman();
    human3.drawHuman();
    human4.drawHuman();
}

function scene3(sceneTime) {
    if(sceneTime < 2.0) {   // Candidates walks
        human1.walk(0.03);
        human3.walk(0.025);
    } else if(sceneTime < 4.5) {
        if(youngHee.headRotation[1] < 180) {
            youngHee.headRotation[1] += 2;
        }
        if(youngHee.headRotation[1] > 30) {
            background.changeColor(RED);
            LINE = RED;
        }
        if(youngHee.headRotation[1] == 180) {
            at = vec3(0.0, 0.0, -3.0);
            eye = vec3(cloneVec3(youngHee.position));
            eye[2] = eye[2] - 2.0;
        }
    } else if(sceneTime < 8.0) {    // Younghee observes candidates
        at[0] = Math.sin((sceneTime - 4.5) * 1.5) * 1.5;
        if(sceneTime > 7.9) {
            at = vec3(cloneVec3(youngHee.position));
            eye = vec3(cloneVec3(human3.position));
            eye[1] = eye[1] + 1.0;
            eye[2] = eye[2] - 3.0;
        }
    } else if(sceneTime < 10.0) {
        if(youngHee.headRotation[1] > 0) {
            youngHee.headRotation[1] -= 2;
        }
        if(youngHee.headRotation[1] < 25) {
            background.changeColor(GREEN);
            LINE = GREEN;
        }
    } else if(sceneTime < 11.5) {
        human1.walk(0.03);
        human3.walk(0.025);
    } else if(sceneTime < 15.5) {   // Candidate 1 gets caught and killed
        if(sceneTime < 13.5) {
            human1.walk(0.015);
        } else {
            human1.backstep(0.015);
        }
        if(youngHee.headRotation[1] < 180) {
            youngHee.headRotation[1] += 4.0;
        } else {
            youngHee.headRotation[1] = 180.0;
            if (youngHee.headRotation[0] > -40.0) {
                youngHee.headRotation[0] -= 2.0;
            }
        }
        if(youngHee.headRotation[1] > 30) {
            background.changeColor(RED);
            LINE = RED;
            at[0] = at[0] + 0.02
        }
        if(youngHee.headRotation[0] < -10.5) {
            if(background.gun1Rotation[1] < 15) {
                background.gun1Rotation[1] += 1.5;
            } else if(background.gun1Rotation[0] > -15) {
                background.gun1Rotation[0] -= 0.5;
            }
        }
    } else if(sceneTime < 17.5) {
        background.gun1Shoot(cloneVec3(human1.position), TIME);
        if(sceneTime > 16.0) {
            human1.die(TIME);
        }
    } else if(sceneTime < 18.5) {
        at[0] = at[0] - 0.03;
    } else {
        nextScene();
    }

    background.drawBackground();
    youngHee.drawYoungHee();
    guard1.drawHuman();
    guard2.drawHuman();
    human1.drawHuman();
    human2.drawHuman();
    human3.drawHuman();
    human4.drawHuman();
}

function scene4(sceneTime) {
    if(sceneTime < 1.5) {   // Younghee rotates and starts game again
        if(youngHee.headRotation[0] < 0) {
            youngHee.headRotation[0] += 1.5;
        } else {
            youngHee.headRotation[0] = 0.0;
            if(youngHee.headRotation[1] > 0) {
                youngHee.headRotation[1] -= 3.5;
            }
            if(youngHee.headRotation[1] < 10.0) {
                background.changeColor(GREEN);
                LINE = GREEN;
            }
        }
        if(background.gun1Rotation[0] < 0) {
            background.gun1Rotation[0] += 0.8;
        } else {
            if(background.gun1Rotation[1] > 0) {
                background.gun1Rotation[1] -= 2.0;
            }
            at = vec3(0.0, 2.0, 6.0);
            eye = vec3(at[0], at[1] + 1.0, at[2] - 10.0);
        }
    } else if(sceneTime < 5.5) {    // Candidate 3 wins the game
        at[0] -= 0.01;
        eye[0] -= 0.01;
        eye[2] += 0.01;
        human3.position[0] -= 0.005;
        human3.walk(0.028);
        human3.run = 2.0;
    } else {
        human3.run = 1.0;
        nextScene();
    }

    background.drawBackground();
    youngHee.drawYoungHee();
    guard1.drawHuman();
    guard2.drawHuman();
    human1.drawHuman();
    human2.drawHuman();
    human3.drawHuman();
    human4.drawHuman();
}

function scene5(sceneTime) {
    // Candidate 3 congratulates surviving
    human3.happy();

    background.drawBackground();
    youngHee.drawYoungHee();
    guard1.drawHuman();
    guard2.drawHuman();
    human1.drawHuman();
    human2.drawHuman();
    human3.drawHuman();
    human4.drawHuman();
}

function nextScene() {
    sceneTime = 0;
    scene = scene + 1;
}

function cloneVec3(vec3Value) {
    return vec3(vec3Value[0], vec3Value[1], vec3Value[2]);
}

function cloneVec4(vec4Value) {
    return vec4(vec4Value[0], vec4Value[1], vec4Value[2], vec4Value[3]);
}

let human1 = {
    position: vec3(0.0, 3.3, 0.0),
    humanRotation: vec3(0.0, 0.0, 0.0),
    leftArmRotation: vec3(0.0, 0.0, 0.0),
    rightArmRotation: vec3(0.0, 0.0, 0.0),
    leftLegRotation: vec3(0.0, 0.0, 0.0),
    rightLegRotation: vec3(0.0, 0.0, 0.0),
    deadTime: 0.0,
    bloodSize: 0.1,

    // Draw human
    drawHuman: function () {
        gPush();
        {
            gTranslate(this.position[0], this.position[1], this.position[2]);
            gRotate(this.humanRotation[0], 1.0, 0.0, 0.0);
            gScale(0.4, 0.4, 0.4);

            // Head
            gPush();
            {
                setColor(SKIN);
                gScale(0.5, 0.5, 0.5);
                drawSphere();
            }
            gPop();

            // Body
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -1.5, 0.0);
                gScale(0.9, 1.0, 0.3);
                drawCube();
            }
            gPop();

            // Front Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, 0.3);

                gPush();
                {
                    gScale(0.2, 0.6, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Back Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, -0.3);

                gPush();
                {
                    gScale(0.2, 0.6, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Arms
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -0.35, 0.0);

                // Right Arm
                gPush();
                {
                    gTranslate(-1.1, 0.0, 0.0);
                    gRotate(-this.rightArmRotation[0], 1.0, 0.0, 0.0);
                    
                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.rightArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();

                // Left Arm
                gPush();
                {
                    setColor(DARKGREEN);
                    gTranslate(1.1, 0.0, 0.0);
                    gRotate(-this.leftArmRotation[0], 1.0, 0.0, 0.0);
                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(0.5, 1.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.leftArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Legs
            gPush();
            {
                gTranslate(0.0, -2.6, 0.0);

                // Right Leg
                gPush();
                {
                    gTranslate(-0.5, 0.0, 0.0);
                    gRotate(-this.rightLegRotation[0], 1.0, 0.0, 0.0);

                    // Thigh
                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();

                // Left Leg
                gPush();
                {
                    gTranslate(0.5, 0.0, 0.0);
                    gRotate(-this.leftLegRotation[0], 1.0, 0.0, 0.0);
                    // Thigh

                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Blood
            if(this.humanRotation[0] > 85.0) {
                gPush();
                {
                    toggleTextures();
                    gl.bindTexture(gl.TEXTURE_2D, textureArray[6].textureWebGL);
                    //setColor(vec4(0.8, 0.1, 0.1, 1.0));
                    gTranslate(0.0, -1.8, 0.5);
                    //gRotate(180, 0.0, 0.0, Math.random());
                    if(this.bloodSize < 2.3) {
                        this.bloodSize += 0.035
                    }
                    gScale(this.bloodSize * 1.1, this.bloodSize * 0.9, 0.1);
                    drawSphere();
                    toggleTextures();
                }
                gPop();
            }

        }
        gPop();
    },

    // Walk animation
    walk: function (speed) {
        this.position[2] += speed;
        this.humanRotation[0] = 5;
        this.rightArmRotation[0] = 5 + Math.sin(TIME + 10) * 30;
        this.leftArmRotation[0] = 5 - Math.sin(TIME + 10) * 30;
    
        this.rightLegRotation[0] = 20 - Math.sin(TIME + 10) * 30;
        this.leftLegRotation[0] = 20 + Math.sin(TIME + 10) * 30;         
    },

    die: function (Time) {
        if(this.deadTime === 0) {
            this.deadTime = Time;
            this.humanRotation[0] = 0.0;
            curY = this.position[1];
            curZ = this.position[2];
        } else if(Time - this.deadTime < 0.8) {
            this.position[1] -= curY - this.position[1] < 2.2 ? 0.1 : 0.0;
            this.position[2] += this.position[2] - curZ < 1.4 ? 0.05 : 0.0;
            this.humanRotation[0] += this.humanRotation[0] < 90 ? 3.0 : 0.0;
        }
    },

    backstep: function (speed) {
        if(this.leftArmRotation[0] < 90) {
            this.leftArmRotation[0] += 0.3;
        }

        if(this.rightArmRotation[0] < 90) {
            this.rightArmRotation[0] += 0.3;
        }

        this.rightLegRotation[0] = 20 - Math.sin(TIME) * 40;
        this.leftLegRotation[0] = 20 + Math.sin(TIME) * 40;  

        this.position[2] -= speed;
    }
};

let human2 = {
    position: vec3(0.0, 3.3, 0.0),
    humanRotation: vec3(0.0, 0.0, 0.0),
    leftArmRotation: vec3(0.0, 0.0, 0.0),
    rightArmRotation: vec3(0.0, 0.0, 0.0),
    leftLegRotation: vec3(0.0, 0.0, 0.0),
    rightLegRotation: vec3(0.0, 0.0, 0.0),
    deadTime: 0.0,
    bloodSize: 0.1,

    // Draw human
    drawHuman: function () {
        gPush();
        {
            //setColor(vec4(0.0, 0.0, 0.0, 1.0));
            gTranslate(this.position[0], this.position[1], this.position[2]);
            gRotate(this.humanRotation[0], 1.0, 0.0, 0.0);
            gScale(0.4, 0.4, 0.4);

            // Head
            gPush();
            {
                setColor(SKIN);
                gScale(0.5, 0.5, 0.5);
                drawSphere();
            }
            gPop();

            // Body
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -1.5, 0.0);
                gScale(0.9, 1.0, 0.3);
                drawCube();
            }
            gPop();

            // Front Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, 0.3);

                gPush();
                {
                    gTranslate(0.0, 0.35, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.3, 0.12, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.1, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(-0.28, -0.32, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.6, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Back Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, -0.3);

                gPush();
                {
                    gTranslate(0.0, 0.35, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(-0.3, 0.12, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.1, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.28, -0.32, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.6, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Arms
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -0.35, 0.0);

                // Right Arm
                gPush();
                {
                    gTranslate(-1.1, 0.0, 0.0);
                    gRotate(-this.rightArmRotation[0], 1.0, 0.0, 0.0);
                    
                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.rightArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();

                // Left Arm
                gPush();
                {
                    setColor(DARKGREEN);
                    gTranslate(1.1, 0.0, 0.0);
                    gRotate(-this.leftArmRotation[0], 1.0, 0.0, 0.0);
                    // Upper Arm
                    gPush();
                    {
                        //etColor(vec4(0.5, 1.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.leftArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Legs
            gPush();
            {
                gTranslate(0.0, -2.6, 0.0);

                // Right Leg
                gPush();
                {
                    gTranslate(-0.5, 0.0, 0.0);
                    gRotate(-this.rightLegRotation[0], 1.0, 0.0, 0.0);

                    // Thigh
                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();

                // Left Leg
                gPush();
                {
                    gTranslate(0.5, 0.0, 0.0);
                    gRotate(-this.leftLegRotation[0], 1.0, 0.0, 0.0);
                    // Thigh

                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Blood
            if(this.humanRotation[0] === 90.0) {
                gPush();
                {
                    toggleTextures();
                    gl.bindTexture(gl.TEXTURE_2D, textureArray[6].textureWebGL);
                    //setColor(vec4(0.8, 0.1, 0.1, 1.0));
                    gTranslate(0.0, -1.7, 0.5);
                    if(this.bloodSize < 2.3) {
                        this.bloodSize += 0.015
                    }
                    gScale(this.bloodSize * 0.8, this.bloodSize * 1.4, 0.1);
                    drawSphere();
                    toggleTextures();
                }
                gPop();
            }
        }
        gPop();
    },

    // Walk animation
    walk: function (speed) {
        this.position[2] += speed;
        this.humanRotation[0] = 5;
        this.rightArmRotation[0] = 5 + Math.sin(TIME + 5.0) * 30;
        this.leftArmRotation[0] = 5 - Math.sin(TIME + 5.0) * 30;
    
        this.rightLegRotation[0] = 20 - Math.sin(TIME + 5.0) * 30;
        this.leftLegRotation[0] = 20 + Math.sin(TIME + 5.0) * 30;         
    },

    die: function (Time) {
        if(this.deadTime === 0.0) {
            this.deadTime = Time;
            this.humanRotation[0] = 0.0;
            curY = this.position[1];
            curZ = this.position[2];
        } else if(Time - this.deadTime < 0.8) {
            this.position[1] -= curY - this.position[1] < 2.2 ? 0.06 : 0.0;
            this.position[2] += this.position[2] - curZ < 1.4 ? 0.05 : 0.0;
            this.humanRotation[0] += this.humanRotation[0] < 90 ? 3.0 : 0.0;
        }
    }
};

let human3 = {
    position: vec3(0.0, 3.3, 0.0),
    humanRotation: vec3(0.0, 0.0, 0.0),
    leftArmRotation: vec3(0.0, 0.0, 0.0),
    rightArmRotation: vec3(0.0, 0.0, 0.0),
    leftLegRotation: vec3(0.0, 0.0, 0.0),
    rightLegRotation: vec3(0.0, 0.0, 0.0),
    deadTime: 0.0,
    run: 1.0,

    // Draw human
    drawHuman: function () {
        gPush();
        {
            //setColor(vec4(0.0, 0.0, 0.0, 1.0));
            gTranslate(this.position[0], this.position[1], this.position[2]);
            gRotate(this.humanRotation[0], 1.0, 0.0, 0.0);
            gScale(0.4, 0.4, 0.4);

            // Head
            gPush();
            {
                setColor(SKIN);
                gScale(0.5, 0.5, 0.5);
                drawSphere();
            }
            gPop();

            // Body
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -1.5, 0.0);
                gScale(0.9, 1.0, 0.3);
                drawCube();
            }
            gPop();

            // Front Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, 0.3);

                gPush();
                {
                    gTranslate(0.0, 0.35, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.3, 0.12, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.1, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.3, -0.32, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.6, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Back Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, -0.3);

                gPush();
                {
                    gTranslate(0.0, 0.35, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(-0.3, 0.12, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.1, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(-0.3, -0.32, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.6, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Arms
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -0.35, 0.0);

                // Right Arm
                gPush();
                {
                    gTranslate(-1.1, 0.0, 0.0);
                    gRotate(-this.rightArmRotation[0], 1.0, 0.0, 0.0);
                    
                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.rightArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();

                // Left Arm
                gPush();
                {
                    setColor(DARKGREEN);
                    gTranslate(1.1, 0.0, 0.0);
                    gRotate(-this.leftArmRotation[0], 1.0, 0.0, 0.0);
                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(0.5, 1.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.leftArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Legs
            gPush();
            {
                gTranslate(0.0, -2.6, 0.0);

                // Right Leg
                gPush();
                {
                    gTranslate(-0.5, 0.0, 0.0);
                    gRotate(-this.rightLegRotation[0], 1.0, 0.0, 0.0);

                    // Thigh
                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();

                // Left Leg
                gPush();
                {
                    gTranslate(0.5, 0.0, 0.0);
                    gRotate(-this.leftLegRotation[0], 1.0, 0.0, 0.0);
                    // Thigh

                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    },

    // Walk animation
    walk: function (speed) {
        this.position[2] += speed;
        this.humanRotation[0] = 5;
        this.rightArmRotation[0] = 5 + Math.sin((TIME - 10.0) * this.run) * 30 ;
        this.leftArmRotation[0] = 5 - Math.sin((TIME - 10.0) * this.run) * 30;
    
        this.rightLegRotation[0] = 20 - Math.sin((TIME - 10.0) * this.run) * 30;
        this.leftLegRotation[0] = 20 + Math.sin((TIME - 10.0) * this.run) * 30;         
    },

    die: function (Time) {
        if(this.deadTime === 0) {
            this.deadTime = Time;
            this.humanRotation[0] = 0.0;
            curY = this.position[1];
            curZ = this.position[2];
        } else if(Time - this.deadTime < 1.5) {
            //console.log(curY + " " + curZ);
            this.position[1] -= curY - this.position[1] < 1.5 ? 0.06 : 0.0;
            this.position[2] += this.position[2] - curZ < 1.4 ? 0.05 : 0.0;
            this.humanRotation[0] += this.humanRotation[0] < 90 ? 3.0 : 0.0;
        }
    },

    happy: function () {
        this.position[1] = 3.1 + ((Math.sin(TIME) + 1.0) * 0.6);
        this.humanRotation[0] = 0.0;
        this.rightArmRotation[0] = 45 + Math.sin(TIME) * 45;
        this.leftArmRotation[0] = 45 + Math.sin(TIME) * 45;
        this.rightLegRotation[0] = 30 - Math.sin(TIME) * 30;
        this.leftLegRotation[0] = 30 - Math.sin(TIME) * 30; 
    }
};

let human4 = {
    position: vec3(0.0, 3.3, 0.0),
    humanRotation: vec3(0.0, 0.0, 0.0),
    leftArmRotation: vec3(0.0, 0.0, 0.0),
    rightArmRotation: vec3(0.0, 0.0, 0.0),
    leftLegRotation: vec3(0.0, 0.0, 0.0),
    rightLegRotation: vec3(0.0, 0.0, 0.0),
    deadTime: 0.0,
    bloodSize: 0.1,

    // Draw human
    drawHuman: function () {
        gPush();
        {
            //setColor(vec4(0.0, 0.0, 0.0, 1.0));
            gTranslate(this.position[0], this.position[1], this.position[2]);
            gRotate(this.humanRotation[0], 1.0, 0.0, 0.0);
            gScale(0.4, 0.4, 0.4);


            // Head
            gPush();
            {
                setColor(SKIN);
                gScale(0.5, 0.5, 0.5);
                drawSphere();
            }
            gPop();

            // Body
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -1.5, 0.0);
                gScale(0.9, 1.0, 0.3);
                drawCube();
            }
            gPop();

            // Front Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, 0.3);

                gPush();
                {
                    gTranslate(0.3, 0.12, 0.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(-0.28, 0.12, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.1, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.3, -0.32, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Back Number
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, -1.3, -0.3);

                gPush();
                {
                    gTranslate(0.28, 0.12, 0.0);
                    //gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(-0.3, 0.12, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                {
                    gTranslate(0.0, -0.1, 0.0);
                    gRotate(90, 0.0, 0.0, 1.0);
                    gScale(0.15, 0.4, 0.01);
                    drawCube();
                }
                gPop();

                gPush();
                { 
                    gTranslate(-0.3, -0.32, 0.0);
                    gScale(0.15, 0.36, 0.01);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Arms
            gPush();
            {
                setColor(DARKGREEN);
                gTranslate(0.0, -0.35, 0.0);

                // Right Arm
                gPush();
                {
                    gTranslate(-1.1, 0.0, 0.0);
                    gRotate(-this.rightArmRotation[0], 1.0, 0.0, 0.0);
                    
                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.rightArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();

                // Left Arm
                gPush();
                {
                    setColor(DARKGREEN);
                    gTranslate(1.1, 0.0, 0.0);
                    gRotate(-this.leftArmRotation[0], 1.0, 0.0, 0.0);
                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(0.5, 1.0, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(-this.leftArmRotation[0] - 30, 1.0, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Legs
            gPush();
            {
                gTranslate(0.0, -2.6, 0.0);

                // Right Leg
                gPush();
                {
                    gTranslate(-0.5, 0.0, 0.0);
                    gRotate(-this.rightLegRotation[0], 1.0, 0.0, 0.0);

                    // Thigh
                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();

                // Left Leg
                gPush();
                {
                    gTranslate(0.5, 0.0, 0.0);
                    gRotate(-this.leftLegRotation[0], 1.0, 0.0, 0.0);
                    // Thigh

                    gPush();
                    {
                        setColor(DARKGREEN);
                        gTranslate(0.0, -0.6, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    gTranslate(0.0, -1.2, 0.0);
                    gRotate(30, 1.0, 0.0, 0.0);
                    // Calf
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gTranslate(0.0, -0.8, 0.0);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.8, 0.2);
                    gPush();
                    {
                        setColor(WHITE);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Blood
            if(this.humanRotation[0] === 90.0) {
                gPush();
                {
                    toggleTextures();
                    gl.bindTexture(gl.TEXTURE_2D, textureArray[6].textureWebGL);
                    //setColor(vec4(0.8, 0.1, 0.1, 1.0));
                    gTranslate(0.0, -1.8, 0.5);
                    //gRotate(180, 0.0, 0.0, Math.random());
                    if(this.bloodSize < 2.3) {
                        this.bloodSize += 0.015
                    }
                    gScale(this.bloodSize, this.bloodSize * 1.3, 0.1);
                    drawSphere();
                    toggleTextures();
                }
                gPop();
            }
        }
        gPop();
    },

    // Walk animation
    walk: function (speed) {
        this.position[2] += speed;
        this.humanRotation[0] = 5;
        this.rightArmRotation[0] = 5 + Math.sin(TIME) * 30;
        this.leftArmRotation[0] = 5 - Math.sin(TIME) * 30;
    
        this.rightLegRotation[0] = 20 - Math.sin(TIME) * 30;
        this.leftLegRotation[0] = 20 + Math.sin(TIME) * 30;         
    },

    die: function (Time) {
        if(this.deadTime === 0) {
            this.deadTime = Time;
            this.humanRotation[0] = 0.0;
            curY = this.position[1];
            curZ = this.position[2];
        } else if(Time - this.deadTime < 0.8) {
            this.position[1] -= curY - this.position[1] < 2.2 ? 0.06 : 0.0;
            this.position[2] += this.position[2] - curZ < 1.4 ? 0.05 : 0.0;
            this.humanRotation[0] += this.humanRotation[0] < 90 ? 3.0 : 0.0;
        }
    },

    backstep: function (speed) {
        if(this.leftArmRotation[0] < 90) {
            this.leftArmRotation[0] += 0.3;
        }

        if(this.rightArmRotation[0] < 90) {
            this.rightArmRotation[0] += 0.3;
        }

        this.rightLegRotation[0] = 20 - Math.sin(TIME) * 40;
        this.leftLegRotation[0] = 20 + Math.sin(TIME) * 40;  

        this.position[2] -= speed;
    }
};

let guard1 = {
    position: vec3(0.0, 0.0, 0.0),

    // Draw human
    drawHuman: function () {
        gPush();
        {
            //setColor(PURPLE);
            gTranslate(this.position[0], this.position[1], this.position[2]);
            gRotate(180, 0.0, 1.0, 0.0);
            gScale(0.5, 0.5, 0.5);

            // Head
            gPush();
            {
                setColor(BLACK);
                gScale(0.5, 0.5, 0.5);
                drawSphere();
            }
            gPop();

            // Face
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, 0.0, 0.385);
                gScale(0.3, 0.3, 0.1);
                drawSphere();
            }
            gPop();

            // Body
            gPush();
            {
                setColor(PURPLE);
                gTranslate(0.0, -1.8, 0.0);
                gScale(0.9, 1.3, 0.3);
                drawCube();
            }
            gPop();

            // Belt
            gPush();
            {
                setColor(BLACK);
                gTranslate(0.0, -2.5, 0.0);
                gScale(0.9, 0.2, 0.31);
                drawCube();
            }
            gPop();

            // Arms
            gPush();
            {
                setColor(PURPLE);
                gTranslate(0.0, -1.1, 0.0);

                // Right Arm
                gPush();
                {
                    gTranslate(-1.1, 0.0, 0.0);

                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -0.6, 0.0);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();

                    // Gun
                    gPush();
                    {
                        gPush();
                        {
                            gTranslate(0.0, -0.2, 0.0);
                            //setColor(BLACK);
                            gScale(0.1, 0.15, 0.2);
                            drawCube();
                        }
                        gPop();
    
                        gPush();
                        {
                            gTranslate(0.0, -0.6, 0.3);
                            //setColor(BLACK);
                            gScale(0.1, 0.4, 0.15);
                            drawCube();
                        }
                        gPop();
                    }
                    gPop();

                }
                gPop();

                // Left Arm
                gPush();
                {
                    setColor(PURPLE);
                    gTranslate(1.1, 0.0, 0.0);

                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(0.5, 1.0, 0.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -0.6, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.3, 0.0, 1.0));
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Legs
            gPush();
            {
                gTranslate(0.0, -3.8, 0.0);

                // Right Leg
                gPush();
                {
                    // Thigh
                    gTranslate(-0.5, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.3, 0.5, 1.0));
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Calf
                    gTranslate(0.0, -1.5, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.0, 0.2);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();

                // Left Leg
                gPush();
                {
                    // Thigh
                    gTranslate(0.5, 0.0, 0.0);
                    gPush();
                    {
                        setColor(PURPLE);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Calf
                    gTranslate(0.0, -1.5, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.0, 0.2);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }
};

let guard2 = {
    position: vec3(0.0, 0.0, 0.0),

    // Draw human
    drawHuman: function () {
        gPush();
        {
            //setColor(PURPLE);
            gTranslate(this.position[0], this.position[1], this.position[2]);
            gRotate(180, 0.0, 1.0, 0.0);
            gScale(0.5, 0.5, 0.5);

            // Head
            gPush();
            {
                setColor(BLACK);
                gScale(0.5, 0.5, 0.5);
                drawSphere();
            }
            gPop();

            // Face
            gPush();
            {
                setColor(WHITE);
                gTranslate(0.0, 0.0, 0.385);
                gScale(0.3, 0.3, 0.1);
                drawSphere();
            }
            gPop();

            // Body
            gPush();
            {
                setColor(PURPLE);
                gTranslate(0.0, -1.8, 0.0);
                gScale(0.9, 1.3, 0.3);
                drawCube();
            }
            gPop();
            
            // Belt
            gPush();
            {
                setColor(BLACK);
                gTranslate(0.0, -2.5, 0.0);
                gScale(0.9, 0.2, 0.31);
                drawCube();
            }
            gPop();

            // Arms
            gPush();
            {
                setColor(PURPLE);
                gTranslate(0.0, -1.1, 0.0);

                // Right Arm
                gPush();
                {
                    gTranslate(-1.1, 0.0, 0.0);

                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -0.6, 0.0);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();

                    // Gun
                    gPush();
                    {
                        gPush();
                        {
                            gTranslate(0.0, -0.2, 0.0);
                            //setColor(BLACK);
                            gScale(0.1, 0.15, 0.2);
                            drawCube();
                        }
                        gPop();
    
                        gPush();
                        {
                            gTranslate(0.0, -0.6, 0.3);
                            //setColor(BLACK);
                            gScale(0.1, 0.4, 0.15);
                            drawCube();
                        }
                        gPop();
                    }
                    gPop();

                }
                gPop();

                // Left Arm
                gPush();
                {
                    setColor(PURPLE);
                    gTranslate(1.1, 0.0, 0.0);

                    // Upper Arm
                    gPush();
                    {
                        //setColor(vec4(0.5, 1.0, 0.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Lower Arm
                    gTranslate(0.0, -1.2, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.0, 0.5, 1.0, 1.0));
                        gScale(0.2, 0.6, 0.2);
                        drawCube();
                    }
                    gPop();

                    // Hand
                    gTranslate(0.0, -0.6, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.3, 0.0, 1.0));
                        gScale(0.2, 0.2, 0.2);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();

            // Legs
            gPush();
            {
                gTranslate(0.0, -3.8, 0.0);

                // Right Leg
                gPush();
                {
                    // Thigh
                    gTranslate(-0.5, 0.0, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.3, 0.5, 1.0));
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Calf
                    gTranslate(0.0, -1.5, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.0, 0.2);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();

                // Left Leg
                gPush();
                {
                    // Thigh
                    gTranslate(0.5, 0.0, 0.0);
                    gPush();
                    {
                        setColor(PURPLE);
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Calf
                    gTranslate(0.0, -1.5, 0.0);
                    gPush();
                    {
                        //setColor(vec4(0.5, 0.8, 0.0, 1.0));
                        gScale(0.3, 0.8, 0.3);
                        drawCube();
                    }
                    gPop();

                    // Foot
                    gTranslate(0.0, -1.0, 0.2);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.3, 0.2, 0.5);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }
};

// YoungHee (The Big Human Shape Object)
let youngHee = {
    position: vec3(0.0, 0.0, 0.0),
    headRotation: vec3(0.0, 0.0, 0.0),

    // Draw YoungHee
    drawYoungHee: function () {
        gPush();
        {
            setColor(vec4(0.0, 0.0, 0.0, 1.0));
            gTranslate(this.position[0], this.position[1], this.position[2]);
            gScale(0.8, 0.8, 0.8);
    
            // Head
            gPush();
            {
                setColor(vec4(1.0, 0.0, 0.0, 1.0));
                gRotate(this.headRotation[0], 1.0, 0.0, 0.0);
                gRotate(this.headRotation[1], 0.0, 1.0, 0.0);
                drawSphere();

                // Eyes
                gPush();
                {
                    // Left Eye
                    gPush();
                    {
                        setColor(vec4(1.0, 1.0, 1.0, 1.0));
                        gTranslate(0.35, 0.35, 0.8);
                        gScale(0.35, 0.35, 0.3);
                        drawSphere();
                    }
                    gPop();

                    gPush();
                    {
                        setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gTranslate(0.35, 0.35, 1.0);
                        gScale(0.15, 0.15, 0.15);
                        drawSphere();
                    }
                    gPop();

                    // Right Eye
                    gPush();
                    {
                        setColor(vec4(1.0, 1.0, 1.0, 1.0));
                        gTranslate(-0.35, 0.35, 0.8);
                        gScale(0.35, 0.35, 0.3);
                        drawSphere();
                    }
                    gPop();

                    gPush();
                    {
                        setColor(vec4(1.0, 0.0, 0.0, 1.0));
                        gTranslate(-0.35, 0.35, 1.0);
                        gScale(0.15, 0.15, 0.15);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();

                // Hair
                gPush()
                {
                    gPush();
                    {
                        setColor(BLACK);
                        gTranslate(0.7, -0.8, -0.8);
                        gScale(0.4, 0.4, 0.4);
                        drawSphere();
                    }
                    gPop();

                    gPush();
                    {
                        setColor(BLACK);
                        gTranslate(-0.7, -0.8, -0.8);
                        gScale(0.4, 0.4, 0.4);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();
    
            // Body
            gPush();
            {
                setColor(ORANGE);
                gTranslate(0.0, -2.4, 0.0);
                gScale(1.2, 1.3, 0.6);
                drawCube();
            }
            gPop();
    
            // Arms
            gPush();
            {
                setColor(vec4(1.0, 0.0, 1.0, 1.0));
                gTranslate(0.0, -2.0, 0.0);
    
                // Right Arm
                gPush();
                {
                    gTranslate(-1.6, 0.0, 0.0);
    
                    // Upper Arm
                    gPush();
                    {
                        setColor(YELLOW);
                        gScale(0.4, 0.8, 0.4);
                        drawCube();
                    }
                    gPop();
    
                    // Lower Arm
                    gTranslate(0.0, -1.6, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.4, 0.8, 0.4);
                        drawCube();
                    }
                    gPop();
    
                    // Hand
                    gTranslate(0.0, -0.9, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.4, 0.4, 0.4);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
    
                // Left Arm
                gPush();
                {
                    gTranslate(1.6, 0.3, 0.5);
                    gRotate(-90, 1.0, 0.0, 0.0);
                    gRotate(30, 0.0, 0.0, 1.0);
                    // Upper Arm
                    gPush();
                    {
                        setColor(YELLOW);
                        gScale(0.4, 0.8, 0.4);
                        drawCube();
                    }
                    gPop();
    
                    // Lower Arm
                    gTranslate(-0.5, -0.5, 0.5);
                    gRotate(-120, 1.0, 0.0, 0.0);
                    gRotate(-40, 0.0, 0.0, 1.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.4, 0.8, 0.4);
                        drawCube();
                    }
                    gPop();
    
                    // Hand
                    gTranslate(0.0, -0.9, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.4, 0.4, 0.4);
                        drawSphere();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();
    
            // Legs
            gPush();
            {
                gTranslate(0.0, -4.5, 0.0);
    
                // Right Leg
                gPush();
                {
                    gTranslate(-0.6, 0.0, 0.0);
    
                    // Thigh
                    gPush();
                    {
                        setColor(ORANGE);
                        gScale(0.6, 0.8, 0.6);
                        drawCube();
                    }
                    gPop();
    
                    // Calf
                    gTranslate(0.0, -1.6, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.5, 0.8, 0.5);
                        drawCube();
                    }
                    gPop();
    
                    // Foot
                    gTranslate(0.0, -1.0, 0.2);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.5, 0.2, 0.7);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
    
                // Left Leg
                gPush();
                {
                    gTranslate(0.6, 0.0, 0.0);
    
                    // Thigh
                    gPush();
                    {
                        setColor(ORANGE);
                        gScale(0.6, 0.8, 0.6);
                        drawCube();
                    }
                    gPop();
    
                    // Calf
                    gTranslate(0.0, -1.6, 0.0);
                    gPush();
                    {
                        setColor(SKIN);
                        gScale(0.5, 0.8, 0.5);
                        drawCube();
                    }
                    gPop();
    
                    // Foot
                    gTranslate(0.0, -1.0, 0.2);
                    gPush();
                    {
                        setColor(BLACK);
                        gScale(0.5, 0.2, 0.7);
                        drawCube();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }
}

// Background
let background = {
    lightColor: vec4(0.0, 0.0, 0.0, 1.0),

    gun1Position: vec3(15.0, 8.0, 18.0),
    gun1Rotation: vec4(0.0, 0.0, 0.0, 0.0),
    gun1Bullet: [],

    gun2Position: vec3(-15.0, 8.0, 18.0),
    gun2Rotation: vec4(0.0, 0.0, 0.0, 0.0),
    gun2Bullet: [],

    // Draw Background
    drawBackground: function () {
        // Ceiling
        gPush();
        {  
            toggleTextures();
            gl.bindTexture(gl.TEXTURE_2D, textureArray[4].textureWebGL);            
            gTranslate(0.0, 13.0, 10.0);
            gScale(35.0, 0.1, 60.0);
            drawCube();
            toggleTextures();
        }
        gPop();
        // Floor
        gPush();
        {
            toggleTextures();
            gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
            setColor(vec4(0.8, 0.8, 0.2, 1.0));
            gScale(15.0, 1.0, 15.0);
            drawCube();
            toggleTextures();
        }
        gPop();
    
        // Start Line
        gPush();
        {
            setColor(LINE);
            gTranslate(0.0, 0.01, 6.0);
            gScale(15.0, 1.0, 0.1);
            drawCube();
        }
        gPop();
    
        // End Line
        gPush();
        {
            setColor(LINE);
            gTranslate(0.0, 0.01, -8.5);
            gScale(15.0, 1.0, 0.1);
            drawCube();
        }
        gPop();
    
        // Front Wall
        gPush();
        {
            toggleTextures();
            gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
            setColor(vec4(0.4, 0.3, 0.7, 1.0));
            gTranslate(0.0, 5.0, 15.0);
            gScale(15.0, 5.0, 1.0);
            drawCube();
            toggleTextures();
        }
        gPop();
    
        // Left Light
        gPush();
        {
            setColor(vec4(0.3, 0.3, 0.3, 1.0));
            gTranslate(8.0, 8.0, 14.0);
            //gTranslate(0.0, 3.0, 0.0);
            gPush();
            {
                toggleTextures();
                gl.bindTexture(gl.TEXTURE_2D, textureArray[7].textureWebGL);
                gScale(1.0, 1.0, 0.1);
                drawCube();
                toggleTextures();
            }
            gPop();
    
            gPush();
            {
                setColor(this.lightColor);
                gScale(0.8, 0.8, 0.8);
                drawSphere();
            }
            gPop();
        }
        gPop();
    
        // Right Light
        gPush();
        {
            setColor(vec4(0.3, 0.3, 0.3, 1.0));
            gTranslate(-8.0, 8.0, 14.0);
            //gTranslate(0.0, 3.0, 0.0);
            gPush();
            {
                toggleTextures();
                gl.bindTexture(gl.TEXTURE_2D, textureArray[7].textureWebGL);
                gScale(1.0, 1.0, 0.1);
                drawCube();
                toggleTextures();
            }
            gPop();
    
            gPush();
            {
                setColor(this.lightColor);
                //setColor(vec4(0.0, 1.0, 0.0, 1.0));
                gScale(0.8, 0.8, 0.8);
                drawSphere();
            }
            gPop();
        }
        gPop();
    
        // Gun 1
        gPush();
        {
            setColor(vec4(0.3, 0.3, 0.3, 1.0));
            gTranslate(12.0, 8.0, 14.0);
            gPush();
            {
                toggleTextures();
                gl.bindTexture(gl.TEXTURE_2D, textureArray[7].textureWebGL);
                gScale(1.0, 1.0, 0.1);
                drawCube();
                toggleTextures();
            }
            gPop();

            gRotate(this.gun1Rotation[0], 1,0, 0.0, 0.0);
            gRotate(this.gun1Rotation[1], 0.0, 1.0, 0.0);
            gRotate(this.gun1Rotation[2], 0.0, 0.0, 1.0);

            gPush();
            {
                setColor(vec4(0.0, 0.0, 0.0, 1.0));
                gTranslate(0.0, 0.0, -0.4);
                gScale(0.5, 0.5, 1.0);
                drawCylinder();
            }
            gPop();
        }
        gPop();

        // Gun 2
        gPush();
        {
            setColor(vec4(0.3, 0.3, 0.3, 1.0));
            gTranslate(-12.0, 8.0, 14.0);
            gPush();
            {
                toggleTextures();
                gl.bindTexture(gl.TEXTURE_2D, textureArray[7].textureWebGL);
                gScale(1.0, 1.0, 0.1);
                drawCube();
                toggleTextures();
            }
            gPop();

            gRotate(this.gun2Rotation[0], 1,0, 0.0, 0.0);
            gRotate(this.gun2Rotation[1], 0.0, 1.0, 0.0);
            gRotate(this.gun2Rotation[2], 0.0, 0.0, 1.0);

            gPush();
            {
                setColor(vec4(0.0, 0.0, 0.0, 1.0));
                gTranslate(0.0, 0.0, -0.4);
                gScale(0.5, 0.5, 1.0);
                drawCylinder();
            }
            gPop();

        }
        gPop();

        // Left Wall
        gPush();
        {
            toggleTextures();
            gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
            setColor(vec4(0.3, 1.0, 0.3, 1.0));
            gTranslate(15.0, 5.0, 0);
            gRotate(90, 0.0, 1.0, 0.0);
            gScale(15.0, 5.0, 1.0);
            drawCube();
        }
        gPop();
    
        // Right Wall
        gPush();
        {
            setColor(vec4(0.3, 0.3, 1.0, 1.0));
            gTranslate(-15.0, 5.0, 0.0);
            gRotate(-90, 0.0, 1.0, 0.0);
            gScale(15.0, 5.0, 1.0);
            drawCube();
            toggleTextures();
        }
        gPop();

        // Back Wall
        if(TIME > 15.0) {
            gPush();
            {
                toggleTextures();
                gl.bindTexture(gl.TEXTURE_2D, textureArray[5].textureWebGL);
                setColor(vec4(0.3, 0.3, 1.0, 1.0));
                gTranslate(0.0, 5.0, -15.0);
                gScale(15.0, 5.0, 1.0);
                drawCube();
                toggleTextures();
            }
            gPop();       
        }
        // Tree
        gPush();
        {
            toggleTextures();
            gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
            gTranslate(0.0, 0.0, 11.0);
            this.drawTree();
            toggleTextures();
        }
        gPop();
    },

    // Draw Tree
    drawTree: function() {
        gPush();
        {
            gTranslate(0.0, 3.0, 0.0);
            gScale(0.7, 0.7, 0.7);
            setColor(vec4(0.8, 0.4, 0.4, 1.0));
            //gRotate(180, 0.0, 0.0, 1.0);
            gRotate(-90, 1.0, 0.0, 0.0);

            // Root
            gPush();
            {
                gScale(5.0, 5.0, 8.0);
                drawCylinder();
            }
            gPop();

            // First Branch (Left)
            gPush();
            {
                gTranslate(2.5, 2.0, 4.0);
                gRotate(-60, 1.0, -0.9, 0.0);
                
                // Root 
                gPush();
                {
                    gScale(3.0, 3.0, 5.0);
                    drawCylinder();
                }
                gPop();

                // First Branch
                gPush();
                {
                    gTranslate(-1.0, -1.0, 4.0);
                    gRotate(60, 1.0, -1.5, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();

                // Second Branch
                gPush();
                {
                    gTranslate(0.0, 1.0, 4.0);
                    gRotate(-60, 1.0, 0.0, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();

                // Third Branch
                gPush();
                {
                    gTranslate(1.0, -1.0, 4.0);
                    gRotate(-60, -1.0, -1.5, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();
            }
            gPop();

            // Second Branch (Middle)
            gPush();
            {
                gTranslate(0.0, -1.0, 4.0);
                gRotate(45, 1.0, 0.0, 0.0);
                
                // Root 
                gPush();
                {
                    gScale(3.0, 3.0, 5.0);
                    drawCylinder();
                }
                gPop();

                // First Branch
                gPush();
                {
                    gTranslate(-1.0, -1.0, 4.0);
                    gRotate(60, 1.0, -1.5, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();

                // Second Branch
                gPush();
                {
                    gTranslate(0.0, 1.0, 4.0);
                    gRotate(-60, 1.0, 0.0, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();

                // Third Branch
                gPush();
                {
                    gTranslate(1.0, -1.0, 4.0);
                    gRotate(-60, -1.0, -1.5, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();
            }
            gPop();

            // Third Branch (Right)
            gPush();
            {
                gTranslate(-3.0, 2.0, 4.0);
                gRotate(-60, 1.0, 1.0, 0.0);
                
                // Root 
                gPush();
                {
                    gScale(3.0, 3.0, 5.0);
                    drawCylinder();
                }
                gPop();

                // First Branch
                gPush();
                {
                    gTranslate(-1.0, -1.0, 4.0);
                    gRotate(60, 1.0, -1.5, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();

                // Second Branch
                gPush();
                {
                    gTranslate(0.0, 1.0, 4.0);
                    gRotate(-60, 1.0, 0.0, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();

                // Third Branch
                gPush();
                {
                    gTranslate(1.0, -1.0, 4.0);
                    gRotate(-60, -1.0, -1.5, 0.0);
                    gScale(1.5, 1.5, 3.0);
                    drawCylinder();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    },

    // Change color of light balls
    changeColor: function(color) {
        this.lightColor[0] = color[0];
        this.lightColor[1] = color[1];
        this.lightColor[2] = color[2];
    },

    gun1Shoot: function(aim, time) {
        xRatio = this.gun1Position[0] - aim[0] - (Math.random() / 4);
        yRatio = this.gun1Position[1] + 0.5 - aim[1] + Math.random();
        zRatio = this.gun1Position[2] - aim[2];

        if(this.gun1Bullet.length === 0) {
            this.gun1Bullet.push(vec4(this.gun1Position[0], this.gun1Position[1] + 1.0, this.gun1Position[2], time));
        } else if (time - this.gun1Bullet[this.gun1Bullet.length - 1][3] > 0.8) {
            this.gun1Bullet.push(vec4(this.gun1Position[0], this.gun1Position[1] + 1.0, this.gun1Position[2], time));            
        }

        for(let i = 0; i < this.gun1Bullet.length; i++) {
            gPush();
            {
                toggleTextures();
                gl.bindTexture(gl.TEXTURE_2D, textureArray[7].textureWebGL);
                setColor(vec4(0.0, 0.0, 0.0, 1.0));
                this.gun1Bullet[i][0] -= xRatio * (time - this.gun1Bullet[i][3]) / 5;
                this.gun1Bullet[i][1] -= yRatio * (time - this.gun1Bullet[i][3]) / 5;
                this.gun1Bullet[i][2] -= zRatio * (time - this.gun1Bullet[i][3]) / 5;
                gTranslate(this.gun1Bullet[i][0], this.gun1Bullet[i][1], this.gun1Bullet[i][2]);
                gScale(0.1, 0.1, 0.1);
                drawSphere();
                toggleTextures();
            }
            gPop();
            
            if(time - this.gun1Bullet[i][3] > 4.0) {
                this.gun1Bullet = this.gun1Bullet.slice(1);
            }
        }
    },

    gun2Shoot: function(aim, time) {
        xRatio = this.gun2Position[0] - aim[0] - (Math.random() / 4);
        yRatio = this.gun2Position[1] + 0.5 - aim[1] + Math.random();
        zRatio = this.gun2Position[2] - aim[2];

        if(this.gun2Bullet.length === 0) {
            this.gun2Bullet.push(vec4(this.gun2Position[0], this.gun2Position[1] + 1.0, this.gun2Position[2], time));
        } else if (time - this.gun2Bullet[this.gun2Bullet.length - 1][3] > 0.8) {
            this.gun2Bullet.push(vec4(this.gun2Position[0], this.gun2Position[1] + 1.0, this.gun2Position[2], time));            
        }

        for(let i = 0; i < this.gun2Bullet.length; i++) {
            gPush();
            {
                toggleTextures();
                gl.bindTexture(gl.TEXTURE_2D, textureArray[7].textureWebGL);
                setColor(vec4(0.0, 0.0, 0.0, 1.0));
                this.gun2Bullet[i][0] -= xRatio * (time - this.gun2Bullet[i][3]) / 5;
                this.gun2Bullet[i][1] -= yRatio * (time - this.gun2Bullet[i][3]) / 5;
                this.gun2Bullet[i][2] -= zRatio * (time - this.gun2Bullet[i][3]) / 5;
                gTranslate(this.gun2Bullet[i][0], this.gun2Bullet[i][1], this.gun2Bullet[i][2]);
                gScale(0.1, 0.1, 0.1);
                drawSphere();
                toggleTextures();
            }
            gPop();
            
            if(time - this.gun2Bullet[i][3] > 4.0) {
                this.gun2Bullet = this.gun2Bullet.slice(1);
            }
        }
    }

}