// Jacinda Ballantyne, 4/14/15
// lab4.js

var gl;
var points = [];
var normals = [];
var NumVertices = 12;

var vertices = [
		vec4(-0.5, 0, 0.5, 1), 
		vec4(0.5, 0, 0.5, 1),
		vec4(0, 1, 0, 1),
		vec4(0, 0, -0.5, 1)
];

var texSize = 64; 
// Create a checkerboard pattern using floats

    
var image1 = new Array()
    for (var i =0; i<texSize; i++)  
		image1[i] = new Array();
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
var texCoordsArray = [];
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];
var lightPosition = vec4(2.0,-1.5,2.0,0.0);
var lightAmbient = vec4(0.2,0.4,0.2,1.0);
var lightDiffuse = vec4(2.0,2.0,2.0,1.0);
var lightSpecular = vec4(3.0,3.0,3.0,1.0);

var materialAmbient = vec4(1.0,0.0,1.0,1.0);
var materialDiffuse = vec4(1.0,0.8,0.0,1.0);
var materialSpecular = vec4(1.0,0.8,0.0,1.0);
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
	
var radius = 4.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;

var modelView, projection;
var viewerPos;
var program;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta2 = [0,0,0];

var thetaLoc;

var flag = true;

function configureTexture(image) {
    texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, 
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}

function tri(a,b,c)
{
	var t1 = subtract(vertices[b], vertices[a]);
	var t2 = subtract(vertices[c], vertices[b]);
	var normal = cross(t1, t2);
	var normal = vec3(normal);
	
	points.push(vertices[a]);
	normals.push(normal);
	texCoordsArray.push(texCoord[0]);
	
	points.push(vertices[b]);
	normals.push(normal);
	texCoordsArray.push(texCoord[1]);
	
	points.push(vertices[c]);
	normals.push(normal);
	texCoordsArray.push(texCoord[2]);
}

function Tetra()
{
	tri(0,1,2);
	tri(1,3,2);
	tri(0,2,3);
	tri(0,3,1);
}

function handleKeyDown(ev){
	
	if (ev.keyCode == 37){ 
		
		theta += dr;
                console.log('rotate CC about Y');
	}
	if (ev.keyCode == 39){ 
		
		theta -= dr;
				console.log('rotate C about Y');
	}
	if (ev.keyCode == 38){ 
		
		phi += dr;
				console.log('rotate CC about X');
	}
	if (ev.keyCode == 40){ 
		
		phi -= dr;
				console.log('rotate C about X');
	}
	
}

window.onload = function init()
{
var canvas = document.getElementById( "gl-canvas" );
gl = WebGLUtils.setupWebGL( canvas );
if ( !gl ) { alert( "WebGL isn't available" ); }

gl.viewport( 0, 0, canvas.width, canvas.height );

gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

gl.enable(gl.DEPTH_TEST);
// Load shaders and initialize attribute buffers
program = initShaders( gl, "vertex-shader", "fragment-shader" );
gl.useProgram( program );

Tetra();

var nBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(normals),gl.STATIC_DRAW);

var vNormal = gl.getAttribLocation(program, "vNormal");
gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vNormal);

var vBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

var vPosition = gl.getAttribLocation(program, "vPosition");
gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0); 
gl.enableVertexAttribArray(vPosition);

var tBuffer = gl.createBuffer();
gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vTexCoord);

configureTexture(image2);

thetaLoc = gl.getUniformLocation(program, "theta2");

projection = ortho(-1, 1, -1, 1, -100, 100); 

ambientProduct = mult(lightAmbient, materialAmbient);
diffuseProduct = mult(lightDiffuse, materialDiffuse);
specularProduct = mult(lightSpecular, materialSpecular);

document.onkeydown=handleKeyDown;

gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));

render();
};

function render() {
gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
viewerPos = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
modelView = mat4();
modelView = mult(modelView, lookAt(viewerPos, at, up)) 
modelView = mult(modelView, rotate(theta2[xAxis], [1,0,0]));
modelView = mult(modelView, rotate(theta2[yAxis], [0,1,0]));
modelView = mult(modelView, rotate(theta2[zAxis], [0,0,1]));
	
gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelView));

gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

requestAnimFrame(render);
}
