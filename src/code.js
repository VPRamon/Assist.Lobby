
//setup context
var canvas = document.querySelector("canvas");
var gl = GL.create({canvas: canvas});
var freecam = false;

function setChatPosition(){};

gl.captureMouse();
gl.captureKeys();
gl.onmouse = onMouse;
gl.onkeydown = onKey;




//camera
var camera = new RD.Camera();
camera.lookAt([0,1.5,2.8],[0,1,0],[0,1,0]); //to set eye,center and up
camera.fov = 60;

//renderer of the scene
var renderer = new RD.Renderer(gl);

//animations container
var animations = {};

function loadAnimation( name, url )
{
	var anim = new RD.SkeletalAnimation();
	anim.load(url);
	animations[ name ] = anim;
}

loadAnimation("idle", "resources/data/anims/girl_idle.skanim");
loadAnimation("walking", "resources/data/anims/girl_walking.skanim");
loadAnimation("dancing", "resources/data/anims/girl_dancing.skanim");

//we need an skeletonm if we plan to do blending
var skeleton = new RD.Skeleton(); //skeleton for blending

//draws the whole frame
function draw()
{
	canvas_coords = document.getElementById('content').clientHeight;
	
	//if(!freecam)
	//	camera.lookAt( camera.position, character.localToGlobal([0,70,0]), [0,1,0] );
	canvas.width = document.getElementById('canvas-container').clientWidth;//window.innerWidth;
	canvas.height = document.getElementById('canvas-container').clientHeight;//window.innerHeight;
	camera.perspective(camera.fov,canvas.width / canvas.height,0.1,1000); //to render in perspective mode

	//clear
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0,0,0,1 );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	drawWorld( camera );
}

//draws the world from a camera point of view
function drawWorld( camera )
{
	renderer.render( scene, camera );

	//render gizmos
	//areas
	//var vertices = walk_area.getVertices();
	//if(vertices)
	//	renderer.renderPoints(vertices,null,camera,null,null,0.1,gl.LINES);

	/*
	gl.disable( gl.DEPTH_TEST );
	if(character.skeleton)
	{
		var vertices = character.skeleton.getVertices( character.getGlobalMatrix() );
		if(vertices)
			renderer.renderPoints(vertices,null,camera,null,null,0.1,gl.LINES);
		gl.enable( gl.DEPTH_TEST );
	}
	*/
}
var i_aux=0;
//CONTROLLER
function update(dt)
{
	var t = getTime() * 0.001;
	
	for(var i = 0; i < room_users_list.length; i++){
		
		if(room_users_list[i].id==myPorfile.id){
			i_aux=i;	
		}
		else{
			var is_moving = vec3.length(room_users_list[i].fut_pos);
			var anim1 = animations[ characters_list[i].anim_name ];
			if(anim1 && anim1.duration)
			{
				anim1.assignTime( t, true );
				characters_list[i].assignSkeleton( anim1.skeleton );
				characters_list[i].shader = "texture_skinning";
				characters_list[i].skeleton = anim1.skeleton; //this could be useful
			}
			//move de cada character
			if(is_moving && room_users_list[i].id!=myPorfile.id ){
				
				
				//vec3.scale( room_users_list[i].fut_pos, room_users_list[i].fut_pos, room_users_list[i].dt );
				
				characters_list[i].moveLocal( room_users_list[i].fut_pos );
				characters_list[i].anim_name = "walking";
				characters_list[i].dance = false;
				characters_list[i].position = walk_area.adjustPosition( characters_list[i].position );
				room_users_list[i].fut_pos=[0,0,0];
				characters_list[i].position=room_users_list[i].pos;
				
				
			}
			else if(room_users_list[i].id!=myPorfile.id && is_moving==false){
				characters_list[i].anim_name = characters_list[i].dance ? "dancing" : "idle";
				//console.log("quieto");
			}
			
			//rotation de cada character
			if(room_users_list[i].fut_rot!=0){
				characters_list[i].rotation=room_users_list[i].fut_rot_aux;
				//characters_list[i].rotate(room_users_list[i].fut_rot,[0,1,0]);
				room_users_list[i].rot=room_users_list[i].fut_rot_aux;
				room_users_list[i].fut_rot=0;
				
				
			}
			
			
		}
		
			
	}
	//example of how to blend two animations
	//animations.idle.assignTime( t, true );
	//animations.walking.assignTime( t, true );
	//RD.Skeleton.blend( animations.idle, animations.walking, 0.5, skeleton );
	if(characters_list.length>0){
		var anim = animations[ characters_list[i_aux].anim_name ];
		if(anim && anim.duration)
		{
			anim.assignTime( t, true );
			characters_list[i_aux].assignSkeleton( anim.skeleton );
			characters_list[i_aux].shader = "texture_skinning";
			characters_list[i_aux].skeleton = anim.skeleton; //this could be useful
		}

		//input
		if(freecam)
		{
			//free camera
			var delta = [0,0,0];
			if( gl.keys["W"] )
				delta[2] = -1;
			else if( gl.keys["S"] )
				delta[2] = 1;
			if( gl.keys["A"] )
				delta[0] = -1;
			else if( gl.keys["D"] )
				delta[0] = 1;
			camera.moveLocal(delta,dt * 10);
		}
		else
			userMovement( characters_list[i_aux], dt );

		//example of ray test from the character with the environment (layer 0b1)
		if(0)
		{
			var center = characters_list[i_aux].localToGlobal([0,70,0]);
			var forward = characters_list[i_aux].getLocalVector([0,0,1]);
			vec3.normalize( forward, forward );
			var ray = new GL.Ray(center,forward);
			var coll_node = scene.testRay( ray,null,100,1 );
			if(coll_node)
				sphere.position = ray.collision_point;
		}

		//example of placing object in head of character
		if(0 && characters_list[i_aux].skeleton)
		{
			var head_matrix = characters_list[i_aux].skeleton.getBoneMatrix("mixamorig_Head", true);
			var gm = characters_list[i_aux].getGlobalMatrix();
			var m = mat4.create();
			mat4.multiply( m, gm, head_matrix );
			mat4.scale( m, m, [20,20,20]);
			sphere.fromMatrix( m );
		}
			
	}
	

}

function userMovement( character, dt )
{
	
	var delta = [0,0,0];
	if( gl.keys["W"] )
		delta[2] = 1;
	else if( gl.keys["S"] )
		delta[2] = -1;
	var delta_aux=delta;
	vec3.scale( delta, delta, dt );
	var is_moving = vec3.length(delta);
	if(is_moving) //if moving
	{
		//console.log(i_aux);
		character.moveLocal( delta );
		character.anim_name = "walking";
		character.dance = false;
		
		
	}
	else
		character.anim_name = character.dance ? "dancing" : "idle";
	
	var rotacion=false;
	var angle=0;
	if( gl.keys["A"] ){
		character.rotate(dt*1.5,[0,1,0]);
		angle=dt*1.5;
		rotacion=true;
		
	}
	else if( gl.keys["D"] ){
		character.rotate(dt*-1.5,[0,1,0]);
		angle=dt*-1.5;
		rotacion=true;
	}
		
	//room_users_list[i_aux].rot=room_users_list[i_aux].rot+angle;
	character.position = walk_area.adjustPosition( character.position );
	if(is_moving){
		var msg = {
			type: "move",
			id:myPorfile.id ,
			pos:character.position,
			fut_pos:delta,
			dt:dt
		};

		socket.socket.send(JSON.stringify( msg ));
	}
	if(rotacion){
		var msg = {
			type: "rotation",
			id:myPorfile.id ,
			angle:character.rotation,
			fut_rot:angle,
			dt:dt
		};

		socket.socket.send(JSON.stringify( msg ));
	}
	
	
}

function onMouse(e)
{
	//console.log(e);

	if(e.type == "mousedown")
	{
		var ray = camera.getRay( e.canvasx, e.canvasy );
		var coll_node = scene.testRay(ray);
		if(coll_node)
		{
			//console.log(coll_node.name, ray.collision_point);
			if( coll_node.is_character ) //if character clicked
			{
				//...
			}
		}
	}

	if(e.dragging)
	{
		//camera.orbit(e.deltax * 0.01, [0,1,0] );
		//var right = camera.getLocalVector([1,0,0]);
		//camera.orbit(e.deltay * 0.01,right );

		//rotating camera
		camera.rotate(e.deltax * -0.01, [0,1,0] );
		var right = camera.getLocalVector([1,0,0]);
		camera.rotate(e.deltay * -0.01,right );
	}
}

function onKey(e)
{
	//console.log(e);
	if(e.key == "Tab")
	{
		freecam = !freecam;
		e.preventDefault();
		e.stopPropagation();
		return true;
	}
	else if(e.code == "Space")
		characters_list[i_aux].dance = !characters_list[i_aux].dance;
}


//last stores timestamp from previous frame
var last = performance.now();

function loop()
{
   draw();


   //to compute seconds since last loop
   var now = performance.now();
   //compute difference and convert to seconds
   var elapsed_time = (now - last) / 1000; 
   //store current time into last time
   last = now;

   //now we can execute our update method
   update( elapsed_time );

   //request to call loop() again before next frame
   requestAnimationFrame( loop );
}


function init()
{
	//start loop
	loop();
	setChatPosition();
}
